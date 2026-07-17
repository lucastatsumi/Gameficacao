-- ============================================================
-- 08_streak_diario.sql — Streak de dias consecutivos jogando.
-- Mecânica de retenção do roadmap de engajamento (docs/ROADMAP.md).
-- Aplicar via MCP como migration "08_streak_diario".
--
-- ATENÇÃO: `ALTER TYPE ... ADD VALUE` não pode ser usado na mesma
-- transação em que o novo valor é referenciado (restrição do Postgres
-- em versões de transação explícita). Por isso o seed de badges que usa
-- 'streak_dias' fica em 09_streak_badges_seed.sql, aplicado em separado.
-- ============================================================

alter type tipo_condicao_badge add value 'streak_dias'; -- parametro: {"dias": 7}

-- streak_dias: dias consecutivos com pelo menos 1 quiz finalizado.
-- streak_ultimo_dia: data (sem hora) do último dia contado no streak —
-- usada pelo servidor para decidir se hoje mantém, incrementa ou zera.
alter table profiles add column streak_dias int not null default 0;
alter table profiles add column streak_ultimo_dia date;
