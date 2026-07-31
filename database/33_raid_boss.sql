-- ============================================================
-- 33_raid_boss.sql — Raid boss de equipe (roadmap v2, 4.7):
-- transforma treinamento individual em objetivo coletivo. O gestor
-- (professor, dono da turma em `turmas`) lança um chefe com HP
-- COMPARTILHADO calibrado pelo tamanho da equipe (membros × 40,
-- ver backend/src/services/raidService.js). Janela de 1 semana;
-- cada acerto de QUALQUER matriculado em `matriculas` causa dano
-- proporcional à dificuldade da questão, dobrado nas últimas 24h
-- ("enfurece"). Derrotar o boss credita fichas para TODOS os
-- membros da turma, não só quem contribuiu — punir individualmente
-- minaria o objetivo coletivo (ver roadmap 4.7).
--
-- Reusa a "equipe" que já existe no código: `turmas`/`matriculas`
-- (mesmas tabelas do professor/aluno, sem nova multi-tenancy).
--
-- No máximo UM raid 'ativo' por turma por vez — o índice único
-- parcial abaixo É a trava de concorrência (mesma ideia de
-- ligas_fechamentos/temporada_resgates usando unique como lock):
-- 23505 na tentativa de lançar um segundo raid ativo é tratado em
-- raidService.lancarRaid como erro amigável.
-- Aplicar via MCP como migration "33_raid_boss".
-- ============================================================

create table raids (
  id         uuid primary key default gen_random_uuid(),
  turma_id   uuid not null references turmas(id) on delete cascade,
  hp_total   int  not null check (hp_total > 0),
  hp_atual   int  not null check (hp_atual >= 0),
  inicio     timestamptz not null default now(),
  fim        timestamptz not null,
  status     text not null default 'ativo' check (status in ('ativo', 'derrotado', 'expirado')),
  criado_por uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- A trava: no máximo um raid ativo por turma ao mesmo tempo.
create unique index raids_turma_ativo_unico on raids (turma_id) where status = 'ativo';

alter table raids enable row level security;

-- Contribuição de dano por jogador — alimenta o placar interno da
-- equipe (visível só para quem está na turma, resolvido no service).
create table raid_contribuicoes (
  id           uuid primary key default gen_random_uuid(),
  raid_id      uuid not null references raids(id) on delete cascade,
  user_id      uuid not null references profiles(id),
  dano         int  not null check (dano > 0),
  tentativa_id uuid,
  created_at   timestamptz not null default now()
);

create index idx_raid_contribuicoes_raid_user on raid_contribuicoes (raid_id, user_id);

alter table raid_contribuicoes enable row level security;
