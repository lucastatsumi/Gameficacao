-- ============================================================
-- 35_temas_competencias.sql — Horizonte 1 (fundação multi-tema)
--
-- * temas: a unidade que a empresa seleciona. empresa_id null = tema
--   do CATÁLOGO global (visível para qualquer empresa que o ativar);
--   empresa_id preenchido = tema próprio daquela empresa (a coluna e a
--   FK para `empresas` entram na 36).
-- * fases viram "módulos" de um tema (fases.tema_id). O conteúdo atual
--   vira o tema de catálogo "Onboarding Corporativo". fases.ordem
--   continua única no banco inteiro (as badges de conclusão referenciam
--   fase_ordem); módulos de outros temas usam faixas de ordem próprias
--   (100+, 200+...) e o frontend mostra a posição DENTRO do tema.
-- * competencias + questao_competencias: tags N:N — base da matriz de
--   competências (Horizonte 3) e das cartas colecionáveis (4.9).
--   `resumo` é o verso da carta: material de consulta rápida.
-- * turma_temas: trilhas por equipe — o gestor escolhe quais temas cada
--   equipe vê. Equipe sem nenhuma atribuição vê todos os temas da
--   empresa (comportamento anterior preservado).
-- ============================================================

create table temas (
  id          serial primary key,
  nome        text not null,
  descricao   text,
  icone       text not null default 'map-pin',
  empresa_id  uuid,                       -- FK adicionada na 36
  ativo       boolean not null default true,
  criado_por  uuid references profiles(id),
  created_at  timestamptz not null default now()
);

alter table fases add column tema_id int references temas(id);

create table competencias (
  id         serial primary key,
  tema_id    int  not null references temas(id) on delete cascade,
  nome       text not null,
  descricao  text,
  resumo     text not null default '',
  unique (tema_id, nome)
);

create table questao_competencias (
  questao_id     uuid not null references questoes(id) on delete cascade,
  competencia_id int  not null references competencias(id) on delete cascade,
  primary key (questao_id, competencia_id)
);

create table turma_temas (
  turma_id uuid not null references turmas(id) on delete cascade,
  tema_id  int  not null references temas(id)  on delete cascade,
  primary key (turma_id, tema_id)
);

create index idx_fases_tema on fases (tema_id, ordem);
create index idx_questao_competencias_comp on questao_competencias (competencia_id);
create index idx_competencias_tema on competencias (tema_id);

alter table temas                enable row level security;
alter table competencias         enable row level security;
alter table questao_competencias enable row level security;
alter table turma_temas          enable row level security;

-- ==================== Tema 1: Onboarding (conteúdo atual) ====================

insert into temas (nome, descricao, icone) values
  ('Onboarding Corporativo', 'Cultura, segurança, processos, comunicação, conduta e reconhecimento: a trilha de integração de quem chega.', 'map-pin'),
  ('LGPD e Privacidade', 'Como tratar dados pessoais no dia a dia: bases legais, direitos do titular e o que fazer num incidente.', 'lock'),
  ('Atendimento ao Cliente', 'Escuta ativa, reclamações difíceis e promessas que o time consegue cumprir.', 'users'),
  ('Liderança e Gestão de Pessoas', 'Feedback, delegação e conversas 1:1 para quem passou a liderar um time.', 'trophy');

update fases set tema_id = (select id from temas where nome = 'Onboarding Corporativo') where tema_id is null;

-- Uma competência por módulo do onboarding (todas as questões do módulo
-- recebem a tag do módulo).
insert into competencias (tema_id, nome, descricao, resumo)
select (select id from temas where nome = 'Onboarding Corporativo'), c.nome, c.descricao, c.resumo
from (values
  ('Cultura e valores', 'Entender missão, valores e o que se espera no início da jornada.',
   'Os valores da empresa são o critério de desempate quando duas orientações parecem conflitar. Na dúvida, pergunte ao gestor ou ao buddy — e siga o que está documentado.'),
  ('Segurança da informação', 'Senhas, phishing e cuidado com dados no dia a dia.',
   'Senha é pessoal e intransferível. E-mail urgente pedindo clique ou dado sensível? Verifique o remetente pelo canal oficial antes de agir e reporte ao time de segurança.'),
  ('Processos internos', 'Usar os canais e fluxos oficiais (chamados, aprovações, reembolsos).',
   'Todo pedido tem um canal oficial: chamado para TI, sistema para reembolso, fluxo de aprovação para compras. Atalhos informais geram retrabalho e falta de rastreabilidade.'),
  ('Comunicação e colaboração', 'Escalonamento, canais certos e feedback.',
   'Comunique no canal adequado ao público: o que afeta todos vai para o canal oficial, o que é individual vai para conversa direta. Escale com contexto e histórico.'),
  ('Ética e conduta', 'Código de conduta, conflito de interesses e brindes.',
   'Conflito de interesses se declara, não se esconde. Brindes e presentes seguem o limite da política; na dúvida, consulte o compliance antes de aceitar.'),
  ('Tomada de decisão', 'Escolher a atitude mais adequada sob pressão de tempo.',
   'Sob pressão, priorize o que tem impacto e prazo; combine o resto. Ouvir antes de responder evita a maioria das escaladas.'),
  ('Procedimentos do dia a dia', 'Executar passo a passo os processos mais comuns.',
   'Procedimento bem feito começa pelo registro no canal oficial e termina com a confirmação de quem é responsável pela próxima etapa.'),
  ('Desempenho e reconhecimento', 'Metas, avaliação, feedback contínuo e reconhecimento entre colegas.',
   'Reconhecimento específico e próximo do fato vale mais que elogio genérico. Metas boas são mensuráveis; avaliação formal e feedback contínuo se complementam.')
) as c(nome, descricao, resumo);

insert into questao_competencias (questao_id, competencia_id)
select q.id, c.id
from questoes q
join fases f on f.id = q.fase_id
join competencias c on c.tema_id = f.tema_id
  and c.nome = (array['Cultura e valores', 'Segurança da informação', 'Processos internos',
                      'Comunicação e colaboração', 'Ética e conduta', 'Tomada de decisão',
                      'Procedimentos do dia a dia', 'Desempenho e reconhecimento'])[f.ordem]
where f.ordem between 1 and 8
on conflict do nothing;

-- ==================== Competências dos temas novos ====================

insert into competencias (tema_id, nome, descricao, resumo)
select t.id, c.nome, c.descricao, c.resumo
from (values
  ('LGPD e Privacidade', 'Bases legais', 'Quando a empresa pode tratar dados pessoais.',
   'A LGPD (Lei 13.709/2018) prevê várias bases legais para tratar dados pessoais — consentimento é só uma delas. Execução de contrato, obrigação legal e legítimo interesse também são bases válidas.'),
  ('LGPD e Privacidade', 'Direitos do titular', 'O que a pessoa dona do dado pode pedir.',
   'O titular pode pedir confirmação e acesso aos dados, correção, eliminação de dados desnecessários, portabilidade e informação sobre compartilhamento. Pedidos vão para o encarregado (DPO).'),
  ('LGPD e Privacidade', 'Minimização e cuidado no uso', 'Coletar e usar só o necessário.',
   'Princípio da necessidade: colete apenas o dado indispensável para a finalidade informada. Dados sensíveis (saúde, biometria, religião, origem racial...) exigem cuidado redobrado.'),
  ('LGPD e Privacidade', 'Incidentes com dados', 'O que fazer quando dados vazam ou são expostos.',
   'Suspeitou de incidente com dados pessoais? Reporte imediatamente ao encarregado/time de segurança pelo canal oficial. A empresa precisa avaliar o risco e comunicar a ANPD e os titulares quando houver risco relevante.'),
  ('Atendimento ao Cliente', 'Escuta ativa', 'Entender o problema real antes de responder.',
   'Ouça sem interromper, confirme o que entendeu com suas palavras e só então proponha caminhos. Cliente que se sente ouvido já está meio caminho mais calmo.'),
  ('Atendimento ao Cliente', 'Resolução de reclamações', 'Transformar uma reclamação em solução.',
   'Reconheça o problema, assuma a condução (mesmo que a causa seja de outra área), dê um prazo realista e retorne antes do prazo vencer.'),
  ('Atendimento ao Cliente', 'Expectativas e promessas', 'Prometer só o que o time consegue cumprir.',
   'Promessa quebrada custa mais que um "não" bem explicado. Ofereça alternativas reais e registre o combinado no sistema.'),
  ('Liderança e Gestão de Pessoas', 'Feedback', 'Dar feedback específico, frequente e útil.',
   'Feedback bom descreve a situação, o comportamento e o impacto — sem rótulos sobre a pessoa — e termina com um próximo passo combinado.'),
  ('Liderança e Gestão de Pessoas', 'Delegação', 'Distribuir responsabilidade com clareza.',
   'Delegar é transferir o resultado, não só a tarefa: deixe claro o que é "pronto", o prazo, a autonomia e quando vocês vão alinhar.'),
  ('Liderança e Gestão de Pessoas', 'Conversas 1:1', 'Usar o 1:1 para desenvolvimento, não para status.',
   'O 1:1 é o espaço da pessoa liderada: carreira, bloqueios, bem-estar. Status de projeto cabe em outro ritual.')
) as c(tema, nome, descricao, resumo)
join temas t on t.nome = c.tema;

-- ==================== Módulos dos temas novos ====================

insert into fases (nome, descricao, ordem, fase_requisito_id, tema_id) values
  ('Fundamentos da LGPD', 'Bases legais, direitos do titular e minimização de dados no seu dia a dia.', 101, null,
   (select id from temas where nome = 'LGPD e Privacidade')),
  ('Excelência no Atendimento', 'Escuta ativa, reclamações e expectativas: situações reais de atendimento.', 201, null,
   (select id from temas where nome = 'Atendimento ao Cliente')),
  ('Primeiros Passos na Liderança', 'Feedback, delegação e 1:1 para quem acabou de assumir um time.', 301, null,
   (select id from temas where nome = 'Liderança e Gestão de Pessoas'));

-- Insere uma questão de múltipla escolha + alternativas + tag de
-- competência num só statement (CTEs de escrita rodam todas).
create or replace function pg_temp.nova_questao(
  p_ordem int, p_competencia text, p_dificuldade dificuldade_questao, p_enunciado text,
  p_alts jsonb -- [{letra, texto, correta, explicacao}, ...]
) returns void language plpgsql as $$
declare
  v_id uuid;
  v_fase int := (select id from fases where ordem = p_ordem);
begin
  insert into questoes (fase_id, enunciado, linguagem, dificuldade, tempo_limite_seg, xp_valor)
  values (v_fase, p_enunciado, 'texto', p_dificuldade,
          case p_dificuldade when 'facil' then 45 when 'media' then 60 else 75 end,
          case p_dificuldade when 'facil' then 10 when 'media' then 15 else 25 end)
  returning id into v_id;

  insert into alternativas (questao_id, letra, texto, correta, explicacao)
  select v_id, a->>'letra', a->>'texto', (a->>'correta')::boolean, a->>'explicacao'
  from jsonb_array_elements(p_alts) a;

  insert into questao_competencias (questao_id, competencia_id)
  select v_id, c.id from competencias c
  join fases f on f.tema_id = c.tema_id
  where f.id = v_fase and c.nome = p_competencia;
end $$;

-- ---------- LGPD ----------
select pg_temp.nova_questao(101, 'Bases legais', 'facil',
  'Um colega diz que a empresa só pode usar os dados pessoais de um cliente se ele tiver clicado em "aceito" num termo de consentimento. Isso está correto segundo a LGPD?',
  '[{"letra":"A","texto":"Não: o consentimento é só uma das bases legais; cumprir um contrato ou uma obrigação legal, por exemplo, também autoriza o tratamento.","correta":true,"explicacao":"Correto! A LGPD lista várias bases legais. Emitir a nota fiscal de uma compra, por exemplo, se apoia em obrigação legal — não depende de consentimento."},
    {"letra":"B","texto":"Sim: sem consentimento expresso nenhum dado pessoal pode ser usado.","correta":false,"explicacao":"É um mito comum. Se fosse assim, a empresa não poderia nem cumprir obrigações fiscais sem pedir permissão."},
    {"letra":"C","texto":"Não: a LGPD só se aplica a dados de saúde, então dados comuns podem ser usados livremente.","correta":false,"explicacao":"A LGPD vale para qualquer dado pessoal — nome, e-mail, CPF. Dados de saúde são uma categoria especial (sensível), com regras ainda mais rígidas."},
    {"letra":"D","texto":"Sim, mas apenas para clientes pessoa jurídica.","correta":false,"explicacao":"Dados de empresas (CNPJ, razão social) nem são dados pessoais. A lei protege pessoas naturais."}]');

select pg_temp.nova_questao(101, 'Direitos do titular', 'facil',
  'Uma cliente liga pedindo para saber quais dados pessoais dela a empresa guarda. Qual é o encaminhamento correto?',
  '[{"letra":"A","texto":"Registrar o pedido e encaminhá-lo ao encarregado (DPO) ou ao canal de privacidade da empresa, que responde formalmente.","correta":true,"explicacao":"Correto! Acesso aos dados é um direito do titular. O canal de privacidade garante que a resposta seja completa, segura e dentro do prazo."},
    {"letra":"B","texto":"Dizer que essa informação é sigilosa e não pode ser compartilhada.","correta":false,"explicacao":"Os dados são da própria cliente — negar acesso desrespeita um direito garantido pela LGPD."},
    {"letra":"C","texto":"Exportar a ficha dela do sistema e mandar por WhatsApp na hora.","correta":false,"explicacao":"Boa intenção, mas sem confirmar a identidade e por um canal não oficial você pode entregar dados para a pessoa errada."},
    {"letra":"D","texto":"Pedir que ela entre com uma ação judicial para obter os dados.","correta":false,"explicacao":"Não é preciso processo judicial: o pedido é feito diretamente à empresa, que tem o dever de responder."}]');

select pg_temp.nova_questao(101, 'Minimização e cuidado no uso', 'media',
  'Você está montando um formulário de inscrição para um evento gratuito da empresa. Alguém sugere pedir também CPF, data de nascimento e renda "porque pode ser útil no futuro". O que fazer?',
  '[{"letra":"A","texto":"Pedir só os dados necessários para o evento (ex.: nome e e-mail) e deixar de fora o que não tem finalidade definida.","correta":true,"explicacao":"Correto! É o princípio da necessidade: coletar \"porque pode ser útil\" não é finalidade legítima e aumenta o risco num eventual vazamento."},
    {"letra":"B","texto":"Pedir tudo, mas marcar os campos extras como opcionais.","correta":false,"explicacao":"Mesmo opcional, o dado coletado sem finalidade clara continua sendo um risco — e o formulário induz a pessoa a preencher."},
    {"letra":"C","texto":"Pedir tudo, desde que o formulário tenha um aviso de privacidade.","correta":false,"explicacao":"Aviso de privacidade não legitima coletar dado desnecessário; ele informa a finalidade, e aqui ela não existe."},
    {"letra":"D","texto":"Pedir tudo e apagar depois de um ano.","correta":false,"explicacao":"Definir prazo de retenção é bom, mas não resolve a coleta sem finalidade."}]');

select pg_temp.nova_questao(101, 'Minimização e cuidado no uso', 'media',
  'Qual destes dados é considerado dado pessoal SENSÍVEL pela LGPD, exigindo cuidado redobrado?',
  '[{"letra":"A","texto":"A informação de que um colaborador tem uma condição de saúde, registrada num atestado.","correta":true,"explicacao":"Correto! Dados de saúde estão na lista de dados sensíveis da LGPD, ao lado de biometria, origem racial, religião, opinião política e filiação sindical, entre outros."},
    {"letra":"B","texto":"O e-mail corporativo do colaborador.","correta":false,"explicacao":"E-mail é dado pessoal comum: precisa de cuidado, mas não está na categoria de sensíveis."},
    {"letra":"C","texto":"O cargo do colaborador.","correta":false,"explicacao":"Cargo é informação profissional comum, não sensível."},
    {"letra":"D","texto":"O CNPJ do fornecedor.","correta":false,"explicacao":"CNPJ identifica uma empresa, não uma pessoa natural — nem é dado pessoal."}]');

select pg_temp.nova_questao(101, 'Incidentes com dados', 'media',
  'Você enviou por engano uma planilha com nomes e telefones de clientes para um fornecedor que não deveria recebê-la. O que fazer primeiro?',
  '[{"letra":"A","texto":"Comunicar imediatamente o ocorrido ao encarregado (DPO) ou time de segurança pelo canal oficial, com os detalhes do envio.","correta":true,"explicacao":"Correto! A empresa precisa avaliar rápido o risco e, se for o caso, comunicar a ANPD e os titulares. Cada hora de atraso dificulta conter o incidente."},
    {"letra":"B","texto":"Pedir ao fornecedor que apague o arquivo e não contar a ninguém, já que foi sem querer.","correta":false,"explicacao":"Pedir a exclusão pode até ajudar, mas esconder o incidente impede a empresa de cumprir suas obrigações legais."},
    {"letra":"C","texto":"Esperar para ver se o fornecedor vai usar os dados antes de avisar alguém.","correta":false,"explicacao":"A avaliação de risco é da empresa, e o tempo conta. Esperar só aumenta o dano possível."},
    {"letra":"D","texto":"Avisar os clientes por conta própria, ligando um a um.","correta":false,"explicacao":"A comunicação aos titulares precisa ser coordenada pela empresa, com informação correta e completa."}]');

select pg_temp.nova_questao(101, 'Direitos do titular', 'dificil',
  'Um ex-cliente pede a eliminação de todos os seus dados. Parte deles está em notas fiscais que a empresa é obrigada por lei a guardar por alguns anos. Qual é a resposta mais adequada?',
  '[{"letra":"A","texto":"Eliminar o que não tem mais finalidade e explicar ao titular que os dados das notas fiscais serão mantidos pelo prazo legal, por obrigação legal.","correta":true,"explicacao":"Correto! O direito à eliminação tem exceções, como o cumprimento de obrigação legal. O caminho é atender no que for possível e explicar com transparência o que fica e por quê."},
    {"letra":"B","texto":"Eliminar tudo, inclusive as notas fiscais, porque o pedido do titular sempre prevalece.","correta":false,"explicacao":"Apagar documentos fiscais obrigatórios descumpre outra lei. A LGPD prevê a guarda quando há obrigação legal."},
    {"letra":"C","texto":"Recusar o pedido inteiro, já que parte dos dados precisa ser mantida.","correta":false,"explicacao":"A exceção vale só para os dados com obrigação legal; o restante deve ser eliminado."},
    {"letra":"D","texto":"Ignorar o pedido, porque ex-clientes não têm mais direitos sobre os dados.","correta":false,"explicacao":"Os direitos do titular não acabam quando o contrato termina."}]');

-- ---------- Atendimento ----------
select pg_temp.nova_questao(201, 'Escuta ativa', 'facil',
  'Um cliente começa a explicar um problema no pedido e você já acha que sabe qual é a solução. O que fazer?',
  '[{"letra":"A","texto":"Deixar o cliente terminar, confirmar com suas palavras o que entendeu e só então propor a solução.","correta":true,"explicacao":"Correto! Confirmar o entendimento evita resolver o problema errado e mostra ao cliente que ele foi ouvido."},
    {"letra":"B","texto":"Interromper para adiantar a solução e ganhar tempo.","correta":false,"explicacao":"Interromper passa a sensação de pressa e você pode acabar resolvendo outro problema, não o dele."},
    {"letra":"C","texto":"Transferir para outra área, para que o cliente explique de novo com mais calma.","correta":false,"explicacao":"Fazer o cliente repetir a história é uma das maiores fontes de irritação no atendimento."},
    {"letra":"D","texto":"Enviar um link da central de ajuda e encerrar o contato.","correta":false,"explicacao":"Conteúdo de autoatendimento complementa, mas não substitui ouvir o caso concreto."}]');

select pg_temp.nova_questao(201, 'Resolução de reclamações', 'media',
  'O problema do cliente foi causado por outra área da empresa. Qual é a melhor postura no atendimento?',
  '[{"letra":"A","texto":"Assumir a condução do caso, acionar a área responsável internamente e manter o cliente informado até a solução.","correta":true,"explicacao":"Correto! Para o cliente existe uma empresa só. Quem atende é dono da experiência, mesmo quando a causa está em outra área."},
    {"letra":"B","texto":"Explicar que a culpa é da outra área e passar o telefone dela.","correta":false,"explicacao":"Jogar a responsabilidade para outra área transfere o problema ao cliente e passa desorganização."},
    {"letra":"C","texto":"Prometer que o problema já está resolvido, para acalmar o cliente.","correta":false,"explicacao":"Promessa sem base vira uma segunda reclamação quando não se cumpre."},
    {"letra":"D","texto":"Pedir ao cliente que abra uma reclamação formal no site.","correta":false,"explicacao":"Burocratizar a reclamação aumenta o esforço do cliente justamente quando ele já está insatisfeito."}]');

select pg_temp.nova_questao(201, 'Expectativas e promessas', 'media',
  'O cliente pergunta quando o reembolso vai cair. Você não tem certeza do prazo. O que responder?',
  '[{"letra":"A","texto":"Consultar o prazo oficial (ou a área responsável) antes de responder e, se precisar, combinar um retorno com horário definido.","correta":true,"explicacao":"Correto! Informação confiável com retorno combinado vale mais que uma resposta rápida e errada."},
    {"letra":"B","texto":"Dizer \"cai amanhã\" para encerrar a conversa satisfeito.","correta":false,"explicacao":"Se não cair amanhã, o cliente volta mais irritado e a confiança na empresa cai junto."},
    {"letra":"C","texto":"Dizer que não sabe e que ele terá de esperar.","correta":false,"explicacao":"Assumir que não sabe é honesto, mas falta o compromisso de buscar a resposta."},
    {"letra":"D","texto":"Dar o maior prazo possível para não errar.","correta":false,"explicacao":"Inflar o prazo pode gerar insatisfação desnecessária e ainda assim não ser verdade."}]');

select pg_temp.nova_questao(201, 'Escuta ativa', 'media',
  'O cliente está muito irritado e falando alto. Qual é a primeira atitude mais eficaz?',
  '[{"letra":"A","texto":"Manter a calma, reconhecer a frustração dele (\"entendo que isso atrapalhou seu dia\") e demonstrar que vai ajudar.","correta":true,"explicacao":"Correto! Validar a emoção desarma a escalada e abre espaço para resolver o problema."},
    {"letra":"B","texto":"Pedir que ele se acalme, senão não será possível atendê-lo.","correta":false,"explicacao":"Mandar \"se acalmar\" costuma ser ouvido como desprezo pela frustração e piora a situação."},
    {"letra":"C","texto":"Responder no mesmo tom para mostrar firmeza.","correta":false,"explicacao":"Elevar o tom transforma o atendimento numa disputa."},
    {"letra":"D","texto":"Colocar a ligação em espera até ele se acalmar sozinho.","correta":false,"explicacao":"Espera sem aviso é lida como abandono e aumenta a irritação."}]');

select pg_temp.nova_questao(201, 'Resolução de reclamações', 'dificil',
  'Você combinou retornar ao cliente até sexta, mas a área responsável ainda não resolveu o problema. É quinta à tarde. O que fazer?',
  '[{"letra":"A","texto":"Avisar o cliente antes do prazo vencer, explicar o status com honestidade e combinar uma nova data com base no que a área informou.","correta":true,"explicacao":"Correto! Avisar antes do prazo mantém a confiança, mesmo sem solução. O pior cenário é o cliente ter que cobrar."},
    {"letra":"B","texto":"Não ligar até ter a solução, para não dar notícia ruim.","correta":false,"explicacao":"Silêncio depois do prazo combinado é a pior notícia possível para o cliente."},
    {"letra":"C","texto":"Ligar na sexta dizendo que está resolvido e torcer para dar certo.","correta":false,"explicacao":"Informar algo falso troca um atraso por uma quebra de confiança."},
    {"letra":"D","texto":"Transferir o caso para um colega para não ter de dar a notícia.","correta":false,"explicacao":"Passar o caso adiante sem contexto só atrasa mais e desvia a responsabilidade."}]');

select pg_temp.nova_questao(201, 'Expectativas e promessas', 'facil',
  'Depois de resolver o problema do cliente por telefone, qual é a boa prática antes de encerrar?',
  '[{"letra":"A","texto":"Registrar no sistema o que foi feito e combinado, e confirmar com o cliente se ficou alguma dúvida.","correta":true,"explicacao":"Correto! O registro garante continuidade: se o cliente voltar, quem atender sabe o histórico e não precisa começar do zero."},
    {"letra":"B","texto":"Encerrar logo para atender o próximo da fila.","correta":false,"explicacao":"Agilidade importa, mas sem registro a próxima interação começa do zero."},
    {"letra":"C","texto":"Anotar o caso num caderno pessoal.","correta":false,"explicacao":"Anotação pessoal não fica acessível para o time e pode conter dados do cliente fora dos sistemas oficiais."},
    {"letra":"D","texto":"Pedir ao cliente que guarde o protocolo e não registrar mais nada.","correta":false,"explicacao":"O protocolo ajuda o cliente, mas o histórico do que foi feito precisa estar no sistema."}]');

-- ---------- Liderança ----------
select pg_temp.nova_questao(301, 'Feedback', 'facil',
  'Qual destes feedbacks é mais útil para quem recebe?',
  '[{"letra":"A","texto":"\"Na apresentação de ontem, você explicou os números com muita clareza e o cliente fechou o escopo na hora.\"","correta":true,"explicacao":"Correto! É específico (situação, comportamento, impacto) e mostra o que vale repetir."},
    {"letra":"B","texto":"\"Você é muito bom, continue assim.\"","correta":false,"explicacao":"Elogio genérico é agradável, mas não diz o que exatamente funcionou."},
    {"letra":"C","texto":"\"Você precisa ser mais proativo.\"","correta":false,"explicacao":"Sem exemplo concreto, a pessoa não sabe o que mudar."},
    {"letra":"D","texto":"\"Todo mundo comentou que você foi bem.\"","correta":false,"explicacao":"Feedback de terceiros sem detalhes não ajuda a pessoa a se desenvolver."}]');

select pg_temp.nova_questao(301, 'Feedback', 'media',
  'Uma pessoa do seu time entregou um relatório com vários erros pela segunda vez. Qual é a melhor abordagem?',
  '[{"letra":"A","texto":"Conversar em particular, mostrar exemplos concretos dos erros e do impacto, ouvir o que está acontecendo e combinar juntos como evitar.","correta":true,"explicacao":"Correto! Feedback corretivo em particular, com fatos e escuta, procura a causa (prazo? ferramenta? clareza do pedido?) em vez de só apontar o erro."},
    {"letra":"B","texto":"Corrigir você mesmo os erros sem comentar, para evitar desconforto.","correta":false,"explicacao":"Evitar a conversa tira da pessoa a chance de melhorar e sobrecarrega você."},
    {"letra":"C","texto":"Apontar os erros na reunião do time, para que todos aprendam.","correta":false,"explicacao":"Expor a pessoa em público gera constrangimento e defensividade."},
    {"letra":"D","texto":"Esperar a avaliação anual para falar sobre isso.","correta":false,"explicacao":"Feedback tardio perde o contexto e deixa o problema se repetir por meses."}]');

select pg_temp.nova_questao(301, 'Delegação', 'media',
  'Você vai delegar a organização de um evento interno para uma pessoa do time. O que é essencial combinar?',
  '[{"letra":"A","texto":"O resultado esperado, o prazo, o orçamento e a autonomia que ela tem, além de quando vocês vão alinhar o andamento.","correta":true,"explicacao":"Correto! Delegar é transferir o resultado com clareza de limites. Sem isso, ou a pessoa trava, ou você vira microgerente."},
    {"letra":"B","texto":"Apenas o nome do evento — detalhar demais tira a autonomia.","correta":false,"explicacao":"Autonomia sem clareza de objetivo e limites gera retrabalho e frustração."},
    {"letra":"C","texto":"Cada passo que ela deve seguir, para garantir que seja feito do seu jeito.","correta":false,"explicacao":"Ditar cada passo é passar a execução, não a responsabilidade — e impede a pessoa de crescer."},
    {"letra":"D","texto":"Que ela deve te copiar em todos os e-mails sobre o evento.","correta":false,"explicacao":"Acompanhar faz parte, mas copiar tudo sinaliza desconfiança e não substitui alinhar o objetivo."}]');

select pg_temp.nova_questao(301, 'Conversas 1:1', 'facil',
  'Qual é o uso mais valioso de uma conversa 1:1 entre líder e pessoa liderada?',
  '[{"letra":"A","texto":"Falar sobre desenvolvimento, bloqueios, bem-estar e carreira da pessoa — a pauta é principalmente dela.","correta":true,"explicacao":"Correto! O 1:1 é o espaço da pessoa liderada. Status de projeto cabe em rituais do time."},
    {"letra":"B","texto":"Revisar o status de cada tarefa em andamento.","correta":false,"explicacao":"Usar o 1:1 só para status desperdiça o único espaço dedicado a desenvolvimento."},
    {"letra":"C","texto":"Comunicar decisões que já foram tomadas para o time inteiro.","correta":false,"explicacao":"Comunicados gerais vão para o time; o 1:1 é para o que é individual."},
    {"letra":"D","texto":"Só acontecer quando houver um problema de desempenho.","correta":false,"explicacao":"1:1 só em crise vira sinônimo de bronca e perde o papel de prevenção."}]');

select pg_temp.nova_questao(301, 'Delegação', 'dificil',
  'Você delegou uma entrega e percebe, na metade do prazo, que a pessoa está indo por um caminho diferente do que você faria, mas que também pode funcionar. O que fazer?',
  '[{"letra":"A","texto":"Perguntar sobre o raciocínio dela, compartilhar suas preocupações como riscos (não como ordens) e deixar a decisão com ela se o resultado continuar viável.","correta":true,"explicacao":"Correto! Delegação de verdade aceita caminhos diferentes. Você contribui com contexto e riscos, e preserva a autonomia e o aprendizado."},
    {"letra":"B","texto":"Assumir a entrega de volta para garantir que seja feita do seu jeito.","correta":false,"explicacao":"Retomar a entrega sem necessidade passa desconfiança e ensina o time a esperar suas ordens."},
    {"letra":"C","texto":"Não dizer nada e corrigir tudo no final.","correta":false,"explicacao":"Calar agora e refazer depois é o pior dos mundos: nem ela aprende, nem você economiza tempo."},
    {"letra":"D","texto":"Mandar que ela recomece seguindo exatamente o seu método.","correta":false,"explicacao":"Impor o método sem discutir o resultado transforma a delegação em execução de ordens."}]');

select pg_temp.nova_questao(301, 'Conversas 1:1', 'media',
  'No 1:1, uma pessoa do time comenta que está sobrecarregada e pensando em sair da empresa. Qual é a melhor reação?',
  '[{"letra":"A","texto":"Agradecer a confiança, ouvir com atenção para entender as causas e combinar ações concretas, como repriorizar demandas.","correta":true,"explicacao":"Correto! Ouvir sem julgar e agir sobre as causas é o que mantém a confiança — e muitas vezes a pessoa."},
    {"letra":"B","texto":"Dizer que todos estão sobrecarregados e que é uma fase.","correta":false,"explicacao":"Minimizar o relato fecha o canal de comunicação e não resolve nada."},
    {"letra":"C","texto":"Já começar a procurar um substituto sem conversar mais.","correta":false,"explicacao":"A pessoa trouxe um problema para ser resolvido, não um pedido de demissão."},
    {"letra":"D","texto":"Contar ao time que ela está pensando em sair, para todos se prepararem.","correta":false,"explicacao":"Expor uma conversa confidencial quebra a confiança dela e a do time em você."}]');
