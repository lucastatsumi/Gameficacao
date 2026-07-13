-- ============================================================
-- 07_quizzes_abertos.sql — Quizzes deixam de ser restritos a
-- professor/turma: qualquer usuário cria, todos podem jogar.
-- Já aplicado via MCP como migration "07_quizzes_abertos".
-- ============================================================

alter table quizzes_custom rename column professor_id to criador_id;
alter table quizzes_custom alter column turma_id drop not null;
