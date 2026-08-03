-- ============================================================
-- 34_cartas.sql — Cartas colecionáveis de conhecimento (roadmap v2,
-- 4.9): colecionismo que É revisão de conteúdo. O roadmap original
-- amarra a carta a "competência" (tag), mas isso ainda não existe no
-- schema (é Horizonte 1). ADAPTADO: usa `fases` como unidade de
-- maestria — uma carta por fase, revelada quando o jogador acumula,
-- entre TODAS as tentativas finalizadas daquela fase, >= 10 questões
-- respondidas e >= 80% de acerto agregado (ver cartaService.js).
-- Revisitar quando o Horizonte 1 trouxer competências de verdade.
--
-- Sem tabela de catálogo (cartas_catalogo do roadmap original) porque
-- `fases` já É o catálogo — 1 linha por fase existente, sem duplicar.
--
-- Aplicar via MCP como migration "34_cartas".
-- ============================================================

create table cartas_do_jogador (
  user_id        uuid not null references profiles(id) on delete cascade,
  fase_id        int  not null references fases(id),
  conquistada_em timestamptz not null default now(),
  primary key (user_id, fase_id)
);

create index idx_cartas_user on cartas_do_jogador (user_id);

alter table cartas_do_jogador enable row level security;
