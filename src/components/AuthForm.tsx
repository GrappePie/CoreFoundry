'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, FormEvent } from 'react';

interface AuthFormProps {
  formType: 'login' | 'register';
}

export default function AuthForm({ formType }: AuthFormProps) {
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
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Correo electrónico:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
      </div>
      <div>
        <label>
          Contraseña:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
      </div>
      <div>
        <button type="submit" disabled={isPending}>
          {isPending
            ? 'Cargando...'
            : formType === 'login'
            ? 'Iniciar sesión'
            : 'Registrarse'}
        </button>
      </div>
      {error && <div>{error.message}</div>}
    </form>
  );
}
