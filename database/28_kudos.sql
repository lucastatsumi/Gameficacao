-- ============================================================
-- 28_kudos.sql — Kudos entre colegas (roadmap v2, 4.12): a única
-- mecânica movida por generosidade, não competição. Cada jogador tem 3
-- kudos por semana para dar a colegas (ranking); receber rende fichas
-- pequenas, dar conta para a missão "reconheça um colega".
--
-- Anti-conluio (backend/src/services/kudosService.js): kudos recíproco
-- no MESMO dia (A dá pra B, B dá pra A) não rende fichas para o segundo
-- kudos da dupla; e há um teto semanal de fichas por kudos recebidos —
-- `fichas_concedidas` registra se ESTE kudos rendeu fichas, para o teto
-- ser contado sem precisar reconsultar o ledger por intervalo de data.
-- Aplicar via MCP como migration "28_kudos".
-- ============================================================

create table kudos (
  id                uuid primary key default gen_random_uuid(),
  de_usuario        uuid not null references profiles(id) on delete cascade,
  para_usuario      uuid not null references profiles(id) on delete cascade,
  semana            text not null, -- rótulo ISO 'YYYY-Www' (utils/semana.js)
  fichas_concedidas boolean not null default false,
  criado_em         timestamptz not null default now(),
  constraint kudos_nao_autokudos check (de_usuario <> para_usuario),
  unique (de_usuario, para_usuario, semana)
);

create index idx_kudos_de_semana on kudos (de_usuario, semana);
create index idx_kudos_para_semana on kudos (para_usuario, semana);

alter table kudos enable row level security;

-- Novo tipo de missão diária: "dar_kudos" (roadmap 4.3 + 4.12).
alter table missoes_catalogo drop constraint missoes_catalogo_tipo_check;
alter table missoes_catalogo add constraint missoes_catalogo_tipo_check
  check (tipo in ('acertos_dia', 'aprovar_quiz', 'quiz_sem_dica', 'usar_poder', 'dar_kudos'));

insert into missoes_catalogo (chave, tipo, descricao, parametro, recompensa_fichas) values
  ('kudos_1', 'dar_kudos', 'Reconheça um colega com kudos hoje', 1, 8);
