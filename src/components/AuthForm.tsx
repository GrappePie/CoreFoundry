'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, FormEvent,  } from 'react';
import {errorMessages} from "@/config/errorMessages";
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
  const [confEmail, setConfEmail] = useState('');
  const [confPassword, setConfPassword] = useState('');
  const [errEmail, setErrEmail] = useState(false);
  const [errPassword, setErrPassword] = useState(false);
  const { login, register, isPending, error } = useAuth();

  function validateData() {

    let error = 0;
    if(password!==confPassword) {
      error++;
      setErrEmail(true)
      console.log('password must match');
    } if(email!==confEmail) {
      error++;
      setErrPassword(true)
      console.log('email must match');
    }

    if(error===0) {
      setErrEmail(false);
      setErrPassword(false)
      register({ email, password });
    }
  }

  function handleSubmit(event: FormEvent)  {
    event.preventDefault();
    if (formType === 'login') {
      login({ email, password });
    } else {
      validateData();
    }
  }

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
      {formType === 'login' ?"":
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Confirmar Correo electrónico
          </label>
          <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="email"
              value={confEmail}
              onChange={(e) => setConfEmail(e.target.value)}
              required
          />
          {errEmail && (
              <label className="block text-red-500 text-sm mt-4  mb-2">
                {errorMessages.NO_MATCH_EMAIL}
              </label>
          )}
        </div>
      }

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
      {formType === 'login' ?"":
        <div  className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Confirmar Contraseña
          </label>
          <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="password"
              value={confPassword}
              onChange={(e) => setConfPassword(e.target.value)}
              required
          />
          {errPassword && (
              <label className="block text-red-500 text-sm mt-4  mb-2">
                {errorMessages.NO_MATCH_PASSWORD}
              </label>
          )}
        </div>
      }

      <div className="flex items-center justify-between">

        <button
         type="submit"
          onClick={handleSubmit}
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
      {error && (() => {
        const issues = (error as any).issues;
        if (Array.isArray(issues)) {
          return (
            <ul className="text-red-500 text-sm mt-4 list-disc list-inside">
              {issues.map((issue: any, idx: number) => (
                <li key={idx}>{issue.path.join('.')}: {issue.message}</li>
              ))}
            </ul>
          );
        }
        return <div className="text-red-500 text-sm mt-4">{error.message}</div>;
      })()}
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
