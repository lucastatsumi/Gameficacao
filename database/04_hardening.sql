-- ============================================================
-- 04_hardening.sql — Correções apontadas pelos security advisors
-- do Supabase após aplicar 01–03. Já aplicado via MCP como
-- migration "04_security_hardening".
-- ============================================================

-- Views passam a respeitar o RLS de quem consulta (security invoker).
-- Sem isso, views no Supabase rodam como SECURITY DEFINER e furariam
-- a estratégia de "RLS habilitado sem policies": a anon key conseguiria
-- ler ranking e desempenho direto pelo PostgREST.
-- Como as tabelas têm RLS sem policies, a anon key não lê nada;
-- o backend (service role) ignora RLS e continua funcionando.
alter view ranking_global      set (security_invoker = true);
alter view ranking_turma       set (security_invoker = true);
alter view ranking_fase        set (security_invoker = true);
alter view desempenho_questoes set (security_invoker = true);
alter view desempenho_alunos   set (security_invoker = true);

-- Fixa o search_path das funções (evita hijack por schema malicioso)
alter function nivel_por_xp(int)  set search_path = public;
alter function xp_para_nivel(int) set search_path = public;

-- handle_new_user é um trigger interno: ninguém deve chamá-lo via RPC
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- rls_auto_enable é uma função de plataforma do Supabase (event trigger);
-- também não deve ser exposta via RPC
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
