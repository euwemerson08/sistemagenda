"use client";

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { appointmentDetails, preferenceId } = location.state || {};
  const { totalAmount, services } = appointmentDetails || {};

  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appointmentDetails || !preferenceId) {
      toast.error("Dados do agendamento não encontrados. Redirecionando...");
      navigate("/services");
      return;
    }

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
        initMercadoPago(data.settings.publicKey, { locale: 'pt-BR' });
      }
    };

    fetchPublicKey();
  }, [appointmentDetails, preferenceId, navigate]);

  const createAppointment = async (payment: any) => {
    const toastId = toast.loading("Confirmando seu agendamento...");
    const appointmentData = {
      ...appointmentDetails,
      payment_id: payment.id,
      payment_status: payment.status === 'approved' ? 'paid' : payment.status,
    };

    const { error } = await supabase.from('appointments').insert([appointmentData]);
    toast.dismiss(toastId);

    if (error) {
      toast.error("Erro ao salvar agendamento: " + error.message);
    } else {
      toast.success("Pagamento aprovado e agendamento confirmado!");
      navigate("/");
    }
  };

  const customization = {
    visual: {
      style: {
        theme: 'flat',
        customVariables: {
          baseColor: '#3B82F6',
          borderRadius: '6px',
          fontSizeMedium: '1rem',
          fontWeightNormal: '400',
        }
      }
    }
  };

  const renderContent = () => {
    if (error) {
      return <p className="text-red-500 text-center">{error}</p>;
    }

    if (!publicKey || !preferenceId) {
      return (
        <div className="space-y-4">
          <p className="text-center text-muted-foreground">Carregando formulário de pagamento...</p>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      );
    }

    return (
      <Payment
        initialization={{ preferenceId, amount: totalAmount }}
        customization={customization}
        onSubmit={async (param) => {
          await createAppointment(param);
        }}
        onReady={() => console.log("Mercado Pago Brick is ready.")}
        onError={(err) => console.error("Mercado Pago Brick error:", err)}
      />
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Finalizar Pagamento</CardTitle>
          <CardDescription className="text-center">
            Preencha os dados abaixo para confirmar seu agendamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {appointmentDetails && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Resumo do Pedido</h3>
              <ul className="space-y-1 text-muted-foreground">
                {services.map((service: any) => (
                  <li key={service.id} className="flex justify-between">
                    <span>{service.name}</span>
                    <span>R$ {service.price.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <Separator className="my-3" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>R$ {totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentPage;