"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const moduleOrchestrator_1 = require("@/services/moduleOrchestrator");
async function GET() {
    const metrics = (0, moduleOrchestrator_1.getOrchestratorMetrics)();
    if (!metrics) {
        return server_1.NextResponse.json({ status: 'stale', message: 'No hay ciclos registrados aún' }, { status: 200 });
    }
    return server_1.NextResponse.json({ status: 'ok', metrics }, { status: 200 });
}
