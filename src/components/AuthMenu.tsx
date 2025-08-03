"use client";
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const AuthMenu = () => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center space-x-2 text-white hover:text-slate-100"
      >
        <span>{user?.email ?? 'Usuario'}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded shadow-lg z-30">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 hover:bg-gray-100"
          >
            Perfil
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
          >Cerrar sesión</button>
        </div>
      )}
    </div>
  );
};

export default AuthMenu;
