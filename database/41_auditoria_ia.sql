-- ============================================================
-- 41_auditoria_ia.sql — Auditoria por IA do banco de questões (roadmap
-- v2, H2). A IA só APONTA problemas (erro técnico, distrator fraco,
-- ambiguidade); nunca altera a questão: o gestor corrige pelo editor
-- existente e marca a sugestão como resolvida/ignorada.
-- ============================================================

create table if not exists auditoria_sugestoes (
  id         uuid primary key default gen_random_uuid(),
  questao_id uuid not null references questoes(id) on delete cascade,
  tipo       text not null check (tipo in ('erro_tecnico', 'distrator_fraco', 'ambiguidade', 'outro')),
  descricao  text not null,
  status     text not null default 'aberta' check (status in ('aberta', 'resolvida', 'ignorada')),
  criado_por uuid not null references profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_auditoria_status on auditoria_sugestoes (status, questao_id);
alter table auditoria_sugestoes enable row level security;
