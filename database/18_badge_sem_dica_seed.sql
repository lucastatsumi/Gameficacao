-- ============================================================
-- 18_badge_sem_dica_seed.sql — Seed do badge "sem usar dica".
-- Depende de 17_badge_sem_dica.sql já aplicada (valor 'sem_dica' do
-- enum tipo_condicao_badge precisa existir e estar comitado).
-- Aplicar via MCP como migration "18_badge_sem_dica_seed".
-- ============================================================

insert into badges (nome, descricao, icone, tipo_condicao, parametro) values
  ('Sem Ajudinha', 'Conclua um quiz de pelo menos 3 questões sem usar nenhuma dica.', '🧠', 'sem_dica', '{"min_questoes": 3}');
