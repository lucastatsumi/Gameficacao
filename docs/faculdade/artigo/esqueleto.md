# Esqueleto do artigo (TCC) — rascunho para revisão

> **Status:** proposta inicial. Tudo marcado com `[DEFINIR]` depende de decisão
> sua ou do orientador. Nenhuma referência bibliográfica foi inventada: onde
> falta fonte, há `[CITAR]` e uma sugestão de busca.
> **Regras do curso:** 12–15 páginas (sem resumo/referências), Arial 12,
> sem linguagem pessoal, metodologia no presente/futuro, resultados na mesma
> ordem da metodologia. Ver `../` para os documentos de orientação.

## Título provisório

**GAMIFICAÇÃO NO TREINAMENTO CORPORATIVO: DESENVOLVIMENTO E AVALIAÇÃO DE UMA
PLATAFORMA DE QUIZ PARA ONBOARDING E RECONHECIMENTO DE COLABORADORES**
`[DEFINIR]` — alternativa mais enxuta: "Plataforma web gamificada para
onboarding corporativo: o caso TeamQuest".

Foco assumido: **jogo corporativo (TeamQuest)**. A origem educacional
(Estrutura de Dados) entra como contexto histórico do sistema, não como tema.

---

## Resumo (150–250 palavras) — roteiro, não texto final

Parágrafo único, sem citações, nesta ordem:
1. Problemática: onboarding/treinamento corporativo com baixo engajamento.
2. Objetivo geral.
3. Justificativa.
4. Metodologia (pesquisa aplicada; desenvolvimento + avaliação do sistema).
5. Principais resultados — **só dá para escrever depois de coletar dados**.

Palavras-chave (3–5) sugeridas: gamificação; treinamento corporativo;
onboarding; engajamento; aplicação web.

---

## 1 Introdução (fluxo único, sem subseções)

**1. Motivação/problematização** — por que o treinamento corporativo
tradicional (formulário, vídeo, apresentação) engaja pouco; por que onboarding
e compliance são críticos. `[CITAR]` buscar no Google Acadêmico:
"gamificação treinamento corporativo", "gamification employee training
engagement", "onboarding gamificado".

**2. Pergunta de pesquisa** (não pode ser sim/não) — proposta:
> De que forma mecânicas de gamificação (XP, níveis, badges, ranking, streak e
> desafios em equipe) podem ser incorporadas a uma plataforma de quiz para
> apoiar o onboarding e o reconhecimento de colaboradores, e como avaliar seu
> efeito sobre o engajamento e o desempenho?

**3. Objetivo geral** (uma única ação) — proposta:
> Desenvolver e avaliar uma plataforma web gamificada de treinamento por quiz
> para onboarding e reconhecimento de colaboradores.

**4. Objetivos específicos** (mín. 3, em romanos) — proposta:
(i) levantar na literatura mecânicas de gamificação aplicáveis ao treinamento
corporativo; (ii) projetar a arquitetura e o modelo de dados da plataforma;
(iii) implementar as mecânicas de jogo com regras e pontuação calculadas no
servidor; (iv) implementar salvaguardas contra abuso (anti-farming, limites
de kudos); (v) avaliar o sistema por meio de `[DEFINIR: testes automatizados
e/ou uso com usuários]`.

**5. Justificativa** — contribuição teórica (ligar gamificação a treinamento
corporativo) e prática (sistema funcional, reaproveitável, com relatórios para
gestores). `[CITAR]` dados de mercado sobre custo/eficácia de onboarding.

**6. Estrutura do trabalho** — último parágrafo, descrevendo as seções 2 a 5.

---

## 2 Fundamentação (renomear o título conforme os temas)

Só conceitos da literatura. Temas propostos (um por subseção):

- 2.1 GAMIFICAÇÃO E MOTIVAÇÃO — conceito, elementos (pontos, níveis, badges,
  rankings), teorias de motivação (ex.: autodeterminação). `[CITAR]`
- 2.2 JOGOS SÉRIOS E APRENDIZAGEM — diferença entre gamificação e jogo sério,
  aprendizagem por quiz/retrieval practice. `[CITAR]`
- 2.3 ONBOARDING E TREINAMENTO CORPORATIVO — papel do onboarding, compliance,
  segurança da informação. `[CITAR]`
- 2.4 AVALIAÇÃO E RISCOS DA GAMIFICAÇÃO — farming de pontos, competição
  nociva, separação entre motivar e avaliar. `[CITAR]`
- 2.5 TECNOLOGIAS DA SOLUÇÃO — React, Node.js/Express, PostgreSQL/Supabase,
  autenticação JWT; só o conceito, sem descrever o projeto. `[CITAR]`
  documentação oficial/livros.

Livros do plano de ensino úteis para a seção 3: Cauchick-Miguel (2019),
Medeiros e Tomasi (2021), Perovano (2016), Gil (2018), Yin (2015).

---

## 3 Metodologia (presente/futuro)

### Classificação da pesquisa (propor e justificar com a literatura)

| Grupo | Classificação sugerida | Observação |
|---|---|---|
| Natureza | Aplicada | gera solução prática (o sistema) |
| Abordagem | Quali-quantitativa `[DEFINIR]` | quantitativa se houver métricas de uso/testes |
| Objetivos | Prescritiva e exploratória | propõe solução e explora o tema |
| Procedimentos | Bibliográfica + estudo de caso (+ experimental `[DEFINIR]`) | caso = TeamQuest |

Citar Gil (2002/2018) e Silva e Menezes (2001), como no modelo da disciplina.

### Etapas (ordem cronológica — mesma ordem no capítulo 4)

Derivadas do histórico real do repositório (`docs/ROADMAP*.md`, `database/`):

1. **Pesquisa bibliográfica** — estratégia de busca, bases, palavras-chave,
   critérios de seleção. `[DEFINIR]` bases e termos usados de fato.
2. **Levantamento de requisitos** — do jogo sério original ao pivô corporativo.
3. **Projeto da arquitetura e do modelo de dados** — React + Express +
   Supabase; lógica de jogo no servidor; RLS sem policies.
4. **Implementação do núcleo de jogo** — quiz com correção no servidor, XP,
   níveis, badges, mapa de fases desbloqueável, ranking como view.
5. **Implementação das mecânicas de engajamento** — streak, poderes, missões,
   fichas e loja, ligas semanais, desafios, kudos, raid boss e mascote de
   equipe.
6. **Salvaguardas anti-abuso** — anti-farming de XP, teto diário de fichas,
   limite de kudos e anti-conluio.
7. **Verificação** — suítes de testes automatizados (backend e frontend) e
   auditoria de acessibilidade.
8. **Implantação** — deploy em Vercel/Supabase.
9. **Avaliação com usuários** `[DEFINIR e decidir com o orientador]` — se
   houver pessoas, **exige aprovação do CEP** (plano de ensino). Alternativa
   sem pessoas: avaliar apenas por testes e análise técnica.

---

## 4 Resultados e discussões (mesma ordem da metodologia)

Um bloco por etapa da seção 3. Material já disponível no repositório:

| Etapa | Fonte no repositório | Possível ilustração |
|---|---|---|
| 3 | `docs/arquitetura.md` | Figura: diagrama de arquitetura |
| 3 | `docs/modelo-dados.md` | Figura: diagrama ER |
| 4 | fluxo de tentativa de quiz | Figura: diagrama de sequência |
| 4–5 | telas do frontend | Figuras: mapa, quiz, ranking, perfil `[CAPTURAR]` |
| 5–6 | `database/*.sql` (28 scripts) | Quadro: mecânica × objetivo × salvaguarda |
| 7 | resultado dos testes | Tabela: nº de testes e cobertura `[RODAR]` |
| 9 | dados de uso `[COLETAR]` | Gráficos/tabelas |

Discussão: relacionar cada mecânica à teoria da seção 2 e apontar limitações
(sem dados de uso, amostra, viés). Sem citações diretas neste capítulo.

---

## 5 Considerações finais

Responder ao objetivo geral e a cada objetivo específico; sem citações e sem
repetir resultados. Trabalhos futuros já previstos no `ROADMAP.md`: quizzes
gerados por IA com revisão humana, questões abertas com rubrica, matriz de
competências.

---

## Referências

Ordem alfabética, norma ABNT (NBR 6023). Lista vazia até a busca
bibliográfica. Toda obra citada no texto deve estar aqui e vice-versa.

---

## Pendências antes de escrever o texto

- [ ] Confirmar tema/foco com o orientador e a orientação atual (1ª–4ª).
- [ ] Decidir se haverá avaliação com pessoas (CEP) ou só técnica.
- [ ] Fazer a busca bibliográfica e preencher os `[CITAR]`.
- [ ] Capturar telas e rodar os testes para os resultados.
- [ ] Converter para Word (.docx) usando o modelo da disciplina — PDF não é
      aceito.
