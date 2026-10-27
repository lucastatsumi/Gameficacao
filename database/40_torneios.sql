-- ============================================================
-- 40_torneios.sql — Torneio entre equipes (roadmap v2, H4 "Campanhas e
-- torneios"). O gestor cria uma janela e escolhe as equipes (turmas)
-- participantes; o placar é o XP médio POR MEMBRO ganho na janela (média,
-- não soma, para não premiar só o tamanho da equipe). Ao encerrar, o
-- pódio rende fichas aos membros (ver torneioService.js).
-- ============================================================

create table if not exists torneios (
  id         uuid primary key default gen_random_uuid(),
  gestor_id  uuid not null references profiles(id),
  nome       text not null,
  inicio     timestamptz not null,
  fim        timestamptz not null check (fim > inicio),
  status     text not null default 'ativo' check (status in ('ativo', 'encerrado')),
  created_at timestamptz not null default now()
);

create table if not exists torneio_equipes (
  torneio_id uuid not null references torneios(id) on delete cascade,
  turma_id   uuid not null references turmas(id)   on delete cascade,
  primary key (torneio_id, turma_id)
);

alter table torneios        enable row level security;
alter table torneio_equipes enable row level security;
