-- 31_pivot_tema_fases_badges.sql
-- Pivô do produto: de "serious game de Estrutura de Dados" para
-- "plataforma gamificada de treinamento/onboarding corporativo" (ver
-- docs/ROADMAP.md, Horizonte 1). Aqui só se renomeia o CONTEÚDO das fases
-- (agora "módulos" de onboarding) e das badges de conclusão — o schema não
-- muda, toda a lógica de jogo continua data-driven e agnóstica de tema.
-- As questões correspondentes são pivotadas em 32_pivot_tema_questoes*.sql.

update fases set
  nome = 'Boas-vindas & Cultura',
  descricao = 'Missão, valores da empresa e o que esperar do seu primeiro mês por aqui.'
where ordem = 1;

update fases set
  nome = 'Segurança da Informação',
  descricao = 'Senhas fortes, phishing e como lidar com dados sensíveis no dia a dia.'
where ordem = 2;

update fases set
  nome = 'Processos & Ferramentas',
  descricao = 'Como abrir chamados, pedir aprovações e usar os canais certos sem gerar retrabalho.'
where ordem = 3;

update fases set
  nome = 'Comunicação & Colaboração',
  descricao = 'Hierarquia, canais de escalonamento e como dar e receber feedback.'
where ordem = 4;

update fases set
  nome = 'Compliance & Conduta',
  descricao = 'Código de conduta, prioridades e as regras que protegem você e a empresa.'
where ordem = 5;

update fases set
  nome = 'Prioridades em Ação',
  descricao = 'Minigame relâmpago: compare duas atitudes no trabalho e escolha a mais adequada antes que o tempo acabe.'
where ordem = 6;

update fases set
  nome = 'Passo a Passo',
  descricao = 'Minigame: arraste os passos embaralhados de um processo do dia a dia para a ordem certa antes que o tempo acabe.'
where ordem = 7;

update fases set
  nome = 'Excelência & Reconhecimento',
  descricao = 'Metas, feedback contínuo e como funcionam as recompensas e promoções por aqui.'
where ordem = 8;

update badges set
  descricao = 'Conclua o módulo de Boas-vindas & Cultura.'
where tipo_condicao = 'fase_concluida' and (parametro->>'fase_ordem')::int = 1;

update badges set
  nome = 'Cadeado Fechado',
  icone = '🔒',
  descricao = 'Conclua o módulo de Segurança da Informação.'
where tipo_condicao = 'fase_concluida' and (parametro->>'fase_ordem')::int = 2;

update badges set
  nome = 'Sem Gargalo',
  descricao = 'Conclua o módulo de Processos & Ferramentas.'
where tipo_condicao = 'fase_concluida' and (parametro->>'fase_ordem')::int = 3;

update badges set
  nome = 'Boa Escuta',
  icone = '🗣️',
  descricao = 'Conclua o módulo de Comunicação & Colaboração.'
where tipo_condicao = 'fase_concluida' and (parametro->>'fase_ordem')::int = 4;

update badges set
  descricao = 'Conclua o módulo de Compliance & Conduta.'
where tipo_condicao = 'fase_concluida' and (parametro->>'fase_ordem')::int = 5;

update badges set
  nome = 'Referência no Time',
  icone = '🏆',
  descricao = 'Conclua o módulo de Excelência & Reconhecimento.'
where tipo_condicao = 'fase_concluida' and (parametro->>'fase_ordem')::int = 8;
