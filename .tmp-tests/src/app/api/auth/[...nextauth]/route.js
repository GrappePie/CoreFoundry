"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = exports.POST = void 0;
const auth_1 = require("@/auth");
const server_1 = require("next/server");
const handleRequest = (handler) => {
    return async (req) => {
        const body = await req.json();
        const res = new server_1.NextResponse();
        // NextRequest and NextApiResponse are not directly compatible with NextApiRequest and NextApiResponse
        // This is a simplified way to adapt them. A proper adapter might be needed for complex cases.
        const apiReq = { body };
        const apiRes = res;
        await handler(apiReq, apiRes);
        return res;
    };
};
exports.POST = handleRequest(auth_1.handlers.login);
const GET = async () => {
    return server_1.NextResponse.json({ message: "Auth endpoint" });
};
exports.GET = GET;
