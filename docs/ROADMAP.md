# Roadmap v2 — Plataforma empresarial de quiz gamificado

> O roadmap anterior (jogo sério de Estrutura de Dados, [`ROADMAP-v1.md`](./ROADMAP-v1.md))
> foi concluído. Este documento define a próxima fase: **pivotar o produto
> para o mercado corporativo** — a empresa escolhe os temas, os quizzes são
> montados (futuramente com IA) e as respostas ganham um método de
> pontuação/avaliação mais rico que o certo/errado binário.

## Visão

De "serious game de Estrutura de Dados para alunos" para **plataforma
gamificada de treinamento por quiz para empresas**:

- A **empresa** cria seu espaço, escolhe os **temas** que quer treinar
  (compliance, segurança da informação, produto, vendas, onboarding...)
  e monta trilhas de módulos.
- Os **quizzes são montados** pelo gestor — manualmente hoje, **com
  assistência de IA** em seguida (geração de questões em rascunho para
  revisão humana).
- As **respostas são pontuadas e avaliadas** com crédito parcial,
  competências e, no futuro, questões abertas corrigidas por IA com
  rubrica — alimentando relatórios de gap por colaborador e equipe.

**O que NÃO muda** — as duas regras de ouro do projeto:

1. O backend continua sendo o único que sabe qual resposta é a correta;
   nada de gabarito no cliente antes da hora.
2. Toda pontuação/avaliação é calculada no servidor.

**O que transfere direto** da base atual (sem retrabalho): XP, níveis,
badges, streak diário, poderes, eventos temporários, ranking, desafio
assíncrono entre colegas, minigames (batalha, reordenar sequência, boss
fight), dificuldade adaptativa, relatórios com export CSV/PDF, i18n,
auditoria de acessibilidade e as suítes de teste (168 backend + 24
frontend). A gamificação construída para alunos é exatamente o que
diferencia um treinamento corporativo de um formulário chato.

---

## Horizonte 1 — Fundação multi-tema

O objetivo é generalizar o domínio sem reescrever o que funciona.

- **Tabela `temas`** — a unidade que a empresa seleciona. `fases` viram
  "módulos" pertencentes a um tema (`fases.tema_id`); o seed atual de
  Estrutura de Dados vira apenas o primeiro tema de catálogo (útil como
  demo). O mapa de fases passa a ser "trilha do tema".
- **Banco de questões por tema** — `questoes` já tem `fase_id`; herda o
  tema pelo módulo. Adicionar **tags de competência** (`competencias`
  jsonb ou tabela N:N) — a base do Horizonte 3.
- **Reposicionamento de papéis** — turma → **equipe/departamento**,
  professor → **gestor**, aluno → **colaborador**. Majoritariamente copy:
  a infra de i18n existente (`translations.js`) já centraliza strings, o
  que transforma boa parte do rebranding em edição de dicionário. Renomear
  tabelas/colunas do banco NÃO é necessário nem recomendado agora (custo
  alto de migração para ganho zero de funcionalidade — registrar como
  dívida consciente).
- **Onboarding da empresa** — fluxo de criação do espaço: nome da
  empresa, seleção de temas ativos do catálogo (ou criação de tema
  próprio vazio). Reusa o padrão do código de acesso de turma para
  convidar colaboradores.
- **Trilhas por equipe** — o gestor escolhe quais temas/trilhas cada
  equipe vê (hoje todo aluno vê todas as fases; passa a ser filtrado por
  atribuição).

## Horizonte 2 — Montagem de quiz com IA

O agente `question-researcher` (`.claude/agents/`) já é o protótipo
conceitual: gerar questões com fontes confiáveis, alternativas plausíveis
e explicações pedagógicas. A evolução é levar isso para DENTRO do produto
via Claude API.

- **Geração assistida de questões** — o gestor informa tema, nível,
  formato e quantidade → a IA gera questões completas (enunciado,
  alternativas com exatamente 1 correta, explicações por alternativa,
  dificuldade sugerida) como **rascunho com status `pendente_revisao`**.
  Regra inegociável: **nenhuma questão gerada por IA entra em produção sem
  aprovação humana** — o editor visual de questões existente
  (`AbaQuestoes.jsx`) vira a tela de revisão (aprovar/editar/descartar).
- **Auditoria por IA do banco existente** — botão "auditar tema": a IA
  revisa questões ativas procurando erros técnicos, distratores fracos ou
  ambiguidade, e abre sugestões de correção (mesmo fluxo de rascunho).
- **Geração a partir de material da empresa** — o gestor faz upload de
  documento interno (política, manual, playbook) e a IA gera questões
  ancoradas naquele texto, citando o trecho-fonte em cada explicação.
  Depende de armazenamento de arquivos — fase 2 deste horizonte.
- **Infra**: chave de API por ambiente (nunca no cliente), chamadas só no
  backend, custo por geração visível ao gestor, e validação do payload
  gerado com o MESMO `validarPayload` do `questaoService` que valida
  questões humanas — IA não ganha caminho privilegiado para dentro do
  banco.

## Horizonte 3 — Método de pontuação e avaliação

O pedido central do pivô: sair do certo/errado binário.

- **Pontuação ponderada (server-side)** — nota da tentativa composta por:
  dificuldade da questão (fácil/média/difícil com pesos), velocidade
  (bônus decrescente pelo tempo restante — o timer validado no servidor já
  existe), e sequência de acertos (combo). Exibida como score 0–100 ao
  lado do XP (o XP continua sendo a moeda de gamificação; o score é a
  métrica de avaliação — propósitos diferentes, números diferentes).
- **Questão aberta corrigida por IA com rubrica** — novo formato
  `resposta_aberta`: o gestor escreve a pergunta e a **rubrica de
  correção** (critérios + pesos); o colaborador responde em texto livre; a
  IA avalia contra a rubrica e devolve nota 0–100 + feedback por critério.
  Primeiro formato com correção não determinística, então:
  a nota da IA fica registrada com a justificativa completa, o gestor pode
  **revisar e sobrescrever** qualquer nota, e a resposta nunca é avaliada
  duas vezes com resultados silenciosamente diferentes (avaliação
  persistida, não recalculada). Segue o padrão do `reordenar_algoritmo`:
  endpoint de correção isolado gravando na mesma tabela `respostas`, sem
  tocar no fluxo dos formatos existentes.
- **Matriz de competências** — com as questões tagueadas (Horizonte 1),
  agregar desempenho por competência: radar/tabela por colaborador e por
  equipe mostrando gaps ("equipe domina LGPD, patina em resposta a
  incidente"). Evolução direta da view `desempenho_fases` que já existe.
- **Certificado de conclusão de trilha** — ao aprovar todos os módulos de
  um tema, o colaborador baixa um certificado em PDF (nome, tema, score,
  data) — reusa o padrão de export por `window.print()` já implementado
  no relatório do gestor.
- **Escala de proficiência** — por tema, classificar o colaborador
  (Iniciante/Praticante/Proficiente/Referência) a partir do score médio e
  cobertura de competências — versão "avaliativa" do título por nível que
  já existe na gamificação.

## Horizonte 4 — Engajamento corporativo (novas experiências)

- **Meta coletiva de equipe (raid boss)** — o gestor lança um "chefe" com
  HP compartilhado para a equipe; cada acerto de qualquer membro causa
  dano proporcional à dificuldade da questão. Derrotou dentro do prazo →
  recompensa para todos (poderes/badge exclusiva). Transforma o
  treinamento individual em objetivo de time — a mecânica de eventos
  temporários existente já dá o esqueleto (período + escopo).
- **Desafio diário** — um mini-quiz por dia com **seed determinística por
  data** (todos respondem às mesmas questões, estilo Wordle), ranking
  separado do dia e bônus de streak por participar. Reusa o sorteio de
  questões existente trocando o RNG por um PRNG semeado pela data.
- **Campanha temática mensal** — evento temporário de 30 dias com badge
  exclusiva e ranking próprio ("Outubro da Segurança") — composição de
  eventos + badges já existentes, novidade é o empacotamento.
- **Torneio entre equipes** — janela em que os desafios assíncronos
  existentes (`desafioService`) são agregados por equipe: soma de vitórias
  vira placar de equipe.

## Horizonte 5 — Plataforma

- **Multi-tenancy real** — hoje o isolamento é por turma dentro de um
  banco único com um "professor" global; empresas exigem isolamento forte:
  `empresa_id` nas entidades-raiz, views de ranking/relatório filtradas
  por empresa, RLS por tenant. É a mudança estrutural mais séria do
  roadmap — fazer cedo, antes que cada feature nova multiplique o custo.
- **Dashboard com evolução temporal** — snapshots periódicos de score por
  equipe/competência para gráficos de tendência (o v1 registrou por que
  isso exige snapshot, não só agregado do momento).
- **Papéis granulares** — dono da empresa / gestor de equipe /
  colaborador (hoje só existe professor/aluno).

### Fora do escopo de implementação autônoma

Itens que exigem decisão comercial, infra externa ou material que este
ambiente não tem como criar/validar sozinho:

- **Billing/planos** (Stripe etc.) — decisão comercial + conta externa.
- **SSO corporativo** (SAML/OIDC com Okta/Azure AD) — exige tenant de
  identidade real para validar.
- **Integração com HRIS** (importar organograma/colaboradores) — depende
  de qual sistema o cliente usa.
- **Notificações externas** (e-mail/push de lembrete) — exige provedor de
  envio configurado; o lembrete in-app já existe.
- **Catálogo de temas prontos com conteúdo licenciado** — curadoria
  editorial/jurídica humana.

## Ordem sugerida

1. Horizonte 1 (fundação multi-tema) — destrava todo o resto.
2. Pontuação ponderada + competências (Horizonte 3, parte determinística)
   — entrega o "método de avaliar" pedido sem depender de IA.
3. Geração de questões com IA (Horizonte 2) — maior valor percebido.
4. Questão aberta com rubrica por IA (Horizonte 3, parte não
   determinística) — depende da infra de IA do passo 3.
5. Raid de equipe + desafio diário (Horizonte 4) — engajamento.
6. Multi-tenancy (Horizonte 5) — antes de qualquer piloto com 2+ empresas.

---

Este roadmap é um documento vivo — atualize conforme itens forem
implementados ou repriorizados.
