-- ============================================================
-- 39_rascunhos_ia.sql — Geração de questões por IA (roadmap v2, H2).
-- Questões geradas NUNCA entram direto em `questoes`: ficam aqui como
-- rascunho até um gestor aprovar (aprovar = criarQuestao, que revalida
-- com o mesmo validarPayload das questões humanas) ou descartar.
-- ============================================================

create table if not exists rascunhos_questoes (
  id            uuid primary key default gen_random_uuid(),
  fase_id       int  not null references fases(id),
  payload       jsonb not null,
  status        text not null default 'pendente_revisao'
                check (status in ('pendente_revisao', 'aprovado', 'descartado')),
  criado_por    uuid not null references profiles(id),
  tokens_entrada int,
  tokens_saida   int,
  created_at    timestamptz not null default now()
);
create index if not exists idx_rascunhos_status on rascunhos_questoes (status, fase_id);
alter table rascunhos_questoes enable row level security;
