-- ============================================================
-- 13_eventos_temporarios.sql — Eventos com XP multiplicado por
-- período (ex.: "semana das árvores": XP em dobro na fase 4).
-- Mecânica de retenção do roadmap de engajamento.
-- Aplicar via MCP como migration "13_eventos_temporarios".
-- ============================================================

create table eventos (
  id               serial primary key,
  nome             text not null,
  fase_id          int references fases(id), -- null = vale para qualquer fase
  multiplicador_xp numeric not null default 2 check (multiplicador_xp > 1),
  inicio           timestamptz not null,
  fim              timestamptz not null check (fim > inicio),
  created_at       timestamptz not null default now()
);

alter table eventos enable row level security;

create index idx_eventos_periodo on eventos (inicio, fim);
