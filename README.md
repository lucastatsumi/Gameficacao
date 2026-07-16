# Serious Game — Estrutura de Dados (TCC)

Aplicação web gamificada para ensino de Estrutura de Dados a estudantes de
Engenharia de Software / Ciência da Computação. Quiz contextualizado com
cenários reais de desenvolvimento, sistema de XP, níveis, badges, mapa de
fases desbloqueável e ranking.

**Em produção:** [frontend](https://gameficacao-omega.vercel.app) ·
[API](https://gameficacao-api.vercel.app/health) — detalhes operacionais em
[`docs/deploy.md`](docs/deploy.md).

## Sumário

- [Stack](#stack)
- [Decisões de arquitetura](#decisões-de-arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Como rodar (desenvolvimento)](#como-rodar-desenvolvimento)
  - [1. Banco de dados](#1-banco-de-dados)
  - [2. Backend](#2-backend)
  - [3. Frontend](#3-frontend)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Qualidade e CI](#qualidade-e-ci)
- [Deploy](#deploy)
- [Documentação adicional](#documentação-adicional)

## Stack

| Camada   | Tecnologia                                      |
| -------- | ----------------------------------------------- |
| Frontend | React + Vite + Tailwind CSS                     |
| Backend  | Node.js + Express                               |
| Banco    | PostgreSQL (Supabase)                           |
| Auth     | Supabase Auth (JWT validado pelo Express)       |
| Deploy   | Vercel (frontend estático + backend serverless) |

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
│   └── 07_quizzes_abertos.sql    #   Quizzes deixam de ser exclusivos do professor/turma
├── backend/
│   ├── api/                      # Entrypoint serverless da Vercel (reexporta o app)
│   └── src/
│       ├── config/               # Cliente Supabase, variáveis de ambiente
│       ├── middlewares/          # Autenticação JWT, tratamento de erros
│       ├── routes/               # Definição de rotas da API
│       ├── controllers/          # Recebem request, delegam e respondem
│       ├── services/             # Regras de jogo: quiz, XP, badges, ranking
│       │   └── *.test.js         # Testes unitários (Vitest) das funções puras
│       └── utils/
├── frontend/
│   └── src/
│       ├── pages/                # Login, MapaFases, Quiz, Ranking, Perfil, Admin
│       ├── components/
│       │   └── ui/               # Botões, cards, modais genéricos
│       ├── contexts/             # AuthContext (sessão do usuário)
│       ├── services/             # Cliente HTTP da API
│       └── lib/                  # Cliente Supabase (só auth)
├── .github/workflows/            # CI (lint + build/test a cada push/PR)
└── docs/                         # arquitetura.md, modelo-dados.md, deploy.md
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

## Qualidade e CI

```bash
npm run lint      # backend/ e frontend/ — ESLint (flat config)
npm run format    # backend/ e frontend/ — Prettier --write
npm test          # backend/ — Vitest (lógica de badges, XP, nível, sorteio)
```

O GitHub Actions (`.github/workflows/ci.yml`) roda lint em ambos os projetos,
testes no backend e build no frontend a cada push/PR para `main`.

## Deploy

Frontend e backend estão publicados na Vercel (ver URLs no topo deste
README). Passo a passo de deploy, variáveis de ambiente em produção, e
ressalvas operacionais (pausa do Supabase free-tier, CORS, confirmação de
e-mail) estão em [`docs/deploy.md`](docs/deploy.md).

## Documentação adicional

- [`docs/arquitetura.md`](docs/arquitetura.md) — diagramas de arquitetura e
  do fluxo de uma tentativa de quiz.
- [`docs/modelo-dados.md`](docs/modelo-dados.md) — diagrama entidade-relacionamento
  do banco e decisões de modelagem não óbvias.
- [`docs/deploy.md`](docs/deploy.md) — runbook operacional.
