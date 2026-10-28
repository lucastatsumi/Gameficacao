-- ============================================================
-- 37_avaliacao.sql — Horizonte 3 (parte determinística): método de
-- pontuação e avaliação.
--
-- * tentativas.score: nota 0–100 da tentativa, calculada no servidor
--   (utils/pontuacao.js) ponderando dificuldade, velocidade e sequência
--   de acertos. Convive com o XP: XP é moeda de gamificação, score é a
--   métrica de avaliação — números diferentes para propósitos diferentes.
--   NULL nas tentativas anteriores a esta migration (não recalculamos o
--   passado: o tempo-limite efetivo de cada resposta não foi registrado).
-- * desempenho_competencias: acertos/total por (colaborador,
--   competência) — base da matriz de competências, da escala de
--   proficiência e das cartas colecionáveis (4.9).
-- ============================================================

alter table tentativas add column score numeric(5,1) check (score between 0 and 100);

create or replace view desempenho_competencias as
select
  t.user_id,
  qc.competencia_id,
  count(*)::int as total,
  (count(*) filter (where r.correta))::int as acertos
from respostas r
join tentativas t on t.id = r.tentativa_id
join questao_competencias qc on qc.questao_id = r.questao_id
group by t.user_id, qc.competencia_id;

alter view desempenho_competencias set (security_invoker = true);

create index idx_tentativas_fase_user_score on tentativas (user_id, fase_id) where score is not null;
