-- ============================================================
-- 05_seed_questoes.sql — 22 questões de exemplo (5 fases)
-- Cenários reais de desenvolvimento. XP: fácil 10, média 15,
-- difícil 25. Aplicado via MCP como migration "05_seed_questoes".
-- ============================================================

-- ==================== FASE 1 — LISTAS ====================

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 1),
    'Você está desenvolvendo a tela de histórico de pedidos de um e-commerce. Os pedidos ficam em um array e o usuário pode clicar em "ver pedido nº 500" para pular direto para ele. Por que o array é uma boa escolha para esse acesso?',
    null, 'javascript', 'facil', 45, 10)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Porque o array permite acesso direto por índice em tempo O(1).', true,
   'Correto! Como os elementos do array ficam em posições contíguas de memória, o endereço de qualquer índice é calculado diretamente — não é preciso percorrer nada.'),
  ('B', 'Porque o array reordena os pedidos automaticamente a cada inserção.', false,
   'Arrays não reordenam nada sozinhos — a ordem é a ordem de inserção, a menos que você ordene explicitamente.'),
  ('C', 'Porque o array usa menos memória que qualquer outra estrutura.', false,
   'Consumo de memória não é o motivo: a vantagem aqui é o acesso direto por índice, que custa O(1).'),
  ('D', 'Porque buscar em array é sempre O(log n).', false,
   'Busca O(log n) só vale para busca binária em array ORDENADO. Acesso por índice (posição conhecida) é O(1).')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 1),
    'No app de mensagens da sua equipe, cada notificação nova deve aparecer no TOPO da lista, e isso acontece milhares de vezes por minuto. Qual estrutura é mais eficiente para essas inserções no início?',
    null, 'javascript', 'facil', 45, 10)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Array dinâmico, pois inserir no início é O(1).', false,
   'Inserir no início de um array exige deslocar TODOS os elementos uma posição para frente — custo O(n).'),
  ('B', 'Lista ligada, pois inserir no início é O(1): basta apontar o novo nó para a antiga cabeça.', true,
   'Correto! Na lista ligada a inserção no início só cria um nó e ajusta um ponteiro, sem deslocar ninguém — O(1) de verdade.'),
  ('C', 'Tanto faz: array e lista ligada têm o mesmo custo de inserção no início.', false,
   'Não é o mesmo custo: array desloca todos os elementos (O(n)); lista ligada só ajusta um ponteiro (O(1)).'),
  ('D', 'Nenhuma das duas: o ideal é ordenar o array a cada inserção.', false,
   'Ordenar a cada inserção custaria O(n log n) por notificação — muito pior que o O(1) da lista ligada.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 1),
    'Durante o code review, você encontra esta função que percorre uma lista ligada. O que ela retorna e qual sua complexidade?',
    'function misterio(cabeca) {
  let atual = cabeca;
  let n = 0;
  while (atual !== null) {
    n++;
    atual = atual.proximo;
  }
  return n;
}', 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Retorna o último elemento da lista, em O(1).', false,
   'A função não retorna "atual" (o nó), retorna o contador "n". E o laço percorre a lista inteira, então não é O(1).'),
  ('B', 'Retorna a quantidade de nós da lista, em O(n).', true,
   'Correto! O laço visita cada nó exatamente uma vez incrementando o contador — é o clássico "tamanho da lista", com custo linear O(n).'),
  ('C', 'Retorna a soma dos valores dos nós, em O(n).', false,
   'Nenhum valor é somado: "n++" incrementa 1 por nó visitado, contando os nós, não somando seus valores.'),
  ('D', 'Entra em loop infinito, pois listas ligadas não têm fim.', false,
   'Uma lista ligada bem formada termina com proximo = null, que é exatamente a condição de parada do while.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 1),
    'Sua API mantém um array com 1 milhão de sessões ativas. Ao remover uma sessão do MEIO do array, o profiler mostra lentidão. Qual é a causa?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Remover do meio de um array exige deslocar todos os elementos seguintes, custando O(n).', true,
   'Correto! Para manter a contiguidade da memória, todos os elementos após a posição removida são deslocados uma casa para trás — com 1 milhão de itens, isso pesa.'),
  ('B', 'Arrays não permitem remoção; o JavaScript recria o array inteiro do zero a cada splice.', false,
   'Arrays permitem remoção (splice faz isso). O custo vem do deslocamento dos elementos seguintes, não de uma "recriação do zero" conceitual.'),
  ('C', 'O garbage collector trava o processo sempre que um elemento é removido.', false,
   'O GC não é acionado a cada remoção. O custo dominante aqui é o deslocamento O(n) dos elementos.'),
  ('D', 'A remoção em array é O(1), então a lentidão vem de outro lugar.', false,
   'Remoção por índice no meio NÃO é O(1) em array: os elementos seguintes precisam ser deslocados, custando O(n).')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 1),
    'No player de música que sua equipe mantém, o usuário navega entre faixas com "anterior" e "próxima", e faixas podem ser removidas da playlist enquanto tocam. Já existe um ponteiro para o nó da faixa atual. Por que uma lista DUPLAMENTE ligada é a melhor escolha?',
    null, 'javascript', 'dificil', 75, 25)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Porque ela mantém as faixas sempre ordenadas alfabeticamente.', false,
   'Lista duplamente ligada não ordena nada — ela apenas adiciona um ponteiro para o nó anterior em cada nó.'),
  ('B', 'Porque o acesso por índice passa a ser O(1), como em um array.', false,
   'Mesmo duplamente ligada, a lista continua exigindo percurso para chegar a um índice — o acesso segue O(n).'),
  ('C', 'Porque, com o ponteiro para o nó atual, tanto voltar à faixa anterior quanto remover o nó são O(1), usando os ponteiros anterior/próximo.', true,
   'Correto! O ponteiro "anterior" permite navegar para trás sem re-percorrer a lista e permite religar vizinho-com-vizinho na remoção, tudo em O(1) quando você já tem o nó.'),
  ('D', 'Porque ela dobra a capacidade de armazenamento da playlist.', false,
   'O segundo ponteiro não aumenta capacidade — pelo contrário, gasta um pouco mais de memória por nó em troca de navegação bidirecional.')
) as a(letra, texto, correta, explicacao);

-- ==================== FASE 2 — PILHAS ====================

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 2),
    'Você vai implementar o Ctrl+Z (desfazer) de um editor de texto: a última ação realizada deve ser a primeira a ser desfeita. Qual estrutura de dados modela esse comportamento?',
    null, 'javascript', 'facil', 45, 10)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Fila (FIFO): a primeira ação registrada é a primeira desfeita.', false,
   'FIFO desfaria a ação mais ANTIGA primeiro — o oposto do Ctrl+Z, que desfaz a mais recente.'),
  ('B', 'Pilha (LIFO): a última ação empilhada é a primeira desempilhada.', true,
   'Correto! Cada ação sofre push na pilha; o Ctrl+Z faz pop, recuperando exatamente a ação mais recente. LIFO é a essência do desfazer.'),
  ('C', 'Árvore binária de busca, para desfazer em ordem alfabética.', false,
   'Ordem alfabética não faz sentido para desfazer — o critério é temporal (mais recente primeiro), que é o LIFO da pilha.'),
  ('D', 'Lista ordenada por tipo de ação.', false,
   'Agrupar por tipo quebraria a ordem temporal. O desfazer precisa da ordem inversa de execução: pilha.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 2),
    'Analisando um teste unitário, você encontra esta sequência de operações em uma pilha. Qual valor está no TOPO ao final?',
    'const pilha = [];
pilha.push(10);
pilha.push(20);
pilha.pop();
pilha.push(30);
pilha.push(40);
pilha.pop();', 'javascript', 'facil', 45, 10)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', '10', false,
   'O 10 está na BASE da pilha. Após as operações, a pilha é [10, 30] — o topo é 30.'),
  ('B', '20', false,
   'O 20 foi removido pelo primeiro pop(). Refaça o passo a passo: push 10, push 20, pop (sai 20), push 30, push 40, pop (sai 40).'),
  ('C', '30', true,
   'Correto! Sequência: [10] → [10,20] → pop remove 20 → [10,30] → [10,30,40] → pop remove 40. Estado final [10, 30], topo = 30.'),
  ('D', '40', false,
   'O 40 foi removido pelo segundo pop() — ele era o topo naquele momento (LIFO). Sobra [10, 30].')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 2),
    'O linter que sua equipe está construindo precisa validar se os parênteses, colchetes e chaves de um código estão balanceados, como em "function() { arr[0]; }". Qual é a estratégia clássica com pilha?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Contar o total de símbolos de abertura e fechamento: se as quantidades forem iguais, está balanceado.', false,
   'Contar não basta: ")(" tem um de cada e está errado, assim como "([)]" — a ORDEM importa, e é a pilha que a verifica.'),
  ('B', 'Empilhar cada símbolo de abertura; ao encontrar um fechamento, desempilhar e verificar se combina. No fim, a pilha deve estar vazia.', true,
   'Correto! O fechamento mais recente deve casar com a abertura mais recente — comportamento LIFO puro. Pilha vazia no final garante que nada ficou aberto.'),
  ('C', 'Usar duas filas: uma para aberturas e outra para fechamentos, comparando as frentes.', false,
   'Filas comparam os símbolos mais ANTIGOS primeiro, o que não detecta aninhamento incorreto como "([)]".'),
  ('D', 'Ordenar os símbolos e verificar se cada abertura tem um fechamento adjacente.', false,
   'Ordenar destrói a estrutura de aninhamento do código — a validação depende da posição original dos símbolos.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 2),
    'Em produção, esta função derruba o serviço com "RangeError: Maximum call stack size exceeded" quando n é grande. O que está acontecendo?',
    'function fatorial(n) {
  return n * fatorial(n - 1);
}
fatorial(100000);', 'javascript', 'dificil', 75, 25)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Cada chamada recursiva empilha um frame na call stack; sem caso base, os frames se acumulam até estourar o limite da pilha.', true,
   'Correto! Faltou o caso base (if n <= 1 return 1) — e mesmo com ele, 100.000 níveis de recursão podem estourar a call stack, que é uma pilha de tamanho limitado. Uma versão iterativa resolveria.'),
  ('B', 'O número ficou grande demais para o tipo Number do JavaScript.', false,
   'Overflow numérico em JS produz Infinity, não RangeError de call stack. O erro fala explicitamente da pilha de chamadas.'),
  ('C', 'O garbage collector removeu a função da memória durante a execução.', false,
   'O GC não remove funções em uso. O erro é o acúmulo de frames de chamada na call stack — uma pilha finita.'),
  ('D', 'Recursão em JavaScript é sempre proibida; qualquer função recursiva lança esse erro.', false,
   'Recursão é permitida e comum. O problema é a AUSÊNCIA de caso base (e a profundidade excessiva), que enche a pilha de chamadas.')
) as a(letra, texto, correta, explicacao);

-- ==================== FASE 3 — FILAS ====================

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 3),
    'O microserviço de e-mails da empresa processa envios na ordem em que foram solicitados: quem pediu primeiro, envia primeiro. Qual estrutura representa esse comportamento?',
    null, 'javascript', 'facil', 45, 10)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Pilha (LIFO): o último e-mail solicitado sai primeiro.', false,
   'LIFO faria o pedido mais RECENTE furar a fila — os primeiros solicitantes nunca seriam atendidos sob carga.'),
  ('B', 'Fila (FIFO): o primeiro e-mail a entrar é o primeiro a sair.', true,
   'Correto! First In, First Out: enqueue no fim, dequeue na frente. É exatamente a semântica de uma fila de processamento justa.'),
  ('C', 'Árvore binária: e-mails organizados por assunto.', false,
   'Organizar por assunto não preserva a ordem de chegada, que é o requisito do serviço.'),
  ('D', 'Conjunto (Set): garante que nenhum e-mail se repita.', false,
   'Set elimina duplicatas mas não mantém disciplina de atendimento por ordem de chegada — isso é papel da fila.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 3),
    'Você precisa guardar as últimas 100 leituras de um sensor IoT em memória, descartando sempre a mais antiga quando chega uma nova. Por que uma FILA CIRCULAR de tamanho fixo é a escolha ideal?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Porque ela reutiliza as posições do array com índices que "dão a volta" (módulo), inserindo e removendo em O(1) sem deslocar elementos nem realocar memória.', true,
   'Correto! Os ponteiros de início e fim avançam com aritmética modular (i % 100), sobrescrevendo a leitura mais antiga — custo constante e memória fixa, perfeito para buffers.'),
  ('B', 'Porque ela ordena as leituras da menor para a maior automaticamente.', false,
   'Fila circular não ordena valores — mantém ordem de chegada. A vantagem é o reaproveitamento das posições com custo O(1).'),
  ('C', 'Porque ela cresce indefinidamente conforme chegam leituras.', false,
   'É o oposto: o tamanho é FIXO. Crescer sem limite é justamente o que se quer evitar em um dispositivo com memória restrita.'),
  ('D', 'Porque remover da frente de um array comum já é O(1), e a fila circular apenas deixa o código mais legível.', false,
   'Remover da frente de um array comum é O(n) (desloca todo o resto). A fila circular existe para transformar isso em O(1).')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 3),
    'No sistema de um pronto-socorro, pacientes graves devem ser atendidos antes dos casos leves, mesmo que tenham chegado depois. Qual estrutura atende a esse requisito?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Fila simples (FIFO), pois a ordem de chegada é sempre o critério mais justo.', false,
   'FIFO ignoraria a gravidade — um infarto esperaria atrás de um dedo torcido. O requisito pede prioridade, não ordem de chegada.'),
  ('B', 'Pilha, para atender por último quem chegou primeiro.', false,
   'LIFO puniria quem chegou cedo e continua ignorando a gravidade do caso.'),
  ('C', 'Fila de prioridade (geralmente implementada com heap): o elemento de maior prioridade sai primeiro, independentemente da ordem de chegada.', true,
   'Correto! A fila de prioridade desacopla "ordem de saída" de "ordem de chegada". Com um heap binário, inserção e remoção do mais prioritário custam O(log n).'),
  ('D', 'Lista ligada percorrida do início ao fim a cada atendimento, sem critério definido.', false,
   'Sem critério de prioridade, percorrer a lista não resolve o problema clínico — e buscar o mais grave a cada vez custaria O(n), pior que o heap.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 3),
    'Em uma entrevista técnica, pedem para você implementar uma FILA usando duas PILHAS (entrada e saída), como no código abaixo. Qual é a complexidade AMORTIZADA do dequeue?',
    'class Fila {
  entrada = []; saida = [];
  enqueue(x) { this.entrada.push(x); }
  dequeue() {
    if (this.saida.length === 0) {
      while (this.entrada.length > 0) {
        this.saida.push(this.entrada.pop());
      }
    }
    return this.saida.pop();
  }
}', 'javascript', 'dificil', 90, 25)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'O(n) sempre, pois cada dequeue transfere todos os elementos entre as pilhas.', false,
   'A transferência só acontece quando a pilha de saída está VAZIA. Nas demais chamadas, dequeue é um pop simples O(1).'),
  ('B', 'O(1) amortizado: cada elemento é movido no máximo uma vez da entrada para a saída, então o custo total se dilui entre as operações.', true,
   'Correto! Cada elemento faz no máximo 2 pushes e 2 pops em toda a sua vida na estrutura. Distribuindo o custo da transferência ocasional entre todas as operações, a média é constante.'),
  ('C', 'O(n²), porque as duas pilhas são percorridas a cada operação.', false,
   'Nenhuma operação percorre as duas pilhas inteiras repetidamente — a transferência move cada elemento uma única vez.'),
  ('D', 'O(log n), porque as pilhas dividem os elementos pela metade.', false,
   'Não há divisão pela metade aqui — isso é característico de árvores e busca binária, não desta técnica.')
) as a(letra, texto, correta, explicacao);

-- ==================== FASE 4 — ÁRVORES ====================

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 4),
    'Você vai indexar os produtos de um catálogo em uma Árvore Binária de Busca (BST) pelo preço. Qual propriedade TODA BST deve manter para que a busca funcione?',
    null, 'javascript', 'facil', 45, 10)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Para cada nó, todos os valores da subárvore esquerda são menores e todos os da direita são maiores que o valor do nó.', true,
   'Correto! Essa invariante vale recursivamente para TODOS os nós, e é o que permite descartar metade da árvore a cada comparação na busca.'),
  ('B', 'Todos os nós devem ter exatamente dois filhos.', false,
   'Isso descreve uma árvore binária CHEIA, que não é requisito de BST — nós com 0 ou 1 filho são perfeitamente válidos.'),
  ('C', 'Os valores devem ser inseridos em ordem crescente.', false,
   'A BST aceita inserção em qualquer ordem (aliás, inserir em ordem crescente a degenera em lista!). A propriedade é sobre a POSIÇÃO relativa dos valores.'),
  ('D', 'A árvore deve ter altura máxima de 10 níveis.', false,
   'Não existe limite fixo de altura na definição de BST. Altura controlada é assunto de árvores BALANCEADAS (AVL, Red-Black).')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 4),
    'O relatório financeiro precisa listar as transações em ordem crescente de valor, e elas já estão indexadas em uma BST. Qual percurso entrega os valores já ordenados, sem ordenação extra?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Pré-ordem (raiz, esquerda, direita).', false,
   'Pré-ordem visita a raiz antes dos menores da esquerda — a saída não fica ordenada. É útil para copiar/serializar a árvore.'),
  ('B', 'Em ordem / in-ordem (esquerda, raiz, direita).', true,
   'Correto! Pela propriedade da BST, visitar esquerda → raiz → direita entrega exatamente a sequência crescente, em O(n), sem sort adicional.'),
  ('C', 'Pós-ordem (esquerda, direita, raiz).', false,
   'Pós-ordem visita a raiz por último — bom para deletar a árvore com segurança, mas a saída não é ordenada.'),
  ('D', 'Percurso em largura (BFS), nível por nível.', false,
   'BFS lista por níveis de profundidade, misturando valores grandes e pequenos de níveis diferentes — não sai ordenado.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 4),
    'Ao revisar o módulo de indexação, você encontra esta função recursiva sobre uma árvore binária. O que ela calcula?',
    'function misterio(no) {
  if (no === null) return 0;
  return 1 + Math.max(
    misterio(no.esquerda),
    misterio(no.direita)
  );
}', 'javascript', 'media', 75, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'A quantidade total de nós da árvore.', false,
   'Para contar nós seria 1 + misterio(esq) + misterio(dir) — SOMA das duas subárvores, não o máximo entre elas.'),
  ('B', 'A soma dos valores armazenados nos nós.', false,
   'Nenhum no.valor é lido — a função só soma 1 por nível e escolhe o maior lado. Valores dos nós são irrelevantes aqui.'),
  ('C', 'A altura da árvore: o comprimento do caminho mais longo da raiz até uma folha.', true,
   'Correto! Cada nível soma 1 e o Math.max escolhe a subárvore mais profunda — a definição recursiva de altura. É a métrica que diz se a árvore está balanceada.'),
  ('D', 'O menor valor armazenado na árvore.', false,
   'Para achar o menor valor de uma BST basta descer sempre à esquerda. Esta função nem compara valores dos nós.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 4),
    'O autocomplete do seu buscador usa uma BST balanceada com 1 milhão de termos. Aproximadamente quantas comparações uma busca faz no pior caso, e por quê?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Cerca de 20, pois cada comparação descarta metade dos nós restantes: log2(1.000.000) ≈ 20.', true,
   'Correto! Em uma árvore balanceada a altura é O(log n). Como 2^20 ≈ 1 milhão, bastam ~20 comparações — é isso que torna a BST balanceada tão poderosa.'),
  ('B', 'Cerca de 500.000, pois em média percorre-se metade da árvore.', false,
   'Percorrer metade dos elementos é comportamento de busca LINEAR (lista/array desordenado), não de uma árvore balanceada.'),
  ('C', 'Exatamente 1.000.000, pois toda busca visita todos os nós.', false,
   'Visitar todos os nós é um percurso completo (O(n)), não uma busca. A propriedade da BST permite descartar subárvores inteiras.'),
  ('D', 'Cerca de 1.000, pois a busca custa raiz quadrada de n.', false,
   'Raiz quadrada não aparece na análise de BST. A altura de uma árvore balanceada cresce com log2(n), que para 1 milhão é ~20.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 4),
    'Um colega importou 100 mil registros JÁ ORDENADOS por ID em uma BST simples, e as buscas ficaram tão lentas quanto uma lista. O que aconteceu e como resolver?',
    null, 'javascript', 'dificil', 90, 25)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'A árvore degenerou: inserções em ordem crescente criam só filhos à direita, virando uma "lista" de altura n com busca O(n). Usar uma árvore auto-balanceada (AVL/Red-Black) resolve.', true,
   'Correto! Cada novo ID maior vira filho direito do anterior — a árvore vira um espeto. Árvores auto-balanceadas fazem rotações na inserção e garantem altura O(log n) mesmo com entrada ordenada.'),
  ('B', 'A BST não aceita dados ordenados; a importação deveria ter falhado com erro.', false,
   'A BST aceita qualquer ordem de inserção sem erro — o problema é silencioso: a FORMA da árvore degenera e o desempenho despenca.'),
  ('C', 'IDs numéricos não podem ser indexados em árvore; o certo seria usar strings.', false,
   'O tipo do dado é irrelevante — qualquer chave comparável funciona. O problema é a ordem de inserção degenerar a estrutura.'),
  ('D', 'Faltou memória RAM, o que força a árvore a operar em modo linear.', false,
   'Não existe "modo linear por falta de RAM". A lentidão vem da altura O(n) da árvore degenerada — um problema estrutural, não de hardware.')
) as a(letra, texto, correta, explicacao);

-- ============= FASE 5 — ALGORITMOS DE ORDENAÇÃO =============

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 5),
    'Durante a aula de revisão, você precisa explicar o Bubble Sort. Como ele funciona e qual sua complexidade no pior caso?',
    null, 'javascript', 'facil', 45, 10)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Compara pares adjacentes e os troca se estiverem fora de ordem, repetindo passadas até não haver trocas — O(n²) no pior caso.', true,
   'Correto! A cada passada o maior elemento "borbulha" para o fim. São até n passadas de até n comparações: O(n²). Simples de entender, ruim para volumes grandes.'),
  ('B', 'Divide o array ao meio recursivamente e intercala as metades ordenadas — O(n log n).', false,
   'Dividir e intercalar é o MERGE SORT. O Bubble Sort trabalha com trocas de vizinhos, sem dividir nada.'),
  ('C', 'Escolhe um pivô e particiona os menores à esquerda e maiores à direita — O(n log n) médio.', false,
   'Pivô e particionamento são o coração do QUICK SORT, não do Bubble Sort.'),
  ('D', 'Insere cada elemento na posição correta da parte já ordenada — O(n) sempre.', false,
   'Inserir na parte já ordenada descreve o INSERTION SORT — e mesmo ele é O(n²) no pior caso, não O(n) sempre.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 5),
    'O relatório noturno ordena 50 milhões de registros e NÃO pode estourar o SLA nem no pior caso. Registros com valores iguais devem manter a ordem original (estabilidade). Qual algoritmo escolher?',
    null, 'javascript', 'media', 60, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Quick Sort, que é sempre o mais rápido em qualquer cenário.', false,
   'O Quick Sort clássico tem pior caso O(n²) e não é estável — dois pontos que violam exatamente os dois requisitos do enunciado.'),
  ('B', 'Bubble Sort, por ser o mais simples de implementar.', false,
   'Simplicidade não compensa O(n²) sobre 50 milhões de registros — seriam ~2,5 quatrilhões de comparações no pior caso.'),
  ('C', 'Merge Sort: garante O(n log n) mesmo no pior caso e é estável, preservando a ordem relativa de valores iguais.', true,
   'Correto! O Merge Sort é o único da lista que combina garantia de O(n log n) no PIOR caso com estabilidade — ao custo de O(n) de memória extra para a intercalação.'),
  ('D', 'Selection Sort, pois faz o menor número possível de comparações.', false,
   'O Selection Sort faz O(n²) comparações SEMPRE, até em arrays já ordenados — e também não é estável na versão comum.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 5),
    'O endpoint de ordenação usa Quick Sort escolhendo sempre o PRIMEIRO elemento como pivô. Em produção, ficou lentíssimo justamente quando recebe listas JÁ ORDENADAS. Por quê?',
    null, 'javascript', 'media', 75, 15)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Com a lista ordenada, o primeiro elemento é sempre o menor: cada partição separa 0 elementos de um lado e n-1 do outro, degradando para O(n²).', true,
   'Correto! O pivô ruim gera partições totalmente desbalanceadas — a recursão vira uma escada de profundidade n. Pivô aleatório ou mediana-de-três evitam esse pior caso.'),
  ('B', 'Listas ordenadas não podem ser processadas pelo Quick Sort, que exige entrada embaralhada.', false,
   'O Quick Sort processa qualquer entrada — o problema não é "poder", é o CUSTO: com esse pivô, entrada ordenada é exatamente o pior caso.'),
  ('C', 'A comparação de elementos iguais trava o algoritmo em loop infinito.', false,
   'Não há loop infinito: o algoritmo termina, apenas com O(n²) comparações em vez de O(n log n). A causa é o particionamento desbalanceado.'),
  ('D', 'O Quick Sort sempre foi O(n²); a lentidão é esperada em qualquer entrada.', false,
   'No caso MÉDIO o Quick Sort é O(n log n) — por isso é tão usado. O O(n²) só aparece com particionamentos consistentemente ruins, como aqui.')
) as a(letra, texto, correta, explicacao);

with q as (
  insert into questoes (fase_id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values ((select id from fases where ordem = 5),
    'Um serviço recebe a cada minuto um lote de eventos QUASE ordenado por timestamp (só alguns fora do lugar, por atraso de rede). A equipe cogita Insertion Sort em vez de Merge Sort para esses lotes. A decisão faz sentido?',
    null, 'javascript', 'dificil', 90, 25)
  returning id
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select q.id, a.letra, a.texto, a.correta, a.explicacao from q, (values
  ('A', 'Sim: em dados quase ordenados o Insertion Sort se aproxima de O(n), pois cada elemento fora do lugar desloca-se apenas algumas posições — mais rápido que o O(n log n) fixo do Merge Sort.', true,
   'Correto! O custo do Insertion Sort é O(n + inversões). Com poucas inversões, ele é quase linear, sem memória extra — por isso bibliotecas reais (como o Timsort do Python/Java) o usam para trechos pequenos ou quase ordenados.'),
  ('B', 'Não: o Insertion Sort é sempre O(n²), independentemente da entrada.', false,
   'O(n²) é o PIOR caso (entrada invertida). Em entrada quase ordenada, o laço interno quase não executa e o custo cai para perto de O(n).'),
  ('C', 'Não: o Merge Sort é sempre mais rápido porque O(n log n) é melhor que O(n).', false,
   'Cuidado: O(n) é MELHOR que O(n log n). E o Merge Sort não se adapta — custa O(n log n) e O(n) de memória extra mesmo se a entrada já estiver ordenada.'),
  ('D', 'Tanto faz: todos os algoritmos de ordenação têm o mesmo desempenho para menos de 1 milhão de itens.', false,
   'O desempenho difere bastante e a característica da ENTRADA importa: quase ordenada favorece fortemente algoritmos adaptativos como o Insertion Sort.')
) as a(letra, texto, correta, explicacao);
