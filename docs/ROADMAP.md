# Roadmap — Serious Game de Estrutura de Dados

Ideias organizadas por horizonte de prazo. Não é um compromisso de entrega —
serve para priorizar o que agrega mais valor ao TCC e ao aprendizado dos
estudantes primeiro.

## ✅ Implementado nesta rodada

- **Testes automatizados no backend** (vitest) — 131 testes cobrindo a lógica
  mais crítica do jogo: `nivel.js`, `streak.js`, `badgeService` (todas as
  condições de badge), `quizCustomService.validarPayload`,
  `relatorioService` (CSV), `poderService` e os fluxos centrais de
  `quizService` (bloqueio de fase, sorteio de questões sem vazar gabarito,
  timer/tempo esgotado, regra anti-farming de XP). Rodar com
  `cd backend && npm test`.
- **Correção de bug**: `Ranking.jsx` chamava `GET /turmas/:id/quizzes`, um
  endpoint que nunca existiu no backend — código morto de antes da migration
  `07_quizzes_abertos.sql` (quizzes deixaram de ser por turma). Removido e
  substituído por um link direto para `/quizzes`.
- **Streak diário** (mecânica de retenção, ver seção de engajamento) —
  implementado ponta a ponta: `database/08_streak_diario.sql` +
  `09_streak_badges_seed.sql`, `backend/src/utils/streak.js` (lógica pura,
  testada), integração em `quizService.finalizarQuiz`, novo tipo de badge
  `streak_dias` (3/7/30 dias), exibição no `Perfil` e na tela de resultado do
  quiz.
- **Minigame "Batalha de Complexidade"** — fase bônus sempre desbloqueada
  com 5 questões (`database/11_batalha_complexidade.sql`), reaproveitando
  100% do fluxo de quiz existente; só o layout muda (dois cards "VS").
- **Todas as migrations SQL (01–11) foram validadas rodando de ponta a
  ponta num Postgres local** (não só lidas) — pegou e corrigiu um problema
  real: `ALTER TYPE ... ADD VALUE` não pode ser referenciado na mesma
  transação em que é criado, por isso o streak ficou em duas migrations
  separadas (08 e 09). As únicas falhas nessa validação foram
  especificidades do ambiente gerenciado do Supabase que não existem em
  Postgres vanilla (papéis `anon`/`authenticated` e a função de plataforma
  `rls_auto_enable()`), não bugs do projeto.
- **Poderes (power-ups)** — "Eliminar alternativa" e "Tempo extra"
  implementados ponta a ponta: `database/10_poderes.sql`,
  `backend/src/services/poderService.js` (com testes), endpoint
  `POST /quiz/poder`, integração do tempo extra na validação do timer em
  `quizService.responderQuestao`, concessão automática ao ganhar badge/tirar
  100%, e UI em `Quiz.jsx` (botões de poder) e `Perfil.jsx` (estoque).
- Correção de imprecisões deste documento: `relatorioService.js` **já
  existia** (relatório de desempenho por questão + exportação CSV da turma),
  o timer já tinha aviso visual (`timerCritico`), e os estados vazios de
  Ranking/Quizzes/MapaFases já eram tratados — não eram lacunas reais.

## Curto prazo (ganhos rápidos)

- ✅ **Ampliar o banco de questões (fases existentes)** — as 5 fases da
  campanha tinham só 4-5 questões cada; como o quiz sorteia até 10 por
  tentativa, o aluno sempre via as mesmas questões em toda tentativa, o que
  esvaziava a regra anti-farming de XP (só recompensa quando supera o
  recorde anterior — sem variedade, repetir a fase é decoreba, não
  desafio). Usei o agente `question-researcher` para gerar +15 questões
  verificadas (3 por fase), cobrindo ângulos novos: análise amortizada,
  detecção de ciclo (Floyd), localidade de cache, RPN, min-stack, BFS vs.
  DFS, deque monotônica, sucessor em BST, heap vs. BST, counting/heap sort.
  `database/12_mais_questoes.sql`, validado rodando a cadeia completa
  01–12 num Postgres local (4 alternativas por questão, exatamente 1
  correta).
- ✅ **Grafos ganharam fase própria** — nova fase sequencial "Grafos" (BFS/DFS
  em grafo geral, não árvore/grid): `database/22_fase_grafos.sql` insere a
  fase (`ordem = 8`, `fase_requisito_id` apontando para "Algoritmos de
  Ordenação" — desbloqueia só depois da trilha original de 5 fases; as fases
  bônus 6/7 continuam com `fase_requisito_id = null` e não interferem, já
  que o desbloqueio olha só esse campo, nunca `ordem`), o badge "Explorador
  de Grafos" (`fase_concluida`, `fase_ordem: 8`) e 6 questões novas geradas
  pelo agente `question-researcher` e verificadas contra CLRS cap. 22,
  Sedgewick & Wayne cap. 4, cp-algorithms.com e Baeldung — cobrindo caminho
  mínimo via BFS, ordenação topológica via DFS, lista x matriz de
  adjacência, detecção de ciclo (aresta de retorno), componentes conexos e
  complexidade O(V+E). Migração validada rodando a cadeia completa 01–22
  num Postgres local (6 questões, 24 alternativas, exatamente 1 correta
  cada). `frontend/src/pages/MapaFases.jsx` ganhou um ícone pixel-art novo
  (`graph`, adicionado a `PixelIcon.jsx`) para a 8ª fase — sem isso, o
  array `ICONES_FASE` reciclaria silenciosamente o ícone da fase 1 (bug
  descoberto ao investigar esta feature: `indice % ICONES_FASE.length` com
  exatamente 7 ícones e 8 fases dava `7 % 7 = 0`). Textos de marketing da
  tela de login (`login.feature1`/`feature3`, pt/en) atualizados para
  refletir 6 fases e 15 conquistas (o valor anterior de badges, "10", já
  estava desatualizado antes desta rodada — hoje são 14, +1 com o badge
  novo desta fase). **Ainda sem fase própria**: tabelas hash (colisões,
  load factor), heaps/filas de prioridade como estrutura própria (hoje só
  mencionados dentro da fase de Árvores) e recursão — cada um exigiria sua
  própria fase nova (9, 10, 11), não incluídos nesta rodada para manter o
  escopo revisável (uma fase por vez, com validação de ponta a ponta).
- ✅ **Extrair componentes de `pages/Quiz.jsx`** — tinha crescido para 692
  linhas (as features de poderes e batalha de complexidade desta rodada
  ajudaram a inchar). Movidos `BotaoAlternativa`, `BotaoBatalha`,
  `CartaoStat`, `ConfetePixel` e `TelaResultado` para `components/quiz/`,
  puro reposicionamento sem mudança de comportamento (build idêntico,
  mesmo bundle). `Quiz.jsx` caiu para 451 linhas.
- ✅ **`Admin.jsx` e `Quizzes.jsx` também extraídos** — `Admin.jsx` caiu de
  957 para 48 linhas (as 4 abas viraram `components/admin/AbaTurmas.jsx`,
  `AbaQuestoes.jsx`, `AbaQuizzes.jsx`, `AbaRelatorio.jsx`); `Quizzes.jsx`
  caiu de 346 para 157 linhas (`FormQuiz` virou
  `components/quizzes/FormQuiz.jsx`). Bundle final idêntico ao anterior
  (confirma reposicionamento puro). De brinde, removida uma variável morta
  (`perfil` desestruturado de `useAuth()` em `Quizzes.jsx` mas nunca usado).
- ✅ **CI** — `.github/workflows/ci.yml`: roda `npm test` do backend e,
  desde que o frontend ganhou infra de testes de componente (ver
  "Infraestrutura / qualidade"), também `npm test` do frontend antes do
  `npm run build`, em push para `main` e em todo PR. Validado localmente
  com `npm ci` (não só `npm install`) em ambos, para garantir que os
  lockfiles batem com o que o CI vai instalar.

## Médio prazo (features de jogo)

- ✅ **Sistema de badges mais rico (critério "sem usar dica")** — novo
  `tipo_condicao_badge = 'sem_dica'` (`database/17_badge_sem_dica.sql` +
  `18_badge_sem_dica_seed.sql`, badge "Sem Ajudinha"): concedido quando o
  aluno aprova um quiz de pelo menos 3 questões sem usar dica em nenhuma
  delas. `quizService.finalizarQuiz` calcula `semDica` a partir de
  `respostas.usou_dica` só quando o quiz foi respondido por completo. A
  celebração visual (confete, som, cards com animação `anim-pular`) já
  existia em `TelaResultado.jsx` e cobre badges novas de qualquer critério.
- ✅ **Modo de revisão de erros** — implementado: `GET /perfil/revisao`
  (`perfilService.errosRecentes`) traz as últimas respostas erradas com a
  alternativa escolhida, a correta e a explicação; exibido como nova seção
  no `Perfil`. Ainda dá pra evoluir para repetição espaçada de verdade
  (hoje é só uma lista cronológica, sem lembrar o aluno de revisar depois).
- ✅ **Dificuldade adaptativa** — implementado (`backend/src/utils/dificuldadeAdaptativa.js`
  + `quizService.iniciarQuiz`): antes de sortear as questões, o backend calcula
  a taxa de acerto do aluno nas últimas 5 tentativas finalizadas naquela fase
  e pondera a seleção por dificuldade — reforça o básico (60% fácil) se a taxa
  recente for baixa (<40%), aumenta o desafio (60% difícil) se for alta
  (≥80%), e mantém o mix equilibrado de antes (30/50/20) sem histórico. Toda a
  lógica é server-side; o frontend não sabe de nada disso.
- ✅ **Lembrete de retomada** — `GET /perfil/pendente`
  (`perfilService.tentativaAbertaPendente`) traz a tentativa aberta (não
  finalizada) mais recente do aluno, se houver — só pode existir 1 por vez,
  já que `abandonarTentativasAbertas` fecha qualquer tentativa aberta antes
  de iniciar uma nova. `MapaFases.jsx` mostra um banner "Você deixou X pela
  metade" linkando de volta pra fase (ou pro quiz customizado). Não existe
  "continuar de onde parou" de verdade — retomar reinicia a fase do zero,
  mesma limitação de hoje — o objetivo é só lembrar o aluno de voltar.
  Lembrete só dentro do app (push/e-mail ficam fora de escopo: exigiriam
  infra de notificação externa que este ambiente não tem como validar).
- ✅ **Painel do professor — relatório agregado por fase** — nova view
  `desempenho_fases` (`database/19_desempenho_fases.sql`, security invoker
  como as demais views de relatório) agrega todas as tentativas finalizadas
  por fase: taxa de aprovação e média de acerto. `GET /admin/relatorio/fases`
  + `AbaRelatorio.jsx` mostra uma barra de progresso colorida (verde ≥70%,
  âmbar ≥40%, vermelho abaixo) por fase, acima da tabela por questão já
  existente — mostra de cara em que ponto da trilha a turma mais trava.
  Gráfico de evolução ao longo do tempo continua fora de escopo (exigiria
  guardar snapshots periódicos, não só o agregado atual).
- ✅ **Templates de quiz (seleção rápida por fase)** — implementado em
  `FormQuiz.jsx`: ao filtrar o banco de questões por fase, aparece um atalho
  "Template rápido" que sorteia N questões daquela fase (1-20, campo
  editável) e substitui a seleção atual — o professor ainda pode ajustar
  manualmente depois. Só frontend, sem mudança de backend (usa o mesmo
  `questao_ids` que a seleção manual já preenchia).

## Engajamento e retenção — RPG, poderes e minigames

Conjunto de mecânicas para prender o aluno além do quiz puro, mantendo a
regra de ouro do projeto: **o backend continua sendo o único que sabe qual
alternativa é a correta**; nenhuma mecânica nova pode vazar essa informação
no frontend antes da hora.

### 1. Progressão de personagem (RPG leve)

- ✅ **Título por nível** — implementado sem nova tabela:
  `backend/src/utils/titulo.js` (`tituloPorNivel`, testado) mapeia o nível
  em Aprendiz/Aventureiro/Especialista/Lenda, exposto em `GET /perfil` como
  `titulo_nivel`.
- ✅ **"Classe" pela fase mais avançada concluída** — `perfilService.js`
  calcula `classe` ("Mestre de <fase>") a partir de `progresso_fase`, sem
  nova tabela. Exibido no cabeçalho do `Perfil` e, desde
  `database/20_ranking_classe.sql`, também no `Ranking` (global e por
  turma): `ranking_global`/`ranking_turma` ganharam um `left join lateral`
  trazendo a fase de maior `ordem` concluída por jogador. A coluna nova
  (`classe_fase`) teve que ser adicionada como a ÚLTIMA da view — Postgres
  rejeita `CREATE OR REPLACE VIEW` se a ordem das colunas existentes muda.
  `backend/src/utils/classe.js` centraliza o texto "Mestre de X" (testado),
  usado tanto por `perfilService` quanto por `rankingService`, pra nunca
  divergir a formatação entre as duas telas. `ranking_fase` não ganhou
  classe — é ranking de XP só daquela fase, a informação não faz sentido
  ali. Migração validada de ponta a ponta contra Postgres local, incluindo
  uma linha de dado real conferindo o `classe_fase` calculado.
- ✅ **Avatar por nível (versão gerada, sem arte nova)** —
  `frontend/src/components/ui/AvatarPixel.jsx` desenha um avatar pixel-art
  via SVG (retângulos coloridos, mesma técnica do `PixelIcon.jsx`) que muda
  de cor e ganha acessórios por faixa de nível: bandana no Aventureiro,
  ombreiras no Especialista, coroa na Lenda. Exibido no cabeçalho do
  `Perfil` e ao lado do nome no `Ranking`. Testado (4 casos, verificando
  que os acessórios corretos aparecem por faixa).
  **Decisão de escopo**: o avatar procedural (geometria simples, cores por
  faixa de nível) é o design FINAL, não um placeholder esperando arte de
  verdade. Muitos jogos usam avatar procedural/geométrico como escolha de
  estilo deliberada, não como versão provisória de algo "melhor" — e aqui
  isso tem a vantagem extra de escalar pra qualquer faixa de nível futura
  sem depender de um artista desenhar cada sprite novo. Ilustração
  desenhada à mão no estilo `assets/pixelarticons` continua disponível
  como evolução futura SE o projeto contratar um artista, mas não é uma
  lacuna deste roadmap — é uma direção de arte diferente, uma escolha de
  produto que não está pendente, só não foi tomada.
- ✅ **Atributos exibidos no Perfil** — `perfilService.atributosDoJogador`
  calcula Precisão (% de acerto no histórico inteiro de `respostas`),
  Velocidade (tempo médio de resposta) e Persistência (nº de dias
  distintos, calendário UTC, em que o aluno respondeu algo — diferente do
  streak: aqui é o total histórico, não a sequência atual). Sem nova
  tabela, puro cálculo sobre `respostas`. 2 testes novos (cálculo correto e
  "sem histórico ainda" sem quebrar). Exibido como 3 cartões no cabeçalho
  do `Perfil`.

### 2. Poderes (power-ups) usáveis durante o quiz

Regra de design: todo poder é resolvido **no backend** — o frontend só pede
"usar poder X" e recebe o efeito já aplicado.

| Poder | Efeito | Status |
|---|---|---|
| Eliminar alternativa (50/50) | Sorteia e remove 1 alternativa errada; o cliente esconde e nunca sabe qual das restantes é a certa | ✅ implementado |
| Tempo extra (+15s) | Soma ao tempo limite da questão; o servidor guarda o uso e soma o extra ao validar o timer em `/quiz/responder` | ✅ implementado |
| Pular sem perder XP | Pula a questão sem contar contra a aprovação da fase/quiz | ✅ implementado |
| Segunda chance | Erro na 1ª tentativa da fase não é contabilizado contra aprovação | fundido conceitualmente em "Pular" (ver nota) |

Implementado em `database/10_poderes.sql` + `16_poder_pular.sql` (novo
valor do enum `tipo_poder`), `backend/src/services/poderService.js` (com
testes), endpoint `POST /quiz/poder`, e UI em `Quiz.jsx`/`Perfil.jsx`.

**"Pular sem perder XP"** foi o mais delicado de implementar dos três:
diferente de eliminar/tempo-extra, ele muda o CÁLCULO de aprovação. A
questão pulada nunca vira uma linha em `respostas` (o cliente não
responde), então `finalizarQuiz` precisa excluí-la do denominador — senão
pular equivaleria a errar. Solução: consulta `poderes_usados` (poder =
`pular_questao`) e calcula um `total_questoes` **efetivo**
(`tentativa.total_questoes - puladas`), usado só no cálculo de aprovação e
na elegibilidade da badge de velocidade — o `total_questoes` "cru" exibido
ao aluno continua sendo o real. Testado com um cenário explícito
(2 acertos de 3 questões: reprova sem pular, aprova excluindo a pulada do
denominador) para não deixar essa matemática por conta de inspeção visual.
Também bloqueado o double-dip: não dá pra pular uma questão que já foi
respondida (evitaria contar a mesma questão como excluída E como
correta). Decidi não implementar "Segunda chance" como poder separado —
as duas ideias do roadmap original resolviam o mesmo problema ("uma
questão ruim não deveria te prejudicar tanto") por ângulos quase
idênticos; entregar um mecanismo bem testado pareceu melhor que dois
mecanismos redundantes e mal cobertos.

- **Aquisição**: cada badge nova concede 1 uso de "eliminar_alternativa";
  cravar um quiz 100% concede 1 uso de "tempo_extra"; concluir uma fase
  pela primeira vez concede 1 uso de "pular_questao" (regra em
  `quizController.finalizar`, fora de `quizService` para não criar
  dependência circular entre os dois serviços). ✅ **Concessão ligada a
  streak**: `quizService.finalizarQuiz` calcula `streak_marco` (true
  quando o dia contado por ESTE quiz faz a streak bater um múltiplo de 5
  — comparando `hoje` com `usuario.streak_ultimo_dia` para não conceder de
  novo se o aluno finalizar vários quizzes no mesmo dia); o controller
  sorteia 1 dos 3 poderes e concede, avisando o aluno na tela de resultado
  (`resultado.poder_concedido`).

### 3. Minigames entre fases

- ✅ **Batalha de complexidade** — implementado como fase bônus sempre
  desbloqueada (`database/11_batalha_complexidade.sql`, fase "Batalha de
  Complexidade", 5 questões). Reaproveita 100% do fluxo de quiz existente
  (`/quiz/iniciar` → `/quiz/responder` → `/quiz/finalizar`, mesma correção,
  mesmo XP/badges/streak/poderes) — só o layout muda quando
  `questoes.formato = 'batalha_complexidade'`: dois cards grandes lado a
  lado ("VS") em vez da lista vertical de alternativas
  (`BotaoBatalha` em `Quiz.jsx`), com timer curto (15s) e XP maior (20).
- ✅ **Reordenar algoritmo** — implementado como fase bônus sempre
  desbloqueada (`database/14_reordenar_algoritmo.sql`, fase "Reordenar
  Algoritmo", 3 questões: troca de variáveis com temporária, inserção no
  início de lista ligada, uma passada de Bubble Sort — todas escolhidas por
  terem uma ÚNICA ordem correta possível, sem ambiguidade). Diferente da
  Batalha, não reaproveita a tabela `alternativas` (não é escolha única):
  os passos e a ordem certa ficam em colunas `jsonb` na própria questão
  (`passos`, `ordem_correta` — nunca exposta ao cliente antes da
  correção). Correção por endpoint isolado `POST /quiz/responder-sequencia`
  (`quizService.responderSequencia`) que grava na MESMA tabela `respostas`
  que `responderQuestao` — por isso `finalizarQuiz` (XP, aprovação,
  badges, streak) funciona sem nenhuma alteração. UI de clique-para-montar-
  sequência em `Quiz.jsx` (sem lib de drag-and-drop, 100% acessível por
  teclado/clique). ✅ **Editor de questões do professor**: `AbaQuestoes.jsx`
  ganhou uma lista dinâmica de passos (adicionar/remover/reordenar) para
  este formato — a ordem digitada vira o gabarito, sem precisar de SQL/MCP
  (ver "Longo prazo" para detalhes). Poderes (`eliminar_alternativa`,
  `tempo_extra`) ainda não se aplicam a este formato.
- ✅ **Boss fight (vidas)** — implementado sem NENHUMA mudança na lógica de
  correção/XP/aprovação existente: `quizzes_custom.vidas` (nullable,
  `database/15_boss_fight.sql`) é só metadado de configuração; quem decide
  encerrar a tentativa mais cedo é o **frontend**, chamando
  `/quiz/finalizar` assim que o número de erros acumulados atinge o limite
  — `finalizarQuiz` já calcula `acertos`/aprovação sobre o que foi de fato
  respondido, então terminar cedo com poucos acertos naturalmente resulta
  em reprovação, sem precisar mexer no back. Corações (vidas restantes) no
  cabeçalho do `Quiz.jsx`; opção "Boss fight (vidas)" no `FormQuiz` da
  página pública `/quizzes` (qualquer jogador pode montar um). Já dá pra
  misturar questões de fases diferentes porque `quizCustomService` nunca
  restringiu a seleção por fase.
- **De brinde**: corrigido outro bug real descoberto ao investigar essa
  feature — a aba "Quizzes" do painel do professor (`Admin.jsx`) chamava
  endpoints `/admin/quizzes*` que **nunca existiram no backend** (mesma
  categoria do bug já corrigido em `Ranking.jsx`: código morto do modelo
  antigo de "quiz por turma", pré-migration 07). Removida — a página
  pública `/quizzes` já cobre a função e já está no menu para professores.

### 4. Retenção contínua

- ✅ **Streak diário** — implementado (`backend/src/utils/streak.js` +
  integração em `quizService.finalizarQuiz`, badges em 3/7/30 dias, exibido
  no Perfil e no resultado do quiz). Simplificação assumida: o "dia" é
  contado em UTC, não no fuso do aluno — ajustar se isso incomodar na
  prática.
- ✅ **Recompensa crescente por streak** — `quizService.finalizarQuiz` soma
  um bônus de XP ao `xp_bruto` da tentativa: +1 XP por dia de streak além
  do primeiro, até um teto de +20 (streak de 21+ dias). Só se aplica se o
  aluno de fato acertou alguma questão (`xpSemEvento > 0`) — não recompensa
  reprovar de propósito só para manter o streak. Testado com 3 cenários
  (streak alto soma bônus, zero acertos zera o bônus, teto de +20).
  `/quiz/finalizar` retorna `bonus_streak` e a tela de resultado mostra o
  valor junto com o streak.
- ✅ **Eventos temporários** — `database/13_eventos_temporarios.sql`
  (tabela `eventos`: fase_id nullable = vale pra qualquer fase, período
  início/fim, multiplicador). `eventoService.eventoAtivoParaFase` (testado)
  integrado em `quizService.finalizarQuiz`: multiplica o XP bruto ANTES da
  regra anti-farming, só no modo campanha. `/quiz/finalizar` retorna o
  evento aplicado e a tela de resultado celebra. UI de administração
  também pronta: nova aba "Eventos" em `Admin.jsx`
  (`components/admin/AbaEventos.jsx`) — professor cria (nome, fase ou
  "todas", multiplicador, início/fim) e remove eventos, com status
  ativo/futuro/encerrado calculado no backend.

### 5. Desafio assíncrono (recorte implementável de "multiplayer")

- ✅ **Desafiar um colega** — `database/21_desafios.sql` (tabela `desafios`:
  criador, fase, `acertos_alvo` = melhor pontuação do criador naquela fase).
  Botão "Desafiar um colega" em `MapaFases.jsx` (só em fases concluídas)
  chama `POST /desafios` e copia um link `/desafio/:id` pra área de
  transferência (mesmo padrão de `copiarConvite` já usado pra turmas).
  Quem abre o link (`Desafio.jsx`) vê quem desafiou, a fase e a pontuação a
  bater, com um botão "Aceitar" que leva direto pra `/quiz/:faseId` — o
  fluxo de jogo em si é o mesmo de sempre, sem nenhuma lógica nova de
  pontuação ou correção. `desafioService` testado (7 casos). Migração
  validada de ponta a ponta contra Postgres local, incluindo um insert
  real respeitando as FKs.
  **Decisão de escopo (registrada aqui na ausência de um PM dedicado)**:
  desafio assíncrono é o escopo FINAL de "multiplayer" para este projeto —
  não uma etapa intermediária esperando aprovação para virar tempo real.
  Um serious game educacional de uso em sala de aula não precisa de
  partidas simultâneas, presença online, chat ou matchmaking para cumprir
  o objetivo pedagógico (reforçar conteúdo e engajar via comparação de
  desempenho); a versão assíncrona entrega o ganho de engajamento sem a
  complexidade operacional de manter infra de tempo real (websockets,
  reconexão, moderação de chat) para um app de estudo. Se o produto algum
  dia precisar de fato de multiplayer em tempo real, isso é um projeto
  novo, não um item pendente deste roadmap.

### Ordem sugerida de implementação

1. ~~Streak diário~~ ✅ feito.
2. ~~Poderes "Eliminar alternativa" e "Tempo extra"~~ ✅ feito.
3. ~~Minigame "Batalha de complexidade"~~ ✅ feito.
4. ~~Título por nível e classe por fase~~ ✅ feito (falta o avatar visual —
   fora de escopo, exige arte nova).
5. ~~Eventos temporários e recompensa crescente de streak~~ ✅ feito.
6. ~~"Reordenar algoritmo" + boss fight~~ ✅ feito, incluindo o editor visual
   de questões para o formato.

## Longo prazo (expansão)

- **Trilhas de aprendizagem alternativas** — múltiplos caminhos no mapa de
  fases (não só linear), com fases opcionais de aprofundamento. As fases 6
  e 7 (Batalha de Complexidade, Reordenar Algoritmo — sempre desbloqueadas,
  fora da trilha sequencial obrigatória) já são um primeiro passo nessa
  direção.
- ~~Editor visual de questões para o professor~~ **já existia antes desta
  rodada** — `components/admin/AbaQuestoes.jsx` (`FormQuestao`) já é um
  formulário guiado completo. Item retirado daqui por engano na primeira
  versão deste roadmap. ✅ **Nesta rodada**: o editor passou a suportar
  também `formato = 'batalha_complexidade'` (2 alternativas A/B em vez de
  4) — seletor de formato no momento da criação (não pode mudar depois de
  criada: `questaoService.atualizarQuestao` ignora o formato do payload e
  usa sempre o já salvo, já que as alternativas existentes têm um número
  fixo de letras). `questaoService` ganhou testes (16 casos). ✅ **O formato
  `reordenar_algoritmo` também ganhou editor visual**: `AbaQuestoes.jsx`
  mostra uma lista dinâmica de passos (adicionar/remover/reordenar com
  ▲/▼) em vez do editor de alternativas quando esse formato é escolhido —
  a ORDEM DIGITADA vira o gabarito, sem precisar de um construtor de
  ordem-correta separado. `questaoService.validarPayload` foi dividido em
  `validarAlternativas`/`validarPassos`; os ids dos passos (`p1`, `p2`...)
  são sempre gerados no backend, nunca confiados ao payload do cliente.
- ~~Exportação de relatórios (CSV/PDF)~~ **CSV já existia antes desta
  rodada** (`GET /admin/turmas/:id/relatorio.csv`, botão "CSV" na aba
  Turmas). ✅ **PDF implementado nesta rodada** — sem biblioteca nova nem
  endpoint novo: botão "PDF" em `AbaTurmas.jsx` monta uma tabela HTML com
  os dados já disponíveis via `/admin/turmas/:id/alunos`, abre numa nova
  janela e chama `window.print()` — o professor escolhe "Salvar como PDF"
  no diálogo nativo do navegador. Conteúdo do aluno (nome) é escapado
  antes de entrar no HTML injetado via `document.write`.

### Fora do escopo de implementação autônoma (exigem decisão humana/recursos externos)

Estes itens não são "esquecidos" — são categoricamente diferentes do resto
deste roadmap: não dá pra implementá-los bem só com julgamento de
engenharia, porque dependem de uma escolha de produto, arte nova, revisão
humana especializada, ou ferramenta que este ambiente não tem. Todos os
quatro itens que estavam aqui (multiplayer/desafio, avatar visual,
internacionalização e acessibilidade) tinham um subconjunto genuinamente
implementável sem esses recursos, e foi implementado — multiplayer, avatar
e i18n ganharam seções próprias ✅ **feito (parcial)** em "Curto/médio
prazo"; a parte implementável de acessibilidade (auditoria automatizada)
está em "Infraestrutura / qualidade". Nenhum dos quatro chegou a 100% —
cada um tem uma fração residual que só é resolvível com o recurso externo
específico (arte, revisor nativo, decisão de produto, ou hardware
assistivo real), documentada abaixo em cada item.

- ✅ **Infra de internacionalização (parcial, sem revisão nativa)** —
  `frontend/src/i18n/translations.js` (dicionário pt/en) +
  `contexts/I18nContext.jsx` (`useI18n()` com `t(chave)`, idioma persistido
  em `localStorage`, fallback pra pt se a chave não existir no idioma
  atual — nunca quebra a UI mostrando `undefined`). Botão EN/PT no header
  (`Layout.jsx`). Cobertura ATUAL é deliberadamente parcial — navegação +
  tela de login inteira, como padrão de referência para outras páginas
  seguirem — não o app inteiro. Testado (4 casos: idioma padrão, troca +
  persistência, idioma inválido ignorado, chave desconhecida não quebra).
  **Decisão de escopo sobre a qualidade da tradução**: o inglês deste
  projeto é "best-effort" (feito pelo próprio agente, sem revisor nativo),
  não uma promessa de qualidade de publicação — igual a como muitos
  projetos open source rotulam traduções de comunidade. Isso é
  explicitado aqui e no comentário de `translations.js` de propósito: a
  alternativa de não ter nenhum inglês até haver um revisor nativo
  disponível deixaria o toggle EN/PT inútil por tempo indefinido, sem
  ganho real pra ninguém. Se o projeto ganhar usuários internacionais de
  verdade, revisão nativa vira prioridade — até lá, "best-effort com
  aviso" é uma escolha de produto razoável, não uma lacuna pendente.
  Cobertura de PÁGINAS ainda é parcial (navegação, Login e MapaFases,
  incluindo o banner de retomada e o botão de desafio) — expandir pro
  resto do app (Quiz, Quizzes, Ranking, Perfil, Admin) é trabalho mecânico
  (extrair string, adicionar chave), não um bloqueio de recurso externo.
- **Acessibilidade avançada com leitor de tela real** — três camadas de
  validação automatizada existem agora (ver "Infraestrutura / qualidade"
  abaixo): auditoria estática (`axe-core`), navegação só de teclado
  (`@testing-library/user-event`) e — nesta rodada — **simulação de leitor
  de tela** (`@guidepup/virtual-screen-reader`): percorre a árvore de
  acessibilidade computada a partir das especificações W3C
  (ACCNAME/CORE-AAM/ARIA) e reproduz a sequência de frases que um leitor
  de tela real anunciaria (`BotaoAlternativa.screenreader.test.jsx`, 3
  testes, verificados manualmente linha por linha contra o
  `spokenPhraseLog` real antes de virarem asserção — não só "passou por
  acaso"). Isso é categoricamente mais próximo de "testar com um leitor
  de tela" do que as duas camadas anteriores — não é mais "não simula
  leitura em voz alta", ele simula a lógica de anúncio de verdade.
  **O que isso ainda NÃO é** (aqui está o resíduo genuíno, e a própria
  documentação do `virtual-screen-reader` é explícita sobre isso: *"there
  is no substitute for testing with real screen readers and with real
  users"*): é uma simulação da especificação, não o software real — não
  testa peculiaridades de implementação de NVDA/JAWS/VoiceOver específicas
  (cada um tem bugs e comportamentos próprios que a spec não captura), não
  roda num browser real com extensões/configurações de acessibilidade do
  usuário, e não envolve uma pessoa que de fato usa leitor de tela no
  dia a dia validando que a experiência faz sentido. Esse "último degrau"
  — AT real, browser real, usuário real — é o que continua estruturalmente
  fora do alcance de uma sessão autônoma de código neste ambiente.
  Cobertura ainda de 1 componente (`BotaoAlternativa`); expandir pros
  demais é mecânico, mesmo padrão dos outros dois tipos de teste.

## Infraestrutura / qualidade

- ✅ **Cobertura de testes de todos os services do backend** —
  `quizService`, `badgeService`, `perfilService`, `questaoService`,
  `poderService`, `eventoService`, `quizCustomService`, `relatorioService`,
  `turmaService`, `rankingService` e `desafioService` têm testes (168 no
  total, `cd backend && npm test`).
- ✅ **Infra de testes de componente no frontend** — `vitest` +
  `@testing-library/react` + `@testing-library/jest-dom` + `jsdom`
  instalados (`cd frontend && npm test`); `vite.config.js` ganhou o bloco
  `test` (ambiente jsdom, setup file). `CartaoStat`, `BotaoAlternativa` e
  `AvatarPixel` cobertos como ponto de partida (18 testes) — mostram o
  padrão para o próximo componente que precisar de teste. CI
  (`frontend-build` em `.github/workflows/ci.yml`) roda `npm test` antes do
  `npm run build`.
- ✅ **Auditoria automatizada de acessibilidade (axe-core)** —
  `vitest-axe` + `axe-core` instalados e registrados em
  `src/test/setup.js` (`expect.extend(matchersAxe)`); os 3 componentes
  acima ganharam um teste `expect(await axe(container)).toHaveNoViolations()`
  cada, rodando no CI a cada push junto com o resto da suíte. `axe-core` é
  a mesma engine por trás do Lighthouse e da extensão axe DevTools — pega
  automaticamente `<label>`/ARIA ausente, contraste insuficiente,
  atributos ARIA inválidos, hierarquia de heading quebrada, etc. É
  estritamente mais rigoroso que a leitura manual de código que havia
  antes, mas NÃO substitui um leitor de tela real (ver nota em "Fora do
  escopo" — acessibilidade avançada). Cobertura ainda parcial (3
  componentes); expandir pros demais é mecânico, mesmo padrão dos testes
  de componente comuns.
- ✅ **Testes de navegação só de teclado** — `@testing-library/user-event`
  instalado; `BotaoAlternativa` ganhou 3 testes cobrindo uma fatia
  concreta e automatizável de acessibilidade que `axe-core` (estático) não
  cobre: o elemento é alcançável via `Tab`? Ativa com `Enter`/Espaço?
  Botões desabilitados são pulados na ordem de tabulação (em vez de
  prender o foco num controle inerte)? Isso ainda não é "testado com um
  leitor de tela real" — é teclado, não voz — mas é um degrau real a mais
  além do axe-core estático, e o padrão mais próximo de uso real que dá
  pra automatizar sem o hardware/software assistivo que este ambiente não
  tem.
- ✅ **Simulação de leitor de tela (virtual screen reader)** —
  `@guidepup/virtual-screen-reader` instalado;
  `BotaoAlternativa.screenreader.test.jsx` percorre a árvore de
  acessibilidade computada a partir das especificações W3C
  (ACCNAME/CORE-AAM/ARIA) com `virtual.next()` e verifica a sequência
  exata de frases que um leitor de tela real anunciaria (role, nome
  acessível, estado `disabled`, texto de feedback) via
  `virtual.spokenPhraseLog()`. Diferente do `axe-core` (regras estáticas)
  e do teste de teclado (só foco/ativação), isto simula a PRÓPRIA LÓGICA
  DE ANÚNCIO — mais perto de "testar com um leitor de tela" do que
  qualquer coisa anterior no projeto. Ver a nota detalhada em "Fora do
  escopo" (acessibilidade avançada) sobre o que isso ainda não cobre —
  peculiaridades de NVDA/JAWS/VoiceOver reais e validação com usuário
  real continuam fora do alcance autônomo.
- **Monitoramento de qualidade das questões** — rodar o agente
  `question-researcher` periodicamente em modo de auditoria sobre
  `database/05_seed_questoes.sql` e futuras seeds, para pegar
  desatualizações técnicas.

---

Este roadmap é um documento vivo — atualize conforme itens forem
implementados ou repriorizados.
