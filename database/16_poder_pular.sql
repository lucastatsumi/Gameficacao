-- ============================================================
-- 16_poder_pular.sql — Poder "Pular sem perder XP": pula a questão
-- atual sem contar contra a aprovação da fase/quiz. Mecânica de
-- engajamento do roadmap (seção 2 — Poderes).
--
-- ATENÇÃO: ALTER TYPE ... ADD VALUE não pode ser referenciado na
-- mesma transação em que é criado — por isso não há mais nada além
-- disso neste arquivo (mesmo motivo de 08_streak_diario.sql).
-- Aplicar via MCP como migration "16_poder_pular".
-- ============================================================

alter type tipo_poder add value 'pular_questao';
