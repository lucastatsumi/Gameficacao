-- ============================================================
-- 27_ligas.sql — Ligas semanais (roadmap v2, seção 4.5): ranking justo
-- por XP GANHO NA SEMANA (não total), em divisões Bronze/Prata/Ouro/
-- Diamante. Fechamento é LAZY: o primeiro acesso de cada divisão após a
-- virada da semana ISO promove o top 20%, rebaixa o bottom 20% e paga
-- fichas a todos pela posição — sem depender de cron externo (regras em
-- ligaService.js). `semana` guarda o identificador ISO ("2026-W30") da
-- última rodada processada para aquele jogador.
-- Aplicar via MCP como migration "27_ligas".
-- ============================================================

create table ligas_semana (
  user_id   uuid primary key references profiles(id) on delete cascade,
  divisao   text not null default 'bronze' check (divisao in ('bronze', 'prata', 'ouro', 'diamante')),
  xp_semana int  not null default 0 check (xp_semana >= 0),
  semana    text not null
);

create index idx_ligas_semana_divisao on ligas_semana (divisao, xp_semana desc);

alter table ligas_semana enable row level security;
