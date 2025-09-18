"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { showError } from "@/utils/toast";
import { loadStripe } from "@stripe/stripe-js";
import { stripePublishableKey } from "@/integrations/supabase/client"; // Importar a chave publicável do Stripe

const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null; // Usar a chave publicável correta

export default function PaymentStatusPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "succeeded" | "processing" | "failed">("loading");
  const [message, setMessage] = useState("");
  const appointmentId = searchParams.get("appointmentId");
  const paymentIntentClientSecret = searchParams.get("payment_intent_client_secret");

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!stripePromise || !paymentIntentClientSecret || !appointmentId) {
        setMessage("Informações de pagamento incompletas.");
        setStatus("failed");
        return;
      }

      const stripe = await stripePromise;
      if (!stripe) {
        setMessage("Erro ao carregar o Stripe.");
        setStatus("failed");
        return;
      }

      const { paymentIntent, error } = await stripe.retrievePaymentIntent(paymentIntentClientSecret);

      if (error) {
        setMessage("Erro ao recuperar o status do pagamento: " + error.message);
        setStatus("failed");
        showError("Erro ao verificar o pagamento.");
        return;
      }

      if (paymentIntent) {
        switch (paymentIntent.status) {
          case "succeeded":
            setMessage("Pagamento realizado com sucesso!");
            setStatus("succeeded");
            // Atualizar o status do agendamento no Supabase
            await supabase.from('appointments').update({ payment_status: 'paid', payment_id: paymentIntent.id }).eq('id', appointmentId);
            break;
          case "processing":
            setMessage("Seu pagamento está sendo processado. Por favor, aguarde.");
            setStatus("processing");
            break;
          case "requires_payment_method":
            setMessage("Seu pagamento falhou, por favor, tente novamente.");
            setStatus("failed");
            // Atualizar o status do agendamento no Supabase
            await supabase.from('appointments').update({ payment_status: 'failed', payment_id: paymentIntent.id }).eq('id', appointmentId);
            break;
          default:
            setMessage("Algo deu errado.");
            setStatus("failed");
            // Atualizar o status do agendamento no Supabase
            await supabase.from('appointments').update({ payment_status: 'failed', payment_id: paymentIntent.id }).eq('id', appointmentId);
            break;
        }
      } else {
        setMessage("Não foi possível encontrar o Payment Intent.");
        setStatus("failed");
      }
    };

    checkPaymentStatus();
  }, [paymentIntentClientSecret, appointmentId, navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case "succeeded":
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case "processing":
        return <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />;
      case "failed":
        return <XCircle className="h-16 w-16 text-red-500" />;
      default:
        return <Loader2 className="h-16 w-16 text-gray-500 animate-spin" />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Status do Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">{getStatusIcon()}</div>
          <p className="text-lg font-medium">{message}</p>
          {status !== "loading" && (
            <Button onClick={() => navigate("/")} className="w-full">
              Voltar para o Início
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}