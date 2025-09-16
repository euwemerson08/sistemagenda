"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";
import { Navigate, Link } from "react-router-dom";

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
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="light"
          providers={[]}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Seu email',
                password_label: 'Sua senha',
                email_input_placeholder: 'seu@email.com',
                password_input_placeholder: 'Sua senha',
                button_label: 'Entrar',
                social_provider_text: 'Entrar com {{provider}}',
                link_text: 'Já tem uma conta? Entre',
              },
              sign_up: {
                email_label: 'Seu email',
                password_label: 'Crie uma senha',
                email_input_placeholder: 'seu@email.com',
                password_input_placeholder: 'Crie uma senha segura',
                button_label: 'Criar conta',
                link_text: 'Não tem uma conta? Crie uma',
              },
              forgotten_password: {
                email_label: 'Seu email',
                password_label: 'Sua senha',
                email_input_placeholder: 'seu@email.com',
                button_label: 'Enviar instruções',
                link_text: 'Esqueceu sua senha?',
              },
            },
          }}
        />
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