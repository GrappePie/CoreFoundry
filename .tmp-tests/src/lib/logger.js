"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = {
    info: (...args) => console.info(...args),
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(...args);
        }
    },
};
exports.default = logger;
