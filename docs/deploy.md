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
- **`gameficacao-api` ficou fora do ar por deploy incompleto** (diagnóstico
  original em 2026-07-30, via conector Vercel): deploys manuais feitos por
  agente (`vercel deploy` / upload inline via `deploy_to_vercel`) vinham
  subindo árvore de arquivos **incompleta** (faltando `src/routes/` no
  backend, ou `src/` inteiro no frontend), causando
  `FUNCTION_INVOCATION_FAILED` / `Error [ERR_MODULE_NOT_FOUND]` no backend e
  `Rollup failed to resolve /src/main.jsx` no build do frontend.

  **Correção aplicada em 2026-07-31**: em vez de depender de rollback manual
  no dashboard, o agente listou `git ls-files` em cada subprojeto (fonte da
  verdade do que deve ir para produção) e chamou `deploy_to_vercel` com a
  árvore **completa e explícita** (todos os arquivos rastreados pelo git,
  nenhum a menos) para os dois projetos, a partir do commit mais recente de
  `main` (pós-rebrand). Ver histórico de commits para o resultado exato —
  isso elimina a causa raiz (upload parcial) sem depender de clique manual.

  **Correção durável (ainda recomendada):** conectar o repositório em
  Project Settings → Git (nos DOIS projetos, com Root Directory `frontend` e
  `backend`). Aí um `git push` na `main` dispara deploy automático a partir
  do checkout COMPLETO do GitHub — elimina de vez a dependência de deploy
  manual (via CLI ou MCP) para publicar mudanças.

  **Reincidência confirmada em 2026-08-02** (via conectores Vercel +
  Supabase): a produção estava quebrada de novo com o MESMO padrão de upload
  parcial.
  - **Backend** (`gameficacao-api`): o deployment de produção estava `READY`
    (build passou) mas a função crashava em runtime com
    `Error [ERR_MODULE_NOT_FOUND]: Cannot find module
    '/var/task/src/utils/httpError.js'` — o último deploy manual subiu a
    árvore SEM o diretório `src/utils/`. Toda chamada retornava HTTP 500
    `FUNCTION_INVOCATION_FAILED`, e era ESSA a causa do "erro de fetch na
    página inicial" (o front chama `https://gameficacao-api.vercel.app/api`).
  - **Frontend** (`gameficacao`): TODOS os deploys recentes estavam em
    `ERROR` (`Could not resolve "./pages/Login.jsx"` — `src/` incompleto),
    então o alias `gameficacao-omega` continuava servindo um build antigo de
    2026-07-29 com a marca velha ("DataQuest — Estrutura de Dados").
  - **Supabase** (`ohjvhovbwkqdkisaatfs`): `ACTIVE_HEALTHY`, `get_advisors`
    sem erros — só INFO (RLS sem policy, por design) e 1 WARN (proteção de
    senha vazada desativada). Conteúdo já corporativo. Ou seja: o banco NÃO
    era o problema; o problema era 100% deploy incompleto na Vercel.

  **Re-correção 2026-08-02**: re-deploy da árvore COMPLETA (via `git ls-files`
  em cada subprojeto, incluindo `src/utils/` no backend) com `deploy_to_vercel`,
  para `gameficacao-api` e `gameficacao`. O bundle do backend também pode ser
  gerado como arquivo único com esbuild
  (`npx esbuild api/index.js --bundle --platform=node --format=esm
  --packages=external`) para eliminar de vez o risco de "faltou um módulo".
  Ainda assim, a correção durável real segue sendo a integração Git↔Vercel
  acima.

- **Conector Supabase**: ao contrário do que uma sessão anterior registrou,
  o conector MCP do Supabase **funciona** neste ambiente (`list_projects`,
  `execute_sql`, `list_migrations`, `get_advisors`, `get_logs` testados em
  2026-07-31). Projeto `ohjvhovbwkqdkisaatfs` está `ACTIVE_HEALTHY`. Conteúdo
  do quiz **confirmado ao vivo** como corporativo (não mais Estrutura de
  Dados): 8 fases (Boas-vindas & Cultura, Segurança da Informação, Processos
  & Ferramentas, Comunicação & Colaboração, Compliance & Conduta, dois
  minigames reaproveitados, Excelência & Reconhecimento) com 61 questões no
  total. `get_advisors` não aponta nenhum erro — só INFOs esperados (RLS
  habilitado sem policy nas tabelas, já que toda escrita passa pela API com
  `service_role`, por design) e um WARN de baixo risco (proteção contra
  senha vazada desabilitada no Auth — ativável no dashboard, Auth → Policies).
  `get_logs` (auth) mostra tráfego real de signup/login/refresh sem erros
  sistêmicos.
- **Divergência entre `database/*.sql` local e migrations aplicadas**: o
  Supabase reporta migrations `31_pivot_tema_fases_badges`,
  `32_pivot_tema_questoes` e `32_pivot_tema_questoes_fases_6_8` já aplicadas
  (via MCP, em sessão anterior), mas o repo só tem
  `database/31_pivot_tema_corporativo.sql` local — os SQLs de `32_*` nunca
  foram salvos no repo. **Débito consciente**: o dado em produção está
  correto (confirmado acima), mas rodar `database/` do zero em outro projeto
  Supabase hoje NÃO reproduziria o pivô completo — falta extrair/commitar o
  SQL real de `32_pivot_tema_questoes` e `32_pivot_tema_questoes_fases_6_8` a
  partir do estado atual do banco.
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
