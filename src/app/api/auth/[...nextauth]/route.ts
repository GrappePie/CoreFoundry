import { handlers } from "@/auth";
import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";

const handleRequest = (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) => {
    return async (req: NextRequest) => {
        const body = await req.json();
        const res = new NextResponse();
        // NextRequest and NextApiResponse are not directly compatible with NextApiRequest and NextApiResponse
        // This is a simplified way to adapt them. A proper adapter might be needed for complex cases.
        const apiReq = { body } as NextApiRequest;
        const apiRes = res as unknown as NextApiResponse;

        await handler(apiReq, apiRes);
        return res;
    };
};

export const POST = handleRequest(handlers.login);
export const GET = async () => {
    return NextResponse.json({ message: "Auth endpoint" });
};
