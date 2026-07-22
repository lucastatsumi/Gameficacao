-- ============================================================
-- 27_ligas_semanais.sql — Ligas semanais (roadmap v2, seção 4.5):
-- ranking justo por divisão (Bronze -> Prata -> Ouro -> Diamante),
-- competindo pelo XP ganho NA SEMANA (não o total acumulado) — todo
-- mundo começa a semana zerado dentro da própria divisão.
--
-- Sem cron externo (este ambiente não garante um): o fechamento da
-- semana é LAZY — o primeiro acesso de cada jogador após a virada
-- (quiz finalizado ou apenas abrir a tela de liga) fecha a semana
-- anterior dele, calcula promoção/rebaixamento pelo cohort daquela
-- semana+divisão (já imutável, pois o XP novo já foi para o balde da
-- semana atual) e paga fichas. `fechada` evita fechar duas vezes.
-- Aplicar via MCP como migration "27_ligas_semanais".
-- ============================================================

create table ligas_jogador (
  user_id     uuid primary key references profiles(id) on delete cascade,
  divisao     text not null default 'bronze' check (divisao in ('bronze', 'prata', 'ouro', 'diamante')),
  atualizada_em timestamptz not null default now()
);

create table ligas_semana (
  user_id    uuid not null references profiles(id) on delete cascade,
  semana     text not null, -- ISO 8601 'YYYY-Www', ex. '2026-W30'
  divisao    text not null check (divisao in ('bronze', 'prata', 'ouro', 'diamante')),
  xp_semana  int  not null default 0 check (xp_semana >= 0),
  fechada    boolean not null default false,
  primary key (user_id, semana)
);

create index idx_ligas_semana_divisao on ligas_semana (semana, divisao);

alter table ligas_jogador enable row level security;
alter table ligas_semana enable row level security;
