import { createClient } from '@supabase/supabase-js';

// Cliente usado SOMENTE para autenticação (login, cadastro, sessão).
// Todo acesso a dados passa pela API Express — a anon key não lê o banco
// (RLS habilitado sem policies).
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
