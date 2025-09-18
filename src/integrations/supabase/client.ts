import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY; // Exportar a chave publicável do Stripe

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem ser definidas.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);