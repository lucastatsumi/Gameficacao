-- ============================================================
-- 12_mais_questoes.sql — 15 questões novas (3 por fase)
-- Objetivo: ampliar o banco de questões por fase, cobrindo ângulos
-- ainda não explorados em 05_seed_questoes.sql, para dar variedade
-- real ao sorteio de QUESTOES_POR_QUIZ e sustentar a regra
-- anti-farming de XP (só recompensa quando supera o recorde anterior).
-- Mesmo padrão de cenário realista + CTE do arquivo original.
-- Gerado pelo agente question-researcher, revisado e validado
-- rodando a cadeia completa 01–12 num Postgres local (integridade
-- de alternativas conferida: 4 por questão, exatamente 1 correta).
-- Aplicar via MCP como migration "12_mais_questoes".
-- ============================================================

-- ==================== FASE 1 — LISTAS (novas) ====================

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 1),
    'No carrinho de compras de um e-commerce, cada novo item é adicionado ao FINAL do array com push(). O array é implementado como array dinâmico (como o Array do JavaScript), que ocasionalmente precisa realocar um bloco maior de memória e copiar os elementos existentes quando a capacidade atual se esgota. Qual é a complexidade AMORTIZADA de um push() no final?',
    null, 'javascript', 'facil', 45, 10)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'O(1) amortizado: as realocações são raras (a capacidade costuma dobrar) e seu custo se dilui entre as muitas inserções O(1) que ocorrem entre uma realocação e outra.', true,
   'Correto! Como a capacidade cresce geometricamente (ex.: dobra a cada estouro), o custo total de todas as cópias ao longo de n inserções é O(n) — dividido por n operações, sobra O(1) por push em média.'),
  ('B', 'O(n) sempre, pois toda vez que um item é adicionado o array inteiro é copiado para um novo bloco de memória.', false,
   'A cópia só acontece quando a capacidade se esgota, não a cada push(). Na maioria das chamadas não há realocação nenhuma — daí o resultado ser amortizado O(1), não O(n) sempre.'),
  ('C', 'O(log n), porque a capacidade do array cresce em potências de 2.', false,
   'O crescimento geométrico explica POR QUE o custo total das cópias fica baixo (O(n) no total), mas isso não produz um resultado de O(log n) por operação — o resultado da análise amortizada é O(1).'),
  ('D', 'O(1) garantido em toda chamada individual, sem exceção.', false,
   'Isso é o comportamento no caso médio/amortizado, não em toda chamada isolada: a chamada específica que dispara a realocação custa O(n) para copiar os elementos existentes.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 1),
    'O histórico de navegação "voltar" do seu app é uma lista ligada de páginas visitadas. Depois de um bug em outro módulo, um nó passou a apontar de volta para um nó anterior, criando um CICLO — e qualquer função que percorra a lista até "proximo === null" trava em loop infinito. Um colega sugere esta função com dois ponteiros para detectar o problema sem percorrer a lista duas vezes. Como ela funciona e qual sua complexidade?',
    'function temCiclo(cabeca) {
  let lento = cabeca;
  let rapido = cabeca;
  while (rapido !== null && rapido.proximo !== null) {
    lento = lento.proximo;
    rapido = rapido.proximo.proximo;
    if (lento === rapido) return true;
  }
  return false;
}', 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'É o algoritmo de Floyd (tartaruga e lebre): "rapido" avança duas casas para cada uma de "lento"; se houver ciclo, os dois ponteiros eventualmente se encontram dentro do ciclo — detecção em O(n) de tempo e O(1) de memória extra.', true,
   'Correto! Se não há ciclo, "rapido" chega a null primeiro e a função retorna false. Se há ciclo, "rapido" entra no laço e, como avança mais rápido, necessariamente alcança "lento" por trás — sem precisar de estrutura auxiliar para marcar nós visitados.'),
  ('B', 'A função nunca funciona, pois "lento" e "rapido" partem do mesmo nó e por isso já começam iguais.', false,
   'A checagem "lento === rapido" só é avaliada DEPOIS de ambos avançarem pelo menos uma vez dentro do laço — a igualdade inicial não é testada, então isso não é um problema real do algoritmo.'),
  ('C', 'É correta, mas tem complexidade O(n²), pois para cada passo de "lento" a função reinicia a busca de "rapido" a partir da cabeça.', false,
   'Não há reinício: "rapido" mantém seu progresso entre iterações, avançando 2 nós por vez continuamente. Cada ponteiro percorre a lista no máximo uma vez completa, o que mantém o custo em O(n).'),
  ('D', 'Só detecta ciclos se a lista tiver um número par de nós antes do ciclo começar.', false,
   'A paridade do número de nós não é relevante: como "rapido" ganha uma casa de vantagem sobre "lento" a cada passo, ele necessariamente entra em sincronia com "lento" dentro do ciclo, qualquer que seja seu tamanho.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 1),
    'Você fez um benchmark: percorrer um array de 1 milhão de inteiros e percorrer uma lista ligada de 1 milhão de nós com o mesmo valor total — ambos são operações O(n). Mesmo assim, o percurso do array terminou várias vezes mais rápido na prática. A que se deve essa diferença, já que o Big-O é o mesmo?',
    null, 'javascript', 'dificil', 75, 25)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Localidade de referência: os elementos do array ficam contíguos na memória e cabem em poucas linhas de cache do processador, enquanto os nós da lista ligada ficam espalhados no heap, gerando muito mais cache misses a cada acesso via ponteiro.', true,
   'Correto! Big-O mede o crescimento assintótico do número de operações, não o custo real de cada acesso à memória. Hardware moderno é muito mais rápido lendo memória contígua (cache-friendly) do que perseguindo ponteiros espalhados — por isso arrays costumam vencer na prática mesmo com a mesma complexidade teórica.'),
  ('B', 'O Big-O do percurso de array na verdade é O(1), não O(n); o benchmark só confirma isso.', false,
   'Percorrer TODOS os elementos de um array continua sendo O(n) — o que muda entre array e lista ligada não é a ordem de crescimento, e sim a constante escondida pelo Big-O, dominada pelo efeito de cache.'),
  ('C', 'A engine do JavaScript trata listas ligadas como um tipo de dado nativo mais lento que arrays, independentemente de como são implementadas.', false,
   '"Lista ligada" aqui é apenas uma estrutura construída com objetos e ponteiros (propriedade "proximo") — não é um tipo especial da linguagem com penalidade própria. A lentidão vem do padrão de acesso à memória, não de uma penalização artificial da engine.'),
  ('D', 'Essa diferença de desempenho só existe em linguagens de baixo nível como C; em JavaScript o resultado seria idêntico.', false,
   'O efeito de localidade de cache é uma característica do hardware (como a CPU e a hierarquia de memória funcionam), não da linguagem — ele se manifesta em qualquer linguagem, ainda que o overhead de objetos gerenciados possa amplificar a diferença em linguagens de alto nível.')
) as a(letra, texto, correta, explicacao);

-- ==================== FASE 2 — PILHAS (novas) ====================

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 2),
    'O motor de uma calculadora avalia expressões em notação PÓS-FIXA (RPN), onde operadores vêm depois dos operandos — por exemplo, "3 4 + 2 *" equivale a (3 + 4) * 2. O código abaixo processa os tokens usando uma pilha. Qual valor fica no topo da pilha ao final, e por que a pilha é a estrutura certa para essa avaliação?',
    'const tokens = ["3", "4", "+", "2", "*"];
const pilha = [];
for (const t of tokens) {
  if (!isNaN(t)) {
    pilha.push(Number(t));
  } else {
    const b = pilha.pop();
    const a = pilha.pop();
    pilha.push(t === "+" ? a + b : a * b);
  }
}', 'javascript', 'facil', 45, 10)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', '14, pois a pilha guarda operandos e resultados intermediários, e cada operador consome os dois valores mais recentes do topo (LIFO) — exatamente a ordem que a notação pós-fixa pressupõe.', true,
   'Correto! Passo a passo: push 3, push 4 → [3,4]; "+" faz pop 4 e 3, push 7 → [7]; push 2 → [7,2]; "*" faz pop 2 e 7, push 14 → [14]. O topo final é 14, equivalente a (3+4)*2.'),
  ('B', '7, pois a expressão termina assim que o primeiro operador "+" é processado.', false,
   'O laço continua até processar todos os tokens, incluindo o "*" final. 7 é apenas o resultado intermediário após o primeiro operador, não o resultado final da expressão.'),
  ('C', '20, calculando 3 + (4 * 2)... ', false,
   'A notação pós-fixa "3 4 + 2 *" não corresponde a essa precedência: o "+" é aplicado aos dois primeiros operandos (3 e 4) antes do "*", resultando em (3+4)*2 = 14, não 3+(4*2).'),
  ('D', 'A pilha não é adequada para isso; avaliação de expressões deveria usar uma fila, para preservar a ordem de leitura da esquerda para a direita.', false,
   'A leitura dos tokens é sequencial (por isso um simples for já resolve), mas o CÁLCULO exige lembrar os operandos mais recentes para aplicar o próximo operador — isso é comportamento LIFO, natural de pilha, não de fila.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 2),
    'O painel de monitoramento registra latências de requisições em uma pilha e precisa exibir, a qualquer momento, a MENOR latência já registrada entre as que ainda estão na pilha — em O(1), sem percorrer nada. A implementação abaixo usa uma pilha auxiliar "minimos" sincronizada com a pilha principal. Por que getMin() roda em O(1), e qual o custo pago por isso?',
    'class PilhaComMin {
  valores = [];
  minimos = [];
  push(x) {
    this.valores.push(x);
    const menorAtual = this.minimos.length === 0
      ? x
      : Math.min(x, this.minimos[this.minimos.length - 1]);
    this.minimos.push(menorAtual);
  }
  pop() {
    this.minimos.pop();
    return this.valores.pop();
  }
  getMin() {
    return this.minimos[this.minimos.length - 1];
  }
}', 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Porque "minimos" mantém no topo, sempre atualizado a cada push/pop, o menor valor da pilha "valores" NAQUELE momento — getMin() só lê o topo. O custo é O(n) de memória extra, um valor mínimo guardado por elemento empilhado.', true,
   'Correto! Cada push calcula e guarda o mínimo "até agora" junto com o valor, e cada pop remove os dois em conjunto — assim os dois topos ficam sempre sincronizados, e getMin() é uma leitura direta O(1), sem varrer a pilha.'),
  ('B', 'Porque o JavaScript otimiza automaticamente chamadas a Math.min(), então getMin() poderia varrer "valores" inteiro e mesmo assim ser O(1).', false,
   'Não existe essa otimização mágica: varrer todo o array "valores" a cada chamada seria O(n). O O(1) real vem de já ter o mínimo pré-calculado no topo de "minimos", não de uma otimização do Math.min.'),
  ('C', 'Porque o array "valores" é mantido sempre ordenado internamente, então o menor elemento está sempre em uma posição fixa.', false,
   'push() apenas adiciona ao final de "valores", sem reordenar nada — a pilha principal preserva a ordem real de inserção (necessária para o pop() correto), a ordenação não é o mecanismo usado aqui.'),
  ('D', 'A técnica só funciona se os valores forem inseridos em ordem crescente.', false,
   'Não há essa restrição: "minimos" recalcula o mínimo a cada push comparando com o topo atual (Math.min), então funciona corretamente para qualquer ordem de inserção.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 2),
    'Um editor de design implementa Ctrl+Z/Ctrl+Y com duas pilhas: "desfazer" e "refazer". Cada Ctrl+Z faz pop de "desfazer" e push em "refazer" (guardando o que foi desfeito, caso o usuário queira refazer). O usuário desfaz 3 ações com Ctrl+Z e, em seguida, realiza uma NOVA edição do zero (não é um Ctrl+Y). O que deve acontecer com a pilha "refazer" nesse momento, e por quê?',
    null, 'javascript', 'dificil', 75, 25)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'A pilha "refazer" deve ser ESVAZIADA: a nova edição cria um novo "futuro" para o documento que não corresponde mais às ações que haviam sido desfeitas — manter o antigo refazer levaria a um Ctrl+Y que reaplica uma edição incompatível com o estado atual.', true,
   'Correto! É o mesmo comportamento de editores de texto reais (VSCode, Word, etc.): qualquer nova ação depois de um undo invalida o histórico de redo anterior, pois o documento seguiu por um caminho diferente daquele que o redo assumia.'),
  ('B', 'A pilha "refazer" deve continuar intacta, e as 3 ações desfeitas continuam disponíveis para Ctrl+Y normalmente depois da nova edição.', false,
   'Isso geraria um Ctrl+Y inconsistente: ele tentaria reaplicar uma edição antiga sobre um documento que já mudou de forma diferente — o histórico de redo só faz sentido enquanto nenhuma edição nova ocorre.'),
  ('C', 'A nova ação deve ser inserida na BASE da pilha "refazer" (abaixo de tudo), preservando as 3 ações desfeitas no topo.', false,
   'Pilhas são LIFO: inserir na base exigiria esvaziar e reconstruir toda a estrutura, além de não fazer sentido semanticamente — o redo de ações antigas simplesmente deixa de ser válido após uma nova edição.'),
  ('D', 'A pilha "desfazer" deve ser copiada inteira para "refazer" antes de registrar a nova edição, para não perder nenhum histórico.', false,
   'Isso misturaria o histórico de "coisas que ainda podem ser desfeitas" com "coisas que podem ser refeitas", sem necessidade — o comportamento correto é simplesmente descartar o redo obsoleto e empilhar a nova ação em "desfazer".')
) as a(letra, texto, correta, explicacao);

-- ==================== FASE 3 — FILAS (novas) ====================

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 3),
    'A fila de tickets de suporte é implementada com um array comum, usando shift() para remover o próximo ticket da frente. Sob alta carga (dezenas de milhares de tickets em fila), o dequeue vira o principal gargalo do sistema, segundo o profiler. Qual é a causa?',
    null, 'javascript', 'facil', 45, 10)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'shift() remove o primeiro elemento do array e precisa deslocar TODOS os elementos restantes uma posição para a esquerda para manter a contiguidade — um custo O(n) a cada chamada.', true,
   'Correto! Assim como remover do meio de um array custa O(n) por causa do deslocamento, remover do início é o pior caso desse deslocamento: todo o restante do array se move. Uma fila baseada em lista ligada (ou em fila circular) resolveria isso com dequeue O(1).'),
  ('B', 'shift() é O(1); o gargalo relatado pelo profiler vem necessariamente de latência de rede, não da estrutura de dados.', false,
   'O enunciado descreve um gargalo de CPU medido pelo profiler na própria operação de dequeue — e shift() em array não é O(1): ele reindexa todos os elementos restantes, o que é justamente a causa mais provável.'),
  ('C', 'Arrays em JavaScript não suportam remoção no início; shift() lança uma exceção que precisa ser tratada, o que consome tempo.', false,
   'shift() é um método válido e amplamente usado para remover o primeiro elemento — ele não lança exceção. O custo real está no deslocamento O(n) dos elementos remanescentes, não em tratamento de erro.'),
  ('D', 'O garbage collector é acionado obrigatoriamente a cada chamada de shift(), travando a aplicação.', false,
   'Não há acionamento obrigatório do GC a cada shift(). O custo dominante e previsível é o deslocamento O(n) de todos os elementos após a remoção do primeiro.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 3),
    'O robô de um armazém automatizado precisa achar o CAMINHO MAIS CURTO (em número de células) de sua posição até um produto, navegando por um grid onde cada célula é um vizinho de até 4 outras. A equipe implementa busca em largura (BFS) usando uma fila para visitar as células. Por que a FILA (e não uma pilha) é essencial para o BFS garantir o caminho mais curto?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'A fila (FIFO) garante que as células sejam exploradas nível por nível, na ordem em que foram descobertas: todos os vizinhos a distância 1 são visitados antes de qualquer célula a distância 2, e assim por diante — por isso, quando o destino é alcançado, é por um caminho de comprimento mínimo. Uma pilha (LIFO) mergulharia fundo por um único ramo antes de explorar os vizinhos mais próximos, fazendo uma DFS, sem essa garantia.', true,
   'Correto! É exatamente a propriedade que distingue BFS de DFS: a disciplina FIFO da fila expande a fronteira de busca em camadas concêntricas de distância, o que é a definição de "caminho mais curto em número de passos" num grafo não ponderado.'),
  ('B', 'A fila calcula automaticamente a distância euclidiana entre células e ordena por proximidade real.', false,
   'A fila não faz nenhum cálculo geométrico — ela só preserva a ordem de descoberta (FIFO). É essa ordem de descoberta por camadas, não uma métrica de distância, que garante o caminho mínimo em número de arestas.'),
  ('C', 'Pilha e fila produzem exatamente a mesma ordem de visita nesse algoritmo; a escolha é só estilística.', false,
   'A ordem de visita muda completamente: com pilha, o algoritmo vira DFS e pode encontrar QUALQUER caminho até o destino, não necessariamente o mais curto. A estrutura de dados usada define o próprio algoritmo (BFS vs. DFS).'),
  ('D', 'A fila é usada apenas para economizar memória; usar uma pilha chegaria ao mesmo resultado, só que gastando mais RAM.', false,
   'O consumo de memória não é o motivo principal: pilha e fila usam memória da mesma ordem de grandeza aqui. A diferença crítica é de CORRETUDE — só a fila garante que o primeiro caminho encontrado até o destino seja o mais curto.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 3),
    'Um serviço de monitoramento recebe milhões de leituras de uso de CPU e precisa exibir, em tempo real, o valor MÁXIMO dentro de uma janela deslizante das últimas k leituras. Recalcular o máximo da janela inteira a cada nova leitura custaria O(k) por leitura. Um colega propõe usar uma DEQUE (fila de duas pontas), removendo do fim os valores menores que a nova leitura antes de inseri-la, e descartando da frente os índices que saíram da janela. Por que essa abordagem alcança O(1) AMORTIZADO por leitura?',
    null, 'javascript', 'dificil', 90, 25)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Porque cada leitura entra e sai da deque no máximo uma vez ao longo de toda a execução: ao chegar, remove do fim (e descarta para sempre) todos os valores menores, que nunca mais poderão ser o máximo de nenhuma janela futura; o valor máximo da janela atual está sempre na frente da deque. Como cada elemento é inserido e removido O(1) vez, o custo total se distribui ao longo de n leituras.', true,
   'Correto! Essa é a técnica clássica da "deque monotônica": ela mantém a deque sempre em ordem decrescente de valor, e cada elemento contribui para o trabalho total no máximo duas vezes (uma inserção, uma remoção) — daí o O(1) amortizado por leitura, em vez de O(k) recalculando tudo.'),
  ('B', 'Porque a deque ordena TODOS os elementos automaticamente como uma árvore balanceada, permitindo buscas rápidas.', false,
   'A deque aqui não faz uma ordenação completa nem se comporta como uma árvore — ela só mantém uma sequência decrescente de CANDIDATOS a máximo, descartando os que nunca mais serão úteis. É essa poda, não uma estrutura de árvore, que garante a eficiência.'),
  ('C', 'Porque a deque descarta metade dos elementos a cada nova leitura, de forma análoga à busca binária.', false,
   'Não há divisão pela metade nessa técnica — o número de elementos removidos por leitura é variável (pode ser 0 ou vários), mas cada elemento só é removido uma vez em toda sua existência na estrutura, o que fundamenta o argumento amortizado, não uma metáfora de busca binária.'),
  ('D', 'Porque a deque limita a janela a exatamente k elementos, e por isso encontrar o máximo é sempre O(1), mesmo sem manter nenhuma ordem interna.', false,
   'Limitar o tamanho da janela para k elementos NÃO bastaria por si só: sem manter a deque em ordem decrescente (removendo os valores obsoletos do fim), encontrar o máximo ainda exigiria varrer até k elementos — O(1) só é alcançado graças à manutenção ativa da ordem.')
) as a(letra, texto, correta, explicacao);

-- ==================== FASE 4 — ÁRVORES (novas) ====================

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 4),
    'A ferramenta de geração de sitemap do site precisa listar as páginas NÍVEL POR NÍVEL a partir da árvore de navegação: primeiro a página inicial, depois todas as suas subpáginas diretas, depois os "netos", e assim por diante. Qual estrutura auxiliar viabiliza esse percurso em LARGURA (BFS) sobre a árvore, e como ela é usada?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Uma FILA: enfileira a raiz e, a cada passo, desenfileira um nó, processa-o e enfileira seus filhos — isso garante que todos os nós de um nível sejam processados antes de qualquer nó do próximo nível.', true,
   'Correto! A disciplina FIFO da fila é o que produz a ordem "nível por nível": como os filhos de um nó só são enfileirados depois de todos os nós anteriores do mesmo nível, eles nunca "furam a fila" na frente de nós de níveis já em andamento.'),
  ('B', 'Uma PILHA: empilha a raiz e a cada passo desempilha um nó, processa-o e empilha seus filhos.', false,
   'Isso produz uma busca em PROFUNDIDADE (DFS), não em largura: o último filho empilhado é processado antes de qualquer irmão do nível anterior, misturando níveis diferentes na saída.'),
  ('C', 'A mesma recursão em ordem (in-order) usada para listar valores de uma BST ordenadamente.', false,
   'In-order (esquerda, raiz, direita) percorre a árvore em PROFUNDIDADE seguindo a estrutura esquerda/direita — não agrupa por nível de distância da raiz, que é o que o sitemap exige.'),
  ('D', 'Não é possível fazer um percurso em largura em árvores; BFS só se aplica a grafos com ciclos.', false,
   'Toda árvore é um caso particular de grafo (acíclico e conexo), e BFS funciona perfeitamente nela — é justamente a estratégia padrão para percursos "nível por nível".')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 4),
    'Você precisa remover um produto do MEIO de uma BST de preços — um nó que tem DOIS filhos. Simplesmente apagar o nó deixaria as duas subárvores "soltas". Qual estratégia clássica remove esse nó preservando a propriedade da BST (esquerda < nó < direita) em toda a árvore?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Substituir o valor do nó removido pelo seu SUCESSOR em ordem (o menor valor da subárvore direita) e então remover esse sucessor de sua posição original — que, por ser o menor da subárvore direita, tem no máximo um filho, tornando sua remoção trivial.', true,
   'Correto! O sucessor em ordem é sempre maior que tudo na subárvore esquerda do nó original e menor que o restante da subárvore direita, então colocá-lo no lugar do nó removido mantém a invariante da BST intacta em toda a árvore.'),
  ('B', 'Remover o nó e deixar suas duas subárvores desconectadas da árvore principal, tratando-as como estruturas independentes.', false,
   'Isso destruiria a árvore: as subárvores esquerda e direita do nó removido precisam continuar acessíveis a partir da raiz para que buscas futuras funcionem — "soltá-las" perde esses dados da estrutura principal.'),
  ('C', 'Substituir o nó removido pelo seu filho esquerdo diretamente, descartando a subárvore direita inteira.', false,
   'Descartar a subárvore direita inteira apaga dados válidos da árvore (todos os valores maiores que o nó removido) — a remoção correta preserva TODOS os elementos, apenas reorganizando a estrutura.'),
  ('D', 'Reconstruir a árvore inteira do zero, extraindo todos os valores em ordem e reinserindo-os, sempre que um nó com dois filhos precisa ser removido.', false,
   'Isso funcionaria, mas custaria O(n) por remoção, bem pior que os O(log n) esperados (em árvore balanceada) da técnica do sucessor — reconstruir tudo é desnecessário para esse caso.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 4),
    'Uma fila de prioridade de tarefas é implementada como um MIN-HEAP guardado em um array (o pai fica no índice i, os filhos em 2i+1 e 2i+2). Ao inserir uma nova tarefa, ela entra no final do array e "sobe" trocando de lugar com o pai enquanto for menor que ele (sift-up), em O(log n). Por que essa estrutura NÃO pode substituir uma BST quando é preciso buscar um valor arbitrário qualquer em O(log n)?',
    null, 'javascript', 'dificil', 75, 25)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'O heap só garante que cada pai seja menor que seus filhos DIRETOS — não existe nenhuma relação de ordem entre subárvores irmãs. Por isso, localizar um valor arbitrário pode exigir visitar quase todos os nós, O(n). Já a BST garante esquerda < nó < direita em TODA a árvore, permitindo descartar metade dos nós a cada comparação.', true,
   'Correto! A propriedade de heap (parent ≤ filhos) é mais fraca que a propriedade de BST (subárvore inteira ordenada em relação ao nó): ela é suficiente para achar rapidamente o mínimo/máximo global, mas insuficiente para eliminar metade da árvore numa busca por um valor qualquer.'),
  ('B', 'Heaps não podem ser representados em array — apenas com nós e ponteiros, o que os torna incompatíveis com buscas rápidas.', false,
   'É o contrário: a representação em array (índice do pai e dos filhos calculados por aritmética) é a forma PADRÃO e mais eficiente de implementar heaps, exatamente como descrito no enunciado — isso não afeta a limitação de busca discutida.'),
  ('C', 'A inserção em heap é O(n), muito mais lenta que em uma BST balanceada, o que inviabiliza seu uso para buscas.', false,
   'A inserção em heap (sift-up) é O(log n), como o próprio enunciado descreve — comparável à de uma BST balanceada. A limitação do heap para busca de valor arbitrário não vem do custo de inserção, e sim da ordenação parcial que ele mantém.'),
  ('D', 'Heaps só conseguem armazenar números inteiros, nunca objetos com prioridade associada.', false,
   'Heaps armazenam qualquer tipo comparável, incluindo objetos com um campo de prioridade (é exatamente o caso de uma fila de prioridade de tarefas) — o tipo do dado não é a razão da limitação de busca.')
) as a(letra, texto, correta, explicacao);

-- ============= FASE 5 — ALGORITMOS DE ORDENAÇÃO (novas) =============

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 5),
    'Um dispositivo embarcado grava configurações ordenadas diretamente em uma memória flash cujas células têm um número LIMITADO de ciclos de escrita (cada escrita desgasta a célula). A equipe precisa ordenar algumas dezenas de valores minimizando o número de TROCAS (e portanto de escritas), mesmo que isso exija mais comparações. Qual algoritmo clássico de ordenação é feito sob medida para esse cenário?',
    null, 'javascript', 'facil', 45, 10)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Selection Sort: em cada passada, encontra o menor elemento restante e faz apenas UMA troca para colocá-lo na posição correta — no máximo n-1 trocas no total em todo o processo, mesmo às custas de O(n²) comparações.', true,
   'Correto! O Selection Sort separa claramente "procurar o mínimo" (só leitura, sem custo de escrita) de "trocar" (a única operação cara nesse cenário). O número de trocas é fixo em no máximo n-1, independentemente da entrada — ideal quando escrita é o recurso escasso.'),
  ('B', 'Bubble Sort, pois troca elementos adjacentes a cada comparação fora de ordem, minimizando o deslocamento de cada troca individual.', false,
   'O Bubble Sort pode realizar até O(n²) trocas no pior caso (uma a cada par fora de ordem detectado) — exatamente o oposto do que se quer minimizar aqui, mesmo que cada troca em si seja "pequena" (entre vizinhos).'),
  ('C', 'Merge Sort, pois nunca troca elementos in-place, apenas os copia para um array auxiliar durante a intercalação.', false,
   'Embora o Merge Sort não faça "trocas" no sentido clássico, ele realiza O(n log n) operações de cópia para o array auxiliar em cada nível da recursão — no total, mais escritas que as n-1 trocas do Selection Sort, além de exigir memória extra que o dispositivo embarcado pode não ter.'),
  ('D', 'Quick Sort, pois é o algoritmo com o menor número de comparações entre todos os algoritmos de ordenação clássicos.', false,
   'O Quick Sort não tem garantia de menor número de comparações (seu pior caso é O(n²) comparações) nem menor número de trocas — a característica que o diferencia é ser rápido NA MÉDIA, não minimizar escritas.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 5),
    'O sistema de matrícula precisa ordenar as notas finais de 200.000 alunos, sabendo que toda nota é um número inteiro entre 0 e 100. Um colega sugere usar Counting Sort em vez de um algoritmo baseado em comparação (como Merge Sort). Por que o Counting Sort pode ser mais rápido nesse caso específico, e qual é sua limitação?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'O Counting Sort conta quantas vezes cada valor possível aparece (0 a 100) e reconstrói a saída a partir dessas contagens, custando O(n + k), onde k é o tamanho do intervalo de valores — mais rápido que O(n log n) quando k é pequeno em relação a n. A limitação é exigir chaves inteiras dentro de um intervalo limitado e conhecido; um k muito grande (como um CPF completo) tornaria o array de contagem inviável em memória.', true,
   'Correto! Notas de 0 a 100 são exatamente o cenário ideal: k=101 é minúsculo perto de n=200.000, então O(n+k) ≈ O(n), superando o O(n log n) de algoritmos de comparação. O Counting Sort só funciona bem quando o domínio de valores é discreto e limitado.'),
  ('B', 'O Counting Sort é sempre O(n log n), exatamente como qualquer algoritmo baseado em comparação, então não haveria vantagem real em usá-lo aqui.', false,
   'O Counting Sort NÃO é baseado em comparação — ele conta ocorrências diretamente, o que o livra do limite inferior de O(n log n) que vale para algoritmos de comparação. Por isso pode chegar a O(n+k), mais rápido quando k é pequeno.'),
  ('C', 'O Counting Sort ordena qualquer tipo de dado (strings, objetos complexos) exatamente na mesma velocidade que ordena números inteiros pequenos.', false,
   'O Counting Sort funciona bem justamente porque as notas são inteiros discretos dentro de um intervalo pequeno e conhecido — ele não generaliza bem para chaves arbitrárias como strings ou objetos, que não mapeiam naturalmente para índices de um array de contagem.'),
  ('D', 'O Counting Sort é mais rápido porque usa recursão para dividir o problema pela metade repetidamente, como o Merge Sort.', false,
   'O Counting Sort não usa divisão e conquista nem recursão — ele percorre a entrada uma vez para contar ocorrências e depois reconstrói a saída, um mecanismo completamente diferente do Merge Sort.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 5),
    'Um dispositivo embarcado com pouquíssima memória RAM extra precisa ordenar 1 milhão de registros com complexidade GARANTIDA de O(n log n) mesmo no pior caso, sem poder alocar um array auxiliar do tamanho da entrada (o que descartaria o Merge Sort nesse contexto). Estabilidade entre registros de valores iguais não é um requisito. Qual algoritmo clássico atende a essas restrições?',
    null, 'javascript', 'dificil', 90, 25)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Heap Sort: constrói um heap in-place a partir do próprio array (O(n)) e extrai repetidamente o maior elemento (O(log n) cada extração), garantindo O(n log n) no PIOR caso usando apenas O(1) de memória extra — ao custo de não ser estável.', true,
   'Correto! O Heap Sort combina exatamente as duas garantias exigidas: pior caso O(n log n) (diferente do Quick Sort, que pode degradar) e ordenação in-place sem array auxiliar proporcional a n (diferente do Merge Sort). O preço é perder a estabilidade, que aqui não é requisito.'),
  ('B', 'Merge Sort, pois é sempre a melhor escolha quando o pior caso importa, independentemente da memória disponível.', false,
   'O Merge Sort garante O(n log n) no pior caso, mas exige O(n) de memória auxiliar para a intercalação — exatamente a restrição que o enunciado diz que o dispositivo não pode atender.'),
  ('C', 'Quick Sort, pois é in-place e na prática nunca degrada para O(n²).', false,
   'O Quick Sort é in-place, mas seu pior caso continua sendo O(n²) (por exemplo, com más escolhas de pivô) — ele não oferece a garantia de pior caso O(n log n) exigida, mesmo sendo rápido "na prática" em média.'),
  ('D', 'Bubble Sort, pois não usa memória extra alguma e sua simplicidade compensa a lentidão em qualquer volume de dados.', false,
   'Bubble Sort não usa memória extra, mas seu pior (e médio) caso é O(n²) — para 1 milhão de registros isso é proibitivamente lento e não atende ao requisito de O(n log n) garantido.')
) as a(letra, texto, correta, explicacao);
