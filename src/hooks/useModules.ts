"use client";

import { useEffect, useState } from "react";

export interface ModuleInfo {
  _id: string;
  name: string;
  status: string;
}

async function fetchModules(): Promise<ModuleInfo[]> {
  const res = await fetch("/api/modules");
  if (!res.ok) return [];
  return res.json();
}

export default function useModules() {
  const [modules, setModules] = useState<ModuleInfo[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const data = await fetchModules();
      if (mounted) setModules(data);
    }

    load();

    const source = new EventSource("/api/modules/events");
    const handler = () => {
      void load();
    };
    source.addEventListener("module.online", handler);
    source.addEventListener("module.offline", handler);
    source.addEventListener("module.removed", handler);

    return () => {
      mounted = false;
      source.close();
    };
  }, []);

  return modules;
}

