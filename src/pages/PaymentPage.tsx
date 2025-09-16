"use client";

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { appointmentDetails, preferenceId } = location.state || {};

  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicKey = async () => {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("settings")
        .eq("provider", "MERCADO_PAGO")
        .single();

      if (error || !data?.settings?.publicKey) {
        setError("Não foi possível carregar a configuração de pagamento. Por favor, contate o suporte.");
        toast.error("Configuração de pagamento não encontrada.");
      } else {
        setPublicKey(data.settings.publicKey);
        initMercadoPago(data.settings.publicKey);
      }
    };

    fetchPublicKey();
  }, []);

  const createAppointment = async (payment: any) => {
    const appointmentData = {
      ...appointmentDetails,
      payment_id: payment.id,
      payment_status: 'paid',
    };

    const { error } = await supabase.from('appointments').insert([appointmentData]);

    if (error) {
      toast.error("Erro ao salvar agendamento: " + error.message);
      // Handle compensation logic if needed (e.g., refund)
    } else {
      toast.success("Pagamento aprovado e agendamento confirmado!");
      navigate("/"); // Redirect to a success page or home
    }
  };

  const renderContent = () => {
    if (error) {
      return <p className="text-red-500 text-center">{error}</p>;
    }

    if (!publicKey || !preferenceId) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }

    return (
      <Payment
        initialization={{ preferenceId }}
        onSubmit={async (param) => {
          // This is a client-side confirmation. For production, use webhooks.
          await createAppointment(param);
        }}
        onReady={() => console.log("Mercado Pago form is ready.")}
        onError={(err) => console.error("Mercado Pago form error:", err)}
      />
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Finalizar Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentPage;