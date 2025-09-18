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
    // Create a Supabase client with the service role key for elevated privileges
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch appointments that should now be 'Em Atendimento'
    const { data: appointmentsToUpdate, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select('id, appointment_date, status')
      .in('status', ['Pendente', 'Confirmado'])
      .lte('appointment_date', new Date().toISOString()); // Check if appointment date is in the past or now

    if (fetchError) {
      console.error('Error fetching appointments to update:', fetchError.message);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (appointmentsToUpdate && appointmentsToUpdate.length > 0) {
      const appointmentIds = appointmentsToUpdate.map(a => a.id);
      
      // Update the status of these appointments
      const { error: updateError } = await supabaseAdmin
        .from('appointments')
        .update({ status: 'Em Atendimento' })
        .in('id', appointmentIds);

      if (updateError) {
        console.error('Error updating appointment statuses:', updateError.message);
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Updated ${appointmentsToUpdate.length} appointments to 'Em Atendimento'.`);
      return new Response(JSON.stringify({ message: `Updated ${appointmentsToUpdate.length} appointments to 'Em Atendimento'.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ message: 'No appointments to update.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

  } catch (error) {
    console.error('Unhandled error in Edge Function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});