"use client";

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { showError, showLoading, dismissToast } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";

// Certifique-se de que sua chave publicável do Stripe está no .env
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number | null;
}

interface PaymentPageProps {
  appointmentId: string;
  clientName: string;
  clientWhatsapp: string;
  selectedServices: Service[];
  totalAmount: number;
  selectedEmployeeId: string;
}

const CheckoutForm: React.FC<PaymentPageProps> = ({
  appointmentId,
  clientName,
  clientWhatsapp,
  selectedServices,
  totalAmount,
  selectedEmployeeId,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    const loadingToast = showLoading("Processando pagamento...");

    // Chamar a Edge Function para criar a Payment Intent
    const { data: paymentIntentData, error: paymentIntentError } = await supabase.functions.invoke('create-stripe-payment-intent', {
      body: {
        amount: Math.round(totalAmount * 100), // Stripe espera o valor em centavos
        currency: 'brl',
        appointmentId: appointmentId,
      },
    });

    if (paymentIntentError) {
      dismissToast(loadingToast);
      showError("Erro ao iniciar o pagamento: " + paymentIntentError.message);
      setIsProcessing(false);
      return;
    }

    const clientSecret = paymentIntentData.data.clientSecret;

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/payment-status?appointmentId=${appointmentId}`,
        receipt_email: clientName, // Usar o nome do cliente como email para o recibo
      },
    });

    dismissToast(loadingToast);
    setIsProcessing(false);

    if (confirmError) {
      if (confirmError.type === "card_error" || confirmError.type === "validation_error") {
        showError(confirmError.message || "Erro no cartão ou validação.");
      } else {
        showError("Ocorreu um erro inesperado.");
      }
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
      <Button disabled={isProcessing || !stripe || !elements} className="w-full">
        {isProcessing ? "Processando..." : "Pagar Agora"}
      </Button>
    </form>
  );
};

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { appointmentId, clientName, clientWhatsapp, selectedServices, totalAmount, selectedEmployeeId } = (location.state || {}) as PaymentPageProps;
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appointmentId || !totalAmount) {
      showError("Dados do agendamento incompletos para pagamento.");
      navigate("/");
      return;
    }

    const fetchClientSecret = async () => {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-stripe-payment-intent', {
        body: {
          amount: Math.round(totalAmount * 100), // Stripe espera o valor em centavos
          currency: 'brl',
          appointmentId: appointmentId,
        },
      });

      if (error) {
        showError("Erro ao preparar o pagamento: " + error.message);
        navigate("/");
      } else {
        setClientSecret(data.data.clientSecret);
      }
      setLoading(false);
    };

    fetchClientSecret();
  }, [appointmentId, totalAmount, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando opções de pagamento...</div>;
  }

  if (!clientSecret) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Erro ao carregar o pagamento.</div>;
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#6366f1', // Tailwind indigo-500
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, sans-serif',
        spacingUnit: '4px',
        borderRadius: '0.375rem', // Tailwind rounded-md
      },
    },
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Finalizar Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-center">
            <p className="text-lg">Serviços selecionados: {selectedServices?.map(s => s.name).join(', ')}</p>
            <p className="text-xl font-bold text-primary">Total: R$ {totalAmount?.toFixed(2) || "0.00"}</p>
          </div>
          {clientSecret && stripePromise && (
            <Elements options={options} stripe={stripePromise}>
              <CheckoutForm
                appointmentId={appointmentId}
                clientName={clientName}
                clientWhatsapp={clientWhatsapp}
                selectedServices={selectedServices || []}
                totalAmount={totalAmount || 0}
                selectedEmployeeId={selectedEmployeeId || ""}
              />
            </Elements>
          )}
        </CardContent>
      </Card>
    </div>
  );
}