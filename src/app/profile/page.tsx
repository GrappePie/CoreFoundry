"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { ArrowLeftCircle } from 'lucide-react';

export default function ProfilePage() {
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-4">
      <div className="relative max-w-md w-full bg-white/10 backdrop-blur-sm rounded-lg pt-10 px-6 pb-6">
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
        >
          <ArrowLeftCircle className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-2xl font-bold mb-4 mt-6">Perfil de Usuario</h1>
        <p className="mb-2"><strong>ID:</strong> {user.id}</p>
        <p className="mb-4"><strong>Email:</strong> {user.email}</p>
      </div>
    </main>
  );
}
