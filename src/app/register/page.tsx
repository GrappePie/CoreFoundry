"use client";

import AuthForm from '@/components/AuthForm';

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md">
        <AuthForm formType="register" />
      </div>
    </div>
  );
}
