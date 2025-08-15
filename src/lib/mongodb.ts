import mongoose, { Mongoose } from "mongoose";

declare global {
    var mongoose: {
        conn: Mongoose | null;
        promise: Promise<Mongoose> | null;
    };
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  const uri = process.env.MONGODB_URI as string | undefined;

  // En tests, no forzamos conexión real para permitir el stubbing de Mongoose
  if (!uri) {
    if (process.env.NODE_ENV === 'test') {
      return (mongoose as unknown) as Mongoose;
    }
    throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
  }

  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached!.promise = mongoose.connect(uri, opts).then((mongoose) => {
      return mongoose;
    });
  }
  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }
  return cached!.conn as Mongoose;
}

export default dbConnect;
