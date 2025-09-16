"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import { useSession } from "@/components/SessionContextProvider";
import { Navigate, Link } from "react-router-dom";
import { CustomerAuthForm } from "@/components/auth/CustomerAuthForm";

const Index = () => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (session) {
    return <Navigate to="/services" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-2">Bem-vindo!</h1>
        <p className="text-center text-muted-foreground mb-6">Faça login ou crie sua conta para agendar.</p>
        <CustomerAuthForm />
        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-blue-500 hover:underline">
            Acesso do Administrador
          </Link>
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;