"use client";

import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const { user, logout } = useAuthStore();

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />

        {user ? (
          <div>
            <p>Bienvenido, {user.email}</p>
            <button onClick={logout}>Cerrar sesión</button>
          </div>
        ) : (
          <div className="flex gap-4">
            <Link href="/login">Iniciar sesión</Link>
            <Link href="/register">Registrarse</Link>
          </div>
        )}
      </main>
    </div>
  );
}
