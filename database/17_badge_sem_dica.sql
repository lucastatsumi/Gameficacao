-- ============================================================
-- 17_badge_sem_dica.sql — Badge "sem usar dica": aprovar um quiz de
-- pelo menos 3 questões sem pedir dica em nenhuma delas. Item do roadmap
-- de badges mais ricos (docs/ROADMAP.md, "Médio prazo").
-- `ALTER TYPE ... ADD VALUE` não pode ser referenciado na mesma
-- transação em que é criado — por isso o valor do enum e o seed do
-- badge ficam em statements separados dentro do mesmo arquivo (cada
-- `alter type` já commita implicitamente fora de bloco explícito).
-- Aplicar via MCP como migration "17_badge_sem_dica".
-- ============================================================

alter type tipo_condicao_badge add value 'sem_dica'; -- parametro: {"min_questoes": 3}
