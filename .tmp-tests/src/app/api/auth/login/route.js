"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const mongodb_1 = __importDefault(require("@/lib/mongodb"));
const User_1 = __importDefault(require("@/models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const loginSchema = zod_1.z.object({
    email: zod_1.z.email(),
    password: zod_1.z.string().min(1),
});
async function POST(req) {
    await (0, mongodb_1.default)();
    try {
        const body = await req.json();
        const parse = loginSchema.safeParse(body);
        if (!parse.success) {
            return server_1.NextResponse.json({ message: 'Validation error', errors: parse.error.issues }, { status: 400 });
        }
        const { email, password } = parse.data;
        const user = await User_1.default.findOne({ email }).select('+password');
        if (!user) {
            return server_1.NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }
        const isPasswordMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordMatch) {
            return server_1.NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const userResponse = { id: user._id, email: user.email };
        const res = server_1.NextResponse.json({ token, user: userResponse });
        // Set role cookie for dashboard access
        res.cookies.set('user-role', user.role, { httpOnly: true, path: '/', sameSite: 'strict' });
        return res;
    }
    catch {
        return server_1.NextResponse.json({ message: 'An error occurred' }, { status: 500 });
    }
}
