"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const updatePasswordSchema = z.object({
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

const UpdatePasswordPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecoverySession, setIsRecoverySession] = useState(false);

  useEffect(() => {
    // The most reliable way to check for a recovery session is the URL hash
    if (window.location.hash.includes('type=recovery')) {
      setIsRecoverySession(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoverySession(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const form = useForm<z.infer<typeof updatePasswordSchema>>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "" },
  });

  async function handleUpdatePassword(values: z.infer<typeof updatePasswordSchema>) {
    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });
    setIsSubmitting(false);
    if (error) {
      toast.error("Erro ao atualizar a senha: " + error.message);
    } else {
      toast.success("Sua senha foi atualizada com sucesso!");
      navigate("/");
    }
  }

  if (!isRecoverySession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-4">Link Inválido ou Expirado</h1>
          <p className="text-muted-foreground mb-6">
            Este link de redefinição de senha não é válido. Por favor, solicite um novo.
          </p>
          <Button onClick={() => navigate("/")}>Voltar para o Início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6">Crie uma Nova Senha</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUpdatePassword)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Sua nova senha segura" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Nova Senha"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;