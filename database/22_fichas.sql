-- ============================================================
-- 22_fichas.sql — Economia dual (roadmap v2, seção 4.1): "fichas" são a
-- moeda GASTÁVEL, separada do XP (que segue como progressão permanente).
-- Modelagem como ledger append-only: o saldo é sempre derivado da soma
-- das transações — auditável, e impossível de "editar na mão" sem
-- deixar rastro. Débitos entram como quantidade negativa (a compra na
-- loja, migration futura, insere a transação negativa correspondente).
-- Aplicar via MCP como migration "22_fichas".
-- ============================================================

create table transacoes_fichas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  quantidade  int  not null check (quantidade <> 0), -- >0 crédito, <0 débito
  motivo      text not null,        -- 'quiz_aprovado', 'quiz_perfeito', 'compra_loja', ...
  referencia  text,                 -- id da tentativa/item que originou (auditoria)
  criada_em   timestamptz not null default now()
);

create index idx_transacoes_fichas_user on transacoes_fichas (user_id, criada_em);

alter table transacoes_fichas enable row level security;
