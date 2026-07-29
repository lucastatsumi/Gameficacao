-- 32_pivot_tema_questoes.sql
-- Pivô do conteúdo das questões das fases 1-5 (onboarding corporativo).
-- São UPDATEs sobre as questões/alternativas já semeadas (05, 12, 26),
-- referenciadas pelos UUIDs existentes no projeto Supabase de produção —
-- portanto este arquivo é um registro fiel do que foi aplicado via MCP,
-- não um seed reexecutável do zero. Ver 31_pivot_tema_fases_badges.sql.

-- ==================== FASE 1 (ordem 1) — Boas-vindas & Cultura ====================

update questoes set codigo_snippet = null, enunciado = $$Na sua segunda semana, você recebe duas orientações que parecem apontar em direções opostas: seu gestor pede para entregar uma tarefa "o quanto antes" e o manual de cultura da empresa lista "qualidade antes de velocidade" como um dos valores centrais. Não existe uma norma escrita cobrindo exatamente essa situação. Qual é a forma mais adequada de usar a missão e os valores da empresa para decidir o que fazer?$$
where id = '22e93590-f323-486d-b040-b43463b02e52';

update alternativas set texto = $$Ignorar o manual de cultura, já que pedidos diretos do gestor sempre têm prioridade sobre qualquer material institucional.$$, explicacao = $$Pedidos do gestor importam, mas ignorar os valores por completo é um exagero: na prática, o próprio gestor normalmente espera que você equilibre prazo e qualidade, não que descarte um dos dois sem conversar.$$, correta = false
where questao_id = '22e93590-f323-486d-b040-b43463b02e52' and letra = 'B';
update alternativas set texto = $$Entregar a tarefa o mais rápido possível, mesmo com qualidade inferior, e explicar depois que só estava seguindo a orientação recebida.$$, explicacao = $$Cumprir literalmente uma instrução ambígua sem checar o outro lado do conflito costuma gerar retrabalho — o mais produtivo é esclarecer a prioridade antes de agir, não depois de errar.$$, correta = false
where questao_id = '22e93590-f323-486d-b040-b43463b02e52' and letra = 'C';
update alternativas set texto = $$Esperar que a área de Recursos Humanos publique uma regra específica para esse tipo de situação antes de agir.$$, explicacao = $$Nem toda situação do dia a dia terá uma regra escrita — é exatamente para isso que servem os valores: dar uma bússola de decisão quando não existe um procedimento formal.$$, correta = false
where questao_id = '22e93590-f323-486d-b040-b43463b02e52' and letra = 'D';
update alternativas set texto = $$Os valores funcionam como critério de desempate: quando não há uma regra específica, eles orientam a decisão — nesse caso, conversar com o gestor para alinhar expectativa de prazo sem abrir mão do padrão de qualidade esperado.$$, explicacao = $$Correto! Valores e missão existem justamente para orientar decisões em situações não previstas em nenhum manual operacional. Eles não substituem o diálogo — pelo contrário, dão munição para alinhar expectativas com quem pediu a tarefa.$$, correta = true
where questao_id = '22e93590-f323-486d-b040-b43463b02e52' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Na sua trilha de integração, você percebe que um dos itens da lista está marcado como "pendente" mas ninguém explicou como ou quando concluí-lo. O prazo sugerido para terminar a trilha é essa semana. O que fazer?$$
where id = '23a07e87-774d-453f-a4ae-a5b49912c9b6';

update alternativas set texto = $$Marcar o item como concluído mesmo sem ter certeza, para não atrasar o indicador de integração.$$, explicacao = $$Marcar algo como feito sem realmente fazê-lo distorce os dados de acompanhamento e pode deixar uma lacuna real de conhecimento sem ser percebida.$$, correta = false
where questao_id = '23a07e87-774d-453f-a4ae-a5b49912c9b6' and letra = 'B';
update alternativas set texto = $$Deixar o item pendente até o fim do período de experiência, sem sinalizar a ninguém.$$, explicacao = $$Deixar pendências em silêncio impede que quem acompanha a integração perceba o problema a tempo de ajudar.$$, correta = false
where questao_id = '23a07e87-774d-453f-a4ae-a5b49912c9b6' and letra = 'C';
update alternativas set texto = $$Pular esse item e seguir para os próximos, já que a ordem da trilha não importa.$$, explicacao = $$Alguns itens de uma trilha de integração são pré-requisitos para os seguintes (como acessos e ferramentas); pular pode gerar mais dificuldade adiante, então o caminho mais seguro é esclarecer, não ignorar.$$, correta = false
where questao_id = '23a07e87-774d-453f-a4ae-a5b49912c9b6' and letra = 'D';
update alternativas set texto = $$Perguntar diretamente ao seu buddy/mentor de integração ou ao gestor como completar aquele item específico.$$, explicacao = $$Correto! A trilha de integração é um guia, não um teste — buddies e gestores esperam perguntas nessa fase, e esclarecer dúvidas rapidamente evita que um item pendente vire um bloqueio no fim do prazo.$$, correta = true
where questao_id = '23a07e87-774d-453f-a4ae-a5b49912c9b6' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Um colega mais antigo te explica um processo dizendo apenas "sempre fizemos assim por aqui". Ao consultar o manual de cultura e políticas internas, você encontra uma orientação oficial ligeiramente diferente do que ele descreveu. Qual é a atitude mais adequada?$$
where id = '30d947cd-9df9-4905-aa94-fea65843f0bf';

update alternativas set texto = $$Seguir sempre o que o colega mais antigo disser, já que a experiência prática vale mais que qualquer documento.$$, explicacao = $$Prática informal pode estar desatualizada ou ser uma exceção pontual que não deveria virar regra — documentos oficiais existem justamente para dar uma referência consistente a todos.$$, correta = false
where questao_id = '30d947cd-9df9-4905-aa94-fea65843f0bf' and letra = 'B';
update alternativas set texto = $$Ignorar as duas fontes e decidir sozinho a forma que parecer mais lógica.$$, explicacao = $$Decidir por conta própria sem checar nenhuma das duas referências ignora tanto o conhecimento institucional quanto a experiência prática do time — o caminho mais seguro é esclarecer a divergência, não inventar uma terceira via.$$, correta = false
where questao_id = '30d947cd-9df9-4905-aa94-fea65843f0bf' and letra = 'C';
update alternativas set texto = $$Assumir que o manual está errado, já que ele foi escrito antes de você chegar à empresa.$$, explicacao = $$A data de escrita, isoladamente, não torna um documento oficial inválido — vale checar a divergência em vez de descartar a fonte documentada só por ser mais antiga.$$, correta = false
where questao_id = '30d947cd-9df9-4905-aa94-fea65843f0bf' and letra = 'D';
update alternativas set texto = $$Seguir a orientação oficial documentada e, se fizer sentido, comentar a diferença com o colega ou o gestor — pode ser um processo desatualizado ou uma exceção que ele não mencionou.$$, explicacao = $$Correto! Documentação oficial é a referência mais confiável, mas práticas informais às vezes carregam contexto valioso (uma exceção real, um ajuste recente) — por isso vale alinhar a diferença em vez de simplesmente escolher um lado calado.$$, correta = true
where questao_id = '30d947cd-9df9-4905-aa94-fea65843f0bf' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Durante a integração, você é apresentado(a) a um(a) colega designado(a) como seu "buddy" — alguém do time que não é seu gestor direto. Qual é o papel esperado dessa pessoa nas primeiras semanas?$$
where id = '50efd6ed-a084-44e3-9790-e474902a17e0';

update alternativas set texto = $$Avaliar formalmente seu desempenho ao final do período de experiência.$$, explicacao = $$Avaliação formal de desempenho normalmente é papel do gestor direto, não do buddy — confundir os dois papéis pode gerar constrangimento desnecessário.$$, correta = false
where questao_id = '50efd6ed-a084-44e3-9790-e474902a17e0' and letra = 'B';
update alternativas set texto = $$Fazer as tarefas técnicas do seu cargo em seu lugar até você estar pronto(a).$$, explicacao = $$O buddy orienta e apoia, mas não substitui você na execução do trabalho — a integração é sobre você aprender a fazer, com suporte.$$, correta = false
where questao_id = '50efd6ed-a084-44e3-9790-e474902a17e0' and letra = 'C';
update alternativas set texto = $$Repassar para o RH cada pergunta que você fizer, sem responder diretamente.$$, explicacao = $$Um bom buddy responde diretamente o que sabe e só encaminha ao RH questões que realmente exigem esse canal (como benefícios ou documentação) — virar apenas um "intermediário" esvazia o propósito do papel.$$, correta = false
where questao_id = '50efd6ed-a084-44e3-9790-e474902a17e0' and letra = 'D';
update alternativas set texto = $$Ajudar com dúvidas práticas do dia a dia, apresentar a rotina informal do time e servir de ponto de contato mais próximo enquanto você ainda não conhece todo mundo.$$, explicacao = $$Correto! O buddy existe para reduzir a distância entre "o que está escrito na trilha de integração" e "como as coisas realmente funcionam no time" — é um canal mais leve e acessível que o gestor para perguntas do cotidiano.$$, correta = true
where questao_id = '50efd6ed-a084-44e3-9790-e474902a17e0' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$É o seu primeiro dia e o time organiza uma reunião rápida para te apresentar a todos. O que é mais esperado que você faça nesse momento?$$
where id = '6084cd4e-7d56-4881-918e-9561748cff03';

update alternativas set texto = $$Ficar em silêncio até que alguém pergunte algo diretamente.$$, explicacao = $$Silêncio total pode passar a impressão de desinteresse — uma breve apresentação, mesmo que simples, ajuda o time a te conhecer.$$, correta = false
where questao_id = '6084cd4e-7d56-4881-918e-9561748cff03' and letra = 'B';
update alternativas set texto = $$Detalhar tecnicamente todas as suas experiências anteriores por 20 minutos.$$, explicacao = $$Uma reunião de boas-vindas costuma ser curta; uma apresentação longa demais toma o tempo do time sem necessidade — há espaço para aprofundar isso depois, em conversas individuais.$$, correta = false
where questao_id = '6084cd4e-7d56-4881-918e-9561748cff03' and letra = 'C';
update alternativas set texto = $$Pedir para adiar a reunião até se sentir mais preparado(a).$$, explicacao = $$Reuniões de boas-vindas são pensadas justamente para quem está chegando, sem exigir preparo prévio — adiá-la sem motivo forte tende a atrasar sua própria integração.$$, correta = false
where questao_id = '6084cd4e-7d56-4881-918e-9561748cff03' and letra = 'D';
update alternativas set texto = $$Se apresentar brevemente, contar um pouco da sua trajetória e demonstrar disposição para aprender sobre o time e a empresa.$$, explicacao = $$Correto! Reuniões de boas-vindas servem para quebrar o gelo e situar quem chega — uma apresentação breve e genuína já cumpre bem esse papel.$$, correta = true
where questao_id = '6084cd4e-7d56-4881-918e-9561748cff03' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Ao final do seu primeiro mês, seu gestor marca uma conversa de feedback. Você fica na dúvida sobre o que esperar desse tipo de conversa nessa fase inicial. Qual é o propósito mais comum de um feedback de primeiro mês?$$
where id = 'ba2ff6b9-d443-482e-998a-97e6ca7ef2b8';

update alternativas set texto = $$Comunicar formalmente se você será desligado(a) ou não, sem espaço para diálogo.$$, explicacao = $$Um feedback de primeiro mês normalmente é uma conversa de ajuste, não um veredito final — tratá-lo como uma sentença gera ansiedade desnecessária e não reflete o objetivo real da conversa.$$, correta = false
where questao_id = 'ba2ff6b9-d443-482e-998a-97e6ca7ef2b8' and letra = 'B';
update alternativas set texto = $$Avaliar exclusivamente metas numéricas de produtividade do mês.$$, explicacao = $$Em um mês inicial, adaptação, aprendizado e integração ao time costumam pesar tanto quanto (ou mais que) números de produtividade — é cedo para reduzir a avaliação só a métricas.$$, correta = false
where questao_id = 'ba2ff6b9-d443-482e-998a-97e6ca7ef2b8' and letra = 'C';
update alternativas set texto = $$Substituir a trilha de integração, que deixa de valer a partir dessa conversa.$$, explicacao = $$Feedback e trilha de integração são complementares, não substitutos — a trilha continua orientando os próximos passos mesmo depois da conversa.$$, correta = false
where questao_id = 'ba2ff6b9-d443-482e-998a-97e6ca7ef2b8' and letra = 'D';
update alternativas set texto = $$Alinhar como está sendo a adaptação, reconhecer pontos positivos observados e ajustar juntos eventuais dificuldades antes que elas se acumulem.$$, explicacao = $$Correto! Feedbacks no início do vínculo funcionam como um checkpoint bidirecional: tanto a empresa quanto você avaliam como a adaptação está indo, com tempo suficiente para corrigir de rota se necessário.$$, correta = true
where questao_id = 'ba2ff6b9-d443-482e-998a-97e6ca7ef2b8' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$No contrato, você percebe que os primeiros meses são definidos como "período de experiência". O que isso significa na prática?$$
where id = 'bf45e515-80e7-4cda-bf08-0e836fdacd0b';

update alternativas set texto = $$É um tempo em que você não recebe salário até ser efetivado(a).$$, explicacao = $$O período de experiência é remunerado normalmente, como qualquer outro período do contrato — não é um estágio não pago.$$, correta = false
where questao_id = 'bf45e515-80e7-4cda-bf08-0e836fdacd0b' and letra = 'B';
update alternativas set texto = $$É um prazo em que você não pode tirar nenhum tipo de folga ou benefício.$$, explicacao = $$Direitos como folgas e benefícios geralmente já valem desde o início do contrato, incluindo o período de experiência, salvo regras específicas informadas pela empresa.$$, correta = false
where questao_id = 'bf45e515-80e7-4cda-bf08-0e836fdacd0b' and letra = 'C';
update alternativas set texto = $$É apenas uma formalidade sem nenhum efeito prático no contrato.$$, explicacao = $$O período de experiência tem efeitos reais no contrato de trabalho, incluindo regras próprias para desligamento — não é só um rótulo simbólico.$$, correta = false
where questao_id = 'bf45e515-80e7-4cda-bf08-0e836fdacd0b' and letra = 'D';
update alternativas set texto = $$É um período em que tanto a empresa quanto você avaliam se a relação de trabalho está funcionando bem, com regras específicas para eventual desligamento nesse intervalo.$$, explicacao = $$Correto! O período de experiência é uma via de mão dupla: dá tempo para a empresa observar a adaptação e para você também avaliar se o trabalho corresponde ao que esperava.$$, correta = true
where questao_id = 'bf45e515-80e7-4cda-bf08-0e836fdacd0b' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Um cliente pede, de forma educada, uma exceção que vai contra uma política da empresa listada como valor de "transparência e tratamento justo para todos os clientes". O que fazer?$$
where id = 'd3e1f9fc-eb85-4b4c-be00-66c01a10a4da';

update alternativas set texto = $$Conceder a exceção sem informar ninguém, para não desagradar o cliente.$$, explicacao = $$Abrir uma exceção não documentada quebra o princípio de tratamento igual para todos os clientes, além de criar um precedente difícil de justificar depois.$$, correta = false
where questao_id = 'd3e1f9fc-eb85-4b4c-be00-66c01a10a4da' and letra = 'B';
update alternativas set texto = $$Recusar o pedido sem nenhuma explicação, para evitar a discussão.$$, explicacao = $$Recusar sem explicar contraria o valor de transparência — o cliente tem direito a entender o motivo da resposta, mesmo quando ela é "não".$$, correta = false
where questao_id = 'd3e1f9fc-eb85-4b4c-be00-66c01a10a4da' and letra = 'C';
update alternativas set texto = $$Encaminhar a decisão para o próprio cliente resolver sozinho, sem posicionamento da empresa.$$, explicacao = $$Deixar de dar uma resposta clara não é neutralidade, é omissão — o valor de transparência pede uma posição explicada, mesmo que a resposta seja negativa.$$, correta = false
where questao_id = 'd3e1f9fc-eb85-4b4c-be00-66c01a10a4da' and letra = 'D';
update alternativas set texto = $$Explicar com transparência por que a exceção não pode ser feita, mantendo o mesmo padrão de atendimento oferecido a qualquer outro cliente.$$, explicacao = $$Correto! Tratamento justo significa aplicar a mesma regra a todos, comunicando isso com clareza — dizer "não" de forma transparente é mais alinhado ao valor do que abrir uma exceção silenciosa.$$, correta = true
where questao_id = 'd3e1f9fc-eb85-4b4c-be00-66c01a10a4da' and letra = 'A';

-- ==================== FASE 2 (ordem 2) — Segurança da Informação ====================

update questoes set codigo_snippet = null, enunciado = $$Você está criando a senha da sua conta corporativa. Qual das práticas abaixo é a mais recomendada pela política de segurança da informação?$$
where id = '40750441-a3bc-4c3e-a8b0-c02db09e614e';

update alternativas set texto = $$Usar a mesma senha do e-mail pessoal, para facilitar a memorização.$$, explicacao = $$Reutilizar senha entre contas pessoais e corporativas significa que um vazamento em um serviço externo pode comprometer diretamente o acesso da empresa.$$, correta = false
where questao_id = '40750441-a3bc-4c3e-a8b0-c02db09e614e' and letra = 'B';
update alternativas set texto = $$Usar uma senha simples e anotá-la em um post-it colado no monitor, para não esquecer.$$, explicacao = $$Anotar a senha visivelmente a expõe a qualquer pessoa que passe pelo seu espaço de trabalho, presencial ou por vídeo — o oposto do que se espera em segurança da informação.$$, correta = false
where questao_id = '40750441-a3bc-4c3e-a8b0-c02db09e614e' and letra = 'C';
update alternativas set texto = $$Compartilhar a senha com um colega de confiança, para que ele possa te ajudar se você esquecer.$$, explicacao = $$Senhas são de uso individual e intransferível — compartilhar quebra a rastreabilidade de quem acessou o quê, mesmo entre colegas de confiança.$$, correta = false
where questao_id = '40750441-a3bc-4c3e-a8b0-c02db09e614e' and letra = 'D';
update alternativas set texto = $$Usar uma senha longa e única para essa conta, idealmente gerada ou gerenciada por um gerenciador de senhas, sem reaproveitar de outros serviços.$$, explicacao = $$Correto! Senhas longas e exclusivas por serviço reduzem o risco de que o vazamento de uma conta pessoal comprometa também suas contas de trabalho.$$, correta = true
where questao_id = '40750441-a3bc-4c3e-a8b0-c02db09e614e' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Você recebe um e-mail urgente, aparentemente do time financeiro, pedindo para clicar em um link e "confirmar seus dados bancários agora, ou o pagamento do seu salário será cancelado". O remetente tem um domínio parecido com o da empresa, mas não idêntico. O que fazer?$$
where id = '41caf3f2-6644-4312-84ec-d366769ec494';

update alternativas set texto = $$Clicar no link rapidamente, já que o prazo mencionado é curto e o assunto parece sério.$$, explicacao = $$Urgência exagerada é justamente a tática usada para que a vítima aja sem pensar — pressa é um sinal de alerta, não um motivo para agir mais rápido.$$, correta = false
where questao_id = '41caf3f2-6644-4312-84ec-d366769ec494' and letra = 'B';
update alternativas set texto = $$Responder ao e-mail pedindo mais detalhes antes de decidir.$$, explicacao = $$Responder confirma para o golpista que o endereço está ativo e pode gerar mais tentativas — o correto é não interagir com o e-mail e reportá-lo pelo canal oficial de segurança.$$, correta = false
where questao_id = '41caf3f2-6644-4312-84ec-d366769ec494' and letra = 'C';
update alternativas set texto = $$Encaminhar o e-mail para colegas perguntando se alguém mais recebeu, sem avisar o time de segurança.$$, explicacao = $$Encaminhar informalmente sem envolver o time responsável não neutraliza a ameaça — o canal oficial de segurança/TI é quem consegue bloquear o remetente e alertar toda a empresa.$$, correta = false
where questao_id = '41caf3f2-6644-4312-84ec-d366769ec494' and letra = 'D';
update alternativas set texto = $$Não clicar no link, verificar o domínio do remetente com atenção e reportar o e-mail ao time de segurança/TI como possível phishing.$$, explicacao = $$Correto! Urgência artificial, ameaça e domínio quase idêntico ao oficial são sinais clássicos de phishing. Reportar ajuda a proteger também outros colegas que podem ter recebido o mesmo e-mail.$$, correta = true
where questao_id = '41caf3f2-6644-4312-84ec-d366769ec494' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Você prefere usar seu notebook pessoal para adiantar um trabalho no fim de semana, acessando o sistema interno que contém dados de clientes. A política da empresa permite acesso remoto, mas exige que dispositivos usados para esse fim tenham antivírus atualizado e criptografia de disco ativada — condições que seu notebook pessoal não atende no momento. O que fazer?$$
where id = '55eb35db-3d8d-4639-af3c-89c3dac9ba63';

update alternativas set texto = $$Acessar mesmo assim, já que a intenção é apenas adiantar trabalho e não fazer nada malicioso.$$, explicacao = $$Boa intenção não neutraliza o risco técnico: um dispositivo sem criptografia ou antivírus atualizado é vulnerável independentemente de quem o está usando ou por quê.$$, correta = false
where questao_id = '55eb35db-3d8d-4639-af3c-89c3dac9ba63' and letra = 'B';
update alternativas set texto = $$Acessar apenas por alguns minutos, argumentando que o risco é proporcional ao tempo de exposição.$$, explicacao = $$O risco de um dispositivo vulnerável não é proporcional ao tempo de uso — basta um único acesso comprometido, ou até um roubo do aparelho fora desse período, para expor os dados.$$, correta = false
where questao_id = '55eb35db-3d8d-4639-af3c-89c3dac9ba63' and letra = 'C';
update alternativas set texto = $$Copiar os dados de clientes para o notebook pessoal e trabalhar offline, para não depender da conexão do sistema interno.$$, explicacao = $$Copiar dados sensíveis para fora do ambiente controlado da empresa é ainda mais arriscado do que acessá-los remotamente — os dados passam a existir num dispositivo sem as proteções exigidas pela política.$$, correta = false
where questao_id = '55eb35db-3d8d-4639-af3c-89c3dac9ba63' and letra = 'D';
update alternativas set texto = $$Não acessar dados de clientes por esse notebook até que ele atenda aos requisitos de segurança da política, e resolver isso usando um dispositivo corporativo ou aguardando até segunda-feira.$$, explicacao = $$Correto! A política existe para proteger dados sensíveis independentemente da boa intenção de quem acessa — um dispositivo desprotegido é uma porta de entrada para vazamento caso seja perdido, roubado ou infectado.$$, correta = true
where questao_id = '55eb35db-3d8d-4639-af3c-89c3dac9ba63' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Em uma ligação de trabalho, usando fones de ouvido no transporte público, você percebe que está prestes a mencionar em voz alta o nome de um cliente e detalhes de um contrato ainda confidencial. Qual é a atitude mais adequada?$$
where id = '8480cb3c-9f6c-48c6-9058-b99a2235507c';

update alternativas set texto = $$Falar baixo, mas continuar normalmente, já que ninguém ali conhece o cliente mencionado.$$, explicacao = $$Não é possível garantir que ninguém ao redor tenha alguma conexão com o cliente ou a informação — o critério de segurança não deve depender de uma aposta sobre quem está por perto.$$, correta = false
where questao_id = '8480cb3c-9f6c-48c6-9058-b99a2235507c' and letra = 'B';
update alternativas set texto = $$Continuar a ligação normalmente, pois o cuidado com confidencialidade só se aplica a documentos escritos, não a conversas faladas.$$, explicacao = $$Confidencialidade se aplica a qualquer forma de compartilhar a informação, incluindo conversas em voz alta — o meio muda, o dever de proteção não.$$, correta = false
where questao_id = '8480cb3c-9f6c-48c6-9058-b99a2235507c' and letra = 'C';
update alternativas set texto = $$Desligar a ligação sem explicação e resolver o assunto por mensagem de texto pelo mesmo caminho no transporte.$$, explicacao = $$Mensagem de texto sobre o assunto tem a vantagem de não ser ouvida por terceiros, mas ainda expõe a tela a quem está ao lado — o ideal é adiar para um ambiente reservado, não apenas trocar o canal.$$, correta = false
where questao_id = '8480cb3c-9f6c-48c6-9058-b99a2235507c' and letra = 'D';
update alternativas set texto = $$Evitar mencionar informações confidenciais em voz alta em locais públicos, pedindo para retomar o assunto quando estiver em um ambiente reservado.$$, explicacao = $$Correto! Informação confidencial dita em voz alta em local público pode ser ouvida por qualquer pessoa próxima — o cuidado com o ambiente físico faz parte da proteção de dados, não só o cuidado digital.$$, correta = true
where questao_id = '8480cb3c-9f6c-48c6-9058-b99a2235507c' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Um fornecedor externo pede que você compartilhe seu login e senha do sistema interno para "agilizar" um suporte técnico. Qual é a conduta correta?$$
where id = '88580715-3b4f-4c67-9fde-03ec2611398f';

update alternativas set texto = $$Compartilhar a senha por mensagem, já que o fornecedor já trabalha com a empresa há anos.$$, explicacao = $$Tempo de relacionamento com o fornecedor não elimina o risco: qualquer compartilhamento de credencial quebra a rastreabilidade de acesso e viola a política, independentemente da confiança envolvida.$$, correta = false
where questao_id = '88580715-3b4f-4c67-9fde-03ec2611398f' and letra = 'B';
update alternativas set texto = $$Compartilhar apenas o login, mas não a senha, como meio-termo seguro.$$, explicacao = $$Mesmo compartilhar só o login já facilita ataques de força bruta e elimina o anonimato da conta — a solução correta é um acesso próprio para o fornecedor, não uma versão parcial do compartilhamento.$$, correta = false
where questao_id = '88580715-3b4f-4c67-9fde-03ec2611398f' and letra = 'C';
update alternativas set texto = $$Alterar temporariamente a senha para uma mais simples, compartilhar, e trocar de volta depois.$$, explicacao = $$Esse processo ainda expõe a credencial durante o período de troca e continua violando a política de acesso individual — o caminho correto é solicitar um acesso próprio ao time de TI.$$, correta = false
where questao_id = '88580715-3b4f-4c67-9fde-03ec2611398f' and letra = 'D';
update alternativas set texto = $$Recusar o compartilhamento e, se necessário, acionar o time de TI para criar um acesso temporário e controlado para o fornecedor.$$, explicacao = $$Correto! Credenciais são pessoais e intransferíveis — compartilhá-las tira a rastreabilidade de quem fez o quê no sistema e viola a política de segurança, mesmo com boas intenções.$$, correta = true
where questao_id = '88580715-3b4f-4c67-9fde-03ec2611398f' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Ao final do expediente, você tem sobre a mesa impressões com dados pessoais de colaboradores para uma análise que fará amanhã. A política de "mesa limpa" da empresa pede que informações sensíveis não fiquem expostas fora do horário de trabalho. O que fazer antes de sair?$$
where id = 'd2a0d309-19fb-4d49-82ae-5c5725011ae7';

update alternativas set texto = $$Deixar os documentos sobre a mesa, virados para baixo, para retomar o trabalho no dia seguinte mais rápido.$$, explicacao = $$Virar os papéis para baixo não impede que alguém os manuseie durante a noite — o correto é guardá-los em um local com acesso controlado.$$, correta = false
where questao_id = 'd2a0d309-19fb-4d49-82ae-5c5725011ae7' and letra = 'B';
update alternativas set texto = $$Levar os documentos para casa, para adiantar a análise fora do horário de trabalho.$$, explicacao = $$Levar dados pessoais de colaboradores para fora do ambiente da empresa amplia o risco de perda ou exposição, além de normalmente contrariar a própria política de proteção de dados.$$, correta = false
where questao_id = 'd2a0d309-19fb-4d49-82ae-5c5725011ae7' and letra = 'C';
update alternativas set texto = $$Jogar os documentos no lixo comum, já que o expediente já terminou.$$, explicacao = $$Documentos com dados pessoais precisam de descarte seguro (como uma fragmentadora), não do lixo comum, que qualquer pessoa pode acessar depois.$$, correta = false
where questao_id = 'd2a0d309-19fb-4d49-82ae-5c5725011ae7' and letra = 'D';
update alternativas set texto = $$Guardar os documentos em um local trancado (gaveta, armário) ou levá-los para descarte seguro se não forem mais necessários, em vez de deixá-los expostos na mesa.$$, explicacao = $$Correto! A política de mesa limpa existe para reduzir o risco de que qualquer pessoa que circule pelo escritório fora do horário tenha acesso visual a dados sensíveis sem necessidade.$$, correta = true
where questao_id = 'd2a0d309-19fb-4d49-82ae-5c5725011ae7' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Você percebe, por acaso, que uma planilha compartilhada internamente por engano ficou com permissão de "qualquer pessoa com o link pode editar", incluindo pessoas fora da empresa, e contém dados de clientes. Você não tem certeza se alguém de fora realmente acessou. O que fazer?$$
where id = 'e1a1ec60-35be-400f-8c5c-3e0b261586cf';

update alternativas set texto = $$Apenas corrigir a permissão da planilha silenciosamente, sem comunicar ninguém, já que o problema já foi resolvido.$$, explicacao = $$Corrigir sem reportar deixa a empresa sem saber que um incidente ocorreu, impedindo qualquer avaliação de impacto ou comunicação a clientes eventualmente afetados, se for o caso.$$, correta = false
where questao_id = 'e1a1ec60-35be-400f-8c5c-3e0b261586cf' and letra = 'B';
update alternativas set texto = $$Esperar até ter certeza absoluta de que houve acesso indevido antes de reportar, para não gerar alarme falso.$$, explicacao = $$Esperar por certeza absoluta atrasa desnecessariamente a resposta a um risco real — políticas de segurança da informação geralmente pedem que qualquer suspeita razoável seja reportada rapidamente, cabendo ao time especializado avaliar a gravidade.$$, correta = false
where questao_id = 'e1a1ec60-35be-400f-8c5c-3e0b261586cf' and letra = 'C';
update alternativas set texto = $$Avisar apenas o colega que compartilhou a planilha por engano, sem envolver o time de segurança.$$, explicacao = $$Um possível vazamento de dados de clientes tem implicações que vão além do erro individual (podem incluir obrigações legais de notificação, por exemplo) — por isso o canal correto é o time de segurança da informação, não apenas o colega responsável pelo erro.$$, correta = false
where questao_id = 'e1a1ec60-35be-400f-8c5c-3e0b261586cf' and letra = 'D';
update alternativas set texto = $$Reportar imediatamente o incidente ao time de segurança da informação, mesmo sem confirmação de que houve acesso indevido, e corrigir a permissão assim que possível.$$, explicacao = $$Correto! Um possível incidente de segurança deve ser reportado pela existência do risco, não apenas quando há certeza de dano — quanto antes o time de segurança souber, mais rápido consegue avaliar o impacto real e agir.$$, correta = true
where questao_id = 'e1a1ec60-35be-400f-8c5c-3e0b261586cf' and letra = 'A';

-- ==================== FASE 3 (ordem 3) — Processos & Ferramentas ====================

update questoes set codigo_snippet = null, enunciado = $$O sistema de chamados de TI da empresa tem duas filas: "geral" e "urgente". Chamados urgentes são atendidos primeiro, mas para evitar abuso, cada abertura como "urgente" passa por uma triagem rápida antes de entrar de fato na fila prioritária — se não for realmente crítico, ele é reclassificado para a fila geral, perdendo a posição de prioridade que teria conquistado. Diante disso, qual é a melhor estratégia ao abrir um chamado que não é crítico, mas te incomoda no trabalho?$$
where id = '1d4fba3f-e3a5-4177-9831-1761c4c88b7d';

update alternativas set texto = $$Sempre abrir como "urgente", já que na pior das hipóteses ele só volta para a fila geral, sem nenhuma desvantagem real.$$, explicacao = $$Existe uma desvantagem: o próprio processo de triagem consome tempo antes da reclassificação, o que pode atrasar o atendimento de um chamado que já entraria direto na fila geral se aberto corretamente desde o início.$$, correta = false
where questao_id = '1d4fba3f-e3a5-4177-9831-1761c4c88b7d' and letra = 'B';
update alternativas set texto = $$Abrir dois chamados idênticos, um em cada fila, para garantir que pelo menos um seja atendido rápido.$$, explicacao = $$Duplicar chamados gera confusão para o time de TI (que pode investir tempo duas vezes no mesmo problema) e não muda a prioridade real do seu caso — o critério de atendimento continua sendo a gravidade, não a quantidade de chamados abertos.$$, correta = false
where questao_id = '1d4fba3f-e3a5-4177-9831-1761c4c88b7d' and letra = 'C';
update alternativas set texto = $$Não abrir chamado nenhum e tentar resolver por conta própria, para não sobrecarregar a fila de TI.$$, explicacao = $$Deixar de reportar um problema real não ajuda ninguém: a fila existe justamente para organizar e priorizar essas demandas — o cuidado está em classificar corretamente, não em evitar abrir o chamado.$$, correta = false
where questao_id = '1d4fba3f-e3a5-4177-9831-1761c4c88b7d' and letra = 'D';
update alternativas set texto = $$Abrir como "geral", descrevendo o problema com clareza e o impacto real no seu trabalho — classificar como urgente sem necessidade só adiciona uma etapa de triagem e pode até atrasar o próprio chamado.$$, explicacao = $$Correto! Como a triagem reclassifica chamados não críticos, marcar algo como urgente sem necessidade real não acelera nada — na prática, adiciona uma etapa extra antes de cair na fila correta. Descrever bem o impacto ajuda a fila geral a priorizar internamente.$$, correta = true
where questao_id = '1d4fba3f-e3a5-4177-9831-1761c4c88b7d' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Você precisa de acesso a uma ferramenta interna que ainda não usa. Qual é o caminho correto para solicitar esse acesso?$$
where id = '363ffe79-4026-4b02-a18e-05dabd0dfdd5';

update alternativas set texto = $$Pedir diretamente pelo chat pessoal a um colega que já tem acesso à ferramenta, para ele compartilhar o próprio login.$$, explicacao = $$Pedir para usar o login de outra pessoa não é o mesmo que ter seu próprio acesso — além de misturar responsabilidades, pode violar a política de contas individuais por sistema.$$, correta = false
where questao_id = '363ffe79-4026-4b02-a18e-05dabd0dfdd5' and letra = 'B';
update alternativas set texto = $$Esperar até que alguém perceba que você precisa da ferramenta e conceda o acesso automaticamente.$$, explicacao = $$Acessos geralmente não são concedidos por antecipação — é necessário solicitar formalmente para que o time responsável avalie e libere.$$, correta = false
where questao_id = '363ffe79-4026-4b02-a18e-05dabd0dfdd5' and letra = 'C';
update alternativas set texto = $$Instalar ou acessar a ferramenta por conta própria, sem passar por nenhuma aprovação.$$, explicacao = $$Ferramentas corporativas costumam exigir aprovação e configuração de acesso controlado (por segurança e por questões de licenciamento) — contornar esse processo pode gerar problemas técnicos e de conformidade.$$, correta = false
where questao_id = '363ffe79-4026-4b02-a18e-05dabd0dfdd5' and letra = 'D';
update alternativas set texto = $$Abrir uma solicitação pelo canal oficial de chamados/tickets, descrevendo qual ferramenta e para qual finalidade.$$, explicacao = $$Correto! O canal de chamados registra e rastreia a solicitação, permitindo acompanhar o andamento e garantindo que a concessão de acesso passe pelas aprovações necessárias.$$, correta = true
where questao_id = '363ffe79-4026-4b02-a18e-05dabd0dfdd5' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$O time de suporte da empresa atende chamados por ordem de prioridade, mas também precisa cumprir um SLA (prazo máximo de resposta) para cada chamado. Um analista percebe que, mesmo respeitando a ordem de prioridade a cada momento, alguns chamados de prioridade baixa ficam tanto tempo esperando que acabam estourando o SLA — porque chamados novos e mais urgentes vão sempre furando a fila na frente deles. Qual ajuste no processo resolve esse problema sem abandonar o critério de prioridade?$$
where id = '673469f5-f7e6-45df-b73f-8a4eb109d169';

update alternativas set texto = $$Atender sempre por ordem de chegada (o primeiro chamado aberto é sempre o primeiro atendido), abandonando por completo o critério de prioridade.$$, explicacao = $$Isso resolveria o problema de inanição, mas ao custo de ignorar completamente a gravidade dos chamados — um problema crítico esperaria atrás de vários triviais só por ter chegado depois, o que não é desejável.$$, correta = false
where questao_id = '673469f5-f7e6-45df-b73f-8a4eb109d169' and letra = 'B';
update alternativas set texto = $$Aumentar o número de analistas disponíveis, sem mudar nenhuma regra de priorização.$$, explicacao = $$Mais gente ajuda a reduzir o volume geral de espera, mas não resolve o problema estrutural: mesmo com mais analistas, chamados de baixa prioridade continuariam sendo sistematicamente preteridos por urgências recorrentes.$$, correta = false
where questao_id = '673469f5-f7e6-45df-b73f-8a4eb109d169' and letra = 'C';
update alternativas set texto = $$Definir um SLA mais curto para chamados de baixa prioridade, para compensar o tempo de espera.$$, explicacao = $$Encurtar o próprio prazo do SLA sem mudar como os chamados são atendidos na prática só tornaria mais fácil estourar esse prazo — o problema real é a regra de atendimento, não o tamanho da janela de tempo.$$, correta = false
where questao_id = '673469f5-f7e6-45df-b73f-8a4eb109d169' and letra = 'D';
update alternativas set texto = $$Fazer a prioridade de um chamado aumentar automaticamente conforme ele se aproxima do limite do SLA, mesmo que sua urgência original fosse baixa — assim ele nunca fica esperando indefinidamente.$$, explicacao = $$Correto! Esse mecanismo (às vezes chamado de "aging" ou prioridade dinâmica) evita a inanição de chamados de baixa prioridade: com o tempo de espera contando a favor deles, nenhum chamado fica preterido para sempre só porque chegam outros mais urgentes.$$, correta = true
where questao_id = '673469f5-f7e6-45df-b73f-8a4eb109d169' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Você teve um gasto de trabalho (por exemplo, um táxi para uma reunião externa) e precisa ser reembolsado(a). Qual é o caminho correto?$$
where id = '674a85fc-6d27-4b6d-b3cf-0ad2f0162eef';

update alternativas set texto = $$Pedir para o gestor pagar do próprio bolso e acertar depois informalmente.$$, explicacao = $$Misturar reembolso da empresa com dinheiro pessoal do gestor foge do processo oficial e não gera nenhum registro rastreável do gasto.$$, correta = false
where questao_id = '674a85fc-6d27-4b6d-b3cf-0ad2f0162eef' and letra = 'B';
update alternativas set texto = $$Descontar o valor diretamente do próximo pagamento que fizer à empresa, sem formalizar nada.$$, explicacao = $$Reembolso e outros lançamentos financeiros não devem ser compensados informalmente — cada um segue seu próprio processo, com registro e aprovação apropriados.$$, correta = false
where questao_id = '674a85fc-6d27-4b6d-b3cf-0ad2f0162eef' and letra = 'C';
update alternativas set texto = $$Esperar até acumular vários gastos, e só então decidir se vale a pena solicitar reembolso.$$, explicacao = $$A maioria das políticas de reembolso tem prazos para submissão do comprovante — esperar demais pode significar perder o prazo, então o ideal é registrar cada despesa logo após ela ocorrer.$$, correta = false
where questao_id = '674a85fc-6d27-4b6d-b3cf-0ad2f0162eef' and letra = 'D';
update alternativas set texto = $$Registrar a despesa no sistema/processo oficial de reembolso, anexando o comprovante e seguindo as regras da política de despesas da empresa.$$, explicacao = $$Correto! O processo formal de reembolso existe para manter um registro auditável de gastos e garantir que cada solicitação siga as mesmas regras, com comprovante como evidência.$$, correta = true
where questao_id = '674a85fc-6d27-4b6d-b3cf-0ad2f0162eef' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Você quer solicitar um curso pago pela empresa. O processo exige aprovação do seu gestor direto e, para valores acima de um certo limite, também aprovação do gestor da área. Seu gestor direto já aprovou, mas o valor do curso está acima do limite. O que fazer?$$
where id = 'b0750820-ed0e-4cb7-8c25-a6241234615c';

update alternativas set texto = $$Considerar o curso confirmado assim que o gestor direto aprovar, já que ele é quem mais entende sua necessidade de desenvolvimento.$$, explicacao = $$A aprovação do gestor direto é necessária, mas não suficiente quando o valor exige uma segunda camada de aprovação — pular essa etapa pode gerar um gasto não autorizado pela governança da empresa.$$, correta = false
where questao_id = 'b0750820-ed0e-4cb7-8c25-a6241234615c' and letra = 'B';
update alternativas set texto = $$Pedir para o gestor direto "dividir" a solicitação em duas menores para ficar abaixo do limite de aprovação.$$, explicacao = $$Fracionar artificialmente uma solicitação para contornar um limite de aprovação vai contra o próprio objetivo do controle — é uma prática que pode ser vista como tentativa de burlar a governança financeira.$$, correta = false
where questao_id = 'b0750820-ed0e-4cb7-8c25-a6241234615c' and letra = 'C';
update alternativas set texto = $$Pagar o curso do próprio bolso e pedir reembolso depois, para não depender da segunda aprovação.$$, explicacao = $$Reembolso segue as mesmas regras de aprovação de qualquer outro gasto acima do limite — pagar antecipadamente não elimina a necessidade da segunda aprovação, só adiciona um risco pessoal desnecessário.$$, correta = false
where questao_id = 'b0750820-ed0e-4cb7-8c25-a6241234615c' and letra = 'D';
update alternativas set texto = $$Aguardar a aprovação também do gestor da área antes de considerar o curso confirmado, já que o processo define essa segunda aprovação como necessária acima do limite de valor.$$, explicacao = $$Correto! Fluxos de aprovação em múltiplos níveis existem para dar governança a decisões de maior impacto financeiro — a aprovação do gestor direto sozinha não é suficiente quando o valor ultrapassa o limite definido.$$, correta = true
where questao_id = 'b0750820-ed0e-4cb7-8c25-a6241234615c' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Você identificou um problema recorrente em um processo que envolve duas áreas diferentes, e não sabe exatamente a quem reportar. Qual é a abordagem mais eficiente para encontrar o responsável certo sem gerar ruído desnecessário?$$
where id = 'ba100e12-cc5d-4bbe-893b-b684b23597ed';

update alternativas set texto = $$Enviar a mesma mensagem para todos os gestores de ambas as áreas ao mesmo tempo, para garantir que alguém responda.$$, explicacao = $$Disparar a mesma mensagem para várias pessoas ao mesmo tempo, sem direcionamento, tende a gerar confusão sobre quem deve agir — geralmente ninguém se sente diretamente responsável por responder.$$, correta = false
where questao_id = 'ba100e12-cc5d-4bbe-893b-b684b23597ed' and letra = 'B';
update alternativas set texto = $$Resolver o problema sozinho(a), sem reportar a ninguém, para evitar burocracia.$$, explicacao = $$Problemas que envolvem mais de uma área normalmente precisam de alinhamento entre os responsáveis — tentar resolver sozinho pode gerar uma solução que não é reconhecida ou sustentada pelas áreas envolvidas.$$, correta = false
where questao_id = 'ba100e12-cc5d-4bbe-893b-b684b23597ed' and letra = 'C';
update alternativas set texto = $$Esperar até a próxima reunião geral da empresa para mencionar o problema publicamente.$$, explicacao = $$Esperar por um fórum amplo atrasa desnecessariamente a solução de um problema que pode ser encaminhado de forma mais direta e rápida pelo seu gestor.$$, correta = false
where questao_id = 'ba100e12-cc5d-4bbe-893b-b684b23597ed' and letra = 'D';
update alternativas set texto = $$Reportar primeiro ao seu gestor direto, explicando o problema e pedindo orientação sobre a quem escalar, já que ele costuma ter visão de quem é responsável por cada processo.$$, explicacao = $$Correto! O gestor direto é o canal mais natural para direcionar assuntos que cruzam áreas — ele tem contexto sobre a estrutura organizacional e evita que você precise "adivinhar" o caminho certo sozinho(a), reduzindo o risco de escalar para a pessoa errada.$$, correta = true
where questao_id = 'ba100e12-cc5d-4bbe-893b-b684b23597ed' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$No sistema de chamados de TI, um chamado crítico (sistema fora do ar para toda a equipe) chega depois de vários chamados triviais (como troca de mouse). Qual deve ser a ordem de atendimento?$$
where id = 'c9b21ce2-e308-47d2-a470-38c83f179626';

update alternativas set texto = $$Todos os chamados devem ser atendidos estritamente na ordem em que chegaram, sem exceção.$$, explicacao = $$Atender rigorosamente por ordem de chegada, ignorando o impacto, deixaria um problema crítico esperando atrás de demandas triviais — a maioria dos processos de suporte prioriza por severidade justamente para evitar isso.$$, correta = false
where questao_id = 'c9b21ce2-e308-47d2-a470-38c83f179626' and letra = 'B';
update alternativas set texto = $$Chamados triviais devem sempre vir primeiro, para "limpar a fila" antes de lidar com problemas complexos.$$, explicacao = $$Resolver primeiro o que é mais simples, ignorando a gravidade, prolonga desnecessariamente o impacto de um problema crítico que afeta muita gente.$$, correta = false
where questao_id = 'c9b21ce2-e308-47d2-a470-38c83f179626' and letra = 'C';
update alternativas set texto = $$A ordem de atendimento deve ser decidida por sorteio entre os chamados abertos no dia.$$, explicacao = $$Sorteio elimina qualquer critério de gravidade ou impacto, o que não atende à necessidade real de priorizar o que afeta mais pessoas ou é mais urgente.$$, correta = false
where questao_id = 'c9b21ce2-e308-47d2-a470-38c83f179626' and letra = 'D';
update alternativas set texto = $$O chamado crítico deve ser atendido primeiro, mesmo tendo chegado depois, porque o impacto do problema é maior que a ordem de chegada.$$, explicacao = $$Correto! Em ambientes de suporte, a severidade do impacto normalmente pesa mais que a ordem de chegada — um sistema fora do ar afeta muita gente, enquanto um mouse com problema afeta uma pessoa só.$$, correta = true
where questao_id = 'c9b21ce2-e308-47d2-a470-38c83f179626' and letra = 'A';

-- ==================== FASE 4 (ordem 4) — Comunicação & Colaboração ====================

update questoes set codigo_snippet = null, enunciado = $$Ao consultar o organograma da empresa, você quer entender rapidamente a quem cada pessoa se reporta. Qual é a informação central que um organograma deve deixar clara para isso funcionar?$$
where id = '3d2e6f88-53e8-4379-bce7-106e7acc2e8f';

update alternativas set texto = $$A lista de todos os projetos em andamento na empresa.$$, explicacao = $$Projetos em andamento são informação de outro tipo de documento (como um portfólio ou roadmap) — o organograma foca especificamente na estrutura de cargos e reporte.$$, correta = false
where questao_id = '3d2e6f88-53e8-4379-bce7-106e7acc2e8f' and letra = 'B';
update alternativas set texto = $$O salário de cada colaborador.$$, explicacao = $$Informação salarial é confidencial e não aparece em organogramas, que mostram apenas a estrutura de cargos e hierarquia.$$, correta = false
where questao_id = '3d2e6f88-53e8-4379-bce7-106e7acc2e8f' and letra = 'C';
update alternativas set texto = $$A ordem alfabética dos nomes de todos os funcionários.$$, explicacao = $$Organogramas são organizados por hierarquia, não por ordem alfabética — a posição de cada pessoa no diagrama reflete a quem ela se reporta.$$, correta = false
where questao_id = '3d2e6f88-53e8-4379-bce7-106e7acc2e8f' and letra = 'D';
update alternativas set texto = $$A relação de subordinação entre cargos: cada pessoa (exceto no topo) deve ter um gestor direto claramente identificado.$$, explicacao = $$Correto! Essa é a função central de um organograma: tornar visível a cadeia de reporte, para que qualquer pessoa saiba quem é seu gestor direto e, subindo o organograma, quem está acima dele.$$, correta = true
where questao_id = '3d2e6f88-53e8-4379-bce7-106e7acc2e8f' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Você tem um problema sério com a conduta do seu gestor direto (por exemplo, uma situação que pode configurar assédio). O canal padrão da empresa pede que problemas de trabalho sejam reportados primeiro ao gestor direto antes de subir o organograma. Diante disso, qual é a atitude correta?$$
where id = '59bd5863-4e6a-424b-b592-3076d98e5323';

update alternativas set texto = $$Seguir rigorosamente o processo padrão e reportar o problema ao próprio gestor envolvido, já que ele é o canal definido pela política.$$, explicacao = $$Aplicar o canal padrão de forma rígida nesse caso específico deixaria a pessoa reportando o problema diretamente para quem é o alvo da reclamação — praticamente nenhuma política de conduta funciona dessa forma; existe sempre uma via alternativa para esses casos.$$, correta = false
where questao_id = '59bd5863-4e6a-424b-b592-3076d98e5323' and letra = 'B';
update alternativas set texto = $$Não reportar nada, para evitar conflito com o gestor direto.$$, explicacao = $$Deixar de reportar um problema sério de conduta não resolve a situação e pode até normalizar um comportamento inadequado — canais de RH e ética existem exatamente para viabilizar esse tipo de denúncia com segurança.$$, correta = false
where questao_id = '59bd5863-4e6a-424b-b592-3076d98e5323' and letra = 'C';
update alternativas set texto = $$Resolver o problema publicamente, expondo a situação em um canal de comunicação amplo da empresa.$$, explicacao = $$Expor publicamente antes de acionar o canal apropriado pode prejudicar a apuração adequada do caso (e a proteção de quem denuncia) — o caminho mais responsável é um canal específico de RH ou ética, que trata a situação com o sigilo necessário.$$, correta = false
where questao_id = '59bd5863-4e6a-424b-b592-3076d98e5323' and letra = 'D';
update alternativas set texto = $$Reportar diretamente ao RH, ao canal de ética/conduta ou ao gestor do seu gestor, pulando o canal padrão — esse tipo de situação é justamente a exceção prevista para escalonamento direto.$$, explicacao = $$Correto! Regras de "reportar primeiro ao gestor direto" pressupõem situações normais de trabalho — quando o próprio gestor é o problema (especialmente em casos de conduta grave), praticamente toda empresa prevê canais alternativos específicos, como RH ou ouvidoria/canal de ética, para não deixar a vítima sem saída.$$, correta = true
where questao_id = '59bd5863-4e6a-424b-b592-3076d98e5323' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Você precisa comunicar uma mudança que afeta todos os times da empresa, não só o seu. Qual é a forma mais adequada de garantir que a informação chegue de forma organizada a todo mundo, sem pular etapas nem gerar informação desencontrada?$$
where id = '62a29781-5ed1-46f5-b94b-ea66b63719a0';

update alternativas set texto = $$Mandar mensagem individualmente para cada pessoa da empresa, uma de cada vez, para ter certeza que todos leram.$$, explicacao = $$Mensagens individuais não escalam bem para uma empresa inteira e criam múltiplas versões da mesma informação sendo replicadas de forma descoordenada — um canal amplo e oficial é mais eficiente e consistente.$$, correta = false
where questao_id = '62a29781-5ed1-46f5-b94b-ea66b63719a0' and letra = 'B';
update alternativas set texto = $$Comentar a mudança informalmente com alguns colegas de times diferentes, esperando que a informação se espalhe organicamente.$$, explicacao = $$Depender de boato para disseminar uma informação importante tende a distorcer a mensagem original conforme ela passa de pessoa a pessoa — o canal oficial evita esse efeito "telefone sem fio".$$, correta = false
where questao_id = '62a29781-5ed1-46f5-b94b-ea66b63719a0' and letra = 'C';
update alternativas set texto = $$Não comunicar nada, e deixar que cada time descubra a mudança quando ela afetar o próprio trabalho.$$, explicacao = $$Não comunicar proativamente uma mudança relevante prejudica o planejamento de outros times, que só descobririam o problema quando ele já estivesse impactando o trabalho deles.$$, correta = false
where questao_id = '62a29781-5ed1-46f5-b94b-ea66b63719a0' and letra = 'D';
update alternativas set texto = $$Levar a comunicação para os canais oficiais amplos da empresa (como um comunicado institucional ou reunião geral), garantindo que ela passe pelas aprovações e alcance todos os níveis de forma consistente.$$, explicacao = $$Correto! Comunicados que afetam toda a empresa precisam de um canal amplo e oficial — isso garante que a mensagem chegue de forma padronizada a todos os níveis, sem versões diferentes se espalhando por conversas paralelas.$$, correta = true
where questao_id = '62a29781-5ed1-46f5-b94b-ea66b63719a0' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Você entra em uma empresa de 1.000 funcionários e se pergunta quantos "níveis" de gestores existem, em média, entre você e a presidência. Considerando que a empresa tem uma estrutura organizacional bem definida (nem achatada demais, nem inchada), qual é a expectativa mais realista?$$
where id = '784d00b5-7a7a-4bdb-8394-3ffdbdcdb7df';

update alternativas set texto = $$Centenas de níveis, um para cada grupo pequeno de funcionários.$$, explicacao = $$Isso descreveria uma hierarquia extremamente "esticada", pouco funcional na prática — a maioria das empresas bem estruturadas evita esse formato, justamente porque dificulta a comunicação e a tomada de decisão.$$, correta = false
where questao_id = '784d00b5-7a7a-4bdb-8394-3ffdbdcdb7df' and letra = 'B';
update alternativas set texto = $$Exatamente 1.000 níveis, um por funcionário.$$, explicacao = $$Isso implicaria uma cadeia linear onde cada pessoa reporta a apenas uma outra, sem nenhuma distribuição em grupos — não é como organogramas reais funcionam.$$, correta = false
where questao_id = '784d00b5-7a7a-4bdb-8394-3ffdbdcdb7df' and letra = 'C';
update alternativas set texto = $$Nenhum nível: em qualquer empresa, todo mundo se reporta diretamente à presidência.$$, explicacao = $$Isso só seria viável em empresas muito pequenas — com 1.000 funcionários, seria impossível para uma única pessoa gerenciar diretamente todo mundo, daí a necessidade de camadas intermediárias de gestão.$$, correta = false
where questao_id = '784d00b5-7a7a-4bdb-8394-3ffdbdcdb7df' and letra = 'D';
update alternativas set texto = $$Poucos níveis — normalmente entre 4 e 7 camadas de gestão, mesmo em empresas de grande porte, graças a uma estrutura organizacional bem desenhada.$$, explicacao = $$Correto! Uma estrutura organizacional saudável distribui a autoridade em poucos níveis com um número razoável de subordinados por gestor — é isso que permite que decisões e informações não precisem atravessar dezenas de camadas até chegar à liderança.$$, correta = true
where questao_id = '784d00b5-7a7a-4bdb-8394-3ffdbdcdb7df' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Uma pessoa do time, que era responsável por duas frentes de trabalho importantes, vai sair da empresa. Simplesmente remover a pessoa do quadro sem mais nada deixaria essas duas frentes sem responsável. Qual é a prática recomendada para lidar com essa saída de forma organizada?$$
where id = '8ea75ec5-35ef-4c36-8794-eca340a04622';

update alternativas set texto = $$Deixar as duas frentes sem responsável até que alguém do time perceba a lacuna e assuma por conta própria.$$, explicacao = $$Esperar que a lacuna seja percebida organicamente costuma atrasar bastante a continuidade do trabalho — planejamento explícito de transição é mais eficiente do que confiar na sorte.$$, correta = false
where questao_id = '8ea75ec5-35ef-4c36-8794-eca340a04622' and letra = 'B';
update alternativas set texto = $$Cancelar as duas frentes de trabalho, já que a pessoa responsável por elas está saindo.$$, explicacao = $$Cancelar entregas relevantes só porque a pessoa responsável está de saída pode significar perder trabalho e valor real, quando a solução mais adequada é reatribuir a responsabilidade, não descartar o trabalho.$$, correta = false
where questao_id = '8ea75ec5-35ef-4c36-8794-eca340a04622' and letra = 'C';
update alternativas set texto = $$Aguardar até a contratação de um substituto direto, mesmo que isso leve meses, sem nenhum plano intermediário.$$, explicacao = $$Um processo de contratação pode levar tempo — deixar responsabilidades importantes sem nenhum plano intermediário nesse período gera um vácuo evitável; redistribuir temporariamente é mais prático.$$, correta = false
where questao_id = '8ea75ec5-35ef-4c36-8794-eca340a04622' and letra = 'D';
update alternativas set texto = $$Redistribuir as duas frentes entre outras pessoas do time (ou preencher a vaga), documentando as responsabilidades antes da saída, garantindo que nada fique sem dono.$$, explicacao = $$Correto! Assim como qualquer estrutura não pode ficar com "partes soltas", um time não pode deixar responsabilidades órfãs — planejar a redistribuição antes da saída evita que informação e continuidade se percam.$$, correta = true
where questao_id = '8ea75ec5-35ef-4c36-8794-eca340a04622' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Em um time, toda informação relevante entre os membros passa obrigatoriamente pelo líder técnico antes de chegar a qualquer outra pessoa — mesmo comunicações simples entre dois colegas passam primeiro por ele. Com o crescimento do time, esse líder virou um gargalo: decisões simples demoram dias porque tudo depende da disponibilidade de uma única pessoa. O que está acontecendo e como resolver?$$
where id = 'c397667f-ef79-43e9-bea6-2aa3f06379c0';

update alternativas set texto = $$O problema é falta de ferramentas de comunicação; basta trocar o aplicativo de mensagens usado pelo time.$$, explicacao = $$Trocar de ferramenta não resolve um problema estrutural de fluxo de decisão — mesmo com o melhor aplicativo do mundo, se toda mensagem ainda precisa passar por uma única pessoa, o gargalo continua.$$, correta = false
where questao_id = 'c397667f-ef79-43e9-bea6-2aa3f06379c0' and letra = 'B';
update alternativas set texto = $$É esperado e correto que toda comunicação passe por uma pessoa só, independentemente do tamanho do time, para manter o controle.$$, explicacao = $$Esse modelo funciona em times pequenos, mas não escala: conforme o time cresce, centralizar tudo em uma única pessoa cria atrasos cada vez maiores — o controle não precisa depender de um único ponto de passagem para tudo.$$, correta = false
where questao_id = 'c397667f-ef79-43e9-bea6-2aa3f06379c0' and letra = 'C';
update alternativas set texto = $$O líder técnico deveria trabalhar mais horas por dia para dar conta do volume de comunicação.$$, explicacao = $$Aumentar a carga de trabalho de uma única pessoa não resolve um problema estrutural de centralização — mesmo trabalhando mais, ela continuaria sendo o único canal, o que não escala com o crescimento do time.$$, correta = false
where questao_id = 'c397667f-ef79-43e9-bea6-2aa3f06379c0' and letra = 'D';
update alternativas set texto = $$A comunicação está centralizada demais em um único ponto, criando um gargalo equivalente a uma fila única e sequencial; a solução é distribuir a tomada de decisão e abrir canais diretos entre os membros do time para assuntos que não exigem, de fato, a participação do líder.$$, explicacao = $$Correto! Quando toda comunicação depende de passar por uma única pessoa, o tempo de resposta do time inteiro fica limitado pela disponibilidade dela — descentralizar decisões simples e permitir comunicação direta entre pares resolve o gargalo sem eliminar o papel de liderança para as decisões que realmente precisam dele.$$, correta = true
where questao_id = 'c397667f-ef79-43e9-bea6-2aa3f06379c0' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Você vai organizar uma reunião de time com vários assuntos a discutir, alguns urgentes e outros que podem esperar. Qual prática torna essa reunião mais eficaz?$$
where id = 'd98d14a4-3458-47bc-9147-f5d36ada26c2';

update alternativas set texto = $$Discutir os assuntos na ordem em que forem lembrados durante a própria reunião, sem preparo prévio.$$, explicacao = $$Discutir sem pauta tende a gastar tempo com assuntos menos importantes antes de chegar aos urgentes, além de aumentar o risco de esquecer algum item relevante.$$, correta = false
where questao_id = 'd98d14a4-3458-47bc-9147-f5d36ada26c2' and letra = 'B';
update alternativas set texto = $$Convidar o maior número possível de pessoas, mesmo que não tenham relação direta com os assuntos, para garantir alinhamento geral.$$, explicacao = $$Convidar pessoas sem relação direta com a pauta tende a alongar a reunião sem necessidade e a diluir a atenção de quem realmente precisa decidir sobre aqueles assuntos.$$, correta = false
where questao_id = 'd98d14a4-3458-47bc-9147-f5d36ada26c2' and letra = 'C';
update alternativas set texto = $$Marcar a reunião sem horário de término definido, para não haver pressa em discutir cada ponto.$$, explicacao = $$Reuniões sem limite de tempo tendem a se estender além do necessário — um horário de término definido, junto com uma pauta priorizada, ajuda o grupo a manter o foco.$$, correta = false
where questao_id = 'd98d14a4-3458-47bc-9147-f5d36ada26c2' and letra = 'D';
update alternativas set texto = $$Montar uma pauta prévia com os assuntos organizados por prioridade e compartilhá-la antes da reunião, para que o tempo seja usado nos itens mais importantes primeiro.$$, explicacao = $$Correto! Uma pauta organizada e compartilhada com antecedência permite que todos cheguem preparados e que o tempo da reunião seja investido no que realmente importa, sem depender de descobrir a ordem de discussão na hora.$$, correta = true
where questao_id = 'd98d14a4-3458-47bc-9147-f5d36ada26c2' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$O time de melhoria de processos está analisando quantas pessoas, no total, um pedido de aprovação percorre desde quem solicita até a aprovação final, contando o caminho mais longo entre todos os tipos de pedido que existem na empresa. O que essa métrica indica sobre o processo de aprovações?$$
where id = 'fd15be09-670c-4dd9-840a-75ccb385b901';

update alternativas set texto = $$O número total de funcionários da empresa.$$, explicacao = $$O tamanho total da empresa não é medido dessa forma — a métrica descrita foca no comprimento do caminho de aprovação de um pedido específico, não no quadro geral de pessoal.$$, correta = false
where questao_id = 'fd15be09-670c-4dd9-840a-75ccb385b901' and letra = 'B';
update alternativas set texto = $$A quantidade de pedidos que são aprovados por mês.$$, explicacao = $$Volume de aprovações por mês é uma métrica diferente (de produtividade do processo); o que está sendo medido aqui é o comprimento do caminho de aprovação, não a quantidade de pedidos processados.$$, correta = false
where questao_id = 'fd15be09-670c-4dd9-840a-75ccb385b901' and letra = 'C';
update alternativas set texto = $$O valor médio em reais dos pedidos aprovados.$$, explicacao = $$Valor financeiro dos pedidos é uma dimensão totalmente diferente — a métrica em questão mede quantas etapas/pessoas um pedido atravessa, não o valor envolvido.$$, correta = false
where questao_id = 'fd15be09-670c-4dd9-840a-75ccb385b901' and letra = 'D';
update alternativas set texto = $$O nível de burocracia/profundidade hierárquica que um pedido pode precisar atravessar — quanto maior esse número, mais lento tende a ser o processo de aprovação nesse fluxo específico.$$, explicacao = $$Correto! Medir o caminho mais longo de aprovação (análogo à "altura" de uma estrutura hierárquica de decisão) revela o pior cenário de demora — é uma métrica útil para identificar fluxos com aprovações demais e simplificá-los.$$, correta = true
where questao_id = 'fd15be09-670c-4dd9-840a-75ccb385b901' and letra = 'A';

-- ==================== FASE 5 (ordem 5) — Compliance & Conduta ====================

update questoes set codigo_snippet = null, enunciado = $$A política de conduta da empresa define um limite claro de valor para presentes recebidos de fornecedores (por exemplo, até um determinado valor, sem necessidade de aprovação especial). Um colega argumenta que seria mais simples ter apenas uma regra genérica como "use o bom senso", sem limite numérico. Por que um limite de valor bem definido tende a funcionar melhor na prática?$$
where id = '10d63f23-4c4d-42f5-9bad-de3df3443f1d';

update alternativas set texto = $$Porque um limite numérico elimina completamente a necessidade de qualquer julgamento ético em qualquer situação.$$, explicacao = $$Um limite de valor ajuda em casos comuns, mas não substitui o julgamento ético para situações mais complexas (como presentes recorrentes de um mesmo fornecedor, mesmo abaixo do limite) — a regra reduz ambiguidade, não elimina o bom senso por completo.$$, correta = false
where questao_id = '10d63f23-4c4d-42f5-9bad-de3df3443f1d' and letra = 'B';
update alternativas set texto = $$Porque presentes acima do limite deixam automaticamente de ser considerados problema de conduta.$$, explicacao = $$É o contrário: presentes acima do limite normalmente exigem aprovação ou até recusa — o limite não torna valores altos "aceitáveis automaticamente", apenas define quando uma aprovação extra é necessária.$$, correta = false
where questao_id = '10d63f23-4c4d-42f5-9bad-de3df3443f1d' and letra = 'C';
update alternativas set texto = $$Porque isso permite que cada área da empresa defina seu próprio limite, sem padronização.$$, explicacao = $$O objetivo de uma política central com limite definido é justamente o oposto: padronizar a regra para toda a empresa, evitando que cada área tenha critérios diferentes.$$, correta = false
where questao_id = '10d63f23-4c4d-42f5-9bad-de3df3443f1d' and letra = 'D';
update alternativas set texto = $$Porque um critério numérico claro reduz ambiguidade e interpretações diferentes entre pessoas, facilitando que todos apliquem a mesma regra da mesma forma, mesmo sem contexto adicional.$$, explicacao = $$Correto! Regras vagas como "bom senso" dependem da interpretação individual de cada pessoa, o que gera aplicação inconsistente — um valor numérico específico elimina essa ambiguidade e torna a regra fácil de verificar objetivamente.$$, correta = true
where questao_id = '10d63f23-4c4d-42f5-9bad-de3df3443f1d' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Você está envolvido(a) no processo de contratação de um fornecedor e percebe que uma das empresas concorrentes pertence a um parente próximo seu. O que a política de conduta normalmente espera que você faça?$$
where id = '3ded504a-d4b4-4e99-b202-0a66ad188396';

update alternativas set texto = $$Participar normalmente da decisão, já que o vínculo é apenas familiar e não afeta seu julgamento profissional.$$, explicacao = $$Mesmo que a pessoa acredite que consiga ser imparcial, a existência do vínculo já configura um conflito de interesse que precisa ser declarado — a percepção de parcialidade por terceiros também importa, não apenas a intenção real.$$, correta = false
where questao_id = '3ded504a-d4b4-4e99-b202-0a66ad188396' and letra = 'B';
update alternativas set texto = $$Favorecer discretamente a empresa do parente, já que ninguém saberia do vínculo.$$, explicacao = $$Favorecer um fornecedor por vínculo pessoal não declarado é exatamente o tipo de conduta que políticas de conflito de interesse existem para prevenir — além de antiético, normalmente é motivo de sanção disciplinar.$$, correta = false
where questao_id = '3ded504a-d4b4-4e99-b202-0a66ad188396' and letra = 'C';
update alternativas set texto = $$Ignorar a situação, pois conflitos de interesse só existem quando envolvem dinheiro trocando de mãos diretamente com o colaborador.$$, explicacao = $$Conflito de interesse não exige que dinheiro passe diretamente para o colaborador — basta que a decisão possa beneficiar alguém próximo a ele para caracterizar a situação, que precisa ser declarada.$$, correta = false
where questao_id = '3ded504a-d4b4-4e99-b202-0a66ad188396' and letra = 'D';
update alternativas set texto = $$Declarar o conflito de interesse ao seu gestor ou à área responsável antes de participar de qualquer decisão sobre essa contratação, e se afastar da decisão se orientado a fazê-lo.$$, explicacao = $$Correto! Declarar o conflito de interesse é o primeiro passo esperado em qualquer código de conduta — isso permite que a empresa decida se você deve participar ou não da decisão, protegendo a lisura do processo.$$, correta = true
where questao_id = '3ded504a-d4b4-4e99-b202-0a66ad188396' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Um fornecedor passa a te enviar pequenos presentes com frequência (abaixo do limite individual permitido pela política), mês após mês. Isolado, cada presente está dentro da regra. O que é mais prudente fazer diante da recorrência?$$
where id = '41b99773-c2c3-4f85-9ee3-ab8b95e435a0';

update alternativas set texto = $$Continuar aceitando normalmente, já que cada presente individual está dentro do limite estabelecido.$$, explicacao = $$Avaliar cada presente isoladamente ignora o padrão que se forma ao longo do tempo — a recorrência de presentes de um mesmo fornecedor é justamente o tipo de sinal que políticas de conduta pedem para ser comunicado.$$, correta = false
where questao_id = '41b99773-c2c3-4f85-9ee3-ab8b95e435a0' and letra = 'B';
update alternativas set texto = $$Recusar educadamente todos os presentes futuros, sem informar ninguém sobre o padrão observado.$$, explicacao = $$Recusar os próximos presentes é uma atitude razoável, mas não substitui a comunicação do padrão ao canal responsável — a empresa também precisa saber que esse fornecedor específico tem esse comportamento.$$, correta = false
where questao_id = '41b99773-c2c3-4f85-9ee3-ab8b95e435a0' and letra = 'C';
update alternativas set texto = $$Pedir para o fornecedor parar de enviar presentes, sem envolver a empresa nessa conversa.$$, explicacao = $$Resolver a questão apenas diretamente com o fornecedor, sem informar a empresa, deixa de lado o objetivo de compliance de manter um registro e uma visão institucional desses padrões.$$, correta = false
where questao_id = '41b99773-c2c3-4f85-9ee3-ab8b95e435a0' and letra = 'D';
update alternativas set texto = $$Comunicar a situação ao seu gestor ou ao canal de compliance, já que a recorrência pode configurar um padrão problemático mesmo com cada presente individualmente dentro do limite.$$, explicacao = $$Correto! Políticas de conduta costumam se preocupar não só com o valor de um único presente, mas com padrões de comportamento que, somados, podem indicar uma tentativa de influência indevida — por isso vale comunicar a recorrência, não só avaliar cada caso isolado.$$, correta = true
where questao_id = '41b99773-c2c3-4f85-9ee3-ab8b95e435a0' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Você está no meio de uma tarefa com prazo apertado quando recebe um lembrete de que um treinamento obrigatório de compliance vence hoje, e você já concluiu a maior parte dele, faltando apenas um módulo curto (uns 10 minutos). Adiar mais um dia só é permitido em casos excepcionais e mediante justificativa. Faz sentido priorizar terminar o treinamento agora, mesmo com o prazo da tarefa apertado?$$
where id = '832806e8-c408-42a9-9721-776d87be1c82';

update alternativas set texto = $$Não: treinamentos de compliance sempre podem ser adiados sem consequência, então a tarefa com prazo deve vir primeiro.$$, explicacao = $$Treinamentos obrigatórios de compliance normalmente têm prazo firme, com adiamento restrito a casos excepcionais e justificados — tratá-los como algo sempre adiável ignora essa restrição.$$, correta = false
where questao_id = '832806e8-c408-42a9-9721-776d87be1c82' and letra = 'B';
update alternativas set texto = $$Não: como a tarefa tem prazo apertado, o treinamento deve ser interrompido e retomado do zero depois.$$, explicacao = $$Não seria necessário "do zero" — a questão descreve que a maior parte já foi concluída, faltando um módulo curto; abandonar o pouco que resta e recomeçar depois seria um desperdício de esforço já investido.$$, correta = false
where questao_id = '832806e8-c408-42a9-9721-776d87be1c82' and letra = 'C';
update alternativas set texto = $$Sim, mas apenas se o treinamento render algum tipo de bônus ou recompensa direta.$$, explicacao = $$A prioridade de concluir o treinamento vem da obrigatoriedade e do prazo, não de uma recompensa associada — mesmo sem bônus, o risco de não conformidade já justificaria terminá-lo.$$, correta = false
where questao_id = '832806e8-c408-42a9-9721-776d87be1c82' and letra = 'D';
update alternativas set texto = $$Sim: como falta pouco para concluir e o prazo do treinamento vence hoje sem justificativa clara para adiar, o custo de terminá-lo agora é pequeno comparado ao risco de ficar em não conformidade — vale pausar a tarefa por poucos minutos.$$, explicacao = $$Correto! Quando o esforço restante é pequeno (só um módulo curto) e o prazo é hoje, adiar sem justificativa forte cria um risco real de não conformidade por um ganho de tempo mínimo na outra tarefa — o cálculo de custo-benefício favorece terminar agora.$$, correta = true
where questao_id = '832806e8-c408-42a9-9721-776d87be1c82' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$A empresa está redesenhando o processo de aprovação de contratos de grande valor. O requisito é que TODO contrato acima de um certo valor passe, sem exceção, por todas as etapas de aprovação previstas (mesmo sob pressão de prazo), e que, entre contratos concorrendo pelo mesmo horário de análise, a ordem de submissão original seja sempre respeitada. Qual característica de processo atende a esses dois requisitos ao mesmo tempo?$$
where id = '846bdd20-69ee-4570-83bb-10f308951850';

update alternativas set texto = $$Um processo mais rápido que permite pular etapas quando há pressão de prazo, desde que a maioria dos contratos ainda passe pelas aprovações.$$, explicacao = $$Permitir exceções sob pressão de prazo contraria diretamente o requisito de "sem exceção" — um processo que às vezes pula etapas não garante a governança exigida para contratos de grande valor.$$, correta = false
where questao_id = '846bdd20-69ee-4570-83bb-10f308951850' and letra = 'B';
update alternativas set texto = $$Um processo que analisa sempre o contrato de maior valor primeiro, independentemente da ordem de submissão.$$, explicacao = $$Isso atenderia a um critério de priorização por valor, mas não ao requisito de preservar a ordem de submissão entre contratos concorrentes — o enunciado pede especificamente esse segundo critério de desempate.$$, correta = false
where questao_id = '846bdd20-69ee-4570-83bb-10f308951850' and letra = 'C';
update alternativas set texto = $$Um processo mais simples, com uma única etapa de aprovação, que reduz o tempo total de análise.$$, explicacao = $$Reduzir para uma única etapa vai contra o requisito de que todas as etapas de aprovação previstas sejam cumpridas — simplificar demais compromete exatamente a governança que o processo precisa garantir.$$, correta = false
where questao_id = '846bdd20-69ee-4570-83bb-10f308951850' and letra = 'D';
update alternativas set texto = $$Um processo com etapas de aprovação obrigatórias e não puláveis (garantia mesmo no pior caso de urgência) combinado com uma fila de análise que preserva a ordem de chegada entre contratos concorrentes (critério de desempate justo).$$, explicacao = $$Correto! "Sem exceção mesmo sob pressão" exige etapas obrigatórias que não podem ser puladas por atalho — e "ordem de submissão respeitada em caso de empate" exige que o critério de desempate seja a ordem de chegada, não outro fator arbitrário. Os dois requisitos juntos definem exatamente esse tipo de processo.$$, correta = true
where questao_id = '846bdd20-69ee-4570-83bb-10f308951850' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Um sistema de distribuição automática de tarefas do time sempre atribui a nova demanda para a primeira pessoa disponível na lista, que é ordenada por ordem alfabética de nome. Como a lista raramente muda de ordem, a pessoa cujo nome começa com a primeira letra do alfabeto está constantemente sobrecarregada, enquanto os últimos da lista quase não recebem tarefas. Por que isso acontece e como corrigir?$$
where id = '9dee6f23-c46f-40c3-9bc3-dd8a26afe394';

update alternativas set texto = $$O problema é o tamanho do time, que precisa dobrar para resolver a sobrecarga.$$, explicacao = $$Aumentar o time sem corrigir o critério de distribuição só adicionaria mais pessoas ao final da lista, sem mudar o fato de que quem está no início continuaria sendo escolhido primeiro sistematicamente.$$, correta = false
where questao_id = '9dee6f23-c46f-40c3-9bc3-dd8a26afe394' and letra = 'B';
update alternativas set texto = $$A ordem alfabética é sempre justa, então a sobrecarga relatada deve ter outra causa não relacionada ao critério de distribuição.$$, explicacao = $$A ordem alfabética não é justa quando aplicada de forma fixa e repetida sem considerar carga atual — é exatamente esse critério estático que concentra tarefas na(s) pessoa(s) do início da lista.$$, correta = false
where questao_id = '9dee6f23-c46f-40c3-9bc3-dd8a26afe394' and letra = 'C';
update alternativas set texto = $$A solução é a pessoa sobrecarregada recusar tarefas até a lista ser reordenada manualmente.$$, explicacao = $$Recusar tarefas individualmente não resolve o problema estrutural do critério de distribuição — a correção precisa estar na regra do sistema, não numa reação pontual de quem está sobrecarregado.$$, correta = false
where questao_id = '9dee6f23-c46f-40c3-9bc3-dd8a26afe394' and letra = 'D';
update alternativas set texto = $$O critério de distribuição (sempre o primeiro da lista) ignora a carga de trabalho atual de cada pessoa; a correção é distribuir com base em quem está com menos tarefas no momento (ou em rodízio), não em uma ordem fixa e sempre igual.$$, explicacao = $$Correto! Um critério fixo e sempre igual (como ordem alfabética estática) tende a sobrecarregar sistematicamente quem fica "na frente" desse critério — balancear pela carga atual de trabalho (ou usar rodízio) distribui a demanda de forma mais justa.$$, correta = true
where questao_id = '9dee6f23-c46f-40c3-9bc3-dd8a26afe394' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$A área de compliance precisa garantir, com certeza, que TODOS os contratos do último ano sejam revisados dentro do prazo do trimestre, mas não tem orçamento para duplicar a equipe nem para copiar toda a documentação para um sistema paralelo de análise. Qual abordagem atende à garantia de cobertura completa dentro do prazo sem exigir esses recursos extras?$$
where id = 'b2b4bb42-020b-4fc6-b7a6-99d6e57c05ba';

update alternativas set texto = $$Revisar apenas uma amostra aleatória pequena dos contratos, assumindo que ela representa razoavelmente o total.$$, explicacao = $$Amostragem aleatória não garante cobertura de 100% dos contratos — o requisito do enunciado é revisar TODOS eles, então uma amostra parcial não atende à garantia de cobertura completa.$$, correta = false
where questao_id = 'b2b4bb42-020b-4fc6-b7a6-99d6e57c05ba' and letra = 'B';
update alternativas set texto = $$Duplicar a equipe de compliance temporariamente, mesmo sem orçamento aprovado para isso.$$, explicacao = $$O enunciado deixa claro que não há orçamento para dobrar a equipe — propor essa solução ignora justamente a restrição de recursos apresentada no problema.$$, correta = false
where questao_id = 'b2b4bb42-020b-4fc6-b7a6-99d6e57c05ba' and letra = 'C';
update alternativas set texto = $$Copiar toda a documentação de contratos para um sistema paralelo de análise, para acelerar a revisão.$$, explicacao = $$Duplicar toda a documentação em um sistema paralelo também é uma solução com custo de recursos que o enunciado explicitamente descarta — o desafio é resolver dentro dos recursos já existentes.$$, correta = false
where questao_id = 'b2b4bb42-020b-4fc6-b7a6-99d6e57c05ba' and letra = 'D';
update alternativas set texto = $$Organizar a revisão em lotes estruturados, com checkpoints de progresso e responsáveis definidos por lote, garantindo que a revisão completa avance de forma previsível dentro da equipe existente, sem depender de duplicar estrutura ou pessoal.$$, explicacao = $$Correto! É possível garantir cobertura total dentro de um prazo usando um plano de trabalho estruturado (lotes, responsáveis, checkpoints) que usa a capacidade já disponível de forma eficiente, sem precisar de recursos extras como equipe dobrada ou um sistema paralelo de armazenamento.$$, correta = true
where questao_id = 'b2b4bb42-020b-4fc6-b7a6-99d6e57c05ba' and letra = 'A';
