-- ============================================================
-- 21_desafios.sql — "Desafio assíncrono" entre colegas: um recorte
-- deliberadamente pequeno de "multiplayer" que dá pra construir sem
-- infra de tempo real (websockets, matchmaking, presença online).
-- Um aluno gera um desafio a partir da própria melhor pontuação numa
-- fase; o colega abre o link, vê a pontuação a bater e joga a fase
-- normalmente. Multiplayer de verdade (partidas simultâneas, chat,
-- matchmaking) continua fora do escopo — exige decisão de produto sobre
-- como o social deve funcionar, este não é.
-- Aplicar via MCP como migration "21_desafios".
-- ============================================================

create table desafios (
  id             uuid primary key default gen_random_uuid(),
  criador_id     uuid not null references profiles(id) on delete cascade,
  fase_id        int  not null references fases(id),
  acertos_alvo   int  not null check (acertos_alvo >= 0),
  criado_em      timestamptz not null default now()
);

create index idx_desafios_criador on desafios (criador_id);

alter table desafios enable row level security;
