import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      throw new Error("O token de acesso do Mercado Pago não está configurado.");
    }

    const { appointmentId, services, clientName, clientEmail, origin } = await req.json();

    if (!appointmentId || !services || !clientName || !clientEmail || !origin) {
      return new Response(JSON.stringify({ error: "Faltam campos obrigatórios." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const items = services.map((service: { name: string; price: number; }) => ({
      title: service.name,
      quantity: 1,
      unit_price: service.price,
      currency_id: 'BRL',
    }));

    const preference = {
      items,
      payer: {
        name: clientName,
        email: clientEmail,
      },
      back_urls: {
        success: `${origin}/payment-success`,
        failure: `${origin}/payment-failure`,
        pending: `${origin}/payment-pending`,
      },
      auto_return: 'approved',
      external_reference: appointmentId,
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro na API do Mercado Pago:", data);
      throw new Error(data.message || "Falha ao criar preferência de pagamento.");
    }

    const paymentId = data.id;
    const initPoint = data.init_point;

    const { error: updateError } = await supabaseAdmin
      .from('appointments')
      .update({ payment_id: paymentId, payment_status: 'pending' })
      .eq('id', appointmentId);

    if (updateError) {
      console.error("Erro ao atualizar agendamento:", updateError);
      throw new Error("Falha ao atualizar agendamento com o ID do pagamento.");
    }

    return new Response(JSON.stringify({ init_point: initPoint }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})