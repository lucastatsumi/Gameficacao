import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Cliente administrativo: usa a service_role key e IGNORA o RLS.
// Só existe no backend — toda regra de acesso é aplicada aqui na API.
export const db = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Cliente com anon key: usado apenas para validar o JWT dos usuários.
export const supabaseAuth = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
