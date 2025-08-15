"use client";

import useModules from "@/hooks/useModules";

export default function ModulesList() {
  const modules = useModules();
  return (
    <ul>
      {modules.map((m) => (
        <li key={m._id}>
          {m.name} - {m.status}
        </li>
      ))}
    </ul>
  );
}

