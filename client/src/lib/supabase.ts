import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iuawurdssgbkbavyyvbs.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1YXd1cmRzc2dia2Jhdnl5dmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDU1MzEsImV4cCI6MjA3NDQyMTUzMX0.JLcuSTI1mfEMGu_mP9UBnGQyG33vcoU2SzvKo8olkL4';

if (!supabaseAnonKey || supabaseAnonKey.includes('placeholder')) {
  console.warn('⚠️ Using placeholder Supabase anon key. Please set VITE_SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

