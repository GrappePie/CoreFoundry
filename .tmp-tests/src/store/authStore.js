"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuthStore = void 0;
const zustand_1 = require("zustand");
const middleware_1 = require("zustand/middleware");
/**
 * Zustand authentication store with persistence.
 * - token: JWT token for authenticated requests
 * - user: user profile data
 * Provides actions to set authentication and to logout.
 * Data is persisted in localStorage under key 'auth-storage'.
 */
exports.useAuthStore = (0, zustand_1.create)()((0, middleware_1.persist)((set) => ({
    token: null,
    user: null,
    isAuthenticated: false,
    setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
    logout: () => set({ token: null, user: null, isAuthenticated: false }),
}), {
    name: 'auth-storage', // key for localStorage persistence
}));
