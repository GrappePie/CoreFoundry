import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  await dbConnect();

  try {
    const body = await req.json();
    const parse = loginSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: parse.error.issues },
        { status: 400 }
      );
    }
    const { email, password } = parse.data;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    });

    const userResponse = {
      id: user._id,
      email: user.email,
    };

    return NextResponse.json({ token, user: userResponse });
  } catch {
    return NextResponse.json(
      { message: 'An error occurred' },
      { status: 500 }
    );
  }
}
