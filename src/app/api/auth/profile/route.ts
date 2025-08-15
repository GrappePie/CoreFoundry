import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not defined');
    const payload = jwt.verify(token, secret) as { userId: string };
    await dbConnect();
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    const userData = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      subscription: user.subscription,
      modulesEnabled: user.modulesEnabled,
      lastLogin: user.lastLogin,
      emailVerified: user.emailVerified,
      status: user.status,
      subscriptionStart: user.subscriptionStart,
      subscriptionEnd: user.subscriptionEnd
    };
    return NextResponse.json({ user: userData });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
}
