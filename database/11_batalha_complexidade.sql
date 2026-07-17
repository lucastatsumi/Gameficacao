-- ============================================================
-- 11_batalha_complexidade.sql — Minigame "Batalha de Complexidade":
-- compara a complexidade de duas abordagens, o aluno escolhe a mais
-- eficiente, timer curto estilo arcade. Reaproveita 100% do fluxo de
-- quiz existente (/quiz/iniciar, /quiz/responder, /quiz/finalizar) —
-- só muda o layout no frontend quando `formato = 'batalha_complexidade'`.
-- Aplicar via MCP como migration "11_batalha_complexidade".
-- ============================================================

alter table questoes add column formato text not null default 'padrao'
  check (formato in ('padrao', 'batalha_complexidade'));

-- Fase bônus, sempre desbloqueada (fase_requisito_id null) — não faz parte
-- da trilha sequencial obrigatória.
insert into fases (nome, descricao, ordem, fase_requisito_id) values
  ('Batalha de Complexidade', 'Minigame relâmpago: compare duas abordagens e escolha a mais eficiente antes que o tempo acabe.', 6, null);

with fase as (
  select id from fases where ordem = 6
),
dados as (
  select * from (values
    (1, 'Ordenar um array GRANDE no caso médio: qual abordagem é mais eficiente?'),
    (2, 'Inserir um elemento no INÍCIO de uma estrutura com 1 milhão de itens: qual é mais eficiente?'),
    (3, 'Verificar se um valor existe em uma coleção com 1 milhão de itens: qual estrutura é mais eficiente?'),
    (4, 'Acessar o elemento de índice 500.000 em uma estrutura com 1 milhão de itens: qual é mais eficiente?'),
    (5, 'Buscar um valor em um array de 1 milhão de itens JÁ ORDENADO: qual busca é mais eficiente?')
  ) as t(n, enunciado)
),
inseridas as (
  insert into questoes (fase_id, enunciado, linguagem, dificuldade, tempo_limite_seg, xp_valor, formato)
  select fase.id, dados.enunciado, 'javascript', 'media', 15, 20, 'batalha_complexidade'
  from fase, dados
  returning id, enunciado
),
ligadas as (
  select i.id as questao_id, d.n
  from inseridas i
  join dados d on d.enunciado = i.enunciado
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select l.questao_id, a.letra, a.texto, a.correta, a.explicacao
from ligadas l
join (values
  (1, 'A', 'Bubble Sort — O(n²)', false, 'Bubble Sort compara pares adjacentes repetidamente: no caso médio custa O(n²), pior que Merge Sort.'),
  (1, 'B', 'Merge Sort — O(n log n)', true, 'Correto! Merge Sort divide o array recursivamente e mescla em O(n log n), bem mais rápido que O(n²) para arrays grandes.'),
  (2, 'A', 'Array dinâmico — O(n)', false, 'Inserir no início de um array exige deslocar todos os elementos uma posição — custo O(n).'),
  (2, 'B', 'Lista ligada — O(1)', true, 'Correto! Na lista ligada, inserir no início só cria um nó e aponta para a antiga cabeça — O(1), sem deslocar nada.'),
  (3, 'A', 'HashMap — O(1) em média', true, 'Correto! O HashMap calcula a posição pelo hash da chave, então a busca custa O(1) em média.'),
  (3, 'B', 'Lista ligada — O(n)', false, 'Sem posição calculável, a lista ligada precisa percorrer nó a nó até achar (ou não achar) o valor — O(n).'),
  (4, 'A', 'Array — O(1)', true, 'Correto! O endereço de qualquer índice de um array é calculado diretamente — acesso O(1).'),
  (4, 'B', 'Lista ligada — O(n)', false, 'Sem índice direto, a lista ligada precisa percorrer nó a nó desde a cabeça até chegar à posição 500.000 — O(n).'),
  (5, 'A', 'Busca linear — O(n)', false, 'A busca linear ignora que o array já está ordenado e pode percorrer todos os elementos — O(n).'),
  (5, 'B', 'Busca binária — O(log n)', true, 'Correto! Em array ordenado, a busca binária descarta metade das possibilidades a cada passo — O(log n).')
) as a(n, letra, texto, correta, explicacao) on a.n = l.n;
