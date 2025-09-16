import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { appointmentDetails } = await req.json();
    if (!appointmentDetails) {
      throw new Error("Appointment details are required.");
    }

    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from("payment_settings")
      .select("settings")
      .eq("provider", "MERCADO_PAGO")
      .single();

    if (settingsError || !settingsData?.settings?.accessToken) {
      throw new Error("Mercado Pago access token not configured.");
    }
    const accessToken = settingsData.settings.accessToken;

    const [firstName, ...lastNameParts] = appointmentDetails.client_name.split(' ');
    const lastName = lastNameParts.join(' ');

    const preference = {
      items: appointmentDetails.services.map((service: any) => ({
        title: service.name,
        quantity: 1,
        unit_price: service.price,
      })),
      payer: {
        name: firstName,
        surname: lastName || firstName,
        email: appointmentDetails.client_email,
        identification: {
          type: "CPF",
          number: appointmentDetails.client_cpf.replace(/\D/g, ''),
        },
      },
      back_urls: {
        success: `${Deno.env.get('SUPABASE_URL')}/success`, // Placeholder, not used in this flow
        failure: `${Deno.env.get('SUPABASE_URL')}/failure`,
        pending: `${Deno.env.get('SUPABASE_URL')}/pending`,
      },
      auto_return: "approved",
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`Mercado Pago API error: ${JSON.stringify(errorBody)}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify({ preferenceId: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});