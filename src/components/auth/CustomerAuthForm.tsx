"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Esquema para a etapa de verificação de OTP
const otpSchema = z.object({
  otp: z.string().min(6, "O código OTP deve ter 6 dígitos."),
});

export function CustomerAuthForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'name_whatsapp_entry' | 'otp_verification'>('name_whatsapp_entry');
  const [prefilledName, setPrefilledName] = useState<string>("");
  const [prefilledWhatsapp, setPrefilledWhatsapp] = useState<string>("");
  const [otpSent, setOtpSent] = useState(false);

  // Formulário para a primeira etapa (Nome e WhatsApp)
  const nameWhatsappForm = useForm<z.infer<typeof nameWhatsappSchema>>({
    resolver: zodResolver(nameWhatsappSchema),
    defaultValues: { name: "", whatsapp: "" },
  });

  // Formulário para a etapa de OTP
  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  // Lida com a submissão da primeira etapa (Nome e WhatsApp) e envia o OTP
  async function handleNameWhatsappSubmit(values: z.infer<typeof nameWhatsappSchema>) {
    setIsSubmitting(true);
    setPrefilledName(values.name);
    setPrefilledWhatsapp(values.whatsapp);

    const { error } = await supabase.auth.signInWithOtp({
      phone: values.whatsapp,
      options: {
        data: {
          name: values.name,
          whatsapp: values.whatsapp,
        },
      },
    });
    setIsSubmitting(false);

    if (error) {
      toast.error("Erro ao enviar código: " + error.message);
    } else {
      toast.success("Um código de verificação foi enviado para o seu WhatsApp!");
      setOtpSent(true);
      setCurrentStep('otp_verification');
    }
  }

  // Lida com a verificação do OTP
  async function handleOtpVerification(values: z.infer<typeof otpSchema>) {
    setIsSubmitting(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: prefilledWhatsapp,
      token: values.otp,
      type: 'sms',
    });
    setIsSubmitting(false);

    if (error) {
      toast.error("Erro ao verificar código: " + error.message);
    } else {
      toast.success("Login realizado com sucesso!");
      // O usuário será redirecionado automaticamente pelo SessionContextProvider
    }
  }

  // Função para reenviar o OTP
  async function handleResendOtp() {
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: prefilledWhatsapp,
      options: {
        data: {
          name: prefilledName,
          whatsapp: prefilledWhatsapp,
        },
      },
    });
    setIsSubmitting(false);

    if (error) {
      toast.error("Erro ao reenviar código: " + error.message);
    } else {
      toast.success("Novo código enviado para o seu WhatsApp!");
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
              {isSubmitting ? "Enviando código..." : "Continuar"}
            </Button>
          </form>
        </Form>
      )}

      {currentStep === 'otp_verification' && (
        <Form {...otpForm}>
          <form onSubmit={otpForm.handleSubmit(handleOtpVerification)} className="space-y-4 mt-4">
            <p className="text-sm text-gray-600">
              Um código de 6 dígitos foi enviado para o seu WhatsApp: <span className="font-medium">{prefilledWhatsapp}</span>
            </p>
            <FormField
              control={otpForm.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Verificação</FormLabel>
                  <FormControl>
                    <Input placeholder="XXXXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Verificando..." : "Verificar Código"}
            </Button>
            <Button type="button" variant="link" className="w-full" onClick={handleResendOtp} disabled={isSubmitting}>
              Reenviar Código
            </Button>
          </form>
        </Form>
      )}
    </>
  );
}