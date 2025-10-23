import { createClient } from '@supabase/supabase-js';

// Reemplaza con tus valores reales de Supabase
const supabaseUrl = "https://TU_URL_SUPABASE.supabase.co";
const supabaseAnonKey = "TU_PUBLIC_ANON_KEY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
