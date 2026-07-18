-- ============================================================
-- 22_fase_estruturas_avancadas.sql — Nova fase sequencial 8:
-- "Estruturas Avançadas" (Grafos, Tabelas Hash, Heaps, Recursão).
-- Pré-requisito: fase 5 (Algoritmos de Ordenação) — as fases 6 e 7
-- ("Batalha de Complexidade" e "Reordenar Algoritmo") são minigames
-- bônus sempre desbloqueados e não fazem parte da trilha sequencial.
-- 16 questões (4 por tópico), mistura facil/media/media/dificil por
-- tópico, no mesmo padrão de 05_seed_questoes.sql e 12_mais_questoes.sql.
-- Fatos técnicos verificados contra CLRS (Cormen, Leiserson, Rivest,
-- Stein — Cap. 6 Heaps, Cap. 11 Hashing, Cap. 22-23 Grafos/BFS/DFS) e
-- Goodrich/Tamassia/Goldwasser ("Data Structures and Algorithms" —
-- comparação de implementações de fila de prioridade).
-- Gerado pelo agente question-researcher. Auto-auditoria realizada:
-- 4 alternativas por questão, exatamente 1 correta, Big-O conferido
-- contra as fontes acima antes de finalizar.
-- Aplicar via MCP como migration "22_fase_estruturas_avancadas".
-- ============================================================

-- ---------- Fase ----------
insert into fases (nome, descricao, ordem, fase_requisito_id) values
  ('Estruturas Avançadas',
   'Grafos (BFS/DFS, listas e matrizes de adjacência), tabelas hash (colisões, load factor), heaps/filas de prioridade e recursão.',
   8,
   (select id from fases where ordem = 5));

-- ---------- Badge ----------
insert into badges (nome, descricao, icone, tipo_condicao, parametro) values
  ('Arquiteto de Dados', 'Conclua a fase de Estruturas Avançadas.', '🧠', 'fase_concluida', '{"fase_ordem": 8}');

-- ==================== TÓPICO 1 — GRAFOS ====================

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Uma rede social tem 50 milhões de usuários (vértices) e, em média, 200 conexões (arestas) por usuário — um grafo esparso. A equipe avalia representar o grafo por MATRIZ de adjacência (uma tabela 50M x 50M) ou por LISTA de adjacência (cada usuário guarda apenas a lista dos seus contatos diretos). Qual a diferença de consumo de memória entre as duas e qual escolher aqui?',
    null, 'javascript', 'facil', 45, 10)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'A matriz de adjacência gasta O(V²) independentemente do número real de arestas (a esmagadora maioria das células seria zero); a lista de adjacência gasta O(V+E), proporcional às conexões que de fato existem. Para um grafo esparso como esse, a lista de adjacência é muito mais eficiente em memória.', true,
   'Correto! Com V=50 milhões, uma matriz V×V seria inviável (da ordem de 10^15 células) mesmo o grafo tendo apenas ~10 bilhões de arestas no total. A lista de adjacência só armazena o que realmente existe: O(V+E).'),
  ('B', 'A matriz de adjacência é sempre a melhor escolha, pois permite acesso O(1) para verificar qualquer conexão, e memória não é um fator relevante nessa decisão.', false,
   'O acesso O(1) da matriz é real, mas memória É um fator crítico aqui: uma matriz 50M×50M é fisicamente inviável de alocar. A decisão de representação sempre pesa tempo E espaço.'),
  ('C', 'As duas representações consomem exatamente a mesma quantidade de memória, sempre O(V+E), independentemente de como são implementadas.', false,
   'A matriz de adjacência aloca espaço para TODOS os pares possíveis de vértices (O(V²)), existindo aresta ou não — ela não se adapta à esparsidade do grafo como a lista de adjacência faz.'),
  ('D', 'A lista de adjacência gasta O(V²), pois cada vértice precisa guardar uma entrada para todos os outros vértices do grafo, existindo conexão ou não.', false,
   'É o oposto: a lista de adjacência guarda só os vizinhos REAIS de cada vértice (O(V+E)) — é a matriz de adjacência que reserva espaço para todos os pares possíveis, O(V²).')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'O recurso "grau de separação" de uma rede profissional calcula o menor número de conexões entre dois usuários usando BUSCA EM LARGURA (BFS) a partir do usuário de origem, com o grafo representado por LISTA de adjacência. Qual é a complexidade de tempo dessa BFS no pior caso, em função de V (usuários) e E (conexões)?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'O(V + E): cada vértice é enfileirado e desenfileirado exatamente uma vez, e cada aresta é examinada no máximo duas vezes (uma a partir de cada extremidade) ao percorrer as listas de adjacência.', true,
   'Correto! É o resultado clássico de BFS com lista de adjacência (CLRS, Cap. 22): o trabalho total é proporcional à soma de vértices visitados mais arestas examinadas, O(V+E).'),
  ('B', 'O(V²) sempre, pois a BFS precisa verificar, para cada vértice, se ele é vizinho de todos os demais vértices do grafo.', false,
   'Isso descreveria BFS sobre MATRIZ de adjacência (onde checar vizinhos de um vértice custa O(V)). Com lista de adjacência, só se examinam os vizinhos reais de cada vértice, não todos os V vértices.'),
  ('C', 'O(E log E), pois a BFS usa uma fila de prioridade interna para decidir qual vértice visitar em seguida.', false,
   'BFS usa uma fila comum (FIFO), não uma fila de prioridade — isso é característica de algoritmos como Dijkstra. Não há log nessa análise de BFS.'),
  ('D', 'O(V), pois apenas o número de vértices importa; as arestas não influenciam o custo do algoritmo.', false,
   'As arestas SÃO examinadas durante a BFS (é assim que se descobrem os vizinhos a visitar) — ignorá-las subestima o custo real, que é O(V+E).')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Um engenheiro adapta uma função de busca em profundidade (DFS) que funcionava bem em árvores de diretórios para percorrer um grafo genérico de dependências entre módulos, que pode ter CICLOS (A depende de B, B depende de C, C depende de A). Em produção, a função entra em loop infinito e derruba o serviço. O que está faltando nessa adaptação?',
    'function dfs(no) {
  processar(no);
  for (const vizinho of no.dependencias) {
    dfs(vizinho);
  }
}', 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Um conjunto de nós VISITADOS: em árvores não existem ciclos, então nunca se revisita um nó, mas em um grafo genérico a DFS precisa marcar cada nó como visitado e não chamar recursivamente sobre nós já visitados — sem isso, um ciclo faz a recursão se repetir indefinidamente.', true,
   'Correto! A propriedade acíclica da árvore é o que tornava a DFS "ingênua" segura. Grafos genéricos exigem controle explícito de visitados (um Set, por exemplo) para terminar mesmo na presença de ciclos.'),
  ('B', 'Trocar a pilha de chamadas por uma fila, transformando a função em busca em largura (BFS), que resolveria o problema automaticamente.', false,
   'Trocar por uma fila sem controle de visitados ainda entraria em loop infinito no ciclo — o problema não é DFS vs BFS, é a AUSÊNCIA de marcação de nós já visitados, necessária nos dois casos.'),
  ('C', 'DFS não pode ser usada em grafos com ciclos; é necessário primeiro aplicar Union-Find para eliminar os ciclos antes de percorrer o grafo.', false,
   'DFS pode, sim, percorrer grafos com ciclos, desde que controle os nós visitados. Union-Find é usado para outros fins (como detectar ciclos em algoritmos de árvore geradora mínima), não é pré-requisito para rodar DFS.'),
  ('D', 'O grafo precisa ser convertido em uma árvore geradora (spanning tree) antes de aplicar a DFS.', false,
   'Encontrar uma árvore geradora normalmente é feito justamente USANDO BFS ou DFS sobre o grafo original — não é um pré-processamento necessário, e o problema real é a falta de controle de nós visitados.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Um sistema de permissões verifica, milhões de vezes por dia, se existe uma relação direta "usuário X segue usuário Y" (uma checagem de existência de aresta) em um grafo MUITO denso (a maioria dos usuários segue a maioria dos outros). O grafo está representado por LISTA de adjacência, e essas checagens estão lentas. Por quê, e qual seria a alternativa mais adequada para esse cenário específico?',
    null, 'javascript', 'dificil', 90, 25)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Em lista de adjacência, verificar se a aresta (X,Y) existe exige percorrer a lista de vizinhos de X, custando O(grau(X)) — que num grafo muito denso se aproxima de O(V). Em matriz de adjacência, a mesma checagem é O(1): basta ler a célula matriz[X][Y]. Para checagens de existência de aresta muito frequentes em grafo denso, a matriz de adjacência é mais adequada.', true,
   'Correto! É exatamente o trade-off inverso da primeira questão desta fase: quando o grafo é denso e a operação dominante é "existe aresta entre X e Y?", o custo O(1) da matriz supera a economia de memória da lista, cujo custo de busca cresce com o grau do vértice.'),
  ('B', 'A lista de adjacência sempre verifica a existência de uma aresta em O(1), pois internamente ela é implementada como uma tabela hash por definição.', false,
   'Isso não é uma garantia da estrutura "lista de adjacência" em si — na forma clássica (array ou lista ligada de vizinhos), a checagem exige percorrer os vizinhos, O(grau do vértice). Só seria O(1) se cada lista de vizinhos fosse implementada especificamente como um Set/hash, o que é uma escolha de implementação, não a definição padrão.'),
  ('C', 'Matriz de adjacência não pode representar grafos direcionados como "segue", então essa alternativa está descartada de saída.', false,
   'Matrizes de adjacência representam grafos direcionados perfeitamente: basta que matriz[X][Y] seja diferente de matriz[Y][X] quando a relação não é simétrica — é uma estrutura comum tanto para grafos direcionados quanto não direcionados.'),
  ('D', 'A escolha entre lista e matriz de adjacência afeta apenas o consumo de memória, nunca a velocidade de operações como checar existência de aresta.', false,
   'A representação afeta diretamente o TEMPO de várias operações, não só a memória: checar existência de aresta é O(1) na matriz e O(grau) na lista — essa é justamente a causa da lentidão descrita no enunciado.')
) as a(letra, texto, correta, explicacao);

-- ==================== TÓPICO 2 — TABELAS HASH ====================

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Um cache em memória armazena o resultado de consultas por chave (ex.: "user:1234") usando uma tabela hash, com acesso O(1) em média. Qual é o papel da FUNÇÃO HASH nessa estrutura?',
    null, 'javascript', 'facil', 45, 10)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Converter a chave (de tamanho arbitrário, como uma string) em um índice dentro do intervalo do array interno da tabela, permitindo acesso direto a essa posição sem precisar comparar a chave com todas as demais já armazenadas.', true,
   'Correto! É essa conversão chave → índice que dá à tabela hash seu acesso O(1) médio: em vez de buscar linearmente, calcula-se o índice diretamente a partir da chave.'),
  ('B', 'Ordenar todas as chaves em ordem alfabética para permitir busca binária dentro da tabela.', false,
   'Tabela hash não mantém as chaves ordenadas — isso é característica de estruturas como árvores balanceadas ou arrays ordenados. O ganho de desempenho da tabela hash vem do cálculo direto de índice, não de ordenação.'),
  ('C', 'Garantir matematicamente que duas chaves diferentes nunca produzirão o mesmo índice, eliminando colisões por completo.', false,
   'Colisões são possíveis (e esperadas) em qualquer função hash prática, já que o espaço de chaves possíveis costuma ser muito maior que o número de índices disponíveis — é justamente por isso que existem estratégias de tratamento de colisão, como encadeamento e endereçamento aberto.'),
  ('D', 'Criptografar a chave para que outros processos não consigam lê-la.', false,
   'A função hash usada em tabelas hash de uso geral não tem objetivo de segurança/sigilo — seu propósito é distribuir bem as chaves entre os índices disponíveis, não protegê-las de leitura (isso é papel de funções hash criptográficas, um conceito diferente).')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Duas chaves diferentes, "joao@x.com" e "maria@y.com", produzem o mesmo índice na tabela hash (uma colisão). A implementação usa ENCADEAMENTO: cada posição do array interno guarda uma lista ligada de pares chave-valor. O que acontece quando a segunda chave é inserida, e qual o impacto na busca por qualquer uma delas depois?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'A nova chave é adicionada à lista ligada daquele índice, sem sobrescrever a primeira. A busca por qualquer uma delas calcula o hash para achar o índice e depois percorre a lista comparando as chaves até achar a correta — no pior caso (muitas colisões no mesmo índice), a busca degrada para O(tamanho da lista).', true,
   'Correto! Encadeamento resolve colisões guardando todas as chaves que colidem em uma estrutura auxiliar (tipicamente lista ligada) no mesmo índice, e a busca faz um segundo passo — a comparação de chave — depois de localizar o índice.'),
  ('B', 'A segunda chave sobrescreve o valor da primeira naquele índice, e o dado de "joao@x.com" é perdido.', false,
   'Sobrescrever aconteceria em uma implementação sem tratamento de colisão nenhum. Encadeamento existe exatamente para evitar essa perda de dados: ambas as chaves convivem na mesma posição, dentro da lista ligada.'),
  ('C', 'A tabela hash rejeita a inserção da segunda chave, retornando um erro de colisão para quem chamou insert().', false,
   'Encadeamento trata colisões de forma transparente para quem usa a tabela — não há rejeição nem erro; a segunda chave é simplesmente adicionada à lista daquele índice.'),
  ('D', 'A tabela recalcula o hash de TODAS as chaves já inseridas sempre que ocorre uma colisão, para tentar evitar colisões futuras.', false,
   'Recalcular todos os hashes a cada colisão individual não é como o encadeamento funciona — isso teria custo proibitivo. Um recálculo geral (rehash) só ocorre em eventos específicos, como redimensionamento por load factor alto, não a cada colisão isolada.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Diferente do encadeamento, uma segunda implementação usa ENDEREÇAMENTO ABERTO com sondagem linear: quando o índice calculado já está ocupado, o algoritmo tenta o próximo índice (i+1, i+2, ...) até achar uma posição livre, e TODAS as entradas ficam armazenadas diretamente dentro do próprio array, sem listas ligadas. O que isso implica sobre a REMOÇÃO de uma chave?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Simplesmente esvaziar a posição da chave removida pode QUEBRAR a busca de outras chaves que sofreram sondagem além dela: a busca segue a mesma sequência de sondagem até achar a chave ou uma posição vazia, e um "buraco" no meio faria a busca parar cedo demais. Por isso, remoções em endereçamento aberto geralmente usam marcadores especiais ("lápides"/tombstones) em vez de simplesmente esvaziar a posição.', true,
   'Correto! É um efeito colateral clássico da sondagem (CLRS, Cap. 11.4): a busca por uma chave K depende de seguir a mesma trilha de sondagens usada na inserção; remover uma entrada no meio dessa trilha sem marcá-la de forma especial corta a trilha e "esconde" chaves que estão depois dela.'),
  ('B', 'Remover é sempre seguro, pois cada chave tem uma posição fixa e única dentro da tabela, independentemente de colisões.', false,
   'Justamente o contrário: em endereçamento aberto, a POSIÇÃO FINAL de uma chave depende do histórico de colisões no momento da inserção, podendo estar deslocada do seu índice "natural" — daí o cuidado necessário na remoção.'),
  ('C', 'Endereçamento aberto não permite remoção de forma alguma; a tabela inteira precisa ser reconstruída do zero a cada remoção.', false,
   'Remoção é possível com a técnica de marcadores (tombstones), sem exigir reconstrução total a cada operação — apenas periodicamente pode ser útil "limpar" tombstones acumulados via rehash, mas isso não é obrigatório a cada remoção individual.'),
  ('D', 'A remoção desloca automaticamente todas as chaves posteriores uma posição para trás, como acontece em um array comum ao remover um elemento do meio.', false,
   'Esse não é o mecanismo padrão de tabelas hash com endereçamento aberto — deslocar elementos ignoraria completamente as posições calculadas pelo hash de cada chave, quebrando a lógica de sondagem da estrutura.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'A tabela hash de sessões ativas do sistema começa com capacidade 16 e cresce conforme o número de sessões aumenta. A implementação monitora o LOAD FACTOR (número de elementos dividido pela capacidade do array) e, quando ele ultrapassa 0.75, DOBRA a capacidade e reinsere todas as chaves (rehash completo, custando O(n)). Por que essa estratégia mantém a complexidade MÉDIA de inserção em O(1) AMORTIZADO, mesmo com esses rehashes ocasionais custosos?',
    null, 'javascript', 'dificil', 90, 25)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Assim como no array dinâmico, dobrar a capacidade faz os rehashes ficarem exponencialmente mais espaçados entre si: o custo total de todos os rehashes ao longo de n inserções soma O(n), que dividido pelas n inserções dá O(1) por operação em média — mesmo que a inserção específica que dispara o rehash custe O(n) sozinha.', true,
   'Correto! É a mesma análise amortizada usada para o crescimento de arrays dinâmicos: crescimento geométrico (dobrar) garante que o custo acumulado das reorganizações seja proporcional a n, não a n vezes o número de rehashes.'),
  ('B', 'Porque o load factor nunca ultrapassa 0.75 na prática, então o rehash na verdade nunca chega a acontecer.', false,
   'O rehash acontece sim, sempre que o load factor cruza o limite configurado — é justamente esse evento (ocasional, mas real) que a análise amortizada precisa explicar, não negar.'),
  ('C', 'Porque o hash de cada chave só precisa ser calculado uma única vez em toda a vida da tabela, mesmo que ela seja redimensionada várias vezes.', false,
   'Em um rehash, o índice de cada chave é recalculado para o novo tamanho do array (o índice depende da capacidade), então cada rehash implica recalcular hashes — a explicação correta está no espaçamento geométrico dos rehashes, não na ideia de "calcular uma única vez".'),
  ('D', 'Porque, mesmo que o load factor fique sempre alto, cada busca ou inserção individual continua sendo O(1) garantido, independentemente de colisões.', false,
   'Load factor alto aumenta o número médio de colisões por posição, degradando a performance — é justamente para EVITAR isso que a tabela redimensiona ao cruzar o limite de 0.75. Ignorar essa relação contradiz o próprio motivo de existir o monitoramento de load factor.')
) as a(letra, texto, correta, explicacao);

-- ==================== TÓPICO 3 — HEAPS / FILAS DE PRIORIDADE ====================

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Um sistema de despacho de entregas usa uma fila de prioridade baseada em MIN-HEAP para sempre processar primeiro a entrega com o MENOR prazo restante. Qual propriedade estrutural todo nó de um min-heap deve satisfazer?',
    null, 'javascript', 'facil', 45, 10)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'O valor de cada nó é menor ou igual ao valor de seus filhos diretos — mas não há garantia de ordem entre nós que não sejam ancestral e descendente (por exemplo, entre dois "primos" na árvore).', true,
   'Correto! É a "propriedade de heap" (heap-order property): mais fraca que a de uma BST, ela garante apenas a relação pai-filho, o suficiente para achar o mínimo global rapidamente na raiz.'),
  ('B', 'O valor de cada nó é menor que TODOS os valores da subárvore esquerda e maior que todos os da subárvore direita.', false,
   'Essa é a propriedade de uma ÁRVORE BINÁRIA DE BUSCA (BST), não de um heap. Um min-heap só compara um nó com seus filhos diretos, não impõe ordem entre esquerda e direita.'),
  ('C', 'A árvore precisa ter profundidade fixa, sem nunca poder ganhar novos níveis conforme elementos são inseridos.', false,
   'Um heap cresce normalmente conforme elementos são inseridos, adicionando novos níveis quando necessário — ele é mantido como uma árvore binária COMPLETA (níveis cheios, exceto talvez o último, preenchido da esquerda para a direita), não com profundidade travada.'),
  ('D', 'Os valores devem estar em ordem alfabética/crescente ao serem lidos da esquerda para a direita no último nível.', false,
   'Essa característica de "leitura ordenada" é da travessia EM ORDEM de uma BST, não de um heap — um heap não garante nenhuma ordem lateral entre irmãos ou primos na árvore.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Ao chamar extractMin() em um min-heap implementado em array, o algoritmo remove a raiz (índice 0), move o ÚLTIMO elemento do array para a posição da raiz, e então faz "sift-down" (heapify para baixo): compara o novo elemento do topo com seus filhos e o troca de lugar com o MENOR filho, repetindo até a propriedade de heap ser restaurada. Qual a complexidade de tempo dessa operação?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'O(log n), pois o heap é mantido como uma árvore binária COMPLETA, então sua altura é sempre ⌊log2 n⌋ — e o sift-down desce no máximo um nível por comparação, ou seja, no máximo a altura da árvore.', true,
   'Correto! O sift-down segue um único caminho da raiz até, no máximo, uma folha, e esse caminho tem comprimento O(log n) numa árvore completa — é o resultado padrão de CLRS (Cap. 6) para extract-min/max em heap binário.'),
  ('B', 'O(n), pois o sift-down pode precisar comparar o elemento movido com TODOS os outros nós da árvore, não só com os filhos ao longo de um caminho.', false,
   'O sift-down só compara o elemento com seus filhos diretos a cada passo, seguindo um único caminho para baixo — ele nunca visita nós fora desse caminho, então não examina a árvore inteira.'),
  ('C', 'O(1), pois remover a raiz de qualquer árvore é sempre uma operação de tempo constante, independentemente do restante da estrutura.', false,
   'Remover a raiz é rápido, mas restaurar a propriedade de heap depois (o sift-down) não é constante — ele pode precisar descer até a altura da árvore, O(log n), para reposicionar corretamente o elemento movido.'),
  ('D', 'O(n log n), pois cada troca durante o sift-down exige reordenar completamente a estrutura do heap inteiro.', false,
   'Cada troca durante o sift-down é local (envolve apenas o nó e um de seus filhos) e não reordena a árvore inteira — o número total de trocas é limitado pela altura da árvore, O(log n), não por n log n.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'A equipe avalia três implementações de fila de prioridade para o despacho de chamados de suporte, onde chamados são inseridos continuamente e o de maior prioridade pode precisar ser removido a qualquer momento: (1) lista NÃO ordenada, (2) lista ORDENADA por prioridade, (3) HEAP binário. Qual opção evita que TANTO a inserção QUANTO a remoção do mais prioritário sejam O(n)?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'O heap binário: inserção e remoção do elemento mais prioritário custam O(log n) cada, um equilíbrio entre as duas operações que nenhuma das listas oferece.', true,
   'Correto! É o clássico trade-off de implementações de fila de prioridade (Goodrich/Tamassia/Goldwasser): lista não ordenada tem inserção O(1) mas remoção O(n) (precisa procurar o mínimo/máximo); lista ordenada tem remoção O(1) mas inserção O(n) (precisa achar a posição correta); o heap equilibra as duas em O(log n).'),
  ('B', 'A lista NÃO ordenada, pois inserir no fim é O(1) e por isso as duas operações ficam rápidas.', false,
   'Inserir é O(1) de fato, mas encontrar e remover o elemento de maior prioridade exige varrer a lista inteira para achá-lo primeiro — O(n). A lista não ordenada resolve só metade do problema.'),
  ('C', 'A lista ORDENADA, pois remover o elemento mais prioritário (que já está na posição correta) é O(1) e por isso as duas operações ficam rápidas.', false,
   'Remover o topo é O(1), mas cada NOVA inserção precisa encontrar a posição correta para manter a ordem, o que custa O(n) — a lista ordenada resolve só a outra metade do problema.'),
  ('D', 'Nenhuma das três: toda fila de prioridade tem obrigatoriamente uma das duas operações em O(n), não existe estrutura que evite isso.', false,
   'Existe sim: o heap binário é a estrutura clássica exatamente para evitar esse dilema, oferecendo O(log n) — nem O(1) puro nem O(n) — para as duas operações simultaneamente.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Um estagiário precisa montar um heap a partir de 1 milhão de registros já carregados em um array (em vez de inserir um por um). Ele implementa o algoritmo clássico "build-heap": percorre o array de trás para frente, do índice n/2 até o início, chamando siftDown em cada posição. Ele espera um custo de O(n log n), já que são n chamadas de siftDown e cada uma custa O(log n) no pior caso. Medindo na prática, o tempo ficou bem menor que o esperado. Por quê?',
    null, 'javascript', 'dificil', 90, 25)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'A análise ingênua superestima o custo: a maioria dos nós está perto das FOLHAS, onde o siftDown quase não desce (custo próximo de O(1)); apenas uma minoria de nós próxima da raiz tem siftDown custando de fato O(log n). Somando o custo real por nível, que decresce geometricamente conforme se sobe na árvore, o total é O(n), não O(n log n).', true,
   'Correto! É um resultado clássico e um pouco contraintuitivo (CLRS, Cap. 6, Teorema 6.3): construir um heap "de baixo para cima" custa O(n), tornando-o mais eficiente do que inserir os n elementos um a um (o que custaria O(n log n), já que cada inserção individual é O(log n)).'),
  ('B', 'A análise ingênua de O(n log n) está correta; a medição mais rápida se deve apenas a otimizações do processador (cache), não a uma diferença real de complexidade algorítmica.', false,
   'A complexidade real do build-heap bottom-up É O(n) — não é um efeito de cache, é um resultado matemático da análise mais cuidadosa que soma o custo de siftDown ponderado pela altura de cada nó, que decai exponencialmente com a profundidade.'),
  ('C', 'siftDown é sempre O(1), independentemente da altura do heap, então o algoritmo é obviamente O(n) desde o início.', false,
   'siftDown pode custar até O(log n) — para nós próximos da raiz, ele de fato pode descer vários níveis. O ponto sutil não é que siftDown seja sempre O(1), e sim que a MAIORIA dos nós (próximos às folhas) tem siftDown barato, o que domina a soma total.'),
  ('D', 'O array já estava parcialmente ordenado antes da construção, e isso sempre reduz qualquer algoritmo baseado em heap para O(n).', false,
   'O resultado de build-heap ser O(n) vale para QUALQUER array de entrada, ordenado ou não — ele decorre da estrutura da árvore completa e de como o custo de siftDown varia por nível, não de uma ordenação prévia acidental dos dados.')
) as a(letra, texto, correta, explicacao);

-- ==================== TÓPICO 4 — RECURSÃO ====================

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Você implementa uma função recursiva para uma contagem regressiva no console, de n até 0. Ao rodar com n = 5, ela imprime 5, 4, 3, 2, 1, 0, -1, -2... e nunca para, até estourar a call stack com "Maximum call stack size exceeded". O que está faltando na função abaixo?',
    'function contagemRegressiva(n) {
  console.log(n);
  contagemRegressiva(n - 1);
}', 'javascript', 'facil', 45, 10)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Falta uma CONDIÇÃO DE PARADA (caso base): um "if (n < 0) return;" antes da chamada recursiva, para a função parar de chamar a si mesma ao alcançar o valor desejado. Sem isso, cada chamada gera uma nova chamada indefinidamente, empilhando frames na call stack até estourá-la.', true,
   'Correto! Toda recursão precisa de pelo menos um caso base que NÃO faça uma nova chamada recursiva. Sem ele, a recursão nunca converge e consome a call stack, que é finita.'),
  ('B', 'Falta trocar a recursão por um laço for, já que JavaScript não suporta recursão profunda.', false,
   'JavaScript suporta recursão normalmente — o problema não é a recursão em si, é a AUSÊNCIA de caso base. Adicionar a condição de parada resolve sem precisar abandonar a recursão.'),
  ('C', 'Falta declarar o parâmetro "n" com let dentro da função, pois ele está sendo reatribuído incorretamente a cada chamada.', false,
   'Parâmetros de função já se comportam como variáveis locais a cada chamada — não há problema de reatribuição aqui. O bug real é a ausência de uma condição que interrompa as chamadas recursivas.'),
  ('D', 'Nada está faltando: toda função recursiva eventualmente para sozinha por causa do garbage collector.', false,
   'O garbage collector gerencia memória de objetos não referenciados, mas não interrompe uma recursão em andamento — sem um caso base explícito, a recursão continua até esgotar a call stack.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Duas implementações somam os valores de um array de N elementos: uma RECURSIVA (soma(arr, i) = arr[i] + soma(arr, i+1), com caso base quando i chega ao fim) e uma ITERATIVA (laço for acumulando em uma variável). Ambas são O(N) em TEMPO. Por que a versão recursiva costuma consumir MAIS memória que a iterativa em arrays grandes, mesmo com complexidade de tempo igual?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Porque cada chamada recursiva empilha um novo frame na call stack (guardando parâmetros, variáveis locais e o ponto de retorno) até o caso base ser atingido, somando O(N) de memória extra; a versão iterativa reaproveita a MESMA variável acumuladora a cada volta do laço, usando O(1) de memória extra.', true,
   'Correto! É a diferença clássica entre tempo e espaço: as duas versões fazem O(N) de trabalho, mas a recursiva paga um custo adicional de espaço proporcional à profundidade da recursão (a call stack), enquanto a iterativa não empilha nada — O(1) de espaço extra.'),
  ('B', 'Porque o JavaScript aloca um array temporário extra a cada chamada recursiva, mesmo que a função não crie nenhum array explicitamente.', false,
   'Não existe essa alocação automática de array a cada chamada — o que realmente cresce é a call stack (frames de chamada), não arrays temporários criados "por baixo dos panos".'),
  ('C', 'Porque a versão recursiva tem, na verdade, complexidade de TEMPO O(N²), maior que a iterativa O(N), e por isso consome mais recursos.', false,
   'O enunciado já estabelece que ambas são O(N) em tempo (cada chamada faz trabalho constante, e há N chamadas) — a diferença relevante aqui é de ESPAÇO, não de tempo.'),
  ('D', 'Não é verdade: as duas versões usam exatamente a mesma quantidade de memória, pois ambas percorrem o array uma única vez.', false,
   'Percorrer o array uma vez explica o tempo igual, mas não o espaço: a recursão soma frames na call stack proporcionalmente a N, algo que o laço iterativo simplesmente não faz.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Uma função recursiva percorre em profundidade (DFS) uma árvore de categorias de produtos para montar um menu. Em um cliente com uma hierarquia muito profunda (milhares de níveis, gerada por um bug de cadastro), a função recursiva estoura a call stack antes de terminar. Reescrever a função para usar uma PILHA EXPLÍCITA (um array que a própria função gerencia com push/pop) em vez de recursão resolve o problema. Por quê?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Porque a call stack da linguagem tem tamanho fixo e limitado pelo motor de execução, enquanto uma pilha explícita é apenas uma estrutura de dados alocada no heap, que pode crescer até o limite de memória RAM disponível — muito maior que o limite da call stack. A técnica simula manualmente o comportamento LIFO da recursão sem depender da pilha de chamadas da linguagem.', true,
   'Correto! É a técnica padrão para percorrer estruturas muito profundas sem estourar a call stack: como a lógica de "processar o próximo, depois voltar" é LIFO, um array usado como pilha reproduz esse comportamento manualmente, limitado apenas pela memória disponível, não por um limite fixo do interpretador.'),
  ('B', 'Porque a pilha explícita elimina a necessidade de percorrer todos os nós da árvore, reduzindo a complexidade de tempo de O(n) para O(log n).', false,
   'A complexidade de TEMPO continua O(n) em ambas as versões — todo nó ainda precisa ser processado. O que muda é apenas onde o estado da pilha "de retorno" é armazenado (call stack limitada vs. array no heap), não quantos nós são visitados.'),
  ('C', 'Porque arrays em JavaScript não têm limite de tamanho, ao contrário da recursão, que está limitada a exatamente 1000 chamadas em qualquer motor JavaScript.', false,
   'Não existe um número fixo universal de "1000 chamadas" — o limite da call stack varia por motor/ambiente e depende da memória de pilha configurada. O ponto central é que a call stack é limitada e fixa por natureza, enquanto uma estrutura no heap tem um teto muito mais alto (a RAM disponível), não um número mágico específico.'),
  ('D', 'Porque a pilha explícita converte automaticamente a busca em profundidade (DFS) em busca em largura (BFS).', false,
   'Usar uma pilha (LIFO) para simular a recursão preserva o comportamento de DFS — trocar para BFS exigiria usar uma FILA (FIFO) em vez de uma pilha, o que é uma mudança de algoritmo, não uma consequência automática de evitar a call stack.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Durante o code review, você encontra esta implementação clássica (e ingênua, sem memoização) do n-ésimo número de Fibonacci. Para n=40 ela já demora vários segundos; para n=50, parece travar. Qual é a complexidade de tempo dessa função e por quê?',
    'function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}', 'javascript', 'dificil', 90, 25)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Cresce EXPONENCIALMENTE com n: cada chamada fib(n) dispara duas novas chamadas, fib(n-1) e fib(n-2), que voltam a recalcular os MESMOS subproblemas repetidamente (por exemplo, fib(n-2) é recalculado do zero tanto dentro do ramo de fib(n-1) quanto diretamente), sem guardar nenhum resultado — o total de chamadas cresce aproximadamente como O(φⁿ) (φ ≈ 1.618, a razão áurea), frequentemente citado como O(2ⁿ) como limite superior simples.', true,
   'Correto! É o exemplo clássico de "subproblemas sobrepostos" recalculados sem memoização (a motivação clássica para programação dinâmica): sem guardar resultados intermediários, o número de chamadas explode exponencialmente, o que explica por que n=50 já é impraticável nessa forma.'),
  ('B', 'É O(n), pois apesar da recursão dupla, cada valor de fib é calculado apenas uma vez ao longo de toda a execução.', false,
   'Sem memoização, cada valor de fib É recalculado muitas vezes — por exemplo, fib(n-2) aparece tanto como chamada direta de fib(n) quanto dentro da árvore de chamadas de fib(n-1). Essa repetição é exatamente o que torna o custo exponencial, não linear.'),
  ('C', 'É O(n²), pois a árvore de chamadas tem profundidade n e, em cada nível, são feitas n comparações.', false,
   'A árvore de chamadas de fato tem profundidade proporcional a n, mas cada chamada gera DUAS novas chamadas (ramificação binária), não um número fixo de comparações por nível — essa ramificação é o que produz crescimento exponencial, não quadrático.'),
  ('D', 'É O(log n), pois a recursão divide o problema pela metade a cada chamada, de forma parecida com a busca binária.', false,
   'Não há divisão pela metade aqui: cada chamada reduz n apenas em 1 ou 2 unidades (fib(n-1) e fib(n-2)), gerando DUAS subchamadas a cada passo — o oposto do padrão de "dividir pela metade e escolher um lado" da busca binária.')
) as a(letra, texto, correta, explicacao);
