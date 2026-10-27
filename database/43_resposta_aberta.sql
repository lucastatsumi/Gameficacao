-- ============================================================
-- 43_resposta_aberta.sql — Questão aberta corrigida por IA com rubrica
-- (roadmap v2, H3). Novo formato 'resposta_aberta': o gestor escreve a
-- pergunta e a RUBRICA (critérios + pesos); o colaborador responde em
-- texto livre; a IA devolve nota 0–100 + feedback por critério.
--
-- Correção não determinística => a avaliação é PERSISTIDA (nunca
-- recalculada): `nota_ia` guarda o que a IA deu, `nota` a vigente
-- (igual à da IA até o gestor sobrescrever, quando `revisada_por` e
-- `revisada_em` são preenchidos). `correta` = nota >= 70, para que XP,
-- aprovação e badges de finalizarQuiz funcionem sem alteração.
-- ============================================================

alter table questoes drop constraint if exists questoes_formato_check;
alter table questoes add constraint questoes_formato_check
  check (formato in ('padrao', 'batalha_complexidade', 'reordenar_algoritmo', 'resposta_aberta'));

alter table questoes add column if not exists rubrica jsonb;

alter table respostas add column if not exists texto_resposta text;
alter table respostas add column if not exists nota int check (nota between 0 and 100);
alter table respostas add column if not exists nota_ia int check (nota_ia between 0 and 100);
alter table respostas add column if not exists feedback_ia jsonb;
alter table respostas add column if not exists revisada_por uuid references profiles(id);
alter table respostas add column if not exists revisada_em timestamptz;
