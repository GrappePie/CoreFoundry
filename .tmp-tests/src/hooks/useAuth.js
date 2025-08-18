"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = void 0;
const react_query_1 = require("@tanstack/react-query");
const authStore_1 = require("../store/authStore");
const navigation_1 = require("next/navigation");
/**
 * Performs login request to backend API and returns auth data
 */
const loginUser = async (credentials) => {
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
    if (!res.ok) {
        const errorBody = await res.json();
        const err = new Error(errorBody.message);
        err.issues = errorBody.errors;
        throw err;
    }
    return res.json();
};
/**
 * Performs user registration request to backend API and returns auth data
 */
const registerUser = async (credentials) => {
    const res = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
    if (!res.ok) {
        const errorBody = await res.json();
        const err = new Error(errorBody.message);
        err.issues = errorBody.errors;
        throw err;
    }
    return res.json();
};
/**
 * Custom hook combining TanStack Query mutations with Zustand auth store.
 * - login: triggers loginUser mutation, updates Zustand store on success, invalidates 'user' query, and navigates to home.
 * - register: triggers registerUser mutation, updates store and navigates similarly.
 * - isPending: true when any auth mutation is in progress.
 * - error: captures errors from mutations.
 */
const useAuth = () => {
    const queryClient = (0, react_query_1.useQueryClient)();
    const { setAuth } = (0, authStore_1.useAuthStore)();
    const router = (0, navigation_1.useRouter)();
    const loginMutation = (0, react_query_1.useMutation)({
        mutationFn: loginUser,
        onSuccess: (data) => {
            const { token, user } = data;
            // Update Zustand store with new auth data
            setAuth(token, user);
            // Refresh any user-related queries
            queryClient.invalidateQueries({ queryKey: ['user'] });
            // Redirect to home page
            router.push('/dashboard');
        },
    });
    const registerMutation = (0, react_query_1.useMutation)({
        mutationFn: registerUser,
        onSuccess: (data) => {
            const { token, user } = data;
            setAuth(token, user);
            queryClient.invalidateQueries({ queryKey: ['user'] });
            router.push('/dashboard');
        },
    });
    return {
        login: loginMutation.mutate,
        register: registerMutation.mutate,
        isPending: loginMutation.isPending || registerMutation.isPending,
        error: loginMutation.error || registerMutation.error,
    };
};
exports.useAuth = useAuth;
