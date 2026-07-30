# Deploy e operação

## URLs em produção

|                    | URL                                         |
| ------------------ | ------------------------------------------- |
| Frontend           | https://gameficacao-omega.vercel.app        |
| Backend (API)      | https://gameficacao-api.vercel.app          |
| Supabase (projeto) | `ohjvhovbwkqdkisaatfs` (região `us-west-2`) |

## Como o deploy funciona

- **Frontend** — projeto Vercel `gameficacao`. Build estático (`vite build`),
  servido como site estático. `frontend/vercel.json` faz rewrite de toda rota
  para `/index.html` (necessário para o React Router funcionar em deep-links
  como `/ranking` ou `/quiz/custom/:id`).
- **Backend** — projeto Vercel `gameficacao-api`. O Express roda como função
  serverless: `backend/api/index.js` reexporta o `app` de `src/app.js`, e
  `backend/vercel.json` faz rewrite de toda rota para `/api`.
- **Nenhum dos dois projetos tem integração Git↔Vercel ativa** (confirmado
  em 2026-07-30: um push em `main` não gerou nenhum deploy novo, mesmo
  minutos depois). Os deploys existentes têm `gitCommitSha`/`gitCommitRef`
  no metadata porque foram feitos com `vercel deploy --prod` rodado a partir
  de um checkout local (a CLI lê o git local e anexa esse metadata; isso não
  exige nem implica um webhook configurado). Ou seja: **`git push` sozinho
  NUNCA atualiza produção.** Para publicar um commit novo, rode manualmente
  em cada pasta (`cd frontend && vercel deploy --prod` /
  `cd backend && vercel deploy --prod`), ou conecte o repositório em
  Project Settings → Git no dashboard da Vercel para automatizar isso.
- **Vercel Authentication (SSO protection)**: os três projetos (`gameficacao`,
  `gameficacao-api`, `gameficacao-backend`) vêm com "Deployment Protection"
  habilitada por padrão para todos os domínios `*.vercel.app`. Isso bloqueia
  QUALQUER visitante anônimo (inclusive o próprio frontend chamando a API) —
  já causou um "erro de fetch" na home em produção. Está configurado para
  `preview` apenas (produção pública) em `gameficacao` e `gameficacao-api`;
  confirme esse estado em Project Settings → Deployment Protection antes de
  cada diagnóstico de "site fora do ar".

## Variáveis de ambiente

As chaves ficam em **Dashboard do Supabase → Project Settings → API Keys**.
Nunca commitar `.env` (já está no `.gitignore`).

| Variável                    | Onde               | Observação                                                      |
| --------------------------- | ------------------ | --------------------------------------------------------------- |
| `SUPABASE_URL`              | backend            | URL do projeto                                                  |
| `SUPABASE_SERVICE_ROLE_KEY` | backend            | **Secreta.** Ignora RLS. Só no backend.                         |
| `SUPABASE_ANON_KEY`         | backend + frontend | Backend usa para validar JWT; frontend usa para login/cadastro. |
| `FRONTEND_URL`              | backend            | Origem liberada no CORS. Hoje é `*` (ver nota abaixo).          |
| `VITE_SUPABASE_URL`         | frontend           | Mesma URL do projeto                                            |
| `VITE_SUPABASE_ANON_KEY`    | frontend           | Mesma anon key                                                  |
| `VITE_API_URL`              | frontend           | `https://gameficacao-api.vercel.app/api` em produção            |

Em produção, essas variáveis estão configuradas como **environment variables
criptografadas na Vercel** (`vercel env add`), nunca embutidas no código-fonte
ou no bundle do backend — isso é importante especialmente para a
`service_role`, que tem acesso total ao banco.

## Ressalvas operacionais conhecidas

- **Supabase free-tier pausa o projeto após ~7 dias de inatividade.** Se a API
  parar de responder dados (mas `/health` continuar OK), é provavelmente isso.
  Reative pelo dashboard do Supabase, ou via Management API:
  `POST https://api.supabase.com/v1/projects/{ref}/restore`. Leva de 2 a 5
  minutos para voltar a `ACTIVE_HEALTHY`.
- **Confirmação de e-mail está habilitada** (`mailer_autoconfirm: false` na
  config de Auth do Supabase). Quem se cadastra recebe um e-mail de
  confirmação e só consegue logar depois de clicar no link. Isso é
  deliberado (mais realista/seguro), mas pode surpreender em uma
  demonstração rápida — o Supabase também aplica rate-limit ao envio desses
  e-mails no plano free.
- **CORS do backend restrito a `https://gameficacao-omega.vercel.app`**
  (`FRONTEND_URL` na Vercel). Qualquer outra origem tentando ler a API pelo
  navegador é bloqueada pelo próprio navegador (o servidor sempre responde;
  quem recusa ler é o `fetch`/XHR da página maliciosa, ao comparar o header
  `Access-Control-Allow-Origin` com a própria origem). Ferramentas como
  `curl` não reforçam CORS — não é um jeito válido de testar o bloqueio.
- **`gameficacao-api` fora do ar por deploy incompleto** (diagnóstico
  2026-07-30, via conector Vercel): o deploy de produção **atual** retorna
  `FUNCTION_INVOCATION_FAILED` em toda rota. Os *runtime logs* mostram a
  causa real: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module
  '/var/task/src/routes/index.js'`. Ou seja, **não é falta de env var** — o
  bundle enviado nos últimos deploys manuais (feitos via CLI, `source: cli`,
  sem metadata de git) subiu **incompleto**, sem a pasta `src/routes/`. As
  variáveis de ambiente ESTÃO configuradas no projeto: o deploy anterior
  `dpl_Ghz55DK7…` (commit `db6706e`, `main`) continua **READY e saudável** —
  `/health` responde `{"status":"ok"}` e `/api/fases` responde `401`
  (autenticação), provando que o Express sobe, o cliente Supabase inicializa
  e o CORS aponta para `https://gameficacao-omega.vercel.app`.

  **Correção imediata (2 cliques, sem código):** Vercel → projeto
  `gameficacao-api` → aba **Deployments** → localizar o deploy saudável de
  `db6706e` → menu **⋯ → Instant Rollback / Promote to Production**. Isso
  reaponta o domínio `gameficacao-api.vercel.app` para o build completo e
  derruba o `500` na hora. Como o conteúdo do quiz vem do banco (já pivotado
  para o tema corporativo nas migrations 31–32), a home volta a exibir as
  fases corporativas assim que a API responde.

  **Correção durável (recomendada):** conectar o repositório em
  Project Settings → Git (nos DOIS projetos, com Root Directory `frontend` e
  `backend`). Aí um `git push` na `main` dispara deploy automático a partir
  do checkout COMPLETO — elimina de vez os deploys manuais parciais que
  causaram tanto este `ERR_MODULE_NOT_FOUND` no backend quanto o
  `Rollup failed to resolve /src/main.jsx` que fez o último build do
  frontend `gameficacao` falhar (mesma causa: upload sem a pasta `src/`).
  Enquanto o deploy manual for a única via, rode-o sempre a partir da
  **raiz de cada subprojeto** (`cd frontend && vercel deploy --prod`,
  `cd backend && vercel deploy --prod`) para garantir a árvore inteira.

  > Nota de ferramentas: o conector Vercel disponível ao agente expõe
  > `deploy_to_vercel` (upload inline de arquivos) mas **não** expõe
  > promote/rollback nem escrita de env var; e reenviar a árvore inteira
  > inline não é confiável. Por isso a correção de produção acima é uma ação
  > de 1–2 cliques no dashboard, não algo que o agente aplicou sozinho.
- **Vulnerabilidade conhecida, baixo risco:** `npm audit` no frontend acusa
  `esbuild ≤0.24.2` (via Vite 5) — permite que qualquer site enviado ao
  navegador do desenvolvedor leia respostas do **dev server local**
  (`npm run dev`). Não afeta o build de produção (`vite build`, que é o que
  está no ar). Corrigir exige upgrade major para Vite 8
  (`npm audit fix --force`), fora de escopo por ora — checar antes de fazer
  esse upgrade, pois é breaking change.

## Push para o GitHub

O token configurado no MCP do GitHub (`.claude.json`) tem **apenas escopo de
leitura** — chamadas de escrita (`push_files`, `create_or_update_file`)
retornam `403 Resource not accessible by personal access token`. O `git push`
via linha de comando também falha por falta de credencial local
(`Password authentication is not supported for Git operations`).

Para habilitar push (seja pela CLI, seja pelo MCP), uma destas opções:

1. Gerar um novo GitHub PAT com escopo `repo` (classic) ou `contents:write`
   (fine-grained) e configurá-lo como credencial do git local (`git config
credential.helper` + login, ou `gh auth login` com o `gh` CLI instalado).
2. Atualizar o token usado pelo MCP do GitHub em `.claude.json` para um que
   tenha esse escopo.
