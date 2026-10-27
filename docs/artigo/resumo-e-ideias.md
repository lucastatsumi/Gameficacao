# Resumo e ideias para o artigo

## Rascunho de resumo

**Status:** texto inicial para revisão; atualizar após executar e registrar a
verificação descrita na metodologia. O rascunho não afirma resultados de
aprendizagem ou engajamento.

Este artigo apresenta o desenvolvimento de uma plataforma web gamificada
voltada ao apoio de ações de onboarding e capacitação corporativa. O problema
abordado é como organizar conteúdos de treinamento em uma experiência que
combine quizzes, progressão e acompanhamento, sem tratar a presença de
mecânicas de jogo como prova de aprendizagem. O objetivo é descrever a
concepção e a implementação da plataforma, bem como analisar sua verificação
técnica. O trabalho é conduzido como desenvolvimento aplicado de software:
apresenta-se a arquitetura da solução, seus principais fluxos e as
funcionalidades implementadas, e propõe-se a verificação por testes
automatizados e cenários funcionais reproduzíveis. A aplicação utiliza
frontend React, API em Node.js e Express e banco de dados PostgreSQL gerenciado
pelo Supabase. Entre seus recursos estão quizzes, trilhas de conteúdo,
pontuação, níveis, badges e ranking. Os resultados devem ser apresentados a
partir das evidências obtidas na execução dos testes e da análise do artefato.
Conclui-se, dentro desse escopo, sobre a viabilidade técnica da solução e
indicam-se como trabalhos futuros avaliações com usuários e estudos sobre
seus efeitos no treinamento.

**Palavras-chave:** gamificação; onboarding; treinamento corporativo;
desenvolvimento de software.

> Antes de submeter, conferir a contagem de palavras e substituir a descrição
> genérica dos resultados pelos achados efetivamente registrados. A faculdade
> exige 150–250 palavras para o resumo.

## Ideias de contribuição

- Documentar uma arquitetura de ponta a ponta para trilhas e quizzes
  corporativos gamificados.
- Mostrar como manter correção e pontuação no servidor e apresentar o
  resultado apenas no momento adequado.
- Descrever como trilhas, XP, níveis, badges e ranking foram integrados aos
  fluxos de quiz.
- Relatar a cobertura e o resultado dos testes técnicos como evidência de
  funcionamento, distinguindo-os de avaliação pedagógica.
- Discutir o que seria necessário para uma avaliação futura com participantes:
  pergunta, instrumento, critérios, autorização e tratamento ético.

## Figuras, tabelas e quadros possíveis

1. **Figura 1 – Arquitetura da plataforma.** Adaptar o diagrama de
   [`../arquitetura.md`](../arquitetura.md); citar e explicar no texto.
2. **Figura 2 – Fluxo de uma tentativa de quiz.** Mostrar início, entrega de
   questões sem gabarito, resposta e finalização.
3. **Figura 3 – Captura da trilha ou do quiz.** Produzir captura atual do
   sistema, remover dados pessoais e descrever o que ela evidencia.
4. **Quadro 1 – Requisitos e funcionalidades.** Relacionar necessidade,
   funcionalidade entregue e evidência de verificação.
5. **Tabela 1 – Resultado dos testes por área.** Preencher após executar a
   suíte; informar o comando, a data e o critério usado. Não estimar números.

Cada ilustração deve ser mencionada e discutida previamente no texto. Usar
legendas e fontes de acordo com o padrão institucional; para material próprio,
identificar autoria e ano conforme orientação recebida.

## O que evitar afirmar sem pesquisa com participantes

- Que a plataforma melhora a aprendizagem ou a retenção de conteúdo.
- Que badges, XP ou ranking aumentam motivação ou engajamento.
- Que o sistema reduz custos, acelera onboarding ou melhora desempenho
  organizacional.
- Que usuários preferem a solução, se não houver instrumento e dados para
  sustentar essa conclusão.

