-- ============================================================
-- 26_fase_estruturas_avancadas.sql — Nova fase de campanha
-- "Estruturas Avançadas" (ordem = 8, requer ter concluído a fase
-- de Algoritmos de Ordenação — ordem 5 — continuando a trilha
-- sequencial obrigatória, ao contrário das fases bônus 6/7).
--
-- Cobre tópicos do roadmap (docs/ROADMAP.md, "Curto prazo") que
-- não tinham fase própria: grafos gerais (BFS/DFS, não só
-- árvore/grid), tabelas hash (colisões, load factor), heaps/filas
-- de prioridade como estrutura própria (antes só mencionados
-- dentro da fase de Árvores) e recursão.
--
-- 16 questões (4 por tópico), geradas pelo agente
-- question-researcher e verificadas manualmente: fatos de Big-O de
-- grafo/hash/heap conferidos contra CLRS; a questão de recursão de
-- cauda conferida contra o comportamento real da V8 (que nunca
-- implementou "proper tail calls" em produção, ao contrário do
-- que a especificação ES2015 permite).
--
-- Validado rodando a cadeia completa 01–22 num Postgres local
-- (schema + todas as seeds anteriores), conferindo: fase 8
-- corretamente encadeada à fase 5, badge de conclusão inserido,
-- e as 16 questões com exatamente 4 alternativas cada e
-- exatamente 1 correta (índice uma_correta_por_questao).
--
-- NÃO aplicado ao projeto Supabase gerenciado nesta sessão — o
-- MCP do Supabase exige autenticação interativa indisponível
-- neste ambiente autônomo. Aplicar via MCP como migration
-- "26_fase_estruturas_avancadas" numa sessão com acesso.
-- ============================================================

-- ---------- Fase ----------
insert into fases (nome, descricao, ordem, fase_requisito_id) values
  ('Estruturas Avançadas', 'Grafos, tabelas hash, heaps/filas de prioridade e recursão: tópicos além das estruturas lineares e árvores das fases anteriores.', 8, (select id from fases where ordem = 5));

-- ==================== GRAFOS ====================

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'A funcionalidade "sugestão de amigos" da rede social que você mantém precisa encontrar o menor número de conexões (grau de separação) entre o usuário logado e outro usuário, navegando pelo grafo de amizades. Esse grafo NÃO é uma árvore: amigos podem se conectar de volta por outros caminhos, formando ciclos. A equipe implementa uma busca em largura (BFS) com uma fila, marcando cada usuário como visitado assim que ele é enfileirado. Por que essa abordagem garante o menor número de conexões, mesmo havendo ciclos no grafo?',
    null, 'javascript', 'facil', 45, 10)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Porque a fila (FIFO) expande a fronteira de busca em camadas de distância crescente, e marcar cada usuário como visitado assim que é enfileirado impede que ele seja reprocessado — essencial num grafo geral, que pode ter ciclos, ao contrário de uma árvore.', true,
   'Correto! Todos os usuários a distância 1 são processados antes de qualquer usuário a distância 2, e assim por diante — por isso o primeiro caminho que alcança o destino é o mais curto. A marcação de "visitado" é o que evita loops infinitos causados pelos ciclos do grafo de amizades.'),
  ('B', 'Porque a fila ordena automaticamente os amigos por nome antes de visitá-los, priorizando conexões mais próximas.', false,
   'A fila não faz nenhuma ordenação alfabética — ela só preserva a ordem de descoberta (FIFO). É essa ordem de descoberta em camadas, e não um critério de nome, que garante o caminho mínimo.'),
  ('C', 'Como o grafo tem ciclos, BFS não é aplicável; apenas DFS (busca em profundidade) trata corretamente grafos com ciclos.', false,
   'BFS é perfeitamente aplicável a grafos com ciclos, desde que marque nós visitados (como no enunciado). DFS também pode lidar com ciclos, mas não garante o caminho MAIS CURTO em número de conexões — ele mergulha fundo por um ramo antes de explorar os vizinhos mais próximos.'),
  ('D', 'Porque, ao detectar um ciclo, o algoritmo troca internamente a fila por uma pilha para não repetir usuários.', false,
   'Não existe essa troca de estrutura: o algoritmo continua usando a mesma fila do início ao fim. Repetição é evitada pelo conjunto de "visitados", não por alternar entre fila e pilha.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Você está projetando o grafo de conexões de uma rede social com 10 milhões de usuários, onde cada usuário tem, em média, 150 conexões (um grafo ESPARSO: bem menos arestas do que o máximo possível). Um colega sugere representar o grafo com uma MATRIZ de adjacência 10 milhões x 10 milhões. Por que uma LISTA de adjacência é a escolha correta aqui?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Porque a matriz de adjacência gasta O(V²) de memória independentemente do número real de conexões — aqui, cerca de 10¹⁴ células —, enquanto a lista de adjacência gasta O(V+E), proporcional apenas às conexões que de fato existem (~1,5 bilhão, no caso).', true,
   'Correto! Com um grafo esparso (E muito menor que V²), a matriz desperdiça memória absurda representando bilhões de "não-conexões" que nunca existirão. A lista de adjacência só armazena as arestas reais, escalando com o tamanho real do grafo.'),
  ('B', 'Porque a matriz de adjacência é sempre mais lenta que a lista de adjacência para qualquer operação, em qualquer tipo de grafo.', false,
   'Não é verdade em geral: para verificar se DUAS conexões específicas existem, a matriz responde em O(1), o que pode ser vantajoso em grafos DENSOS. O problema aqui é especificamente de memória, dado que o grafo é esparso.'),
  ('C', 'Porque listas de adjacência só conseguem representar grafos não direcionados, e uma rede social exige um grafo direcionado.', false,
   'Listas de adjacência representam tanto grafos direcionados (guardando a lista de "para onde saem arestas" de cada nó) quanto não direcionados — isso não é uma limitação da estrutura.'),
  ('D', 'Porque a matriz de adjacência gasta menos memória que a lista quando o grafo é esparso, mas é mais difícil de implementar.', false,
   'É o contrário: em grafos esparsos, é a MATRIZ que desperdiça memória (O(V²) fixo) e a LISTA que economiza (O(V+E)). Facilidade de implementação não é o motivo da escolha aqui — é a viabilidade de memória.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'O gerenciador de pacotes que sua equipe mantém resolve a ordem de build a partir de um grafo DIRECIONADO de dependências (pacote A depende de B significa uma aresta de A para B). É preciso detectar uma dependência CIRCULAR (A depende de B, que depende de C, que depende de A de volta) antes de tentar montar a ordem de build. A implementação usa DFS mantendo dois conjuntos: "visitados" (nós já totalmente processados) e "no caminho atual" (ancestrais ainda ativos na recursão). Por que não basta um único conjunto de "visitados" para detectar o ciclo corretamente?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Porque, num grafo direcionado, um pacote pode ser referenciado por múltiplas dependências diferentes sem formar ciclo (ex.: A e B dependendo ambos de C) — isso é normal e não é um ciclo. Só é ciclo de verdade quando uma aresta aponta para um nó que ainda está "no caminho atual" da recursão (um ancestral ativo, não apenas um nó já visitado alguma vez).', true,
   'Correto! Um único conjunto de visitados confundiria essa reconvergência legítima (comum em grafos de dependência, formando um DAG válido) com um ciclo, gerando falsos positivos. A aresta que fecha um ciclo de verdade é a que aponta de volta para um nó que ainda não terminou de ser processado no caminho atual — a chamada "aresta de retorno".'),
  ('B', 'Porque detectar ciclos exige obrigatoriamente uma matriz de adjacência; listas de adjacência não fornecem informação suficiente.', false,
   'A representação (lista ou matriz) não determina se é possível detectar ciclos — o algoritmo de DFS com os dois conjuntos funciona igualmente bem com lista de adjacência, que inclusive é a escolha mais comum para grafos de dependências (tipicamente esparsos).'),
  ('C', 'Porque só é possível detectar ciclos usando busca em largura (BFS); DFS não é capaz de detectar ciclos em nenhum tipo de grafo.', false,
   'É o oposto do que costuma ser ensinado: DFS com o rastreamento do "caminho atual" é a técnica clássica para detectar ciclos em grafos direcionados. BFS também pode detectar ciclos (ex.: algoritmo de Kahn, via contagem de grau de entrada), mas a afirmação de que DFS "não é capaz" está errada.'),
  ('D', 'Porque grafos direcionados nunca formam ciclos verdadeiros; o que parece um ciclo é sempre uma reconvergência de dependências.', false,
   'Grafos direcionados podem, sim, formar ciclos verdadeiros — é exatamente esse o cenário do enunciado (dependência circular A→B→C→A), e é isso que quebraria o processo de build se não fosse detectado antes.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'O sistema de rotas de entrega da empresa representa cidades e conexões rodoviárias como um grafo bem ESPARSO (poucas rotas diretas por cidade). A implementação atual guarda o grafo como uma MATRIZ de adjacência V x V, e a busca em largura (BFS) que acha a rota com menos escalas percorre a LINHA INTEIRA da matriz para achar os vizinhos de cada cidade visitada, mesmo quando quase todas as células daquela linha são zero. Com centenas de milhares de cidades, o profiler mostra o BFS extremamente lento. Qual é a causa e a complexidade correta desse BFS na representação atual?',
    null, 'javascript', 'dificil', 90, 25)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Com matriz de adjacência, achar os vizinhos de um nó custa O(V) (percorrer a linha toda), então o BFS completo fica O(V²), independentemente de quantas rotas realmente existam. Migrar para lista de adjacência reduziria para O(V+E), pois cada aresta só é examinada quando de fato existe.', true,
   'Correto! A complexidade de BFS/DFS depende da representação escolhida: O(V+E) é a garantia com lista de adjacência (o clássico resultado de CLRS para grafos), mas cai para O(V²) com matriz de adjacência, porque descobrir os vizinhos de cada nó exige varrer uma linha inteira de tamanho V, mesmo num grafo esparso onde E é muito menor que V².'),
  ('B', 'BFS é sempre O(V+E), não importa a representação escolhida para o grafo — o profiler deve estar apontando para outro gargalo, alheio ao algoritmo.', false,
   'A garantia O(V+E) vale especificamente para a representação em lista de adjacência. Com matriz de adjacência, encontrar vizinhos custa O(V) por nó visitado, elevando o total para O(V²) — exatamente o gargalo relatado pelo profiler.'),
  ('C', 'O problema é usar uma fila em vez de uma pilha para controlar a fronteira de busca; trocar para pilha resolveria a lentidão.', false,
   'Trocar fila por pilha mudaria o algoritmo de BFS para DFS (e perderia a garantia de rota com menos escalas) sem resolver o problema real, que é o custo de descobrir vizinhos O(V) por nó na matriz — a estrutura de dados do GRAFO, não a estrutura auxiliar de controle.'),
  ('D', 'BFS sempre tem complexidade O(V log V), igual à do algoritmo de Dijkstra implementado com heap, então o gargalo não pode vir do próprio BFS.', false,
   'O(V log V) (ou mais precisamente O((V+E) log V)) é característico de Dijkstra COM heap para grafos com peso, não do BFS simples, que não usa heap. A causa real aqui é a representação em matriz elevando o custo de BFS para O(V²).')
) as a(letra, texto, correta, explicacao);

-- ==================== TABELAS HASH ====================

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'O cache em memória do seu serviço é implementado como uma tabela hash simples: uma função hash calcula um índice a partir da chave (por exemplo, somando os códigos dos caracteres e tirando o resto pela divisão do tamanho do array interno) para decidir em qual posição guardar cada valor. Você percebe que duas chaves diferentes, "abc" e "cba", produzem o MESMO índice — uma colisão. Por que colisões são inevitáveis em qualquer tabela hash de uso geral, mesmo com uma função hash bem projetada?',
    null, 'javascript', 'facil', 45, 10)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Pelo princípio da casa dos pombos: o espaço de chaves possíveis (todas as strings, por exemplo) é muito maior que o número finito de posições do array interno, então qualquer função hash necessariamente mapeia várias chaves diferentes para o mesmo índice em algum momento.', true,
   'Correto! Se há mais "pombos" (chaves possíveis) do que "casas" (posições do array), pelo menos duas chaves precisam compartilhar uma casa. Colisão não é sinal de uma função hash ruim — é uma consequência matemática inevitável quando o domínio de chaves é maior que o número de posições.'),
  ('B', 'Colisões só ocorrem quando a função hash está mal implementada; uma função hash "perfeita" nunca colide, para qualquer conjunto de chaves.', false,
   'Hashing perfeito (sem nenhuma colisão) só é possível para um conjunto FIXO e conhecido de chaves, calculado sob medida para elas. Para uma tabela hash de uso geral, que aceita chaves arbitrárias e desconhecidas de antemão (como strings de qualquer tamanho), colisões são inevitáveis.'),
  ('C', 'Colisões só acontecem quando a tabela está completamente cheia (todas as posições ocupadas).', false,
   'Colisões podem ocorrer bem antes da tabela ficar cheia — duas chaves podem calhar de mapear para o mesmo índice mesmo com a tabela quase vazia. É por isso que toda tabela hash precisa de uma estratégia de resolução de colisão desde o início.'),
  ('D', 'O problema se resolve criando um array com tamanho igual ao número de chaves possíveis, eliminando colisões por completo.', false,
   'Para chaves como strings arbitrárias, o número de chaves possíveis é praticamente ilimitado — um array desse tamanho seria inviável de alocar. É exatamente por isso que se aceita conviver com colisões e se investe em uma boa estratégia para resolvê-las.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Comparando duas implementações de hashmap open source: a primeira guarda, em cada posição do array interno, uma LISTA LIGADA com todos os pares chave-valor que colidiram naquele índice (encadeamento / separate chaining); a segunda, ao encontrar a posição calculada já ocupada, procura sequencialmente a PRÓXIMA posição livre no próprio array (endereçamento aberto / open addressing). Qual afirmação sobre essas duas estratégias está correta?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'No encadeamento, o load factor (razão elementos/posições) pode ultrapassar 1, já que cada posição comporta uma lista com vários pares; no endereçamento aberto, o load factor precisa ficar sempre abaixo de 1, pois cada posição do array guarda no máximo um elemento — é preciso deixar folga para as sondagens funcionarem.', true,
   'Correto! Como no endereçamento aberto todo elemento mora diretamente numa célula do array (sem lista auxiliar), a tabela nunca pode receber mais elementos do que posições — daí a necessidade de manter o load factor abaixo de 1 e fazer rehash antes de chegar perto disso, ao contrário do encadeamento.'),
  ('B', 'As duas estratégias resolvem colisões exatamente da mesma forma; a diferença entre "encadeamento" e "endereçamento aberto" é apenas de nomenclatura.', false,
   'São mecanismos bem diferentes: encadeamento agrupa colisões numa estrutura auxiliar (lista) por posição, enquanto endereçamento aberto redistribui o elemento colidido para OUTRA posição do próprio array, seguindo uma sequência de sondagem.'),
  ('C', 'O endereçamento aberto nunca fica cheio, pois sempre existe alguma posição livre em algum lugar do array, não importa quantos elementos sejam inseridos.', false,
   'O array do endereçamento aberto tem tamanho fixo: se o número de elementos se aproxima do número de posições, sondagens ficam cada vez mais longas e a tabela pode de fato ficar sem posições livres — por isso ela precisa crescer (rehash) bem antes disso, mantendo o load factor controlado.'),
  ('D', 'Encadeamento é uma técnica obsoleta; toda implementação de hashmap em produção usa apenas endereçamento aberto atualmente.', false,
   'Ambas seguem em uso: por exemplo, o HashMap do Java tradicionalmente usa encadeamento (com listas, convertidas em árvores quando o bucket cresce muito), enquanto o dict do Python usa endereçamento aberto — a escolha depende de trade-offs de cada linguagem/runtime, não de uma técnica ter sido abandonada.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Você implementa um hashmap customizado cujo array interno começa com 16 posições. A cada inserção, o código calcula o load factor (número de chaves ÷ capacidade); quando ele ultrapassa 0.75, um array NOVO com o DOBRO de posições é criado e todas as chaves existentes são reinseridas nele (rehash). Por que é necessário RECALCULAR o índice de cada chave existente durante o rehash, em vez de simplesmente copiar cada valor para a mesma posição de índice no array maior?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Porque o índice de cada chave é calculado como hash(chave) módulo a capacidade da tabela; ao dobrar a capacidade, o resultado do módulo muda para a maioria das chaves, então copiar para a mesma posição colocaria a maioria delas no bucket ERRADO, quebrando buscas futuras.', true,
   'Correto! O índice não é uma propriedade fixa da chave — ele depende do TAMANHO ATUAL da tabela (via módulo). Por isso, sempre que a capacidade muda, cada chave precisa ter seu índice recalculado contra a nova capacidade para continuar sendo encontrável.'),
  ('B', 'Não seria necessário recalcular nada: como hash(chave) não depende do tamanho da tabela, bastaria copiar cada elemento para a mesma posição de índice no array novo.', false,
   'O valor de hash(chave) em si até pode não depender do tamanho da tabela, mas o ÍNDICE usado de fato (hash(chave) % capacidade) depende, sim, da capacidade. Copiar para a mesma posição ignoraria essa mudança e quebraria a tabela.'),
  ('C', 'O rehash serve apenas para economizar memória; a posição de cada chave dentro do array não é afetada por ele.', false,
   'O rehash não é sobre economizar memória (na verdade ele usa mais memória, dobrando o array) — é sobre manter o load factor baixo para preservar o desempenho médio O(1). E a posição de cada chave muda sim, pois o módulo usado no cálculo do índice mudou.'),
  ('D', 'O rehash acontece a cada inserção, não apenas quando o load factor ultrapassa o limite configurado.', false,
   'Pelo enunciado, o rehash só é disparado quando o load factor ultrapassa 0.75 — não a cada inserção. É justamente por ser um evento raro (e não a cada operação) que seu custo se dilui entre muitas inserções O(1), resultando em custo amortizado O(1) por inserção.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Um pesquisador de segurança reporta que sua API pública agrupa requisições num dicionário (tabela hash) usando como chave um parâmetro de busca enviado livremente pelo cliente. Enviando milhares de strings cuidadosamente escolhidas para colidir no MESMO índice da tabela (um "hash flooding"), ele consegue degradar drasticamente o tempo de resposta do endpoint. Por que esse ataque funciona, dado que tabelas hash são conhecidas por operações O(1) em MÉDIA?',
    null, 'javascript', 'dificil', 90, 25)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'O(1) médio pressupõe chaves razoavelmente bem distribuídas entre as posições (entrada "típica"); se um atacante escolhe deliberadamente muitas chaves que mapeiam para o MESMO índice, todas elas acabam na mesma lista de colisão (ou sequência de sondagem), e buscar/inserir qualquer uma delas degrada para o PIOR caso O(n), pois é preciso varrer todas as chaves daquele único índice.', true,
   'Correto! É exatamente a distinção entre caso médio e pior caso de uma tabela hash (um resultado clássico de CLRS): a garantia O(1) depende da suposição de hashing "uniforme" das chaves de entrada. Um atacante que conhece (ou descobre) a função hash pode violar essa suposição de propósito. Por isso linguagens como Python, Ruby e PHP passaram a "semear" (randomizar) a função hash de strings a cada execução, dificultando que um atacante preveja quais chaves colidirão.'),
  ('B', 'Não é possível degradar uma tabela hash provocando colisões deliberadamente; a complexidade O(1) é uma garantia matemática válida para qualquer entrada.', false,
   'O(1) é uma garantia de caso MÉDIO sob suposições sobre a distribuição das chaves, não uma garantia de pior caso incondicional. Justamente por isso o ataque de hash flooding é real e documentado — ele explora chaves adversariais que quebram essa suposição.'),
  ('C', 'O ataque funciona porque toda tabela hash piora gradualmente para O(n) só de receber mais chaves, mesmo sem nenhuma colisão deliberada.', false,
   'Um crescimento natural do número de chaves é justamente o que o rehash (aumentar a capacidade quando o load factor sobe) evita, mantendo o caso médio próximo de O(1). O problema do hash flooding não é volume de chaves — é a CONCENTRAÇÃO deliberada de muitas chaves num único índice.'),
  ('D', 'O problema é exclusivo de tabelas hash com endereçamento aberto; tabelas com encadeamento são imunes a esse tipo de ataque.', false,
   'Tabelas com encadeamento também são vulneráveis: se muitas chaves colidem no mesmo índice, a lista ligada daquele bucket cresce e percorrê-la também vira O(n). O ataque afeta ambas as estratégias de resolução de colisão, pois o problema de fundo é a concentração de chaves num único índice, não a técnica de resolução em si.')
) as a(letra, texto, correta, explicacao);

-- ==================== HEAPS / FILAS DE PRIORIDADE ====================

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Você está implementando um agendador de tarefas em background que precisa sempre executar, entre as tarefas pendentes, aquela com o MENOR prazo (deadline) — quanto menor o prazo, mais urgente. A equipe decide usar um heap para representar a fila de tarefas pendentes. Qual tipo de heap deve ser usado, e por quê?',
    null, 'javascript', 'facil', 45, 10)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Um MIN-heap: sua propriedade garante que a RAIZ é sempre menor ou igual a todos os outros nós, então consultar/extrair o topo sempre entrega a tarefa de menor prazo, sem precisar buscar na estrutura inteira.', true,
   'Correto! Num min-heap, todo nó é menor ou igual a seus filhos (recursivamente), o que força o menor valor de toda a estrutura a estar sempre na raiz. Isso torna "pegar a tarefa mais urgente" uma simples leitura do topo, em O(1), e a remoção seguida de reorganização (sift-down) custa O(log n).'),
  ('B', 'Um MAX-heap: sua propriedade garante que a raiz é sempre o maior valor, o que corresponde à tarefa de menor prazo.', false,
   'É o contrário: num max-heap, a raiz é sempre o MAIOR valor. Usá-lo aqui entregaria a tarefa de MAIOR prazo (menos urgente) no topo, o oposto do que o agendador precisa.'),
  ('C', 'Tanto faz min-heap ou max-heap, pois qualquer heap mantém todos os seus elementos totalmente ordenados internamente, então a raiz é sempre a mesma independentemente do tipo.', false,
   'Um heap NÃO mantém todos os elementos totalmente ordenados — apenas garante a relação de ordem entre cada nó e seus filhos diretos. E o tipo do heap (min ou max) determina exatamente qual extremo (menor ou maior) acaba na raiz, então a escolha importa muito.'),
  ('D', 'Tanto faz usar heap ou simplesmente manter um array ORDENADO por prazo, já que inserir num array ordenado também custa O(log n) graças à busca binária.', false,
   'A busca binária encontra a POSIÇÃO correta em O(log n), mas inserir de fato nessa posição ainda exige deslocar os elementos seguintes, custando O(n) no array. Já a inserção num heap (sift-up) é O(log n) de ponta a ponta — por isso o heap é preferido para esse caso de uso.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'A implementação de min-heap abaixo insere um novo valor no FIM do array e o faz "subir" (sift-up), trocando de lugar com o pai enquanto for menor que ele. Com n elementos já no heap, qual é a complexidade de PIOR CASO de inserir(), e por quê?',
    'class MinHeap {
  itens = [];
  inserir(valor) {
    this.itens.push(valor);
    let i = this.itens.length - 1;
    while (i > 0) {
      const pai = Math.floor((i - 1) / 2);
      if (this.itens[pai] <= this.itens[i]) break;
      [this.itens[pai], this.itens[i]] = [this.itens[i], this.itens[pai]];
      i = pai;
    }
  }
}', 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'O(log n): o heap é representado como uma árvore binária COMPLETA (sempre preenchida da esquerda para a direita), então sua altura é sempre O(log n); o laço de sift-up troca o elemento com o pai no máximo uma vez por nível, ou seja, no máximo O(log n) vezes.', true,
   'Correto! Por ser uma árvore completa (invariante estrutural do heap), a altura cresce logaritmicamente com o número de elementos. O sift-up sobe no máximo um nível por iteração do laço, então o número de trocas no pior caso é limitado pela altura, O(log n).'),
  ('B', 'O(1): o push() no fim do array é O(1) e o laço while nunca chega a executar mais de uma vez, não importa o tamanho do heap.', false,
   'O push() em si é O(1) amortizado, mas o laço de sift-up PODE executar várias vezes — no pior caso, uma vez por nível da árvore, até o novo elemento chegar à raiz. Ignorar esse laço subestima a complexidade real.'),
  ('C', 'O(n): no pior caso, o novo elemento pode precisar ser comparado com todos os outros elementos do heap para encontrar sua posição correta.', false,
   'O sift-up só compara o elemento com seus ANCESTRAIS diretos (o caminho até a raiz), não com o heap inteiro. Como esse caminho tem no máximo O(log n) nós (a altura da árvore), o número de comparações é O(log n), não O(n).'),
  ('D', 'O(n log n): além de subir o novo elemento, o heap inteiro precisa ser reorganizado (reordenado) a cada inserção.', false,
   'Não há reorganização do heap inteiro — apenas trocas locais ao longo de um único caminho da folha até (no máximo) a raiz. O custo total fica limitado à altura da árvore, O(log n), sem nenhum fator adicional de n.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Você precisa transformar um array bruto de 1 milhão de preços num heap, para depois extrair repetidamente o menor preço. Inserir os preços um a um num heap vazio custaria O(n log n) no total (n inserções de O(log n) cada). Um colega sugere usar o algoritmo clássico de "build-heap" (heapify de baixo para cima, aplicando sift-down em cada nó interno, começando pelos mais próximos das folhas), afirmando que ele constrói o heap inteiro em O(n) — mais rápido, apesar de parecer, à primeira vista, que "aplicar sift-down em cada um dos n nós" custaria O(n log n). Por que o build-heap bottom-up é mesmo O(n)?',
    null, 'javascript', 'dificil', 75, 25)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Porque o custo do sift-down aplicado em cada nó depende da ALTURA daquele nó específico, não da altura da árvore inteira; a grande maioria dos nós está perto das folhas (altura pequena), e só uma minoria próxima da raiz tem altura O(log n) — somando o custo real por nó (e não o pior caso de O(log n) para todos), a soma total converge para O(n).', true,
   'Correto! É o resultado clássico da análise de build-heap (CLRS, capítulo de heaps): metade dos nós são folhas (altura 0, custo zero de sift-down), um quarto tem altura 1, e assim por diante — a soma ponderada por essa distribuição de alturas é uma série geométrica que converge para O(n), bem abaixo do limite ingênuo de O(n log n) que assumiria altura O(log n) para todos os nós.'),
  ('B', 'Porque o build-heap não aplica sift-down algum: ele apenas copia o array como está, presumindo (erradamente) que ele já é um heap válido.', false,
   'O build-heap aplica sift-down de fato, em cada nó interno da árvore, dos mais profundos até a raiz — é esse processo que reorganiza um array arbitrário até satisfazer a propriedade de heap. A economia de tempo vem da distribuição de alturas, não da ausência de trabalho.'),
  ('C', 'Porque o array de entrada já vem ordenado por preço, o que elimina toda comparação durante a construção do heap.', false,
   'Nada no enunciado garante que os preços chegam ordenados, e o resultado O(n) do build-heap vale para QUALQUER array de entrada, ordenado ou não — a análise depende apenas da estrutura da árvore (distribuição de alturas), não da ordem dos dados.'),
  ('D', 'Porque, apesar de cada sift-down custar O(log n), o algoritmo aplica sift-down em apenas O(log n) nós no total, não em todos os n nós.', false,
   'O build-heap aplica sift-down em praticamente metade dos nós (todos os nós internos, aproximadamente n/2) — não apenas em O(log n) deles. A economia de tempo vem do fato de que a maioria desses nós internos tem altura pequena (perto das folhas), não da quantidade de nós processados.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Você está implementando o algoritmo de Dijkstra para achar a rota de MENOR custo acumulado num grafo de conexões de transporte com pesos não negativos. A cada passo, o algoritmo precisa escolher, entre todos os nós "na fronteira" ainda não finalizados, aquele com a menor distância acumulada até agora. A implementação usa um MIN-heap (fila de prioridade) para armazenar esses candidatos. Qual é a vantagem concreta de usar o min-heap em vez de simplesmente varrer um array de candidatos a cada passo para achar o mínimo?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Com o min-heap, extrair o candidato de menor distância custa O(log n) em vez de O(n) (varredura linear do array); como esse passo se repete para cada um dos V nós do grafo, a diferença muda a complexidade total do algoritmo de O(V²) (com varredura) para O((V+E) log V) (com heap) — significativo em grafos grandes e esparsos.', true,
   'Correto! É exatamente por isso que implementações de Dijkstra orientadas a desempenho usam fila de prioridade baseada em heap: a operação "extrair o mínimo", repetida V vezes ao longo do algoritmo, domina a complexidade total, e trocar O(n) por O(log n) nessa operação reduz bastante o custo em grafos com muitos nós.'),
  ('B', 'Não há vantagem real de desempenho; tanto o heap quanto a varredura de um array encontram o mínimo em O(1).', false,
   'Nem heap nem varredura de array encontram o mínimo em O(1) em geral: varrer um array desordenado custa O(n); o heap reduz isso para O(log n) (consultar o topo é O(1), mas removê-lo e reorganizar custa O(log n)) — ainda assim, uma melhoria expressiva sobre O(n).'),
  ('C', 'O heap elimina a necessidade de marcar nós como "finalizados/visitados" durante a execução do algoritmo.', false,
   'Dijkstra continua precisando marcar nós como finalizados independentemente da estrutura usada para escolher o próximo candidato — isso evita reprocessar um nó cuja menor distância já foi determinada. O heap resolve apenas a eficiência de "achar o próximo mínimo", não essa marcação.'),
  ('D', 'O heap garante que o algoritmo encontre o caminho mais curto corretamente mesmo com arestas de peso NEGATIVO no grafo.', false,
   'A escolha da estrutura de dados (heap ou não) não muda essa limitação: Dijkstra pressupõe pesos não negativos e pode produzir resultados incorretos com arestas negativas, independentemente de como os candidatos são armazenados. Para grafos com pesos negativos, o algoritmo correto é o de Bellman-Ford.')
) as a(letra, texto, correta, explicacao);

-- ==================== RECURSÃO ====================

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Durante o code review, você encontra esta função recursiva que deveria somar os dígitos de um número inteiro positivo. Ao chamar somaDigitos(125), o processo derruba o serviço com "RangeError: Maximum call stack size exceeded". O que está faltando na função?',
    'function somaDigitos(n) {
  return n % 10 + somaDigitos(Math.floor(n / 10));
}',
    'javascript', 'facil', 45, 10)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Falta um CASO BASE (por exemplo, "if (n === 0) return 0;") que interrompa a recursão; sem ele, Math.floor(0 / 10) sempre resulta em 0, e a função continua chamando a si mesma indefinidamente até estourar a pilha.', true,
   'Correto! Quando n chega a 0, a função continua chamando somaDigitos(0) para sempre, pois Math.floor(0/10) também é 0 — sem uma condição que pare a recursão nesse ponto, os frames de chamada se acumulam na call stack até estourar o limite.'),
  ('B', 'Falta apenas trocar Math.floor por Math.round; a lógica de parada da função já está correta.', false,
   'Trocar para Math.round não resolveria nada: o problema não é o arredondamento de n/10, e sim a AUSÊNCIA de uma condição que pare a recursão quando n chega a 0 — sem ela, a chamada se repete indefinidamente independentemente de como n/10 é arredondado.'),
  ('C', 'A função está correta como está; qualquer número eventualmente chega a n = 0, e o JavaScript para a recursão automaticamente nesse caso.', false,
   'O JavaScript não interrompe recursões automaticamente ao detectar um padrão de repetição — é responsabilidade do código definir explicitamente quando parar (o caso base). Sem essa condição, a função continua sendo chamada para sempre com n = 0.'),
  ('D', 'O problema é usar recursão em vez de um loop for; somar dígitos deveria sempre ser feito com um loop, nunca com recursão.', false,
   'Recursão é uma abordagem perfeitamente válida para esse problema (e até elegante). O defeito aqui é específico: falta o caso base. Adicionar "if (n === 0) return 0;" resolveria o problema sem precisar abandonar a recursão.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Sua função percorre recursivamente uma árvore de comentários aninhados de uma rede social (comentário → respostas → respostas das respostas...) e TEM um caso base correto: ela retorna assim que encontra um comentário sem respostas. Mesmo assim, quando uma thread vira uma "guerra de replies" com milhares de níveis de aninhamento, o processo derruba com "RangeError: Maximum call stack size exceeded". Por que a função ainda pode estourar a pilha, mesmo com o caso base correto?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Cada chamada recursiva ocupa um FRAME na call stack (variáveis locais, endereço de retorno etc.), e a call stack tem um tamanho MÁXIMO fixo; uma árvore com milhares de níveis de profundidade consome um frame por nível ao longo do caminho, podendo ultrapassar esse limite mesmo com uma lógica de parada perfeitamente correta.', true,
   'Correto! Ter um caso base garante que a recursão vai TERMINAR eventualmente (corretude), mas não garante que ela vai CABER dentro do tamanho finito da call stack do motor JavaScript. São dois problemas diferentes: término da recursão e profundidade suportada pela pilha.'),
  ('B', 'Isso nunca aconteceria: com caso base correto, a recursão sempre termina sem estourar a pilha, não importa a profundidade da árvore.', false,
   'Terminar (eventualmente retornar) e caber dentro do limite de tamanho da call stack são coisas diferentes. Uma recursão pode estar perfeitamente correta e mesmo assim estourar a pilha se a profundidade de chamadas ultrapassar o limite do motor JavaScript.'),
  ('C', 'O erro é causado pelo garbage collector, que impõe um limite ao número de objetos "comentário" que podem existir simultaneamente em memória.', false,
   'O erro relatado é especificamente de "call stack size", relacionado à pilha de chamadas de função, não à quantidade de objetos na heap gerenciada pelo garbage collector — são mecanismos distintos do motor JavaScript.'),
  ('D', 'A call stack do JavaScript cresce dinamicamente sem nenhum limite; esse erro só pode ser um bug no runtime do Node.js.', false,
   'A call stack tem, sim, um tamanho máximo (a mensagem de erro "Maximum call stack size exceeded" é justamente o motor avisando que esse limite foi atingido) — não é um bug, é o comportamento esperado quando a profundidade de recursão é grande demais para a pilha disponível.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Depois do incidente da questão anterior, a equipe decide reescrever de forma ITERATIVA a função que percorre a árvore de comentários (que pode ter múltiplos filhos por nó e profundidade muito variável), justamente porque a versão recursiva estourou a call stack em produção. A nova versão usa uma pilha (array) EXPLÍCITA, alocada no heap da aplicação, para simular a ordem de visita que antes vinha da recursão. Qual afirmação sobre essa troca é PRECISA?',
    null, 'javascript', 'dificil', 90, 25)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'A pilha explícita, alocada no heap da aplicação, tipicamente resolve o overflow porque o heap é ordens de magnitude maior que a call stack padrão — mas ela NÃO elimina o uso de memória proporcional à profundidade da árvore: ainda é preciso O(profundidade) de espaço, só que numa estrutura sem o limite rígido da call stack.', true,
   'Correto! Trocar recursão por iteração com pilha explícita move o custo de memória de um lugar limitado (a call stack) para outro bem maior e mais flexível (o heap gerenciado da aplicação) — mas o CUSTO em si, proporcional à profundidade máxima da árvore percorrida, continua existindo; a troca resolve o limite rígido, não elimina a necessidade de memória.'),
  ('B', 'A versão iterativa elimina completamente o uso de memória extra proporcional à profundidade, tornando o algoritmo O(1) de espaço.', false,
   'Para replicar corretamente a ordem de uma travessia em profundidade de uma árvore com múltiplos filhos, a pilha explícita ainda precisa guardar, no pior caso, um item por nível de profundidade — o espaço usado continua sendo O(profundidade), não O(1).'),
  ('C', 'Recursão e iteração sempre têm exatamente a mesma complexidade de tempo e espaço; a escolha entre elas é puramente estética.', false,
   'Não são idênticas: cada chamada recursiva paga o custo de um frame de função (endereço de retorno, contexto etc.) na call stack, que tem tamanho limitado, enquanto a pilha explícita da versão iterativa usa memória do heap, sem esse limite rígido — foi exatamente essa diferença que motivou a reescrita para evitar o estouro em produção.'),
  ('D', 'A troca resolve o problema porque laços (for/while) em JavaScript são executados por um interpretador totalmente separado da call stack usada nas chamadas de função.', false,
   'Não existe esse "interpretador separado": laços rodam na mesma thread e no mesmo motor que as chamadas de função. A diferença real é que um laço, por si só, não empilha um novo frame a cada iteração — quem simula a pilha de visita agora é a estrutura de dados explícita no heap, não um mecanismo paralelo de execução.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Um desenvolvedor reescreve a soma de um array bem grande para ser uma recursão de CAUDA (tail recursion): a chamada recursiva é a ÚLTIMA operação da função, com o resultado parcial sendo acumulado num parâmetro, sem nenhum cálculo pendente depois da chamada. Ele espera que isso evite o estouro de pilha, citando que a especificação ES2015 (ES6) do JavaScript inclui "proper tail calls" (otimização de chamada de cauda). Mesmo assim, rodando em Node.js (motor V8), a função abaixo continua estourando a pilha para arrays muito grandes. Por quê?',
    'function somarCauda(arr, i = 0, acumulador = 0) {
  if (i === arr.length) return acumulador;
  return somarCauda(arr, i + 1, acumulador + arr[i]);
}',
    'javascript', 'dificil', 90, 25)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Apesar de o ES2015 especificar "proper tail calls" (que reaproveitariam o mesmo frame da pilha em vez de empilhar um novo a cada chamada de cauda), a V8 — motor usado por Node.js e Chrome — nunca implementou essa otimização em produção; entre os motores JavaScript mais usados, apenas o JavaScriptCore (Safari) o faz. Por isso, no Node.js, cada chamada recursiva ainda cria um novo frame na call stack, mesmo sendo tecnicamente uma tail call.', true,
   'Correto! "Proper tail calls" faz parte da especificação ECMAScript desde 2015, mas sua adoção prática pelos motores ficou muito aquém: a V8 chegou a experimentar a otimização e a removeu por preocupações de debugging/ergonomia, e o restante do ecossistema (exceto o JavaScriptCore da Safari) nunca a implementou. Na prática, escrever código no estilo tail-recursive em Node.js não impede o estouro de pilha para recursões muito profundas — trocar por um laço explícito (ou por uma pilha, como na questão anterior) continua sendo necessário.'),
  ('B', 'A função não é realmente uma tail call porque usa parâmetros com valor padrão (i = 0, acumulador = 0); tail calls não podem coexistir com parâmetros padrão, segundo a especificação.', false,
   'Parâmetros com valor padrão não desqualificam uma chamada de estar em "posição de cauda" — o que importa é que a última coisa que a função faz seja simplesmente "return outraChamada(...)", sem nenhuma operação pendente depois dela, o que é exatamente o caso aqui.'),
  ('C', 'Otimização de chamada de cauda está implementada em todo motor JavaScript desde 2015, incluindo a V8; o estouro de pilha nesse código só pode vir de outra causa, como um vazamento de memória alheio à recursão.', false,
   'Isso contraria o comportamento real e documentado da V8: ela nunca implementou "proper tail calls" em produção. O estouro de pilha nesse código é justamente o sintoma esperado dessa ausência de otimização, não um vazamento de memória não relacionado.'),
  ('D', 'Basta adicionar a diretiva "use strict" no topo do arquivo para ativar a otimização de cauda no Node.js atual.', false,
   'O modo estrito chegou a ser um pré-requisito da especificação original para "proper tail calls", e a V8 experimentou brevemente um suporte parcial atrás dessa condição — mas essa implementação foi removida, e hoje "use strict" sozinho não ativa nenhuma otimização de cauda na V8/Node.js.')
) as a(letra, texto, correta, explicacao);

-- ---------- Badge ----------
insert into badges (nome, descricao, icone, tipo_condicao, parametro) values
  ('Arquiteto de Estruturas', 'Conclua a fase de Estruturas Avançadas.', '🕸️', 'fase_concluida', '{"fase_ordem": 8}');
