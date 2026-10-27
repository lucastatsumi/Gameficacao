# TeamQuest: plataforma gamificada para onboarding e reconhecimento de colaboradores

**[NOME COMPLETO DO(A) AUTOR(A)]**  
**Orientador(a): [NOME COMPLETO]**  
**[CURSO] — [INSTITUIÇÃO] — [ANO]**

> **Rascunho para revisão acadêmica.** Complete os campos entre colchetes,
> confirme com a orientação se o recorte corporativo está aprovado para o
> Projeto Final de Curso e substitua a proposta de avaliação pelos dados
> efetivamente coletados. Não foram presumidos participantes nem resultados.

## Resumo

Este trabalho apresenta a TeamQuest, uma plataforma web que utiliza quizzes e
elementos de gamificação para apoiar o onboarding e o reconhecimento de
colaboradores em organizações. A solução reúne quizzes organizados em fases,
progresso por experiência (XP), níveis, badges e ranking. O sistema foi
desenvolvido com React e Vite no frontend, Node.js e Express na API, e
PostgreSQL e Supabase para persistência e autenticação. As regras de negócio
dos quizzes e da progressão são processadas no servidor. Este artigo descreve
o problema, a arquitetura e as funcionalidades implementadas e propõe uma
avaliação funcional e de usabilidade. A efetividade da plataforma para
aprendizagem, engajamento ou retenção de colaboradores ainda depende de
avaliação empírica com participantes e de resultados documentados.

**Palavras-chave:** gamificação; onboarding; treinamento corporativo; quiz;
aplicação web.

## 1. Introdução

O onboarding apresenta a novos colaboradores informações sobre cultura,
processos, ferramentas, segurança e conduta. Quando esses conteúdos são
oferecidos de forma pouco interativa, pode ser difícil manter o interesse e
acompanhar a compreensão dos participantes. Uma plataforma digital pode
organizar esses conteúdos em atividades curtas e registrar o progresso,
facilitando tanto a participação quanto o acompanhamento.

A TeamQuest é uma aplicação web que organiza quizzes em uma trilha de fases e
combina as atividades com elementos de jogo, como XP, níveis, badges e
ranking. A proposta é apoiar treinamentos e ações de reconhecimento, sem
confundir a pontuação lúdica com uma medida conclusiva de competência
profissional.

**Problema de pesquisa:** como uma plataforma web com quizzes e elementos de
gamificação pode apoiar a participação em atividades de onboarding e
reconhecimento de colaboradores?

**Objetivo geral:** desenvolver e descrever uma plataforma web gamificada para
organizar quizzes de treinamento corporativo e acompanhar a progressão dos
participantes.

**Objetivos específicos:**

- organizar conteúdos de treinamento em quizzes e fases;
- implementar mecanismos de progressão, como XP, níveis, badges e ranking;
- oferecer recursos de administração de quizzes e acompanhamento de
desempenho;
- definir uma estratégia de avaliação funcional e de usabilidade da solução.

## 2. Fundamentação teórica

### 2.1 Gamificação

Deterding et al. (2011) definem gamificação como o uso de elementos de design
de jogos em contextos que não são jogos. Essa definição permite distinguir a
aplicação de mecânicas como progressão, feedback e desafios de um jogo completo.
Na TeamQuest, XP, badges, fases desbloqueáveis e ranking são usados para
estruturar o percurso e tornar o progresso visível. A presença dessas
mecânicas, por si só, não comprova aumento de motivação ou aprendizagem; esses
efeitos precisam ser investigados com usuários.

### 2.2 Motivação e aprendizagem

A teoria da autodeterminação discute a relação entre motivação e necessidades
psicológicas como autonomia, competência e vínculo social (DECI; RYAN, 2000).
Em uma aplicação gamificada, feedback de progresso e desafios graduais podem
ser considerados decisões de design relacionadas a esses conceitos. A
adequação dessas decisões ao público e ao contexto da organização deve ser
verificada na avaliação, e não assumida como resultado.

## 3. Metodologia

O trabalho apresenta o desenvolvimento de um artefato de software. A solução
foi implementada como aplicação web, com frontend em React/Vite, API em
Node.js/Express e banco PostgreSQL gerenciado pelo Supabase. A autenticação é
realizada pelo Supabase Auth; a API valida os tokens e executa as regras de
jogo e o acesso aos dados.

Para a avaliação acadêmica, recomenda-se documentar as seguintes etapas:

1. **Avaliação funcional:** executar fluxos de cadastro e acesso, início e
   conclusão de quiz, registro de respostas e atualização da progressão;
2. **Avaliação de usabilidade:** solicitar que participantes representativos
   realizem tarefas definidas e registrem dificuldades e percepções;
3. **Análise:** apresentar os procedimentos, os critérios, o perfil e a
   quantidade de participantes, os resultados observados e as limitações.

**Dados a completar:** [período e ambiente da avaliação]; [quantidade e perfil
dos participantes]; [tarefas e instrumentos utilizados]; [procedimentos de
consentimento e proteção dos dados, se aplicáveis].

## 4. Desenvolvimento da plataforma

### 4.1 Arquitetura

O frontend apresenta as páginas de autenticação, mapa de fases, quizzes,
ranking, perfil e administração. A API Express centraliza as regras de
negócio e comunica-se com o PostgreSQL pelo cliente Supabase. O frontend usa
Supabase Auth para autenticação, mas as operações de dados da aplicação
passam pela API.

A correção das respostas e o cálculo da progressão são feitos no servidor.
Durante a execução de um quiz, a API envia as questões sem o gabarito; após o
envio de uma resposta, devolve o resultado e a explicação correspondente.
Essa separação evita expor antecipadamente a resposta correta ao cliente.

### 4.2 Funcionalidades

Entre os recursos documentados no projeto estão:

- quizzes e fases com progressão;
- XP, níveis, badges e ranking;
- quizzes personalizados e ferramentas administrativas;
- registro de tentativas e respostas para relatórios de desempenho.

O sistema utiliza PostgreSQL para persistir perfis, quizzes, tentativas e
progressão. O ranking é calculado a partir dos dados de XP, e não mantido como
uma posição independente.

## 5. Resultados e discussão

A implementação reúne os componentes necessários para apresentar quizzes,
processar respostas e registrar progressão e desempenho. A arquitetura separa
interface, API e persistência, concentrando no servidor as regras de
pontuação. Esses resultados descrevem a solução técnica, mas não demonstram
por si só sua eficácia pedagógica ou impacto organizacional.

**Inserir aqui os resultados reais da avaliação:** [resultados dos testes
funcionais]; [observações ou métricas de usabilidade]; [feedback dos
participantes]; [problemas encontrados e correções realizadas]. Se a avaliação
com usuários não tiver sido realizada, declarar essa limitação explicitamente
e não atribuir à plataforma efeitos de aprendizagem, motivação ou retenção.

## 6. Considerações finais

Este trabalho apresentou a TeamQuest como uma plataforma web para organizar
quizzes de onboarding e reconhecimento com elementos de gamificação. A
solução implementa uma trilha de atividades, mecanismos de progressão e
recursos de acompanhamento, com regras de jogo processadas pela API.

Como próximos passos, propõe-se avaliar os fluxos funcionais e a usabilidade
com participantes representativos e, em estudos posteriores, investigar
resultados de aprendizagem e engajamento por meio de métricas e procedimentos
definidos previamente. A principal limitação desta versão do artigo é a
ausência de dados empíricos documentados, que devem ser incluídos antes da
submissão.

## Referências

DECI, Edward L.; RYAN, Richard M. The “what” and “why” of goal pursuits:
Human needs and the self-determination of behavior. *Psychological Inquiry*,
v. 11, n. 4, p. 227–268, 2000. DOI: 10.1207/S15327965PLI1104_01.

DETERDING, Sebastian et al. From game design elements to gamefulness:
Defining “gamification”. In: *Proceedings of the 15th International Academic
MindTrek Conference*. New York: ACM, 2011. p. 9–15. DOI:
10.1145/2181037.2181040.
