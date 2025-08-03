import mongoose, { Schema, Document, models } from 'mongoose';

export interface IModule extends Document {
  name: string;
  description: string;
  ownerId: mongoose.Types.ObjectId;
  schema: any;
  endpoints: {
    rest: string;
    ws?: string;
  };
}

const ModuleSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  schema: { type: Schema.Types.Mixed, required: true },
  endpoints: {
    rest: { type: String, required: true },
    ws: { type: String },
  },
}, { timestamps: true });

// Indexes
ModuleSchema.index({ ownerId: 1 });
ModuleSchema.index({ name: 1 });

export default models.Module || mongoose.model<IModule>('Module', ModuleSchema);
