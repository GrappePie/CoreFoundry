import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

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

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    });

    const userResponse = {
      id: user._id,
      email: user.email,
    };

    return NextResponse.json({ token, user: userResponse }, { status: 201 });
  } catch (error) {
    console.error('Error en el registro:', error);
    return NextResponse.json(
      { message: 'An error occurred' },
      { status: 500 }
    );
  }
}
