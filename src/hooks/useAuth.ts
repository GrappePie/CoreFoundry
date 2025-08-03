'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

interface Credentials {
  email?: string;
  password?: string;
}

/**
 * Performs login request to backend API and returns auth data
 */
const loginUser = async (credentials: Credentials) => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const errorBody = await res.json();
    const err = new Error(errorBody.message);
    (err as any).issues = errorBody.errors;
    throw err;
  }

  return res.json();
};

/**
 * Performs user registration request to backend API and returns auth data
 */
const registerUser = async (credentials: Credentials) => {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const errorBody = await res.json();
    const err = new Error(errorBody.message);
    (err as any).issues = errorBody.errors;
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
export const useAuth = () => {
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      const { token, user } = data;
      // Update Zustand store with new auth data
      setAuth(token, user);
      // Refresh any user-related queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
      // Redirect to home page
      router.push('/');
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      const { token, user } = data;
      setAuth(token, user);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.push('/');
    },
  });

  return {
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    isPending: loginMutation.isPending || registerMutation.isPending,
    error: loginMutation.error || registerMutation.error,
  };
};
