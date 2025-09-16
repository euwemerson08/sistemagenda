"use client";

import React from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";
import { Navigate } from "react-router-dom";

const Login: React.FC = () => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (session) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6">Login do Administrador</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="light"
          providers={[]} // Remova provedores de terceiros se não forem necessários
          redirectTo={window.location.origin + '/admin'}
        />
      </div>
    </div>
  );
};

export default Login;