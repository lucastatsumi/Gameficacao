-- ============================================================
-- 27_ligas.sql — Ligas semanais (roadmap v2, 4.5): divisões
-- Bronze < Prata < Ouro < Diamante competindo pelo XP ganho NA
-- SEMANA (não o total) — o ranking global atual premia veteranos
-- para sempre; aqui todo mundo começa a segunda-feira zerado
-- dentro da própria divisão.
--
-- Fechamento é LAZY (backend/src/services/ligaService.js): o
-- primeiro acesso de QUALQUER jogador após a virada da semana
-- promove/rebaixa quem tinha linha na semana que fechou e semeia
-- a semana nova — sem depender de cron externo, que este ambiente
-- não tem como garantir.
-- Aplicar via MCP como migration "27_ligas".
-- ============================================================

create table ligas_semana (
  user_id   uuid not null references profiles(id) on delete cascade,
  semana    text not null, -- rótulo ISO 'YYYY-Www' (ex.: '2026-W30')
  divisao   text not null check (divisao in ('bronze', 'prata', 'ouro', 'diamante')),
  xp_semana int  not null default 0 check (xp_semana >= 0),
  primary key (user_id, semana)
);

create index idx_ligas_semana_divisao on ligas_semana (semana, divisao, xp_semana desc);

-- Trava do fechamento lazy: só existe depois que alguém processou a
-- transição para esta semana. O insert É a trava — 23505 (unique
-- violation) significa que outra requisição concorrente já fechou.
create table ligas_fechamentos (
  semana        text primary key,
  processado_em timestamptz not null default now()
);

alter table ligas_semana enable row level security;
alter table ligas_fechamentos enable row level security;

create or replace view ranking_liga as
select
  ls.user_id as id,
  p.nome,
  ls.semana,
  ls.divisao,
  ls.xp_semana,
  rank() over (partition by ls.semana, ls.divisao order by ls.xp_semana desc) as posicao
from ligas_semana ls
join profiles p on p.id = ls.user_id
where p.role = 'aluno';

-- Mesma regra de segurança das demais views (04_hardening.sql): security
-- invoker, senão rodaria como SECURITY DEFINER e furaria o RLS.
alter view ranking_liga set (security_invoker = true);
