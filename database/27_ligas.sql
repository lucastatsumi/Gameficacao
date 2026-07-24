-- ============================================================
-- 27_ligas.sql — Ligas semanais (roadmap v2, seção 4.5): competição
-- justa por faixa de nível — o ranking global (por XP total) sempre
-- premia veteranos; a liga rankeia por XP GANHO NA SEMANA dentro da
-- divisão do jogador, então todo mundo compete de igual para igual.
--
-- Uma única linha por jogador guarda o estado corrente (divisão, XP
-- acumulado na semana, semana ISO de referência). O fechamento da
-- semana é LAZY (sem cron): o primeiro acesso de QUALQUER jogador da
-- divisão após a virada de semana dispara o processamento de toda a
-- divisão — ver ligaService.fecharSemanaDaDivisao.
-- Aplicar via MCP como migration "27_ligas".
-- ============================================================

create table ligas_semana (
  user_id       uuid primary key references profiles(id) on delete cascade,
  divisao       text not null default 'bronze' check (divisao in ('bronze', 'prata', 'ouro', 'diamante')),
  xp_semana     int  not null default 0 check (xp_semana >= 0),
  semana        text not null, -- ISO 8601 'AAAA-Www', ex.: '2026-W30'
  atualizada_em timestamptz not null default now()
);

create index idx_ligas_semana_divisao_semana on ligas_semana (divisao, semana);

alter table ligas_semana enable row level security;
