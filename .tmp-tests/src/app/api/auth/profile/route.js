"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const mongodb_1 = __importDefault(require("@/lib/mongodb"));
const User_1 = __importDefault(require("@/models/User"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
async function GET(req) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return server_1.NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret)
            throw new Error('JWT_SECRET not defined');
        const payload = jsonwebtoken_1.default.verify(token, secret);
        await (0, mongodb_1.default)();
        const user = await User_1.default.findById(payload.userId);
        if (!user) {
            return server_1.NextResponse.json({ message: 'User not found' }, { status: 404 });
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
        return server_1.NextResponse.json({ user: userData });
    }
    catch (err) {
        console.error('Profile fetch error:', err);
        return server_1.NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
}
