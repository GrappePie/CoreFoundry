"use client";

import { useEffect, useState } from "react";

type HealthPart = { status: "ok" | "error" | "disabled"; error?: string };
interface HealthSummary {
  status: "ok" | "degraded" | "error";
  db: HealthPart;
  mq: HealthPart;
}

export default function HealthStatus() {
  const [data, setData] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const json = (await res.json()) as HealthSummary;
        if (mounted) setData(json);
      } catch {
        if (mounted) setData({ status: "error", db: { status: "error" }, mq: { status: "error" } });
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

  const badge = (s: "ok" | "degraded" | "error") =>
    s === "ok" ? "bg-green-100 text-green-700" : s === "degraded" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";

  const part = (s: "ok" | "error" | "disabled") =>
    s === "ok" ? "text-green-600" : s === "disabled" ? "text-gray-500" : "text-red-600";

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className={`px-2 py-1 rounded ${badge(data?.status ?? (loading ? "degraded" : "error"))}`}>
        {loading ? "Comprobando…" : `Estado: ${data?.status ?? "error"}`}
      </span>
      <span className={part(data?.db.status ?? "error")}>DB: {data?.db.status ?? "error"}</span>
      <span className={part(data?.mq.status ?? "error")}>MQ: {data?.mq.status ?? "error"}</span>
    </div>
  );
}

