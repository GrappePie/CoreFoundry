import AuthForm from '@/components/AuthForm';

export default function RegisterPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <AuthForm formType="register" />
    </div>
  );
}
