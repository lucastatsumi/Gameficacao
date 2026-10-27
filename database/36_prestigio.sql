-- ============================================================
-- 36_prestigio.sql — Prestígio / Nova Jornada+ (roadmap v2, 4.11).
-- Um registro por ciclo concluído de um tema. O progresso de JOGO
-- (progresso_fase) reinicia; score e competências (derivados de
-- tentativas/respostas) NÃO resetam — gamificação ≠ avaliação.
-- ============================================================

create table if not exists prestigios (
  user_id  uuid not null references profiles(id) on delete cascade,
  tema_id  int  not null references temas(id),
  ciclo    int  not null check (ciclo >= 1),
  criado_em timestamptz not null default now(),
  primary key (user_id, tema_id, ciclo)  -- também é a trava contra duplo clique
);
alter table prestigios enable row level security;
