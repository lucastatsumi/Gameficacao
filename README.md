# TeamQuest — Onboarding e Reconhecimento Gamificados

Plataforma web gamificada de treinamento por quiz para empresas: qualifica o
onboarding de novos colaboradores (cultura, segurança da informação,
processos, comunicação, compliance) e reconhece/recompensa o time no dia a
dia. Quiz contextualizado com cenários reais do ambiente corporativo,
sistema de XP, níveis, badges, mapa de módulos desbloqueável e ranking.

> **Direção do produto**: a base já nasceu como jogo sério de Estrutura de
> Dados (TCC) e pivotou para o mercado corporativo — mecânica de
> gamificação 100% reaproveitada, conteúdo do quiz e copy trocados para
> onboarding/reconhecimento. Próximos passos (multi-tema por empresa,
> quizzes montados com IA, avaliação com pontuação ponderada e rubricas) em
> [`docs/ROADMAP.md`](docs/ROADMAP.md). O roadmap da fase educacional
> original está arquivado em [`docs/ROADMAP-v1.md`](docs/ROADMAP-v1.md).

## Sumário

- [Stack](#stack)
- [Decisões de arquitetura](#decisões-de-arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Como rodar (desenvolvimento)](#como-rodar-desenvolvimento)
  - [1. Banco de dados](#1-banco-de-dados)
  - [2. Backend](#2-backend)
  - [3. Frontend](#3-frontend)
- [Variáveis de ambiente](#variáveis-de-ambiente)

## Stack

| Camada   | Tecnologia                                   |
|----------|-----------------------------------------------|
| Frontend | React + Vite + Tailwind CSS                  |
| Backend  | Node.js + Express                            |
| Banco    | PostgreSQL (Supabase)                        |
| Auth     | Supabase Auth (JWT validado pelo Express)    |
| Deploy   | Vercel (frontend) + Railway (backend)        |

## Decisões de arquitetura

- **Autenticação única via Supabase Auth** — não há senha no banco da
  aplicação; `profiles.id` referencia `auth.users.id` e um trigger cria o
  perfil no cadastro.
- **Lógica de jogo 100% no servidor** — correção de respostas, XP, badges e
  desbloqueio de fases são calculados pelo Express. O frontend nunca recebe
  qual alternativa é a correta antes de responder.
- **Ranking é view, não tabela** — posição é derivada de `xp_total` com
  `RANK() OVER`, eliminando inconsistência.
- **Histórico granular** — `tentativas` (1 por quiz) e `respostas` (1 por
  questão, com tempo) alimentam os relatórios do professor.
- **RLS habilitado sem policies** — o frontend não acessa o banco
  diretamente; toda escrita passa pela API (service role).

## Estrutura de pastas

```
├── database/                     # Scripts SQL (rodar em ordem no Supabase)
│   ├── 01_schema.sql             #   Tabelas, trigger de perfil, RLS, índices
│   ├── 02_views.sql              #   Rankings, funções de nível, views do professor
│   ├── 03_seed_fases_badges.sql  #   Fases e badges iniciais
│   ├── 04_hardening.sql          #   Views security invoker, search_path, revokes
│   ├── 05_seed_questoes.sql      #   22 questões de exemplo (5 fases)
│   ├── 06_quiz_custom_dicas.sql  #   Quizzes do professor (tempo/sons/dicas)
│   ├── 07_quizzes_abertos.sql    #   Quizzes deixam de ser restritos a turma
│   ├── 08_streak_diario.sql      #   Coluna de streak + valor de enum de badge
│   ├── 09_streak_badges_seed.sql #   Badges de streak (3/7/30 dias)
│   ├── 10_poderes.sql            #   Poderes (50/50, tempo extra)
│   ├── 11_batalha_complexidade.sql # Minigame de comparação de Big-O
│   ├── 12_mais_questoes.sql      #   +15 questões (3 por fase, mais variedade)
│   ├── 13_eventos_temporarios.sql #  XP multiplicado por período
│   ├── 14_reordenar_algoritmo.sql #  Minigame de ordenar passos de algoritmo
│   ├── 15_boss_fight.sql         #   Vidas em quizzes customizados
│   ├── 16_poder_pular.sql        #   Poder "pular sem perder XP"
│   ├── 17_badge_sem_dica.sql     #   Valor de enum do badge "sem usar dica"
│   ├── 18_badge_sem_dica_seed.sql #  Seed do badge "sem usar dica"
│   ├── 19_desempenho_fases.sql   #   View de relatório agregado por fase
│   ├── 20_ranking_classe.sql     #   Classe (Mestre de X) no ranking
│   ├── 21_desafios.sql           #   Desafio assíncrono entre colegas
│   ├── 22_fichas.sql             #   Fichas (moeda gastável, ledger)
│   ├── 23_loja.sql               #   Loja de poderes e cosméticos
│   ├── 24_missoes.sql            #   Missões diárias
│   ├── 25_desafio_diario.sql     #   Desafio diário (seed por data)
│   ├── 26_fase_estruturas_avancadas.sql # Fase 8 (conteúdo reescrito pela 31)
│   ├── 27_ligas.sql              #   Ligas semanais (divisões, fechamento lazy)
│   ├── 28_kudos.sql              #   Kudos entre colegas (3/semana, anti-conluio)
│   ├── 29_temporadas.sql … 33_raid_boss.sql # Temporadas, missão semanal, pivô corporativo, raid
│   ├── 34_limpeza_conteudo_corporativo.sql # Remove resquícios técnicos do conteúdo
│   ├── 35_temas_competencias.sql #   Temas, módulos, competências, trilhas por equipe
│   ├── 36_empresas_multitenancy.sql # Empresas, papéis, isolamento por empresa_id
│   ├── 37_avaliacao.sql          #   Score 0–100 e desempenho por competência
│   ├── 38_ia_questoes_abertas.sql #  Rascunhos de IA, rubricas, custos de IA
│   ├── 39_badges_novos_tipos.sql #   Enum de badges (rodar antes da 40)
│   └── 40_cartas_prestigio_campanhas_torneios.sql # Cartas, prestígio, campanhas, torneios, snapshots
├── backend/
│   └── src/
│       ├── config/               # Cliente Supabase, variáveis de ambiente
│       ├── middlewares/          # Autenticação JWT, tratamento de erros
│       ├── routes/               # Definição de rotas da API
│       ├── controllers/          # Recebem request, delegam e respondem
│       ├── services/             # Regras de jogo: quiz, XP, badges, ranking
│       └── utils/
├── frontend/
│   └── src/
│       ├── pages/                # Login, MapaFases, Quiz, Ranking, Perfil, Admin
│       ├── components/
│       │   ├── ui/               # Botões, cards, modais genéricos
│       │   ├── mapa/             # Trilha de fases, nós bloqueados/concluídos
│       │   ├── quiz/             # Questão, timer, alternativas, feedback
│       │   └── ranking/          # Tabelas de classificação, pódio
│       ├── contexts/             # AuthContext (sessão do usuário)
│       ├── hooks/                # useQuiz, useTimer, useRanking...
│       ├── services/             # Cliente HTTP da API
│       └── lib/                  # Cliente Supabase (só auth)
└── docs/                         # Documentação do TCC (diagramas, relatórios)
```

## Como rodar (desenvolvimento)

### 1. Banco de dados

Os scripts de `database/` já foram aplicados como migrations no projeto
Supabase (via MCP). Para recriar do zero em outro projeto, execute-os em
ordem no SQL Editor.

### 2. Backend

```bash
cd backend
cp .env.example .env   # preencher com as chaves do Supabase
npm install
npm run dev            # http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # preencher URL do projeto + anon key + URL da API
npm install
npm run dev            # http://localhost:5173
```

## Variáveis de ambiente

As chaves ficam em: **Dashboard do Supabase → Project Settings → API Keys**.

- A `service_role` vai **somente** no `backend/.env`.
- A `anon`/`publishable` vai no `frontend/.env` **e** no `backend/.env`
  (usada para validação de JWT).
- `ANTHROPIC_API_KEY` (opcional, **somente** no `backend/.env`): liga a
  geração/auditoria de questões e a correção de respostas abertas por IA
  (modelo em `IA_MODELO`, padrão `claude-opus-5-5`). Sem ela o resto
  funciona e as respostas abertas ficam pendentes para o gestor.
