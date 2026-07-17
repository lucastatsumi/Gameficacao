-- ============================================================
-- 09_streak_badges_seed.sql — Badges de streak diário.
-- Depende de 08_streak_diario.sql já aplicada (valor 'streak_dias' do
-- enum tipo_condicao_badge precisa existir e estar comitado).
-- Aplicar via MCP como migration "09_streak_badges_seed".
-- ============================================================

insert into badges (nome, descricao, icone, tipo_condicao, parametro) values
  ('Chama Acesa', 'Jogue 3 dias seguidos.', '🔥', 'streak_dias', '{"dias": 3}'),
  ('Em Chamas', 'Jogue 7 dias seguidos.', '🔥', 'streak_dias', '{"dias": 7}'),
  ('Imparável', 'Jogue 30 dias seguidos.', '🔥', 'streak_dias', '{"dias": 30}');
