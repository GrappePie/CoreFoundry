"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const mongodb_1 = __importDefault(require("@/lib/mongodb"));
const User_1 = __importDefault(require("@/models/User"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const rabbitmq_1 = require("@/lib/rabbitmq");
const UserRegistered_schema_1 = require("@/schemas/events/UserRegistered.schema");
const registerSchema = zod_1.z.object({
    email: zod_1.z.email(),
    password: zod_1.z.string().min(6),
});
async function POST(req) {
    await (0, mongodb_1.default)();
    try {
        const body = await req.json();
        const parse = registerSchema.safeParse(body);
        if (!parse.success) {
            return server_1.NextResponse.json({ message: 'Validation error', errors: parse.error.issues }, { status: 400 });
        }
        const { email, password } = parse.data;
        const userExists = await User_1.default.findOne({ email });
        if (userExists) {
            return server_1.NextResponse.json({ message: 'User already exists' }, { status: 400 });
        }
        // Crear usuario (el pre-save hook de mongoose se encargará de hashear la contraseña)
        const user = await User_1.default.create({
            email,
            password,
        });
        try {
            await (0, rabbitmq_1.publish)(rabbitmq_1.EXCHANGE_NAME, 'auth.user.registered', { userId: user._id.toString(), email: user.email }, UserRegistered_schema_1.UserRegisteredSchema);
        }
        catch (err) {
            console.error('Error publicando evento user.registered:', err);
        }
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET no está configurado');
            return server_1.NextResponse.json({ message: 'Internal configuration error' }, { status: 500 });
        }
        let token;
        try {
            token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
                expiresIn: '1h',
            });
        }
        catch (err) {
            console.error('Error generando JWT:', err);
            return server_1.NextResponse.json({ message: 'Token generation failed' }, { status: 500 });
        }
        const userResponse = { id: user._id, email: user.email };
        const res = server_1.NextResponse.json({ token, user: userResponse }, { status: 201 });
        // Set role cookie for dashboard access
        res.cookies.set('user-role', user.role, { httpOnly: true, path: '/', sameSite: 'strict' });
        return res;
    }
    catch (error) {
        console.error('Error en el registro:', error);
        return server_1.NextResponse.json({ message: 'An error occurred' }, { status: 500 });
    }
}
