import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mvvcriramwousalqdstz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dmNyaXJhbXdvdXNhbHFkc3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MDI4MzAsImV4cCI6MjA3MzQ3ODgzMH0.O5uOEmir3pEP8vQP0xjP2erjY89SY7nW-HtBud1nRKU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);