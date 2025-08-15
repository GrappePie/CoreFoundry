"use client";

import { useEffect, useState } from "react";

type Metrics = {
  online: number;
  offline: number;
  durationMs: number;
  timestamp: string;
  isActive: boolean;
  isRunning: boolean;
};

type Payload =
  | { status: "ok"; metrics: Metrics }
  | { status: "stale"; message: string };

export default function OrchestratorMetrics() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/orchestrator/metrics", { cache: "no-store" });
        const json = (await res.json()) as Payload;
        if (mounted) setData(json);
      } catch {
        if (mounted) setData({ status: "stale", message: "sin datos" });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 15000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const badge = (s: "ok" | "stale") =>
    s === "ok" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700";

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className={`px-2 py-1 rounded ${badge("stale")}`}>Orquestador: cargando…</span>
      </div>
    );
  }

  if (!data || data.status === "stale") {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className={`px-2 py-1 rounded ${badge("stale")}`}>Orquestador: sin datos</span>
      </div>
    );
  }

  const m = data.metrics;
  const dt = new Date(m.timestamp);
  const since = `${dt.toLocaleTimeString()}-${dt.toLocaleDateString()}`;

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className={`px-2 py-1 rounded ${badge("ok")}`}>Orquestador: ok</span>
      <span className="text-slate-600">online: {m.online}</span>
      <span className="text-slate-600">offline: {m.offline}</span>
      <span className="text-slate-600">duración: {m.durationMs}ms</span>
      <span className="text-slate-500">{m.isActive ? (m.isRunning ? "ciclo en curso" : "activo") : "inactivo"}</span>
      <span className="text-slate-400">{since}</span>
    </div>
  );
}

