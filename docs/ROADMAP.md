# Roadmap — Serious Game de Estrutura de Dados

Ideias organizadas por horizonte de prazo. Não é um compromisso de entrega —
serve para priorizar o que agrega mais valor ao TCC e ao aprendizado dos
estudantes primeiro.

## Curto prazo (ganhos rápidos)

- **Ampliar o banco de questões** — hoje há 22 questões em 5 fases. Usar o
  agente `question-researcher` para cobrir tópicos ainda ausentes: pilhas,
  filas, árvores (binária, AVL, B), grafos (BFS/DFS), tabelas hash,
  heaps/filas de prioridade, recursão.
- **Feedback de resposta mais didático no Quiz** — garantir tempo de leitura
  suficiente da `explicacao` antes de avançar para a próxima questão (usar o
  agente `ux-game-enhancer` para revisar o fluxo em `pages/Quiz.jsx`).
- **Aviso visual gradual do timer** — mudança de cor/animação da barra de
  tempo conforme se aproxima do limite, em vez de só o número regressivo.
- **Estados vazios tratados** — ranking sem participantes, turma sem alunos,
  fase sem questões ativas: mensagens específicas em vez de tela em branco.
- **Extrair componentes de `pages/Quiz.jsx`, `Admin.jsx`, `Quizzes.jsx`** —
  arquivos hoje com 500–950 linhas; mover blocos para
  `components/quiz/`, `components/mapa/`, `components/ranking/` (hoje vazios,
  só `.gitkeep`), melhorando manutenibilidade.

## Médio prazo (features de jogo)

- **Sistema de badges mais rico** — `badgeService.js` já calcula sequência de
  acertos; adicionar critérios novos (velocidade de resposta, fase concluída
  sem erro, streak diário de estudo) e exibir conquista com celebração visual
  (modal/animação ao desbloquear).
- **Modo de revisão de erros** — tela que lista questões que o aluno errou
  nas últimas tentativas, com a explicação, para reforço espaçado.
- **Dificuldade adaptativa** — ajustar mix de questões fácil/média/difícil
  por fase com base no desempenho recente do aluno (mantendo lógica no
  backend).
- **Notificações/lembretes de retomada** — para alunos que abandonaram uma
  fase ou não acessam há X dias (o campo `abandonarTentativasAbertas` já
  existe em `quizService.js` como base).
- **Painel do professor mais completo** — `relatorioService.js` está vazio
  hoje; construir relatórios de turma (desempenho por fase, questões com
  maior taxa de erro, tempo médio de resposta) para apoiar a docência.
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

- **Avatar por nível**: sprite pixel-art evolui a cada faixa de nível (usa o
  mesmo estilo visual de `assets/pixelarticons`). Reaproveita o cálculo de
  nível já existente em `backend/src/utils/nivel.js`.
- **"Classes" temáticas por fase**: ao concluir a fase de Listas, Pilhas/
  Filas, Árvores, Grafos etc., o aluno ganha um título temático (ex.:
  "Guardião das Listas") exibido no `Perfil` e no `Ranking`.
- **Atributos exibidos no Perfil** (derivados, não gameplay): Precisão (%
  acerto histórico), Velocidade (tempo médio de resposta), Persistência
  (sequência de dias ativos). Tudo calculável a partir de `tentativas` e
  `respostas`, sem nova tabela.
- Escopo de dados: tabela nova `personagem` (ou colunas em `profiles`) para
  título atual e cosmético de avatar equipado.

### 2. Poderes (power-ups) usáveis durante o quiz

Regra de design: todo poder é resolvido **no backend**, no mesmo endpoint
que hoje serve a questão/processa a resposta — o frontend só pede
"usar poder X" e recebe o efeito já aplicado.

| Poder | Efeito | Onde entra no backend |
|---|---|---|
| Eliminar alternativa (50/50) | Remove 1 alternativa errada da resposta da API antes de enviar ao cliente | `quizController`/`quizService`, no momento de montar a questão a exibir |
| Tempo extra (+15s) | Soma ao `tempo_limite_seg` daquela questão específica | mesmo ponto onde o timer é validado no submit |
| Pular sem perder XP | Marca a questão como pulada sem contar erro, 1x por fase | fluxo de `respostas`, novo tipo de resultado além de certo/errado/tempo-esgotado |
| Segunda chance | Erro na 1ª tentativa da fase não é contabilizado contra aprovação | lógica de `atualizarProgressoFase` em `quizService.js` |

- **Aquisição**: poderes ganhos como recompensa de badge/streak, com estoque
  limitado (ex.: "você tem 2 usos de 50/50 essa semana") — cria decisão
  estratégica em vez de trivializar o quiz.
- Nova tabela sugerida: `poderes` (catálogo) + `usuario_poderes` (estoque
  por aluno) + registro de uso em `respostas` (ex.: coluna
  `poder_usado_id` nullable).

### 3. Minigames entre fases

- **Reordenar algoritmo**: arrastar passos embaralhados de um algoritmo
  (ex.: bubble sort, busca binária) na ordem correta, contra o tempo —
  variação de UI que não depende de nova lógica de correção complexa (é uma
  sequência fixa correta por algoritmo, cadastrável como conteúdo estático).
- **Batalha de complexidade**: compara Big-O de dois trechos de código,
  aluno escolhe o mais eficiente, timer curto estilo arcade — reaproveita o
  modelo de "questão com alternativas", só muda o layout.
- **Boss fight a cada N fases**: quiz relâmpago misturando questões de fases
  anteriores, com "vidas" (N erros = fim da tentativa) — reaproveita
  `quizCustomService.js` (já monta quizzes sob medida) para selecionar o
  pool de questões.

### 4. Retenção contínua

- **Streak diário** com recompensa crescente (mais XP ou poderes a cada dia
  consecutivo) — precisa de um job/consulta diária sobre `tentativas` para
  calcular e não quebrar a sequência por fuso horário.
- **Eventos temporários** (ex.: "semana das árvores" com XP em dobro em
  questões daquela fase) — flag simples de período ativo + multiplicador no
  cálculo de XP em `quizService.js`.

### Ordem sugerida de implementação

1. Minigame "Batalha de complexidade" (reaproveita infraestrutura de questão
   existente, menor risco).
2. Poderes "Eliminar alternativa" e "Tempo extra" (maior impacto percebido,
   escopo de backend contido).
3. Progressão de personagem / avatar por nível (cosmético, sem risco de
   lógica de jogo).
4. Streak diário e eventos temporários.
5. "Reordenar algoritmo" e boss fight (maior esforço de UI/conteúdo).

## Longo prazo (expansão)

- **Multiplayer/desafio entre colegas** — duelo síncrono ou assíncrono
  (melhor tempo/acertos) entre dois alunos na mesma fase.
- **Trilhas de aprendizagem alternativas** — múltiplos caminhos no mapa de
  fases (não só linear), com fases opcionais de aprofundamento.
- **Editor visual de questões para o professor** — hoje a criação de questão
  provavelmente passa por SQL/admin; um formulário guiado no `Admin.jsx`
  reduziria erro humano e dependência do agente de conteúdo.
- **Exportação de relatórios (CSV/PDF)** para uso do professor fora da
  plataforma (apoio ao TCC/avaliação).
- **Internacionalização** — se houver interesse em usar o jogo além do
  público de língua portuguesa.
- **Acessibilidade avançada** — suporte a leitor de tela completo no fluxo
  de quiz, modo alto contraste, navegação 100% por teclado.

## Infraestrutura / qualidade

- **Testes automatizados** — hoje não há suíte de testes visível em
  `backend/` nem `frontend/`; priorizar testes de `quizService.js` (regra
  de XP/aprovação/desbloqueio) por ser a lógica mais crítica do jogo.
- **CI** — não há workflow de CI configurado no repositório; adicionar
  lint + testes rodando em cada PR.
- **Monitoramento de qualidade das questões** — rodar o agente
  `question-researcher` periodicamente em modo de auditoria sobre
  `database/05_seed_questoes.sql` e futuras seeds, para pegar
  desatualizações técnicas.

---

Este roadmap é um documento vivo — atualize conforme itens forem
implementados ou repriorizados.
