"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = useModules;
const react_1 = require("react");
async function fetchModules() {
    const res = await fetch("/api/modules");
    if (!res.ok)
        return [];
    return res.json();
}
function useModules() {
    const [modules, setModules] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        let mounted = true;
        async function load() {
            const data = await fetchModules();
            if (mounted)
                setModules(data);
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
