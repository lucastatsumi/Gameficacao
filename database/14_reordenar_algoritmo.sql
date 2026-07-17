-- ============================================================
-- 14_reordenar_algoritmo.sql — Minigame "Reordenar algoritmo":
-- arrastar passos embaralhados de um algoritmo para a ordem
-- correta, contra o tempo. Mecânica de minigame do roadmap de
-- engajamento (docs/ROADMAP.md, seção 3).
--
-- Formato diferente de 'padrao'/'batalha_complexidade': não usa a
-- tabela `alternativas` (não é escolha única) — os passos e a ordem
-- correta ficam em duas colunas jsonb na própria questão. Corrigido
-- por um endpoint isolado (/quiz/responder-sequencia) que NÃO toca
-- na lógica existente de responderQuestao.
-- Aplicar via MCP como migration "14_reordenar_algoritmo".
-- ============================================================

alter table questoes drop constraint questoes_formato_check;
alter table questoes add constraint questoes_formato_check
  check (formato in ('padrao', 'batalha_complexidade', 'reordenar_algoritmo'));

-- passos: [{"id": "p1", "texto": "..."}, ...] — o backend embaralha a
-- ordem de exibição a cada /quiz/iniciar (o conteúdo cadastrado aqui não
-- precisa estar em nenhuma ordem específica).
-- ordem_correta: ["p3", "p1", "p2", ...] — os mesmos ids de `passos`, na
-- ordem certa. Nunca é enviado ao cliente antes da correção.
alter table questoes add column passos jsonb;
alter table questoes add column ordem_correta jsonb;

-- Fase bônus, sempre desbloqueada — mesmo padrão da fase 6 (Batalha de
-- Complexidade). Só 3 questões: cada uma foi escolhida por ter uma ÚNICA
-- ordem correta possível (evita algoritmos com passos ramificados/
-- intercambiáveis, que não têm uma sequência linear inequívoca).
insert into fases (nome, descricao, ordem, fase_requisito_id) values
  ('Reordenar Algoritmo', 'Minigame: arraste os passos embaralhados de um algoritmo para a ordem certa antes que o tempo acabe.', 7, null);

with fase as (
  select id from fases where ordem = 7
),
q1 as (
  insert into questoes (fase_id, enunciado, dificuldade, tempo_limite_seg, xp_valor, formato, passos, ordem_correta)
  select fase.id,
    'Trocar os valores de duas variáveis A e B usando uma variável temporária: coloque os passos na ordem certa.',
    'facil', 30, 20, 'reordenar_algoritmo',
    '[{"id":"p1","texto":"Guarde o valor de A numa variável temporária (tmp = A)"},{"id":"p2","texto":"Atribua o valor de B a A (A = B)"},{"id":"p3","texto":"Atribua o valor guardado em tmp a B (B = tmp)"}]'::jsonb,
    '["p1","p2","p3"]'::jsonb
  from fase
  returning id
),
q2 as (
  insert into questoes (fase_id, enunciado, dificuldade, tempo_limite_seg, xp_valor, formato, passos, ordem_correta)
  select fase.id,
    'Inserir um novo nó no INÍCIO de uma lista ligada (ele vira a nova cabeça): coloque os passos na ordem certa.',
    'media', 30, 20, 'reordenar_algoritmo',
    '[{"id":"p1","texto":"Crie o novo nó com o valor desejado"},{"id":"p2","texto":"Aponte o campo \"próximo\" do novo nó para a antiga cabeça da lista"},{"id":"p3","texto":"Atualize a cabeça da lista para apontar para o novo nó"}]'::jsonb,
    '["p1","p2","p3"]'::jsonb
  from fase
  returning id
),
q3 as (
  insert into questoes (fase_id, enunciado, dificuldade, tempo_limite_seg, xp_valor, formato, passos, ordem_correta)
  select fase.id,
    'Uma passada do Bubble Sort no array [5, 3, 8]: coloque os passos na ordem em que acontecem.',
    'dificil', 30, 25, 'reordenar_algoritmo',
    '[{"id":"p1","texto":"Compare array[0] e array[1]: 5 > 3, troca -> [3, 5, 8]"},{"id":"p2","texto":"Compare array[1] e array[2]: 5 < 8, não troca -> [3, 5, 8]"},{"id":"p3","texto":"Fim da passada: array [3, 5, 8], já ordenado"}]'::jsonb,
    '["p1","p2","p3"]'::jsonb
  from fase
  returning id
)
select 1; -- as três questões acima já foram inseridas pelas CTEs
