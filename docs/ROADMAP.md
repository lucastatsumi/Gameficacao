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
