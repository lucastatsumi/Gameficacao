# Roadmap — Serious Game de Estrutura de Dados

Ideias organizadas por horizonte de prazo. Não é um compromisso de entrega —
serve para priorizar o que agrega mais valor ao TCC e ao aprendizado dos
estudantes primeiro.

## ✅ Implementado nesta rodada

- **Testes automatizados no backend** (vitest) — 96 testes cobrindo a lógica
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
- **Cobrir tópicos ainda sem fase própria**: grafos (BFS/DFS em grafo geral,
  não só árvore/grid), tabelas hash (colisões, load factor), heaps/filas de
  prioridade como estrutura própria (hoje só aparecem mencionados dentro da
  fase de Árvores), recursão — exigiria uma fase nova (fase 7), não só mais
  questões nas fases atuais.
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
- ✅ **CI** — `.github/workflows/ci.yml`: roda `npm test` do backend e
  `npm run build` do frontend em push para `main` e em todo PR. Validado
  localmente com `npm ci` (não só `npm install`) em ambos, para garantir
  que os lockfiles batem com o que o CI vai instalar. O frontend ainda não
  tem suíte de testes própria; começar por lógica não-visual (ex.: uma
  eventual extração de helpers puros de `Quiz.jsx`) quando houver o
  suficiente para justificar.

## Médio prazo (features de jogo)

- **Sistema de badges mais rico** — `badgeService.js` já cobre XP acumulado,
  fase concluída, quiz perfeito, velocidade, sequência de acertos e (nesta
  rodada) streak diário; falta celebração visual mais elaborada ao
  desbloquear (hoje é um card estático na tela de resultado) e critérios
  novos como "sem usar dica".
- ✅ **Modo de revisão de erros** — implementado: `GET /perfil/revisao`
  (`perfilService.errosRecentes`) traz as últimas respostas erradas com a
  alternativa escolhida, a correta e a explicação; exibido como nova seção
  no `Perfil`. Ainda dá pra evoluir para repetição espaçada de verdade
  (hoje é só uma lista cronológica, sem lembrar o aluno de revisar depois).
- **Dificuldade adaptativa** — ajustar mix de questões fácil/média/difícil
  por fase com base no desempenho recente do aluno (mantendo lógica no
  backend).
- **Notificações/lembretes de retomada** — para alunos que abandonaram uma
  fase ou não acessam há X dias (o campo `abandonarTentativasAbertas` já
  existe em `quizService.js` como base).
- **Painel do professor — mais relatórios** — `relatorioService.js` já traz
  desempenho por questão e exportação CSV da turma; falta uma visão agregada
  por fase (não só por questão individual) e gráfico de evolução ao longo do
  tempo.
- **Quizzes customizados com mais opções** — `quizCustomService.js` e
  `06_quiz_custom_dicas.sql`/`07_quizzes_abertos.sql` já dão base para
  quizzes abertos com dicas; adicionar templates prontos por tópico para o
  professor montar quiz rápido.

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
  nova tabela. Exibido no cabeçalho do `Perfil`. Ainda não aparece no
  `Ranking` (a view de ranking não traz essa informação por jogador; exigiria
  join extra na view ou uma consulta por linha, ainda não feito).
- **Avatar por nível** (sprite pixel-art que muda visualmente): ainda não
  implementado — hoje só existe o texto do título, sem arte nova. Precisa de
  assets extras que não existem no projeto.
- **Atributos exibidos no Perfil** (derivados, não gameplay): Precisão (%
  acerto histórico), Velocidade (tempo médio de resposta), Persistência
  (sequência de dias ativos). Tudo calculável a partir de `tentativas` e
  `respostas`, sem nova tabela — próximo passo natural desta seção.

### 2. Poderes (power-ups) usáveis durante o quiz

Regra de design: todo poder é resolvido **no backend** — o frontend só pede
"usar poder X" e recebe o efeito já aplicado.

| Poder | Efeito | Status |
|---|---|---|
| Eliminar alternativa (50/50) | Sorteia e remove 1 alternativa errada; o cliente esconde e nunca sabe qual das restantes é a certa | ✅ implementado |
| Tempo extra (+15s) | Soma ao tempo limite da questão; o servidor guarda o uso e soma o extra ao validar o timer em `/quiz/responder` | ✅ implementado |
| Pular sem perder XP | Marca a questão como pulada sem contar erro, 1x por fase | não implementado |
| Segunda chance | Erro na 1ª tentativa da fase não é contabilizado contra aprovação | não implementado |

Implementado em `database/10_poderes.sql` (tabelas `usuario_poderes` e
`poderes_usados`), `backend/src/services/poderService.js` (com testes),
endpoint `POST /quiz/poder`, e UI em `Quiz.jsx`/`Perfil.jsx`.

- **Aquisição**: cada badge nova concede 1 uso de "eliminar_alternativa";
  cravar um quiz 100% concede 1 uso de "tempo_extra" (regra em
  `quizController.finalizar`, fora de `quizService` para não criar
  dependência circular entre os dois serviços). Ainda não há concessão
  ligada a streak — próximo passo natural.

### 3. Minigames entre fases

- ✅ **Batalha de complexidade** — implementado como fase bônus sempre
  desbloqueada (`database/11_batalha_complexidade.sql`, fase "Batalha de
  Complexidade", 5 questões). Reaproveita 100% do fluxo de quiz existente
  (`/quiz/iniciar` → `/quiz/responder` → `/quiz/finalizar`, mesma correção,
  mesmo XP/badges/streak/poderes) — só o layout muda quando
  `questoes.formato = 'batalha_complexidade'`: dois cards grandes lado a
  lado ("VS") em vez da lista vertical de alternativas
  (`BotaoBatalha` em `Quiz.jsx`), com timer curto (15s) e XP maior (20).
- **Reordenar algoritmo**: arrastar passos embaralhados de um algoritmo
  (ex.: bubble sort, busca binária) na ordem correta, contra o tempo —
  variação de UI que não depende de nova lógica de correção complexa (é uma
  sequência fixa correta por algoritmo, cadastrável como conteúdo estático).
- **Boss fight a cada N fases**: quiz relâmpago misturando questões de fases
  anteriores, com "vidas" (N erros = fim da tentativa) — reaproveita
  `quizCustomService.js` (já monta quizzes sob medida) para selecionar o
  pool de questões.

### 4. Retenção contínua

- ✅ **Streak diário** — implementado (`backend/src/utils/streak.js` +
  integração em `quizService.finalizarQuiz`, badges em 3/7/30 dias, exibido
  no Perfil e no resultado do quiz). Simplificação assumida: o "dia" é
  contado em UTC, não no fuso do aluno — ajustar se isso incomodar na
  prática.
- **Recompensa crescente por streak** (mais XP ou poderes a cada dia
  consecutivo) — ainda não implementado; hoje o streak só concede as badges
  de marco (3/7/30 dias), sem bônus contínuo de XP.
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

### Ordem sugerida de implementação

1. ~~Streak diário~~ ✅ feito.
2. ~~Poderes "Eliminar alternativa" e "Tempo extra"~~ ✅ feito.
3. ~~Minigame "Batalha de complexidade"~~ ✅ feito.
4. ~~Título por nível e classe por fase~~ ✅ feito (falta o avatar visual).
5. Eventos temporários e recompensa crescente de streak.
6. "Reordenar algoritmo" e boss fight (maior esforço de UI/conteúdo).

## Longo prazo (expansão)

- **Multiplayer/desafio entre colegas** — duelo síncrono ou assíncrono
  (melhor tempo/acertos) entre dois alunos na mesma fase.
- **Trilhas de aprendizagem alternativas** — múltiplos caminhos no mapa de
  fases (não só linear), com fases opcionais de aprofundamento. A "Batalha
  de Complexidade" (fase 6, sempre desbloqueada) já é um primeiro passo
  nessa direção — uma fase fora da trilha sequencial obrigatória.
- ~~Editor visual de questões para o professor~~ **já existia antes desta
  rodada** — `components/admin/AbaQuestoes.jsx` (`FormQuestao`) já é um
  formulário guiado completo. Item retirado daqui por engano na primeira
  versão deste roadmap. ✅ **Nesta rodada**: o editor passou a suportar
  também `formato = 'batalha_complexidade'` (2 alternativas A/B em vez de
  4) — seletor de formato no momento da criação (não pode mudar depois de
  criada: `questaoService.atualizarQuestao` ignora o formato do payload e
  usa sempre o já salvo, já que as alternativas existentes têm um número
  fixo de letras). `questaoService` ganhou testes (16 casos).
- ~~Exportação de relatórios (CSV/PDF)~~ **CSV já existia antes desta
  rodada** (`GET /admin/turmas/:id/relatorio.csv`, botão "CSV" na aba
  Turmas). Falta só a exportação em **PDF**.
- **Internacionalização** — se houver interesse em usar o jogo além do
  público de língua portuguesa.
- **Acessibilidade avançada** — suporte a leitor de tela completo no fluxo
  de quiz, modo alto contraste, navegação 100% por teclado.

## Infraestrutura / qualidade

- **Ampliar cobertura de testes** — `quizService`, `badgeService`,
  `perfilService`, `questaoService`, `poderService`, `eventoService` e
  `quizCustomService` já têm testes (96 no total). Falta `turmaService` e
  testes de componente no frontend (ex.: com `@testing-library/react`,
  ainda não instalado).
- **Monitoramento de qualidade das questões** — rodar o agente
  `question-researcher` periodicamente em modo de auditoria sobre
  `database/05_seed_questoes.sql` e futuras seeds, para pegar
  desatualizações técnicas.

---

Este roadmap é um documento vivo — atualize conforme itens forem
implementados ou repriorizados.
