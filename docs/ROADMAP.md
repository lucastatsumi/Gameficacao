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

## Horizonte 4 — Sistema de gamificação (design detalhado)

O coração do produto. Cada mecânica abaixo está especificada com o
**objetivo comportamental** que ataca, as **regras**, o **modelo de
dados/backend** e as **salvaguardas anti-abuso** — em contexto
corporativo, gamificação sem anti-abuso vira gincana de farmar pontos.
Duas regras valem para TODAS as mecânicas:

1. Recompensa é sempre concedida pelo **servidor** ao processar um evento
   legítimo (finalizar quiz, completar missão) — o cliente nunca "pede" a
   recompensa.
2. **Gamificação ≠ avaliação**: XP, fichas, ligas e cosméticos motivam;
   o score/competências (Horizonte 3) avaliam. Nenhuma mecânica lúdica
   contamina o relatório que o gestor usa para decidir sobre pessoas.

### 4.1 Economia dual — XP + Fichas ✅ implementado

*Objetivo: dar propósito contínuo ao jogo depois que o nível para de
subir rápido.*

> **Como saiu**: `database/22_fichas.sql` + `fichaService.js` (7 testes).
> Ledger append-only com check `quantidade <> 0`; saldo derivado da soma;
> recompensa de quiz condicionada a `xp_ganho > 0` (herda o anti-farming)
> com teto diário de 50; saldo exposto em `GET /perfil` e nas telas de
> Perfil/resultado.

- **XP** continua como está: progressão permanente, nunca se gasta.
- **Fichas** são a moeda gastável: ganha ao aprovar quiz (10), quiz
  perfeito (+5), desafio diário (+5), missões e raids; gasta na loja.
- Backend: `carteiras` (saldo) + `transacoes_fichas` como **ledger
  append-only** (motivo, referência da origem, timestamp) — saldo é
  derivável do ledger, auditável, e impossível de "editar na mão".
- Anti-abuso: teto diário de fichas por fonte; a regra anti-farming de XP
  existente (só recompensa superar o próprio recorde) se aplica igual às
  fichas de quiz repetido.

### 4.2 Loja e cosméticos do avatar ✅ implementado

*Objetivo: dar em que gastar as fichas e deixar o jogador expressar
identidade — sem pay-to-win.*

> **Como saiu**: `database/23_loja.sql` (9 itens seed) + `lojaService.js`
> (11 testes) + página `/loja`. Poder comprável credita `usuario_poderes`
> (consumível); paleta/título são compra única (PK composta) com o "em
> uso" em `profiles.equipados`; `AvatarPixel` aceita a paleta comprada
> (preview na própria loja) e o Perfil exibe o título equipado.

- A loja vende: **poderes** (eliminar alternativa, tempo extra, pular —
  hoje só ganháveis, passam a ser também compráveis com teto de estoque),
  e **cosméticos**: paletas de cor do `AvatarPixel`, acessórios extras
  (óculos, capa, aura), molduras de card no ranking e **títulos
  exibíveis** ("O Implacável", "Caçador de Bugs") escolhidos no perfil.
- Cosmético é 100% procedural (SVG por código, extensão direta do
  `AvatarPixel.jsx` existente) — nenhuma arte externa necessária.
- Raridades comum/raro/épico definem preço e cor da moldura.
- Backend: `itens_catalogo`, `itens_do_jogador`, `equipados` (jsonb no
  perfil). Compra é transação no ledger de fichas.

### 4.3 Missões diárias e semanais (quadro de missões) ✅ diárias implementadas

*Objetivo: dar um motivo concreto para abrir o app HOJE, além do streak.*

> **Como saiu**: `database/24_missoes.sql` (catálogo de 6 + atribuições
> por jogador/dia) + `missaoService.js` (7 testes) + `utils/seed.js`
> (PRNG mulberry32 determinístico — atribuições concorrentes convergem).
> Progresso atualizado só no hook do controller pós-`finalizarQuiz`;
> fichas pagas uma única vez por conclusão; quadro no MapaFases e
> celebração no resultado. Missão SEMANAL ficou de fora desta rodada
> (exige janela de 7 dias no acumulador — extensão natural do mesmo
> modelo, `dia` vira `semana ISO`).

- 3 missões diárias sorteadas por jogador ("acerte 5 questões de
  <tema>", "aprove 1 quiz sem usar dica", "vença 1 desafio contra
  colega") + 1 missão semanal maior ("acumule 15 acertos na semana").
- Recompensa: fichas + XP pequeno; a semanal dá item cosmético raro.
- Backend: `missoes_catalogo` (tipo, parâmetro, recompensa) +
  `missoes_do_dia` (atribuição por jogador/data, progresso). O progresso
  é verificado **server-side no mesmo hook de `finalizarQuiz` que já
  verifica badges** — zero confiança no cliente, mesma arquitetura.
- Anti-abuso: progresso só conta em tentativas finalizadas; missões de
  "N acertos" ignoram questões repetidas no mesmo dia.

### 4.4 Combo dentro do quiz ✅ implementado

*Objetivo: tensão e ritmo momento-a-momento (a menor e mais barata
mecânica do horizonte — quick win).*

> **Como saiu**: `utils/combo.js` (puro, 5 testes) aplicado em
> `finalizarQuiz` sobre a sequência real de `respostas` (agora ordenada
> por `respondida_em`); o bônus é a diferença entre XP com e sem
> multiplicadores, então compõe com evento/streak sem mudar as regras
> existentes. Contador animado no header do quiz e combo máximo na tela
> de resultado — o cliente nunca calcula nada.

- Acertos consecutivos na MESMA tentativa multiplicam o XP da questão:
  ×1.0 → ×1.1 (2 seguidos) → ×1.25 (3) → ×1.5 (teto, 4+). Errar zera.
- Calculado em `finalizarQuiz` a partir da sequência de `respostas` (já
  são ordenadas e timestamped — nenhuma coluna nova); o frontend só
  ANIMA o contador ("COMBO ×1.5!"), nunca calcula.

### 4.5 Ligas semanais ✅ implementado

*Objetivo: competição justa para todos os níveis — o ranking global atual
premia veteranos para sempre; novato nunca alcança.*

> **Como saiu**: `database/27_ligas.sql` (`ligas_semana`: jogador, divisão,
> xp_semana, semana ISO) + `ligaService.js` (14 testes) + `utils/semana.js`
> (identificador ISO "2026-W30", 4 testes). Fechamento **lazy**: o primeiro
> acesso de CADA DIVISÃO após a virada da semana ISO promove o top 20%,
> rebaixa o bottom 20% (arredondamento simples — divisões pequenas às vezes
> não movem ninguém) e paga fichas a todos pela posição, sem cron externo.
> `registrarXpNaLiga` roda no mesmo hook pós-`finalizarQuiz` que já
> alimenta fichas e missões, somando o `xp_ganho` já filtrado pela
> anti-farming existente. Card no MapaFases mostra a divisão e o top 3 da
> semana; rota `GET /liga` devolve o ranking completo da divisão do
> jogador.

- Divisões Bronze → Prata → Ouro → Diamante. O ranking da semana é por
  **XP ganho NA semana** (não total): todo mundo começa a semana zerado
  dentro da sua divisão.
- Fim da semana: top 20% da divisão sobe, bottom 20% desce, todos ganham
  fichas conforme a posição.
- Backend: `ligas_semana` (jogador, divisão, xp_semana, semana ISO) com
  fechamento **lazy** — o primeiro acesso após a virada da semana
  processa a promoção/rebaixamento (sem depender de cron externo, que
  este ambiente não tem como garantir).

### 4.6 Temporadas e passe de missões

*Objetivo: arco de longo prazo renovável — e o gancho corporativo
perfeito para campanhas trimestrais de treinamento.*

- Temporada = 8–12 semanas com tema ("Temporada de Segurança Q1"),
  trilha de ~30 recompensas destravadas por **pontos de temporada** (=
  XP ganho no período). Cosméticos exclusivos que nunca voltam à loja.
- No fim, ranking da temporada congela em "hall da fama" consultável.
- Backend: `temporadas` (período, tema) + acumulador por jogador; a
  mesma mecânica de eventos temporários dá o esqueleto do período.

### 4.7 Raid boss de equipe

*Objetivo: transformar treinamento individual em objetivo coletivo — o
colaborador que não faria o quiz por si faz pela equipe.*

- O gestor lança um chefe com **HP compartilhado** calibrado pelo
  tamanho da equipe (ex.: membros × 40). Janela de 1 semana.
- Cada acerto de qualquer membro causa dano = dificuldade da questão
  (fácil 1 / média 2 / difícil 4). Nas **últimas 24h o boss "enfurece"**:
  dano ×2 — pico de urgência coletiva no fim da janela.
- Derrotou → badge exclusiva + fichas para TODOS (inclusive quem
  contribuiu pouco: a pressão social já faz o trabalho; punir
  individualmente aqui minaria o objetivo).
- Backend: `raids` (equipe, hp_total, hp_atual, período) +
  `raid_contribuicoes` (dano por jogador — alimenta um placar interno de
  contribuição visível só para a equipe). Dano aplicado em
  `finalizarQuiz`, nunca por chamada direta.

### 4.8 Desafio diário (seed por data) ✅ implementado

*Objetivo: ritual compartilhado estilo Wordle — todos falam do MESMO
desafio no café.*

> **Como saiu**: `database/25_desafio_diario.sql` (terceira origem de
> tentativa `desafio_dia` + índice único parcial de 1/dia — abrir e
> abandonar consome o dia, anti-espiada) + `desafioDiarioService.js`
> (6 testes). O conjunto do dia é DERIVADO (nunca armazenado): ids
> ordenados + embaralhamento semeado por `desafio:<data>`;
> `responderQuestao` revalida o pertencimento pela mesma seed; poderes
> bloqueados (arena justa); sem anti-farming (1 tentativa/dia, conteúdo
> novo por dia). Card no MapaFases com pódio do dia; rota `/quiz/diario`
> reusa o fluxo inteiro do Quiz.

- 5 questões por dia, **idênticas para todos** (PRNG determinístico
  semeado por `data + tema da semana` no sorteio existente), 1 tentativa
  por jogador por dia, sem dicas/poderes.
- Ranking do dia (acertos, depois tempo) separado do ranking geral;
  participar mantém o streak diário existente.

### 4.9 Cartas colecionáveis de conhecimento

*Objetivo: colecionismo que É revisão de conteúdo — a recompensa reforça
o aprendizado em vez de distrair dele.*

- Dominar uma competência (ex.: ≥80% de acerto em ≥10 questões daquela
  tag) **revela a carta** daquele conceito: frente com arte procedural
  (mesma técnica SVG do avatar) e nome; verso com o resumo do conceito —
  a carta vira material de consulta rápida no perfil.
- Álbum por tema; completar o álbum = badge + entrada no certificado.
- Backend: `cartas_catalogo` (1 por competência) + `cartas_do_jogador`;
  a checagem de maestria roda no mesmo hook das badges.

### 4.10 Mascote da equipe

*Objetivo: nudge social gentil — sinalizar queda de engajamento coletivo
sem expor ninguém individualmente.*

- Cada equipe tem um mascote pixel procedural com humor semanal: radiante
  (≥80% dos membros ativos na semana) → feliz → neutro → dormindo (<20%).
  Evolui de forma (filhote → adulto → lendário) com semanas consecutivas
  de equipe ativa.
- Aparece no topo do ranking da equipe. NUNCA mostra quem está ativo ou
  não — só o agregado (decisão deliberada de privacidade).
- Backend: cálculo derivado de `respostas` por semana, sem tabela nova.

### 4.11 Prestígio (Nova Jornada+)

*Objetivo: rejogabilidade para quem terminou tudo — o "e agora?" do
veterano.*

- Quem completa a trilha de um tema pode **prestigiar**: o progresso da
  trilha reinicia com modificadores de dificuldade (sem dicas, timer
  −25%, só questões média/difícil) e o perfil ganha uma **estrela de
  prestígio permanente** por ciclo.
- O score/competências do Horizonte 3 **não resetam** (gamificação ≠
  avaliação): o gestor continua vendo a proficiência real acumulada.
- Backend: `prestigio` (jogador, tema, ciclo) + filtro extra no sorteio
  de questões — reusa a infra da dificuldade adaptativa.

### 4.12 Kudos entre colegas

*Objetivo: reconhecimento social positivo — a única mecânica movida por
generosidade, não competição.*

- Cada jogador tem **3 kudos por semana** para dar a colegas (no ranking
  ou após um desafio). Receber kudos rende fichas pequenas; dar kudos
  conta para missão ("reconheça um colega").
- Anti-conluio: kudos recíproco no mesmo dia não rende fichas; teto
  semanal de fichas por kudos recebidos.
- Backend: `kudos` (de, para, semana) com unique por par/semana.

### Mapa mecânica × objetivo × esforço

| Mecânica | Objetivo comportamental | Esforço | Depende de | Status |
|---|---|---|---|---|
| Combo no quiz (4.4) | Tensão momento-a-momento | Baixo | nada | ✅ |
| Economia + loja (4.1, 4.2) | Propósito pós-nível | Médio | nada | ✅ |
| Missões (4.3) | Motivo para abrir hoje | Médio | fichas (4.1) | ✅ diárias |
| Desafio diário (4.8) | Ritual compartilhado | Médio | nada | ✅ |
| Ligas semanais (4.5) | Competição justa | Médio | nada | ✅ |
| Kudos (4.12) | Reconhecimento social | Baixo | fichas (4.1) | — |
| Raid boss (4.7) | Objetivo coletivo | Alto | equipes (H1) | — |
| Cartas (4.9) | Colecionismo educativo | Alto | competências (H1/H3) | — |
| Mascote de equipe (4.10) | Nudge social agregado | Baixo | equipes (H1) | — |
| Temporadas + passe (4.6) | Arco de longo prazo | Alto | fichas, cosméticos | — |
| Prestígio (4.11) | Rejogabilidade | Médio | trilhas por tema (H1) | — |

**Sequência recomendada dentro do horizonte**: ~~4.4 (combo) → 4.1+4.2
(economia+loja) → 4.3 (missões) → 4.8 (desafio diário)~~ ✅ **o núcleo do
loop diário inteiro está implementado e validado** (212 testes de backend,
migrações 22–25 validadas em Postgres local). ~~4.5 (ligas)~~ ✅
**implementada** (migração 27, 241 testes de backend no total). Próximos:
4.12 (kudos) → 4.7 (raid) → 4.10 (mascote) → 4.9 (cartas) → 4.6
(temporadas) → 4.11 (prestígio) — os quatro sociais/coletivos rendem mais
depois que o Horizonte 1 criar equipes de verdade.

### Campanhas e torneios (empacotamento para o gestor)

- **Campanha temática mensal** — evento temporário de 30 dias com badge
  exclusiva e ranking próprio ("Outubro da Segurança") — composição de
  eventos + badges já existentes, novidade é o empacotamento na UI do
  gestor (criar campanha = evento + badge + missões do período de uma
  vez).
- **Torneio entre equipes** — janela em que os desafios assíncronos
  existentes (`desafioService`) são agregados por equipe: soma de
  vitórias vira placar de equipe; pódio rende fichas e cosmético.

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

1. ~~**Núcleo do loop diário de gamificação** (Horizonte 4: combo →
   economia+loja → missões → desafio diário)~~ ✅ **feito** — implementado
   sobre o jogo atual, sem esperar o pivô multi-tema (migrações 22–25,
   fichaService/lojaService/missaoService/desafioDiarioService, página
   /loja, quadro de missões e card do desafio no mapa).
2. Horizonte 1 (fundação multi-tema) — destrava tudo que é corporativo.
3. Pontuação ponderada + competências (Horizonte 3, parte determinística)
   — entrega o "método de avaliar" pedido sem depender de IA.
4. Geração de questões com IA (Horizonte 2) — maior valor percebido.
5. Questão aberta com rubrica por IA (Horizonte 3, parte não
   determinística) — depende da infra de IA do passo 4.
6. Gamificação social e coletiva (Horizonte 4: ligas → kudos → raid →
   mascote) — depende de equipes (H1) para brilhar de verdade.
7. Arcos longos (Horizonte 4: cartas → temporadas → prestígio) — empilham
   sobre economia, competências e trilhas já estabelecidas.
8. Multi-tenancy (Horizonte 5) — antes de qualquer piloto com 2+ empresas.

---

Este roadmap é um documento vivo — atualize conforme itens forem
implementados ou repriorizados.
