"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Esquema para a primeira etapa (Nome e WhatsApp)
const nameWhatsappSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  whatsapp: z.string().min(10, "O WhatsApp parece inválido."),
});

// Esquemas existentes para Sign Up e Sign In
const signUpSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  whatsapp: z.string().min(10, "O WhatsApp parece inválido."),
  email: z.string().email("Email inválido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

const signInSchema = z.object({
  email: z.string().email("Email inválido."),
  password: z.string().min(1, "A senha é obrigatória."),
});

export function CustomerAuthForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'name_whatsapp_entry' | 'auth_tabs'>('name_whatsapp_entry');
  const [prefilledName, setPrefilledName] = useState<string>("");
  const [prefilledWhatsapp, setPrefilledWhatsapp] = useState<string>("");
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin"); // Controla qual aba de auth está ativa

  // Formulário para a primeira etapa (Nome e WhatsApp)
  const nameWhatsappForm = useForm<z.infer<typeof nameWhatsappSchema>>({
    resolver: zodResolver(nameWhatsappSchema),
    defaultValues: { name: "", whatsapp: "" },
  });

  // Formulário de Sign Up, com valores preenchidos se vier da etapa anterior
  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: prefilledName, whatsapp: prefilledWhatsapp, email: "", password: "" },
  });

  // Formulário de Sign In
  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  // Atualiza os valores padrão do formulário de Sign Up quando prefilledName/Whatsapp mudam
  useEffect(() => {
    signUpForm.reset({
      name: prefilledName,
      whatsapp: prefilledWhatsapp,
      email: "", // Mantém o email vazio para novos cadastros
      password: "",
    });
  }, [prefilledName, prefilledWhatsapp, signUpForm]);

  // Lida com a submissão da primeira etapa (Nome e WhatsApp)
  async function handleNameWhatsappSubmit(values: z.infer<typeof nameWhatsappSchema>) {
    setIsSubmitting(true);
    setPrefilledName(values.name);
    setPrefilledWhatsapp(values.whatsapp);

    // Verifica se um perfil com este nome e whatsapp existe
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("name", values.name)
      .eq("whatsapp", values.whatsapp)
      .single();

    setIsSubmitting(false);

    if (error && error.code !== 'PGRST116') { // PGRST116 significa "nenhuma linha encontrada"
      toast.error("Erro ao verificar perfil: " + error.message);
      return;
    }

    if (data) {
      // Perfil encontrado, guia para fazer login
      toast.info("Bem-vindo de volta! Por favor, faça login com seu email e senha.");
      setAuthTab("signin");
    } else {
      // Perfil não encontrado, guia para criar conta
      toast.info("Parece que você é novo por aqui! Crie sua conta para agendar.");
      setAuthTab("signup");
    }
    setCurrentStep('auth_tabs'); // Avança para a etapa de abas de autenticação
  }

  // Lida com o cadastro de um novo usuário
  async function handleSignUp(values: z.infer<typeof signUpSchema>) {
    setIsSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          name: values.name,
          whatsapp: values.whatsapp,
        },
      },
    });
    setIsSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Verifique seu email para confirmar sua conta!");
    }
  }

  // Lida com o login de um usuário existente
  async function handleSignIn(values: z.infer<typeof signInSchema>) {
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    setIsSubmitting(false);
    if (error) {
      toast.error("Email ou senha inválidos.");
    }
  }

  return (
    <>
      {currentStep === 'name_whatsapp_entry' && (
        <Form {...nameWhatsappForm}>
          <form onSubmit={nameWhatsappForm.handleSubmit(handleNameWhatsappSubmit)} className="space-y-4 mt-4">
            <FormField
              control={nameWhatsappForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={nameWhatsappForm.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                  <FormControl>
                    <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Verificando..." : "Continuar"}
            </Button>
          </form>
        </Form>
      )}

      {currentStep === 'auth_tabs' && (
        <Tabs value={authTab} onValueChange={(value) => setAuthTab(value as "signin" | "signup")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar Conta</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <Form {...signInForm}>
              <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4 mt-4">
                <FormField
                  control={signInForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signInForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Sua senha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="signup">
            <Form {...signUpForm}>
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4 mt-4">
                <FormField
                  control={signUpForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome completo" {...field} readOnly={!!prefilledName} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signUpForm.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp</FormLabel>
                      <FormControl>
                        <Input placeholder="(XX) XXXXX-XXXX" {...field} readOnly={!!prefilledWhatsapp} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signUpForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signUpForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Crie uma senha segura" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Criando conta..." : "Criar Conta"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}