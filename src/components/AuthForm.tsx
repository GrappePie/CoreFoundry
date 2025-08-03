'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftCircle } from 'lucide-react';

interface AuthFormProps {
  formType: 'login' | 'register';
}

export default function AuthForm({ formType }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, register, isPending, error } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formType === 'login') {
      login({ email, password });
    } else {
      register({ email, password });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative bg-white shadow-md rounded px-8 pt-10 pb-8 mb-4 w-full max-w-md"
    >
      <button
        type="button"
        onClick={() => router.back()}
        className="absolute top-3 left-3 p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
      >
        <ArrowLeftCircle className="w-5 h-5 text-gray-700" />
      </button>
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        {formType === 'login' ? 'Iniciar sesión' : 'Registro'}
      </h2>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Correo electrónico
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Contraseña
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={isPending}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {isPending
            ? 'Cargando...'
            : formType === 'login'
            ? 'Iniciar sesión'
            : 'Registrarse'}
        </button>
      </div>
      {error && <div className="text-red-500 text-sm mt-4">{error.message}</div>}
      <div className="mt-4 text-center">
        {formType === 'login' ? (
          <Link href="/register" className="text-blue-500 hover:underline text-sm">
            ¿No tienes una cuenta? Regístrate
          </Link>
        ) : (
          <Link href="/login" className="text-blue-500 hover:underline text-sm">
            ¿Ya tienes una cuenta? Inicia sesión
          </Link>
        )}
      </div>
    </form>
  );
}
