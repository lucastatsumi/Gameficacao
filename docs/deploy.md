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
- **Ambos os projetos estão conectados ao GitHub** (Project Settings → Git):
  um `git push` em `main` dispara build e deploy automático em produção para
  `gameficacao` (frontend) e `gameficacao-api` (backend). Deploys manuais via
  `vercel deploy --prod` continuam funcionando (não têm metadata de commit),
  mas não são mais a via normal.
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
- **`gameficacao-api` sem variáveis de ambiente configuradas** (regressão
  conhecida): o projeto atual está retornando `FUNCTION_INVOCATION_FAILED`
  em toda rota porque `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/
  `SUPABASE_ANON_KEY` não estão setadas nele — `backend/src/config/env.js`
  lança erro no cold start assim que falta alguma. Provavelmente essas
  variáveis existiam no projeto antigo `gameficacao-backend` e não foram
  copiadas quando o backend migrou para o projeto `gameficacao-api`. Não há
  ferramenta de agente para ler/escrever env vars da Vercel (e a
  `service_role` nunca deveria passar por um agente) — configure manualmente
  em Project Settings → Environment Variables (ambiente **Production**) e
  redeploy. Sem isso, o backend inteiro fica fora do ar mesmo com o frontend
  saudável.
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
