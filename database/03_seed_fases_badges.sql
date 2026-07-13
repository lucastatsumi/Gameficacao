-- ============================================================
-- 03_seed_fases_badges.sql — Dados iniciais: fases e badges
-- (As 20+ questões de exemplo entram no 04_seed_questoes.sql)
-- ============================================================

-- ---------- Fases (trilha de desbloqueio em cadeia) ----------
insert into fases (nome, descricao, ordem, fase_requisito_id) values
  ('Listas',                  'Listas ligadas, arrays dinâmicos e operações fundamentais de inserção, remoção e busca.', 1, null),
  ('Pilhas',                  'Estrutura LIFO: push, pop, aplicações em undo/redo, chamadas de função e validação de expressões.', 2, 1),
  ('Filas',                   'Estrutura FIFO: enqueue, dequeue, filas circulares e filas de prioridade.', 3, 2),
  ('Árvores',                 'Árvores binárias, BST, percursos (in/pre/pós-ordem) e balanceamento.', 4, 3),
  ('Algoritmos de Ordenação', 'Bubble, Selection, Insertion, Merge e Quick Sort: funcionamento e complexidade.', 5, 4);

-- ---------- Badges ----------
insert into badges (nome, descricao, icone, tipo_condicao, parametro) values
  ('Primeiro Passo',     'Conclua a fase de Listas.',                          '👣', 'fase_concluida',    '{"fase_ordem": 1}'),
  ('Empilhado',          'Conclua a fase de Pilhas.',                          '📚', 'fase_concluida',    '{"fase_ordem": 2}'),
  ('Na Fila do Pão',     'Conclua a fase de Filas.',                           '🎫', 'fase_concluida',    '{"fase_ordem": 3}'),
  ('Jardineiro Binário', 'Conclua a fase de Árvores.',                         '🌳', 'fase_concluida',    '{"fase_ordem": 4}'),
  ('Tudo em Ordem',      'Conclua a fase de Algoritmos de Ordenação.',         '🏁', 'fase_concluida',    '{"fase_ordem": 5}'),
  ('Gabaritou!',         'Acerte todas as questões de um quiz.',               '💯', 'quiz_perfeito',     '{}'),
  ('Sequência de 10',    'Acerte 10 questões consecutivas.',                   '🔥', 'sequencia_acertos', '{"acertos": 10}'),
  ('Raio Veloz',         'Conclua um quiz com tempo médio abaixo de 15s por questão.', '⚡', 'velocidade', '{"tempo_medio_ms": 15000}'),
  ('Veterano',           'Acumule 1.000 pontos de XP.',                        '🎖️', 'xp_acumulado',     '{"xp": 1000}'),
  ('Lenda',              'Acumule 5.000 pontos de XP.',                        '👑', 'xp_acumulado',     '{"xp": 5000}');
