-- ============================================================
-- 25_desafio_diario.sql — Desafio diário (roadmap v2, seção 4.8):
-- um mini-quiz por dia com as MESMAS questões para todo mundo
-- (sorteio determinístico semeado pela data, no backend), 1 tentativa
-- por jogador por dia e ranking próprio do dia.
-- A tentativa do desafio é uma TERCEIRA origem de tentativa (nem fase,
-- nem quiz custom): marcada por `desafio_dia`. O índice único parcial
-- garante no banco a regra de 1 por dia — abrir e abandonar também
-- consome o dia (anti-abuso: senão daria para espiar as questões e
-- voltar depois).
-- Aplicar via MCP como migration "25_desafio_diario".
-- ============================================================

alter table tentativas add column desafio_dia date;

alter table tentativas drop constraint tentativa_origem;
alter table tentativas add constraint tentativa_origem check (
  (fase_id is not null and quiz_custom_id is null and desafio_dia is null) or
  (fase_id is null and quiz_custom_id is not null and desafio_dia is null) or
  (fase_id is null and quiz_custom_id is null and desafio_dia is not null)
);

create unique index um_desafio_por_dia
  on tentativas (user_id, desafio_dia) where desafio_dia is not null;
