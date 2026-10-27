-- ============================================================
-- 34_score_tentativa.sql — Pontuação ponderada (roadmap v2, H3):
-- score 0–100 por tentativa, calculado no servidor em
-- backend/src/utils/score.js (dificuldade + velocidade + sequência).
-- É a métrica de AVALIAÇÃO do gestor; o XP segue como moeda de jogo.
-- Nulo em tentativas antigas/abandonadas.
-- ============================================================

alter table tentativas
  add column if not exists score int check (score between 0 and 100);
