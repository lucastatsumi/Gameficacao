-- ============================================================
-- 31_pivot_tema_fases_badges.sql — Pivô de tema (roadmap v2): o
-- catálogo de módulos e conquistas deixa de falar de Estrutura de
-- Dados/Engenharia de Software e passa a ser o quiz gameficado
-- corporativo — onboarding de novos colaboradores e reconhecimento
-- de desempenho. Renomeia só NOME/DESCRIÇÃO (texto) das fases e
-- badges já existentes — nenhuma coluna, id, ordem, ícone (salvo
-- onde o ícone antigo era um trocadilho específico de CS) ou regra
-- de desbloqueio muda. O conteúdo das questões (enunciados/
-- alternativas) é reescrito separadamente em
-- `32_pivot_tema_questoes.sql`.
-- Aplicar via MCP como migration "31_pivot_tema_fases_badges".
-- ============================================================

-- ---------- Fases (viram "módulos" na trilha de onboarding) ----------
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

-- ---------- Badges ligadas a uma fase específica ----------
-- (as demais — Gabaritou!, Sequência de 10, Raio Veloz, Veterano, Lenda,
-- Chama Acesa, Em Chamas, Imparável, Sem Ajudinha — são genéricas e não
-- referenciam o tema antigo; ficam como estão.)
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
