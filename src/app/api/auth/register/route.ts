import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { publish, EXCHANGE_NAME } from '@/lib/rabbitmq';
import { UserRegisteredSchema } from '@/schemas/events/UserRegistered.schema';

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  await dbConnect();

  try {
    const body = await req.json();
    const parse = registerSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: parse.error.issues },
        { status: 400 }
      );
    }
    const { email, password } = parse.data;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      );
    }

    // Crear usuario (el pre-save hook de mongoose se encargará de hashear la contraseña)
    const user = await User.create({
      email,
      password,
    });

    try {
      await publish(
        EXCHANGE_NAME,
        'auth.user.registered',
        { userId: user._id.toString(), email: user.email },
        UserRegisteredSchema
      );
    } catch (err) {
      console.error('Error publicando evento user.registered:', err);
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no está configurado');
      return NextResponse.json(
        { message: 'Internal configuration error' },
        { status: 500 }
      );
    }

    let token: string;
    try {
      token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET!, {
        expiresIn: '1h',
      });
    } catch (err) {
      console.error('Error generando JWT:', err);
      return NextResponse.json(
        { message: 'Token generation failed' },
        { status: 500 }
      );
    }

    const userResponse = { id: user._id, email: user.email };
    const res = NextResponse.json({ token, user: userResponse }, { status: 201 });
    // Set role cookie for dashboard access
    res.cookies.set('user-role', user.role, { httpOnly: true, path: '/', sameSite: 'strict' });
    return res;
  } catch (error) {
    console.error('Error en el registro:', error);
    return NextResponse.json(
      { message: 'An error occurred' },
      { status: 500 }
    );
  }
}
