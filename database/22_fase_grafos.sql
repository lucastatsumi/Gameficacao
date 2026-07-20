-- ============================================================
-- 22_fase_grafos.sql — Nova fase sequencial "Grafos" (BFS/DFS em
-- grafo geral, não árvore/grid), preenchendo a lacuna apontada em
-- docs/ROADMAP.md ("Cobrir tópicos ainda sem fase própria").
--
-- Fase 8 na trilha sequencial (ordem = 8), desbloqueada só após
-- concluir "Algoritmos de Ordenação" (ordem = 5) — as fases bônus
-- 6 e 7 (Batalha de Complexidade, Reordenar Algoritmo) têm
-- fase_requisito_id null e continuam fora da trilha obrigatória,
-- então não interferem no desbloqueio (backend só olha
-- fase_requisito_id, nunca `ordem` — ver faseService.js/quizService.js).
--
-- As 6 questões foram geradas e verificadas pelo agente
-- question-researcher contra CLRS cap. 22 (Elementary Graph
-- Algorithms), Sedgewick & Wayne cap. 4 (Graphs), cp-algorithms.com
-- e Baeldung — ver database/rascunho_questoes_grafos.sql (histórico
-- do rascunho revisado) para a lista completa de fontes por questão.
-- Cobrem ângulos distintos: caminho mínimo via BFS, ordenação
-- topológica via DFS, lista x matriz de adjacência, detecção de
-- ciclo (aresta de retorno), componentes conexos, complexidade
-- O(V+E). Validado rodando a cadeia completa 01–22 num Postgres
-- local: 6 questões, 24 alternativas, exatamente 1 correta por
-- questão.
-- ============================================================

-- ---------- Fase ----------
insert into fases (nome, descricao, ordem, fase_requisito_id) values
  ('Grafos', 'Grafos gerais (não árvore, não grid): busca em largura (BFS), busca em profundidade (DFS), representações, ciclos e componentes conexos.', 8, (select id from fases where ordem = 5));

-- ---------- Badge ----------
insert into badges (nome, descricao, icone, tipo_condicao, parametro) values
  ('Explorador de Grafos', 'Conclua a fase de Grafos.', '🕸️', 'fase_concluida', '{"fase_ordem": 8}');

-- ---------- Questões ----------

-- Q1 (fácil) — BFS garante caminho mais curto (em arestas) em
-- grafo geral não ponderado; DFS não garante.
with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'A rede social da empresa quer implementar o recurso "grau de separação": dado o perfil de dois usuários A e B, mostrar o CAMINHO MAIS CURTO de amizades (menor número de conexões) que liga um ao outro. O grafo de amizades é geral — não é uma árvore nem um grid: cada usuário pode ter dezenas de amigos, e existem vários caminhos possíveis entre A e B, inclusive ciclos (grupos de amigos que se conectam entre si). Por que a equipe deve implementar essa busca com BFS, e não com DFS?',
    null, 'javascript', 'facil', 45, 10)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'DFS encontra o mesmo caminho mínimo que o BFS, só que gastando mais memória, porque mergulha fundo antes de voltar.', false,
   'DFS não garante caminho mínimo: ele pode mergulhar por um caminho longo e sinuoso antes de alcançar B, sem qualquer garantia sobre o número de conexões percorridas até chegar lá. A diferença entre os dois não é apenas de memória — é de CORRETUDE para esse problema específico.'),
  ('B', 'BFS explora as conexões em camadas de distância crescente a partir de A (primeiro os amigos diretos, depois os amigos dos amigos, e assim por diante); a primeira vez que B é alcançado, é necessariamente pelo caminho com o menor número de conexões.', true,
   'Correto! Como a fila (FIFO) do BFS só passa para a camada de distância k+1 depois de esgotar toda a camada k, a primeira descoberta de qualquer vértice ocorre pela distância mínima em número de arestas — essa é a prova clássica de que BFS resolve caminho mínimo em grafo não ponderado (CLRS, cap. 22.2).'),
  ('C', 'Como o grafo tem ciclos (grupos de amigos interligados), nem BFS nem DFS funcionam — é preciso primeiro transformar o grafo em uma árvore removendo os ciclos.', false,
   'BFS e DFS lidam perfeitamente com ciclos, desde que marquem vértices já visitados para não reprocessá-los infinitamente. Não é necessário "remover ciclos" antes de buscar — essa marcação de visitados já resolve o problema.'),
  ('D', 'BFS é melhor porque visita os vértices em ordem alfabética do nome de usuário, o que corresponde à ordem de proximidade social.', false,
   'A ordem de visita do BFS não tem relação nenhuma com ordem alfabética ou qualquer rótulo dos vértices — ela é determinada exclusivamente pela ordem de descoberta via fila, a partir da estrutura de conexões do grafo.')
) as a(letra, texto, correta, explicacao);

-- Q2 (média) — DFS como escolha natural para ordenação topológica
-- de dependências (grafo direcionado acíclico).
with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'O gerenciador de pacotes que sua equipe mantém precisa decidir em qual ORDEM instalar as dependências de um projeto: se o pacote X depende do pacote Y, então Y precisa ser instalado antes de X. As dependências formam um grafo DIRECIONADO sem ciclos (uma aresta de X para Y significa "X depende de Y"). Um colega sugere usar DFS, finalizando cada pacote (empilhando-o numa lista de saída) somente depois de processar todas as suas dependências, e no fim invertendo essa lista. Por que essa é a estratégia clássica de DFS para ordenação topológica, e por que um BFS simples (só percorrer camada a camada a partir de um pacote raiz) não resolve o problema da mesma forma direta?',
    'function dfsTopologico(pacote, visitado, saida) {
  visitado.add(pacote);
  for (const dep of pacote.dependencias) {
    if (!visitado.has(dep)) {
      dfsTopologico(dep, visitado, saida);
    }
  }
  saida.push(pacote); // só finaliza o pacote após todas as suas dependências
}
// ordem de instalação = saida invertida', 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'DFS funciona porque visita sempre o pacote com MENOS dependências primeiro, resolvendo automaticamente qualquer ciclo que exista.', false,
   'DFS não escolhe por número de dependências — a ordem de visita segue a ordem dos vizinhos na lista de adjacência/recursão. E se houvesse um ciclo, não existiria ordenação topológica válida alguma: ciclo de dependências é um erro a ser DETECTADO, não algo que o DFS "resolve" sozinho.'),
  ('B', 'Um BFS simples camada por camada a partir da raiz sempre produz a mesma ordem que o DFS invertido, então a escolha entre os dois é indiferente.', false,
   'A ordem de descoberta do BFS reflete a distância até o vértice inicial, não a relação de precedência entre TODAS as dependências do grafo. Um pacote pode ser dependência direta de vários outros em "camadas" diferentes, e o BFS puro não garante que ele apareça antes de quem depende dele.'),
  ('C', 'DFS só marca um pacote como "finalizado" depois de esgotar recursivamente todas as suas dependências; ao inverter a ordem de finalização, toda dependência aparece antes de quem depende dela — essa é a ordenação topológica. Um BFS simples não oferece essa garantia sem bookkeeping extra (como o algoritmo de Kahn, que rastreia grau de entrada de cada vértice).', true,
   'Correto! É o Teorema clássico de CLRS (cap. 22.4): inverter a ordem de finalização (pós-ordem) de um DFS em um DAG produz uma ordenação topológica válida. Existe sim uma alternativa baseada em fila — o algoritmo de Kahn — mas ele precisa rastrear o grau de entrada de cada vértice, uma técnica adicional além de um BFS ingênuo.'),
  ('D', 'DFS resolve, mas exige que o grafo de dependências seja NÃO-direcionado; grafos direcionados não permitem ordenação topológica.', false,
   'É o oposto: ordenação topológica só faz sentido em grafos DIRECIONADOS acíclicos (DAG). Um grafo não-direcionado não tem a noção de "depende de", então não haveria o que ordenar.')
) as a(letra, texto, correta, explicacao);

-- Q3 (fácil) — lista de adjacência vs. matriz de adjacência: trade-off
-- de espaço em grafo esparso.
with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Você está modelando o grafo de conexões ("segue") de uma rede social com 10 milhões de usuários, em que cada usuário segue, em média, apenas 150 outros — um grafo ESPARSO, com número de arestas muito menor que V². Um colega sugere representar o grafo com uma MATRIZ de adjacência (matriz booleana usuário x usuário); outro sugere LISTA de adjacência (cada usuário guarda só a lista de quem ele segue). Qual é o principal motivo para preferir a lista de adjacência nesse cenário?',
    null, 'javascript', 'facil', 45, 10)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'A lista de adjacência permite verificar se existe uma aresta específica (A segue B?) mais rápido que a matriz, em qualquer cenário.', false,
   'É o contrário nesse ponto específico: a matriz responde "existe aresta A→B?" em O(1), acessando diretamente matriz[A][B]. A lista precisa varrer a lista de A, custando O(grau(A)) no pior caso. A vantagem da lista aqui é de ESPAÇO, não de consulta pontual de uma aresta.'),
  ('B', 'Nenhuma diferença prática existe entre as duas representações; a escolha é só estilo de código.', false,
   'A diferença é enorme em memória para grafos esparsos grandes: a matriz cresce com o QUADRADO do número de vértices, independentemente de quantas arestas existem de fato.'),
  ('C', 'A matriz de adjacência não consegue representar relações assimétricas (A segue B mas B não segue A), então é inutilizável para redes sociais.', false,
   'A matriz representa perfeitamente relações direcionadas/assimétricas: matriz[A][B] pode ser diferente de matriz[B][A]. O problema real aqui é de ESPAÇO em grafos esparsos, não de expressividade da representação.'),
  ('D', 'A matriz gastaria O(V²) de memória — com 10 milhões de usuários isso é ~10^14 células, impraticável — mesmo que a maioria represente "não há conexão"; a lista gasta O(V + E), proporcional às conexões que realmente existem.', true,
   'Correto! Para grafo esparso (E ≪ V²), a lista de adjacência é a escolha padrão: O(V + E) de espaço, contra O(V²) fixo da matriz, que não muda mesmo que a imensa maioria das células seja "sem conexão" (CLRS 22.1; Baeldung, "Time and Space Complexity of Adjacency Matrix and List").')
) as a(letra, texto, correta, explicacao);

-- Q4 (difícil) — detecção de ciclo em grafo DIRECIONADO via DFS
-- (aresta de retorno / back edge para vértice cinza).
with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'O sistema de build da empresa modela as dependências de módulos como um grafo DIRECIONADO (aresta de X para Y significa "X depende de Y"). Antes de compilar, o sistema precisa detectar se existe uma DEPENDÊNCIA CIRCULAR (ex.: X depende de Y, Y depende de Z, Z depende de X novamente), o que tornaria a compilação impossível. A equipe implementa DFS marcando cada vértice com três estados: BRANCO (não visitado), CINZA (em processamento, ainda na pilha de recursão) e PRETO (totalmente processado, já saiu da pilha). Qual condição, encontrada durante o DFS, indica com certeza a existência de um ciclo?',
    'function temCiclo(no, cor) {
  cor.set(no, "CINZA");
  for (const dep of no.dependencias) {
    if (cor.get(dep) === "CINZA") {
      return true; // ????
    }
    if (cor.get(dep) === "BRANCO" && temCiclo(dep, cor)) {
      return true;
    }
  }
  cor.set(no, "PRETO");
  return false;
}', 'javascript', 'dificil', 75, 25)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Encontrar, durante a exploração, uma aresta para um vértice PRETO, pois isso significa que ele já foi visitado antes.', false,
   'Uma aresta para um vértice PRETO é chamada de aresta de "avanço" ou de "cruzamento" — o vértice já terminou de ser processado e NÃO está na pilha de recursão atual. Isso é comum e esperado mesmo em grafos SEM ciclo (ex.: um módulo usado como dependência de dois módulos diferentes) e não indica ciclo algum.'),
  ('B', 'Encontrar, durante a exploração, uma aresta para um vértice CINZA — ou seja, um vértice que já está na pilha de recursão atual (um ancestral do vértice corrente). Essa é a chamada "aresta de retorno" (back edge), e sua existência é necessária e suficiente para haver ciclo em um grafo direcionado.', true,
   'Correto! CINZA significa "ainda estou processando este vértice e seus descendentes" — se um desses descendentes aponta de volta para um vértice CINZA, existe um caminho de volta ao ancestral, fechando um ciclo. CLRS (Teorema 22.11) prova exatamente isso: um grafo direcionado é acíclico se e somente se o DFS não produz nenhuma aresta de retorno.'),
  ('C', 'Visitar o mesmo vértice mais de uma vez durante toda a execução do DFS, independentemente da cor.', false,
   'Revisitar um vértice já PRETO é normal em grafos (mesmo acíclicos) com múltiplos caminhos até o mesmo nó — por exemplo, um módulo compartilhado por duas dependências diferentes. O que importa não é "quantas vezes o nó é tocado", e sim se ele está CINZA (ou seja, ainda um ancestral ativo) no momento em que é encontrado de novo.'),
  ('D', 'A pilha de chamadas do DFS estourar (erro de recursão), pois ciclos sempre causam recursão infinita.', false,
   'O algoritmo com coloração não entra em recursão infinita mesmo com ciclos: ao encontrar um vértice CINZA ele apenas detecta a condição e retorna true, sem chamar temCiclo() de novo sobre ele. Um estouro de pilha indicaria um bug de implementação (por exemplo, esquecer de checar a cor antes de recursar), não é o mecanismo correto de detecção.')
) as a(letra, texto, correta, explicacao);

-- Q5 (média) — componentes conexos em grafo não-direcionado via
-- buscas repetidas de BFS/DFS.
with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'A equipe de infraestrutura modela a rede de servidores da empresa como um grafo NÃO-DIRECIONADO, em que uma aresta entre dois servidores indica um link de rede direto entre eles. Após uma falha, o time suspeita que a rede ficou PARTICIONADA em "ilhas" isoladas — subgrupos de servidores que conseguem se comunicar entre si, mas não com os demais. Como usar BFS ou DFS para descobrir quantas ilhas (componentes conexos) existem?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Basta rodar UMA única BFS a partir de qualquer servidor; se ela não visitar todos os vértices, a rede tem exatamente 2 componentes.', false,
   'Uma única busca visita apenas o componente que contém o vértice inicial. Os vértices restantes, não visitados, podem formar QUALQUER número de componentes adicionais (1, 2, 10...) — é preciso repetir a busca a partir de cada vértice ainda não visitado para contar corretamente.'),
  ('B', 'Contar o número de arestas do grafo: se o número de arestas for menor que o número de vértices, a rede está particionada.', false,
   'O número de arestas isolado não determina conectividade: um grafo com poucas arestas bem distribuídas pode estar conexo, e um com muitas arestas concentradas em poucos vértices pode estar particionado. O critério confiável é a alcançabilidade via BFS/DFS, não uma contagem numérica isolada.'),
  ('C', 'Percorrer todos os vértices; a cada vértice ainda não visitado, iniciar uma nova busca (BFS ou DFS) a partir dele, marcando como visitados todos os vértices alcançados. Cada execução completa da busca descobre exatamente um componente conexo, e o número de vezes que se inicia uma nova busca é o número de componentes.', true,
   'Correto! Essa é a técnica padrão (Sedgewick & Wayne, cap. 4): repetir BFS/DFS a partir de cada vértice ainda não visitado até cobrir o grafo inteiro. Cada nova busca iniciada corresponde a uma nova "ilha" desconectada das anteriores, e o algoritmo inteiro roda em O(V + E).'),
  ('D', 'É impossível determinar isso com BFS/DFS; só um algoritmo de caminho mínimo com pesos, como Dijkstra, revela partições da rede.', false,
   'Nem BFS/DFS nem Dijkstra precisam de pesos para essa tarefa. A existência de conectividade (alcançabilidade) é resolvida em O(V+E) só com busca simples; pesos de aresta só seriam necessários se a pergunta fosse sobre a MENOR distância entre servidores, não sobre a existência de conexão.')
) as a(letra, texto, correta, explicacao);

-- Q6 (difícil) — complexidade de tempo O(V+E) de BFS/DFS.
with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 8),
    'Em uma revisão de código, um colega afirma que a complexidade de tempo do BFS em um grafo é "O(V)", já que o algoritmo visita cada vértice uma única vez. Outro colega discorda e diz que a complexidade correta é O(V + E). Considere um sistema de recomendação que modela produtos como vértices e "comprados juntos" como arestas, com V produtos e E relações de coocorrência. Por que a complexidade correta inclui o termo E, e em que cenário a diferença entre O(V) e O(V+E) se torna crítica?',
    'function bfs(inicio, adjacencia) {
  const visitado = new Set([inicio]);
  const fila = [inicio];
  while (fila.length > 0) {
    const atual = fila.shift();
    for (const vizinho of adjacencia[atual]) { // percorre as arestas de "atual"
      if (!visitado.has(vizinho)) {
        visitado.add(vizinho);
        fila.push(vizinho);
      }
    }
  }
}', 'javascript', 'dificil', 90, 25)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Além de processar cada vértice uma vez (O(V)), o algoritmo também examina cada aresta da lista de adjacência do vértice ao explorar seus vizinhos; somando sobre todos os vértices, cada aresta é examinada um número constante de vezes, totalizando O(E). Em um grafo denso — onde E pode se aproximar de V² —, ignorar o termo E subestimaria drasticamente o custo real.', true,
   'Correto! CLRS (Teorema 22.3) prova que BFS roda em O(V+E): o tempo total gasto varrendo listas de adjacência, somado sobre todos os vértices, é O(E) (cada aresta é examinada uma vez em grafo direcionado, ou duas em não-direcionado — ainda O(E)). Em um catálogo onde muitos produtos são comprados juntos (grafo denso), E pode se aproximar de V², e nesse caso O(V) subestimaria o custo real de forma grave.'),
  ('B', 'O termo E só aparece em grafos DIRECIONADOS; em grafos não-direcionados a complexidade é mesmo O(V).', false,
   'A necessidade de examinar as arestas para descobrir vizinhos existe tanto em grafos direcionados quanto não-direcionados — a única diferença é uma constante (cada aresta não-direcionada aparece em duas listas de adjacência), o que não muda a ordem de grandeza O(E).'),
  ('C', 'O(V) está correto; o exame das arestas de cada vértice é O(1), pois é apenas "olhar a lista", então o total continua proporcional só a V.', false,
   '"Olhar a lista" de um vértice custa proporcional ao GRAU dele (quantidade de arestas que saem dele), não O(1) constante. Somando o grau de todos os vértices do grafo, o total é O(E) — para um produto muito popular (grau alto), essa lista pode ter milhares de entradas, longe de custar O(1).'),
  ('D', 'A diferença entre O(V) e O(V+E) é só teórica; na prática os dois termos sempre crescem na mesma proporção, então tanto faz.', false,
   'Eles não crescem necessariamente na mesma proporção: um grafo esparso tem E próximo de V, mas um grafo denso (muitos produtos com coocorrências cruzadas) pode ter E próximo de V², fazendo O(V+E) dominar completamente O(V) — a diferença é bem real na prática, não só teórica.')
) as a(letra, texto, correta, explicacao);
