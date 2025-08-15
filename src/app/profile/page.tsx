"use client";

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { ArrowLeftCircle } from 'lucide-react';

export default function ProfilePage() {
  const user = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Fetch full profile
  useEffect(() => {
    if (token && isAuthenticated) {
      setLoading(true);
      fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          setProfile(data.user);
        })
        .catch(err => console.error('Error fetching profile:', err))
        .finally(() => setLoading(false));
    }
  }, [token, isAuthenticated]);

  if (!user) return null;
  if (loading || !profile) {
    return <main className="min-h-screen flex items-center justify-center">Cargando...</main>;
  }

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
        <p className="mb-2"><strong>ID:</strong> {profile.id}</p>
        <p className="mb-2"><strong>Email:</strong> {profile.email}</p>
        <p className="mb-2"><strong>Rol:</strong> {profile.role}</p>
        <p className="mb-2"><strong>Subscripción:</strong> {profile.subscription}</p>
        <p className="mb-2"><strong>Estado:</strong> {profile.status}</p>
        <p className="mb-2"><strong>Email verificado:</strong> {profile.emailVerified ? 'Sí' : 'No'}</p>
        <p className="mb-2"><strong>Último inicio sesión:</strong> {profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : '-'}</p>
        <p className="mb-2"><strong>Inicio subscripción:</strong> {profile.subscriptionStart ? new Date(profile.subscriptionStart).toLocaleDateString() : '-'}</p>
        <p className="mb-4"><strong>Fin subscripción:</strong> {profile.subscriptionEnd ? new Date(profile.subscriptionEnd).toLocaleDateString() : '-'}</p>
      </div>
    </main>
  );
}
