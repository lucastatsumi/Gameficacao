-- 32b_pivot_tema_questoes_fases_6_8.sql
-- Continuação de 32_pivot_tema_questoes.sql para as fases 6 (minigame
-- "Prioridades em Ação"), 7 (minigame "Passo a Passo") e 8 (Excelência &
-- Reconhecimento). UPDATEs keyed por UUID de produção (registro fiel).

-- ==================== FASE 6 (ordem 6) — Prioridades em Ação (batalha_complexidade) ====================

update questoes set codigo_snippet = null, enunciado = $$Um cliente liga extremamente irritado reclamando de um erro no pedido dele. Você tem poucos segundos para decidir como abrir a conversa. Qual atitude é mais eficaz?$$
where id = '091f492c-924a-4e67-9d00-d9bc3caa6316';

update alternativas set texto = $$Interromper rapidamente para explicar que o erro não foi culpa sua, antes que ele continue reclamando.$$, explicacao = $$Interromper para se defender antes de ouvir tende a piorar a reação de um cliente já irritado — a prioridade nesse momento é reduzir a tensão, não determinar de quem é a culpa.$$, correta = false
where questao_id = '091f492c-924a-4e67-9d00-d9bc3caa6316' and letra = 'B';
update alternativas set texto = $$Ouvir sem interromper, reconhecer a frustração dele e só depois explicar os próximos passos para resolver.$$, explicacao = $$Correto! Validar a frustração antes de argumentar reduz a tensão e abre espaço para uma solução — interromper ou já começar a se defender tende a escalar o conflito.$$, correta = true
where questao_id = '091f492c-924a-4e67-9d00-d9bc3caa6316' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Uma reunião está no horário de término, mas ainda restam dois assuntos importantes na pauta. Qual atitude é mais eficaz nesse momento?$$
where id = '0cd5752d-d4f1-4a3a-bb9c-213713ff048c';

update alternativas set texto = $$Estender a reunião indefinidamente até que todos os assuntos sejam resolvidos, mesmo passando do horário.$$, explicacao = $$Estender sem combinar gera atraso em outros compromissos dos participantes e tende a fazer a discussão perder o foco — o mais eficaz é fechar no horário e remarcar objetivamente o que falta.$$, correta = false
where questao_id = '0cd5752d-d4f1-4a3a-bb9c-213713ff048c' and letra = 'B';
update alternativas set texto = $$Encerrar no horário combinado e agendar uma nova reunião curta e focada apenas nos assuntos pendentes.$$, explicacao = $$Correto! Respeitar o tempo combinado evita conflitos de agenda para quem tem outros compromissos, e uma reunião focada exclusivamente no que faltou tende a ser mais objetiva que estender a atual.$$, correta = true
where questao_id = '0cd5752d-d4f1-4a3a-bb9c-213713ff048c' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Você abre a caixa de entrada e encontra uma grande quantidade de e-mails acumulados, com prioridades variadas. Qual abordagem tende a ser mais eficaz para lidar com isso rapidamente?$$
where id = '6b175fad-1678-4ae0-a40d-ada6872d9564';

update alternativas set texto = $$Responder cada e-mail na ordem em que chegou na caixa de entrada, sem checar os demais antes.$$, explicacao = $$Responder estritamente por ordem de chegada, sem triagem prévia, pode fazer um e-mail urgente esperar atrás de vários outros sem importância que chegaram antes.$$, correta = false
where questao_id = '6b175fad-1678-4ae0-a40d-ada6872d9564' and letra = 'B';
update alternativas set texto = $$Passar rapidamente por todos os e-mails primeiro, identificando os realmente urgentes, e só então responder em ordem de prioridade.$$, explicacao = $$Correto! Uma triagem rápida antes de responder evita gastar tempo cedo demais em algo pouco importante enquanto um item urgente fica esquecido no meio do monte.$$, correta = true
where questao_id = '6b175fad-1678-4ae0-a40d-ada6872d9564' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Você precisa encontrar rapidamente o registro de um cliente específico em uma planilha enorme que já está ordenada alfabeticamente por nome. Qual abordagem é mais rápida?$$
where id = '71d70b9b-28c7-45e9-9279-d121fbacf548';

update alternativas set texto = $$Rolar a planilha do início ao fim, linha por linha, até encontrar o nome procurado.$$, explicacao = $$Percorrer tudo linha por linha ignora a vantagem de a planilha já estar ordenada — é a forma mais lenta possível de encontrar um registro específico num conjunto grande de dados.$$, correta = false
where questao_id = '71d70b9b-28c7-45e9-9279-d121fbacf548' and letra = 'B';
update alternativas set texto = $$Usar a função de busca/filtro da planilha (ou pular direto para a região alfabética aproximada), aproveitando que os dados já estão ordenados.$$, explicacao = $$Correto! Como os dados já estão ordenados, é possível pular direto para a região aproximada onde o nome deveria estar, em vez de examinar tudo — muito mais rápido que uma checagem linha a linha.$$, correta = true
where questao_id = '71d70b9b-28c7-45e9-9279-d121fbacf548' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Você precisa confirmar rapidamente se um colaborador específico, entre milhares, já concluiu um treinamento obrigatório. Qual é a forma mais eficiente de checar isso?$$
where id = 'c62221e3-1ae9-4300-bff0-d55037de3bff';

update alternativas set texto = $$Pedir a lista completa de todos os colaboradores e treinamentos em uma planilha, e procurar manualmente o nome dele.$$, explicacao = $$Procurar manualmente numa lista gigante quando existe um sistema de busca direta é muito mais lento e sujeito a erro do que consultar diretamente pelo nome ou ID no sistema apropriado.$$, correta = false
where questao_id = 'c62221e3-1ae9-4300-bff0-d55037de3bff' and letra = 'B';
update alternativas set texto = $$Consultar o próprio sistema de RH/treinamentos, buscando diretamente pelo nome ou ID do colaborador.$$, explicacao = $$Correto! Sistemas de RH são feitos para consultas diretas e rápidas por identificador — é a forma mais eficiente de confirmar uma informação específica entre milhares de registros.$$, correta = true
where questao_id = 'c62221e3-1ae9-4300-bff0-d55037de3bff' and letra = 'A';

-- ==================== FASE 7 (ordem 7) — Passo a Passo (reordenar_algoritmo) ====================

update questoes set codigo_snippet = null,
  enunciado = $$Você percebeu um possível incidente de segurança da informação (por exemplo, um e-mail suspeito que pode ser phishing). Coloque os passos na ordem correta para reportá-lo.$$,
  passos = $$[
    {"id": "p1", "texto": "Não clicar em links nem responder ao e-mail suspeito"},
    {"id": "p2", "texto": "Registrar um chamado no canal oficial de segurança da informação, descrevendo o que foi observado"},
    {"id": "p3", "texto": "Aguardar orientação do time de segurança sobre os próximos passos (como bloquear o remetente)"}
  ]$$::jsonb,
  ordem_correta = $$["p1", "p2", "p3"]$$::jsonb
where id = '194bb1d1-87d3-4231-ac4d-cb78bb18dcba';

update questoes set codigo_snippet = null,
  enunciado = $$Você teve um gasto de trabalho e precisa solicitar reembolso à empresa. Coloque os passos na ordem correta.$$,
  passos = $$[
    {"id": "p1", "texto": "Guardar o comprovante da despesa (nota fiscal ou recibo) no momento da compra"},
    {"id": "p2", "texto": "Registrar a despesa no sistema de reembolso, anexando o comprovante e descrevendo o motivo"},
    {"id": "p3", "texto": "Aguardar a aprovação do gestor responsável para o reembolso ser processado"}
  ]$$::jsonb,
  ordem_correta = $$["p1", "p2", "p3"]$$::jsonb
where id = 'c9389adf-1f4c-4847-863a-d17bb80cc8ed';

update questoes set codigo_snippet = null,
  enunciado = $$Um fornecedor não está cumprindo um prazo combinado e você precisa resolver isso da forma mais adequada. Coloque os passos na ordem certa.$$,
  passos = $$[
    {"id": "p1", "texto": "Tentar resolver o problema diretamente com a pessoa ou área envolvida, deixando claro o impacto e o prazo necessário"},
    {"id": "p2", "texto": "Se não houver resposta ou solução dentro de um prazo razoável, reunir os detalhes da tentativa (datas, combinados, ausência de retorno) antes de escalar"},
    {"id": "p3", "texto": "Levar o problema ao gestor com esse histórico organizado, pedindo orientação ou apoio para desbloquear a situação"}
  ]$$::jsonb,
  ordem_correta = $$["p1", "p2", "p3"]$$::jsonb
where id = 'db80e96f-729f-46e3-ae2d-483719dac609';

-- ==================== FASE 8 (ordem 8) — Excelência & Reconhecimento ====================

update questoes set codigo_snippet = null, enunciado = $$Ao definir os Resultados-Chave (Key Results) de um OKR trimestral, um colega sugere: "Melhorar a satisfação dos clientes." Por que essa formulação não é um bom Key Result, mesmo sendo um objetivo válido de se perseguir?$$
where id = '082ba89c-5d40-434b-bd0c-d6c8c7902986';

update alternativas set texto = $$Porque objetivos relacionados a clientes nunca podem virar Key Results, apenas Objetivos.$$, explicacao = $$Satisfação de clientes pode, sim, virar um bom Key Result — desde que seja formulado de forma mensurável (como uma métrica de NPS ou CSAT com meta numérica), não porque o tema em si seja proibido.$$, correta = false
where questao_id = '082ba89c-5d40-434b-bd0c-d6c8c7902986' and letra = 'B';
update alternativas set texto = $$Porque Key Results só podem ser definidos pela liderança, nunca sugeridos por um colega de time.$$, explicacao = $$Quem sugere um Key Result não é o problema aqui — mesmo vindo da liderança, a formulação "melhorar a satisfação" continuaria vaga e não mensurável.$$, correta = false
where questao_id = '082ba89c-5d40-434b-bd0c-d6c8c7902986' and letra = 'C';
update alternativas set texto = $$Porque esse Key Result é bom demais e vai ser fácil de bater, o que desmotiva o time.$$, explicacao = $$O problema não é a dificuldade da meta, e sim a ausência de um critério objetivo de medição — sem número-alvo, não dá nem para saber se ela foi fácil, difícil ou impossível de bater.$$, correta = false
where questao_id = '082ba89c-5d40-434b-bd0c-d6c8c7902986' and letra = 'D';
update alternativas set texto = $$Porque não é mensurável nem tem um alvo numérico claro — um bom Key Result precisa de uma métrica específica, como "aumentar o NPS de 42 para 55 no trimestre", para que seja possível avaliar objetivamente se foi atingido.$$, explicacao = $$Correto! Key Results existem justamente para tornar um objetivo (que pode ser inspiracional e qualitativo) mensurável — sem número e prazo, não há como saber se ele foi realmente alcançado ao final do período.$$, correta = true
where questao_id = '082ba89c-5d40-434b-bd0c-d6c8c7902986' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$A empresa adota uma cultura de "feedback contínuo": gestores são incentivados a dar retorno frequente e informal ao longo do ano, além da avaliação formal anual. Um gestor acredita que, por já dar feedback verbal constantemente no dia a dia, pode pular a avaliação formal escrita de fim de ano, já que "o colaborador já sabe como está indo". Essa lógica está correta?$$
where id = '0906dc40-85db-44d0-86ec-2e17095780ba';

update alternativas set texto = $$Sim: se o feedback verbal já foi dado ao longo do ano, a avaliação formal escrita se torna redundante e pode ser dispensada.$$, explicacao = $$Mesmo com bastante feedback informal ao longo do ano, a avaliação formal cumpre uma função distinta: gerar um registro documentado que embasa decisões formais — pular essa etapa tira a rastreabilidade do processo, mesmo quando a comunicação verbal foi boa.$$, correta = false
where questao_id = '0906dc40-85db-44d0-86ec-2e17095780ba' and letra = 'B';
update alternativas set texto = $$Sim, mas apenas para colaboradores que já estão na empresa há mais de cinco anos.$$, explicacao = $$Tempo de casa não muda a necessidade de um registro formal — a distinção entre feedback contínuo e avaliação formal vale para qualquer colaborador, independentemente da antiguidade.$$, correta = false
where questao_id = '0906dc40-85db-44d0-86ec-2e17095780ba' and letra = 'C';
update alternativas set texto = $$Não: a avaliação formal deveria substituir totalmente o feedback contínuo ao longo do ano, para não gerar mensagens conflitantes.$$, explicacao = $$As duas práticas não competem entre si — o objetivo do feedback contínuo é justamente evitar que a avaliação formal traga qualquer surpresa, então elas deveriam ser consistentes e complementares, não substituir uma a outra.$$, correta = false
where questao_id = '0906dc40-85db-44d0-86ec-2e17095780ba' and letra = 'D';
update alternativas set texto = $$Não: o feedback contínuo e a avaliação formal cumprem papéis diferentes — o feedback frequente ajusta o rumo no curto prazo, enquanto a avaliação formal documenta oficialmente o desempenho do período, com efeitos em decisões como promoção e remuneração, que dependem de um registro formal, não apenas de conversas verbais.$$, explicacao = $$Correto! Feedback contínuo reduz surpresas na avaliação formal, mas não a substitui: decisões estruturais (promoção, mérito, plano de desenvolvimento) normalmente exigem um registro formal e consistente, que a informalidade do dia a dia não supre sozinha.$$, correta = true
where questao_id = '0906dc40-85db-44d0-86ec-2e17095780ba' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Um colaborador acredita que será promovido automaticamente após completar dois anos na empresa, independentemente de outros fatores. Ao consultar o programa de carreira, ele descobre que a promoção depende da demonstração de competências e impacto no nível seguinte, com evidências concretas — o tempo de casa, sozinho, não é critério suficiente. Por que empresas costumam adotar esse modelo em vez de promoção automática por tempo?$$
where id = '13db7710-cafe-4249-9fd4-d68f12fe352d';

update alternativas set texto = $$Porque promoção baseada em tempo de casa é ilegal em qualquer empresa.$$, explicacao = $$Não é uma questão de legalidade — empresas podem, em tese, adotar diferentes critérios; a escolha por competências e impacto é uma decisão de política interna voltada à meritocracia, não uma obrigação legal genérica.$$, correta = false
where questao_id = '13db7710-cafe-4249-9fd4-d68f12fe352d' and letra = 'B';
update alternativas set texto = $$Porque tempo de casa é o único critério que realmente importa, e o programa de carreira só formaliza isso de forma mais burocrática.$$, explicacao = $$É o oposto do que o programa de carreira descrito propõe: ele explicitamente substitui o critério de tempo por competências e impacto demonstrados, exatamente para ir além da mera permanência.$$, correta = false
where questao_id = '13db7710-cafe-4249-9fd4-d68f12fe352d' and letra = 'C';
update alternativas set texto = $$Porque promoções deveriam depender exclusivamente da avaliação do próprio colaborador sobre si mesmo.$$, explicacao = $$Autoavaliação pode ser um insumo do processo, mas não costuma ser o único critério — evidências de impacto avaliadas por gestores e pares dão mais robustez e isenção ao processo do que depender só da percepção do próprio colaborador.$$, correta = false
where questao_id = '13db7710-cafe-4249-9fd4-d68f12fe352d' and letra = 'D';
update alternativas set texto = $$Porque tempo de casa mede apenas permanência, não necessariamente o desenvolvimento de competências e impacto exigidos no cargo seguinte — avaliar evidências concretas garante que a promoção reflita a capacidade real de assumir o próximo nível.$$, explicacao = $$Correto! Promoção automática por tempo desconecta o critério de avanço do que realmente importa: se a pessoa já demonstra as competências e o impacto esperado do próximo nível. Avaliar evidências mantém a meritocracia e evita promover alguém que ainda não está pronto para as novas responsabilidades.$$, correta = true
where questao_id = '13db7710-cafe-4249-9fd4-d68f12fe352d' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$A empresa lança um programa de reconhecimento entre colegas que permite enviar "elogios" públicos e pequenos pontos de recompensa a qualquer momento, sem precisar de aprovação de um gestor. Um diretor questiona o programa, argumentando que "reconhecimento só tem valor real se vier em forma de um grande prêmio anual, escolhido cuidadosamente pela liderança" — e sugere cancelar os elogios informais para investir tudo em uma cerimônia anual maior. Por que essa lógica costuma ser equivocada, segundo o que se sabe sobre motivação e reconhecimento no trabalho?$$
where id = '2500d514-9f98-4973-bed1-e3c1bee7b84a';

update alternativas set texto = $$Porque grandes prêmios anuais nunca deveriam existir; toda forma de reconhecimento formal e cerimonial é ineficaz.$$, explicacao = $$A questão não é que reconhecimento formal e cerimonial seja inútil — ele tem seu papel simbólico e de celebração coletiva — o ponto é que ele não substitui a frequência e a proximidade temporal do reconhecimento contínuo entre pares.$$, correta = false
where questao_id = '2500d514-9f98-4973-bed1-e3c1bee7b84a' and letra = 'B';
update alternativas set texto = $$Porque reconhecimento entre colegas só funciona quando aprovado previamente por um gestor, o que o programa deveria exigir.$$, explicacao = $$Exigir aprovação prévia de gestor para cada elogio tornaria o reconhecimento mais lento e menos espontâneo — parte do valor do programa está justamente em permitir reconhecimento imediato entre pares, sem esse gargalo.$$, correta = false
where questao_id = '2500d514-9f98-4973-bed1-e3c1bee7b84a' and letra = 'C';
update alternativas set texto = $$Porque o diretor está certo: cancelar o programa informal e concentrar tudo num prêmio anual maximiza o orçamento de reconhecimento disponível.$$, explicacao = $$Concentrar todo o orçamento em um único evento anual pode até ser mais simples de administrar, mas abre mão do efeito motivacional do reconhecimento frequente e próximo do momento da ação — o que a pesquisa sobre engajamento no trabalho considera um trade-off desfavorável.$$, correta = false
where questao_id = '2500d514-9f98-4973-bed1-e3c1bee7b84a' and letra = 'D';
update alternativas set texto = $$Porque reconhecimento frequente e próximo do momento em que a boa ação aconteceu tem impacto motivacional mais consistente do que um prêmio grande, mas raro e distante no tempo — os dois formatos cumprem papéis diferentes, e substituir um pelo outro tende a reduzir o efeito total do reconhecimento ao longo do ano.$$, explicacao = $$Correto! Reconhecimento oportuno (próximo do momento do bom trabalho) reforça o comportamento desejado de forma mais eficaz do que um reconhecimento único e distante — grandes prêmios anuais têm seu valor simbólico, mas não substituem o efeito cumulativo do reconhecimento contínuo. Os formatos são complementares, não concorrentes.$$, correta = true
where questao_id = '2500d514-9f98-4973-bed1-e3c1bee7b84a' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$A empresa avalia o "impacto" de cada colaborador contando o número de menções a ele em canais públicos de comunicação (como elogios e agradecimentos visíveis a todos), presumindo que mais menções significam mais impacto real. Um analista percebe que colaboradores em áreas de suporte interno (como TI e operações), cujo trabalho raramente é visto publicamente pelos clientes ou por outras áreas, aparecem sistematicamente com pontuação de "impacto" mais baixa — mesmo quando o trabalho deles é essencial. Por que essa métrica, apesar de parecer objetiva (é só contar menções), pode gerar uma avaliação de mérito injusta?$$
where id = '67502332-c395-40b1-8b3a-b09d0b3949cc';

update alternativas set texto = $$Não há problema: se a contagem é objetiva e automática, o resultado é necessariamente justo, então a pontuação mais baixa reflete impacto real menor dessas áreas.$$, explicacao = $$Objetividade no CÁLCULO de uma métrica (contar menções é simples e sem ambiguidade) não garante que ela meça o que realmente importa — o viés está na escolha do que contar, não na precisão da contagem em si.$$, correta = false
where questao_id = '67502332-c395-40b1-8b3a-b09d0b3949cc' and letra = 'B';
update alternativas set texto = $$O problema é que colaboradores de TI e operações trabalham menos que os demais, então a pontuação mais baixa é esperada e correta.$$, explicacao = $$Nada no cenário indica menor volume ou qualidade de trabalho dessas áreas — a explicação mais plausível é que a métrica captura visibilidade pública, não esforço ou impacto real, o que penaliza sistematicamente funções de bastidor.$$, correta = false
where questao_id = '67502332-c395-40b1-8b3a-b09d0b3949cc' and letra = 'C';
update alternativas set texto = $$A solução é aumentar o peso da métrica de menções públicas ainda mais, para incentivar todo mundo a buscar mais visibilidade.$$, explicacao = $$Aumentar o peso de uma métrica já enviesada só amplificaria a distorção contra áreas de suporte interno — a correção adequada é revisar a métrica (ou complementá-la com outros indicadores), não reforçar o critério problemático.$$, correta = false
where questao_id = '67502332-c395-40b1-8b3a-b09d0b3949cc' and letra = 'D';
update alternativas set texto = $$Porque a métrica mede visibilidade, não necessariamente impacto real — funções de suporte interno podem ter alto impacto sem gerar menções públicas frequentes, então usar apenas essa contagem introduz um viés sistemático contra esses papéis, mesmo sendo um número "objetivo" de se calcular.$$, explicacao = $$Correto! Uma métrica pode ser tecnicamente objetiva (fácil de contar, sem ambiguidade no cálculo) e, ainda assim, ser um mau indicador do que realmente se quer medir (impacto real). Aqui, a visibilidade pública correlaciona mal com o valor gerado por funções de bastidor — é preciso complementar ou ajustar a métrica para não distorcer sistematicamente a avaliação de mérito contra certos papéis.$$, correta = true
where questao_id = '67502332-c395-40b1-8b3a-b09d0b3949cc' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Um colaborador cria, junto com o gestor, um Plano de Desenvolvimento Individual (PDI) bem estruturado no início do ano, com metas claras de aprendizado. Ainda assim, ao final do ano, quase nada do PDI foi de fato executado — mesmo o plano estando tecnicamente correto e bem escrito. Qual é a explicação mais provável para esse tipo de falha?$$
where id = '7884c08f-a9f4-42cb-ba77-1479a40cae75';

update alternativas set texto = $$PDIs nunca funcionam, independentemente de como são acompanhados, então a falha era esperada desde o início.$$, explicacao = $$PDIs funcionam bem quando têm acompanhamento periódico — a falha aqui não é do instrumento em si, mas da ausência de checkpoints regulares, que é o que sustenta a execução ao longo do tempo.$$, correta = false
where questao_id = '7884c08f-a9f4-42cb-ba77-1479a40cae75' and letra = 'B';
update alternativas set texto = $$O colaborador certamente não se esforçou o suficiente, já que o plano estava bem escrito desde o início.$$, explicacao = $$Um plano bem escrito não garante execução por si só — atribuir a falha exclusivamente à falta de esforço ignora a ausência de um processo de acompanhamento, que é normalmente uma responsabilidade compartilhada entre colaborador e gestor.$$, correta = false
where questao_id = '7884c08f-a9f4-42cb-ba77-1479a40cae75' and letra = 'C';
update alternativas set texto = $$O problema é que o PDI foi criado no início do ano; planos de desenvolvimento só funcionam se forem criados no meio do ano.$$, explicacao = $$O momento de criação do plano não é a causa provável do problema — o que sustenta a execução ao longo do tempo é o acompanhamento periódico, não a época específica em que o plano foi elaborado.$$, correta = false
where questao_id = '7884c08f-a9f4-42cb-ba77-1479a40cae75' and letra = 'D';
update alternativas set texto = $$Faltaram checkpoints periódicos de acompanhamento ao longo do ano — um PDI bem escrito, mas revisado só uma vez (na criação) e nunca mais, tende a perder prioridade frente às demandas do dia a dia.$$, explicacao = $$Correto! Ter um plano correto no papel não garante execução: sem revisões periódicas (mensais ou trimestrais, por exemplo) para checar progresso e reforçar prioridade, ele naturalmente perde espaço para as urgências do cotidiano.$$, correta = true
where questao_id = '7884c08f-a9f4-42cb-ba77-1479a40cae75' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Cada colaborador do time tem sua meta individual registrada em uma planilha separada, sem nenhuma ligação direta com a meta agregada do time, que fica em outro documento. Toda vez que a liderança precisa saber "quanto falta para o time bater a meta agregada", alguém precisa abrir e somar manualmente as dezenas de planilhas individuais, o que consome horas e ainda gera erros de digitação. Com o crescimento do time, esse processo virou um gargalo relatado por vários gestores. Qual é a causa raiz e a solução mais estrutural?$$
where id = '7bb3e946-1c02-48a9-bf62-53cde75340b5';

update alternativas set texto = $$O problema é que o time é grande demais; reduzir o número de colaboradores resolveria o gargalo.$$, explicacao = $$Reduzir o time só diminuiria o número de planilhas a somar manualmente, mas não resolveria a causa raiz: a ausência de uma estrutura conectada continuaria exigindo trabalho manual, só que em menor escala.$$, correta = false
where questao_id = '7bb3e946-1c02-48a9-bf62-53cde75340b5' and letra = 'B';
update alternativas set texto = $$Não há problema real: somar planilhas manualmente é a forma mais confiável de acompanhar metas, mesmo demorando horas.$$, explicacao = $$O processo manual, além de lento, já foi identificado como gerador de erros de digitação — "mais confiável" não descreve um processo demorado e propenso a erro; a solução estruturada reduz ambos os problemas.$$, correta = false
where questao_id = '7bb3e946-1c02-48a9-bf62-53cde75340b5' and letra = 'C';
update alternativas set texto = $$A solução é que cada gestor faça a soma mentalmente durante as reuniões, sem depender de planilhas.$$, explicacao = $$Fazer contas de cabeça em reunião não resolve a causa raiz (a falta de estrutura conectada) e ainda é mais sujeito a erro do que qualquer processo manual já problemático descrito no cenário.$$, correta = false
where questao_id = '7bb3e946-1c02-48a9-bf62-53cde75340b5' and letra = 'D';
update alternativas set texto = $$A causa raiz é a falta de uma estrutura conectada entre metas individuais e a meta agregada (cada meta individual deveria referenciar diretamente a meta do time da qual faz parte); a solução é usar um sistema/planilha único com essa hierarquia explícita, permitindo que o progresso agregado seja calculado automaticamente a partir das metas individuais, sem soma manual.$$, explicacao = $$Correto! Sem uma ligação clara entre o nível individual e o agregado, qualquer consulta ao progresso do time exige um trabalho manual que cresce proporcionalmente ao número de planilhas — estruturar a relação (cada meta individual referenciando explicitamente a meta do time) permite que o cálculo agregado seja automático e sempre atualizado.$$, correta = true
where questao_id = '7bb3e946-1c02-48a9-bf62-53cde75340b5' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Você quer reconhecer um colega que te ajudou muito em uma entrega importante. Qual forma de reconhecimento tende a ser mais eficaz?$$
where id = 'a0c131a0-d757-4e5c-8e41-15d1dd91c414';

update alternativas set texto = $$Um comentário genérico como "bom trabalho", sem detalhar o que exatamente foi bem feito.$$, explicacao = $$Um elogio genérico transmite menos informação sobre o que exatamente foi valioso — reconhecimento específico tem impacto motivacional maior, pois deixa claro qual comportamento vale a pena repetir.$$, correta = false
where questao_id = 'a0c131a0-d757-4e5c-8e41-15d1dd91c414' and letra = 'B';
update alternativas set texto = $$Esperar a avaliação de desempenho anual para mencionar a ajuda recebida.$$, explicacao = $$Esperar meses para reconhecer uma ajuda pontual reduz o efeito motivacional do reconhecimento — quanto mais próximo do momento da ação, mais forte tende a ser o impacto.$$, correta = false
where questao_id = 'a0c131a0-d757-4e5c-8e41-15d1dd91c414' and letra = 'C';
update alternativas set texto = $$Não dizer nada diretamente, mas mencionar a ajuda apenas em conversas privadas com outras pessoas.$$, explicacao = $$Reconhecimento que nunca chega até a pessoa reconhecida perde o efeito motivacional — o colega que ajudou deveria ser o primeiro a saber que seu esforço foi percebido.$$, correta = false
where questao_id = 'a0c131a0-d757-4e5c-8e41-15d1dd91c414' and letra = 'D';
update alternativas set texto = $$Um elogio específico, dizendo exatamente o que ele fez e qual foi o impacto (por exemplo, "sua revisão detalhada evitou um erro que teria afetado o cliente").$$, explicacao = $$Correto! Reconhecimento específico, ligado a uma ação concreta e seu impacto, é mais significativo e reforça exatamente o comportamento que se quer incentivar — muito mais do que um elogio vago.$$, correta = true
where questao_id = 'a0c131a0-d757-4e5c-8e41-15d1dd91c414' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Durante uma avaliação de desempenho, o colaborador se avalia com uma nota mais alta do que a nota dada pelo gestor para os mesmos critérios. Por que esse tipo de divergência de percepção é considerado normal e esperado nesses processos, mesmo com critérios bem definidos?$$
where id = 'a5d2d7f5-405e-4145-b923-86a3ff7920df';

update alternativas set texto = $$Porque um dos dois lados está necessariamente mentindo sobre o desempenho.$$, explicacao = $$Divergência de nota não significa má-fé de nenhuma das partes — é uma diferença natural de perspectiva entre quem vive o esforço por dentro e quem observa o resultado de fora, por isso o processo prevê uma conversa de alinhamento, não uma acusação.$$, correta = false
where questao_id = 'a5d2d7f5-405e-4145-b923-86a3ff7920df' and letra = 'B';
update alternativas set texto = $$Porque critérios de avaliação de desempenho nunca deveriam existir, já que sempre geram esse tipo de divergência.$$, explicacao = $$A existência de critérios claros é o que permite justamente identificar e discutir a divergência de forma objetiva — sem critérios definidos, a conversa de calibração teria ainda menos base para acontecer.$$, correta = false
where questao_id = 'a5d2d7f5-405e-4145-b923-86a3ff7920df' and letra = 'C';
update alternativas set texto = $$Porque colaboradores sempre superestimam o próprio desempenho, sem exceção.$$, explicacao = $$Divergências podem ir em ambas as direções (às vezes o colaborador se avalia abaixo do que o gestor percebe) — tratar isso como uma regra fixa e unidirecional ignora a variedade real dessas conversas.$$, correta = false
where questao_id = 'a5d2d7f5-405e-4145-b923-86a3ff7920df' and letra = 'D';
update alternativas set texto = $$Porque autoavaliação e avaliação do gestor partem de perspectivas diferentes (visão interna do esforço x visão externa do resultado observado); por isso a maioria dos processos de avaliação inclui uma conversa de calibração para alinhar as duas visões, em vez de assumir que elas serão sempre idênticas.$$, explicacao = $$Correto! É esperado que autoavaliação e avaliação do gestor não coincidam perfeitamente, já que cada uma reflete uma perspectiva diferente — é exatamente por isso que a conversa de calibração existe, para alinhar as duas visões com base em evidências concretas.$$, correta = true
where questao_id = 'a5d2d7f5-405e-4145-b923-86a3ff7920df' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$A empresa está comparando dois formatos de programa de reconhecimento entre colegas: o primeiro dá pontos acumuláveis, trocáveis por prêmios materiais; o segundo é puramente social, com elogios públicos sem nenhuma recompensa material associada. Qual afirmação sobre os dois formatos é mais precisa?$$
where id = 'bc17c956-1bc7-4306-b3e1-9e5df1a41599';

update alternativas set texto = $$Reconhecimento social é sempre inútil, porque só recompensas materiais realmente motivam colaboradores.$$, explicacao = $$Reconhecimento social tem efeito motivacional real e documentado, especialmente quando é específico e público — reduzir motivação apenas a recompensas materiais ignora um componente importante do reconhecimento no trabalho.$$, correta = false
where questao_id = 'bc17c956-1bc7-4306-b3e1-9e5df1a41599' and letra = 'B';
update alternativas set texto = $$Pontos trocáveis por prêmios são sempre um desperdício de orçamento, e a empresa deveria usar exclusivamente reconhecimento social.$$, explicacao = $$Programas com recompensa material também têm valor, funcionando como um incentivo tangível complementar — descartar esse formato por completo ignora o papel que ele pode cumprir junto ao reconhecimento social.$$, correta = false
where questao_id = 'bc17c956-1bc7-4306-b3e1-9e5df1a41599' and letra = 'C';
update alternativas set texto = $$Os dois formatos são exatamente iguais em efeito e custo, então a escolha entre eles é indiferente.$$, explicacao = $$Os formatos têm custos e efeitos diferentes (um envolve orçamento para prêmios, o outro praticamente não) — tratar como indiferentes ignora justamente o trade-off que a empresa precisa avaliar ao escolher ou combiná-los.$$, correta = false
where questao_id = 'bc17c956-1bc7-4306-b3e1-9e5df1a41599' and letra = 'D';
update alternativas set texto = $$Os dois formatos podem coexistir e se complementam: o reconhecimento social reforça a cultura de forma contínua e de baixo custo, enquanto pontos trocáveis por prêmios adicionam um incentivo tangível adicional — a escolha entre eles (ou o uso combinado) depende do orçamento e da cultura que a empresa quer reforçar.$$, explicacao = $$Correto! Assim como diferentes formas de resolver um mesmo problema podem ter trade-offs distintos sem uma ser universalmente "melhor", reconhecimento social e reconhecimento com recompensa material atendem necessidades diferentes — muitas empresas usam os dois em conjunto, não como alternativas excludentes.$$, correta = true
where questao_id = 'bc17c956-1bc7-4306-b3e1-9e5df1a41599' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Um gestor de time grande precisa saber, toda semana, qual colaborador está mais atrasado em relação às próprias metas do trimestre, para focar o apoio onde é mais necessário. Hoje, ele faz isso perguntando individualmente a cada pessoa em conversas separadas, o que consome boa parte da semana. Um dashboard automatizado de acompanhamento de metas resolveria esse problema de que forma?$$
where id = 'c96816e0-d845-4f65-9266-c0233899cea7';

update alternativas set texto = $$O dashboard eliminaria completamente a necessidade de qualquer conversa entre o gestor e o time sobre metas.$$, explicacao = $$O dashboard ajuda a IDENTIFICAR rapidamente onde focar, mas não substitui a conversa em si — o apoio real ainda depende do diálogo; a ferramenta só torna a etapa de descoberta muito mais rápida.$$, correta = false
where questao_id = 'c96816e0-d845-4f65-9266-c0233899cea7' and letra = 'B';
update alternativas set texto = $$O dashboard só funcionaria se o time tivesse menos de dez pessoas; para times grandes, conversas individuais continuam sendo mais eficientes.$$, explicacao = $$É o contrário: quanto maior o time, maior a vantagem de centralizar a informação em um painel — conversas individuais escalam mal justamente quando o número de pessoas cresce.$$, correta = false
where questao_id = 'c96816e0-d845-4f65-9266-c0233899cea7' and letra = 'C';
update alternativas set texto = $$O dashboard resolveria o problema garantindo que nenhum colaborador jamais fique atrasado em relação às próprias metas.$$, explicacao = $$Um dashboard ajuda a IDENTIFICAR atrasos mais rápido, mas não impede que eles aconteçam por si só — a ferramenta melhora a velocidade de detecção, não elimina a possibilidade de atraso.$$, correta = false
where questao_id = 'c96816e0-d845-4f65-9266-c0233899cea7' and letra = 'D';
update alternativas set texto = $$O dashboard concentraria o status de progresso de todos os colaboradores em um único lugar, permitindo identificar rapidamente quem está mais atrasado sem precisar de uma rodada de conversas individuais só para levantar essa informação.$$, explicacao = $$Correto! Consultar um painel centralizado e sempre atualizado é muito mais rápido do que reunir a mesma informação uma pessoa de cada vez — a vantagem concreta é reduzir o tempo gasto só para SABER onde o apoio é mais necessário, deixando mais tempo para efetivamente apoiar.$$, correta = true
where questao_id = 'c96816e0-d845-4f65-9266-c0233899cea7' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Ao revisar o fluxo de aprovações de despesas de um time, a auditoria interna encontra uma situação em que a Pessoa A aprova despesas da Pessoa B, que aprova despesas da Pessoa C, que por sua vez aprova despesas da Pessoa A — fechando um ciclo em que, na prática, ninguém é verdadeiramente fiscalizado por alguém fora do próprio grupo. Por que esse tipo de ciclo de aprovação é considerado um problema de governança, mesmo que cada aprovação individual pareça correta isoladamente?$$
where id = 'ce18c341-bbbf-4b7f-a8ca-a0afcc2ffc23';

update alternativas set texto = $$Não é um problema real, já que todas as aprovações seguem formalmente a política, com cada pessoa aprovando exatamente quem deveria aprovar.$$, explicacao = $$Seguir a forma da política (cada aprovação individualmente correta) não garante a substância da governança — o ciclo fechado elimina a fiscalização externa real, que é justamente o objetivo por trás da exigência de aprovação.$$, correta = false
where questao_id = 'ce18c341-bbbf-4b7f-a8ca-a0afcc2ffc23' and letra = 'B';
update alternativas set texto = $$O problema só existiria se o ciclo envolvesse mais de dez pessoas; com apenas três, não há risco de governança.$$, explicacao = $$O tamanho do ciclo não é o que determina o risco — mesmo um ciclo pequeno, com poucas pessoas, já elimina a fiscalização externa real, que é a questão central de governança nesse cenário.$$, correta = false
where questao_id = 'ce18c341-bbbf-4b7f-a8ca-a0afcc2ffc23' and letra = 'C';
update alternativas set texto = $$A solução é aumentar a frequência das aprovações dentro do mesmo ciclo, para compensar a falta de fiscalização externa.$$, explicacao = $$Aumentar a frequência das aprovações dentro do próprio ciclo fechado não resolve nada — o problema estrutural é a ausência de alguém de fora aprovando, não a quantidade de vezes que o ciclo interno se repete.$$, correta = false
where questao_id = 'ce18c341-bbbf-4b7f-a8ca-a0afcc2ffc23' and letra = 'D';
update alternativas set texto = $$Porque, apesar de cada aprovação parecer normal isoladamente, o ciclo fechado permite que o grupo aprove despesas "entre si" sem nenhuma supervisão externa real — a estrutura de aprovação deveria sempre terminar em alguém fora do ciclo, para garantir fiscalização de fato independente.$$, explicacao = $$Correto! Um ciclo de aprovações mútuas quebra o princípio de segregação de funções: mesmo que cada aprovação siga a regra formal (uma pessoa aprovando a outra), o conjunto cria uma zona sem fiscalização externa real — é esse tipo de estrutura que auditorias de compliance são treinadas para identificar e corrigir.$$, correta = true
where questao_id = 'ce18c341-bbbf-4b7f-a8ca-a0afcc2ffc23' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Você quer ser apresentado(a) a alguém de outra área que nunca conheceu, mas sabe que tem colegas em comum que talvez consigam fazer essa ponte. Qual é a forma mais eficiente de encontrar o caminho mais curto até essa pessoa?$$
where id = 'ce797c94-dea3-4b02-af9a-4e72edc9cd34';

update alternativas set texto = $$Perguntar diretamente para todos da empresa ao mesmo tempo em um canal público, sem considerar proximidade de contatos.$$, explicacao = $$Perguntar para toda a empresa de uma vez gera ruído desnecessário e não aproveita a informação de quem já está mais próximo de você — começar pelos contatos diretos costuma ser mais rápido e direcionado.$$, correta = false
where questao_id = 'ce797c94-dea3-4b02-af9a-4e72edc9cd34' and letra = 'B';
update alternativas set texto = $$Esperar que a pessoa desejada apareça em algum evento da empresa, sem buscar ativamente uma apresentação.$$, explicacao = $$Esperar passivamente por um encontro casual é bem menos eficiente do que buscar ativamente uma ponte através de conexões em comum, especialmente se a apresentação tem alguma urgência.$$, correta = false
where questao_id = 'ce797c94-dea3-4b02-af9a-4e72edc9cd34' and letra = 'C';
update alternativas set texto = $$Perguntar aos seus contatos mais distantes primeiro, guardando os contatos próximos para depois.$$, explicacao = $$Começar pelos contatos mais distantes inverte a lógica mais eficiente de busca — os contatos próximos têm maior chance de conhecer diretamente a pessoa ou de indicar rapidamente quem conhece.$$, correta = false
where questao_id = 'ce797c94-dea3-4b02-af9a-4e72edc9cd34' and letra = 'D';
update alternativas set texto = $$Perguntar primeiro aos seus contatos mais próximos se algum deles conhece diretamente a pessoa desejada, e só então expandir a busca para os contatos dos seus contatos, evitando repetir quem já foi consultado.$$, explicacao = $$Correto! Começar pelos contatos mais próximos e expandir gradualmente para conexões mais distantes (sem repetir quem já foi perguntado) é a forma mais eficiente de achar o caminho mais curto até alguém — perguntar aleatoriamente ou pular direto para conexões distantes tende a ser menos eficaz.$$, correta = true
where questao_id = 'ce797c94-dea3-4b02-af9a-4e72edc9cd34' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$No processo de calibração de desempenho, a empresa reúne todos os gestores de uma área em um único comitê, onde as notas de todo o time são discutidas e ajustadas em conjunto, comparando os colaboradores entre si de uma vez. Um gestor sugere, em vez disso, revisar a nota de cada colaborador individualmente, um de cada vez, refazendo a comparação com o time inteiro a cada nova revisão. Por que o formato de comitê único tende a ser bem mais eficiente que revisar pessoa por pessoa, repetindo a comparação completa a cada vez?$$
where id = 'dfd7332f-761d-4944-81c1-1702b0defceb';

update alternativas set texto = $$Não há diferença real de eficiência entre os dois formatos; a escolha é puramente uma questão de preferência cultural da empresa.$$, explicacao = $$Há, sim, uma diferença estrutural de eficiência: revisar pessoa por pessoa, refazendo a comparação com o time inteiro a cada vez, multiplica o esforço de comparação — não é apenas uma questão de preferência, mas de quanto trabalho repetido cada formato exige.$$, correta = false
where questao_id = 'dfd7332f-761d-4944-81c1-1702b0defceb' and letra = 'B';
update alternativas set texto = $$O comitê único é mais rápido apenas porque reúne menos gestores do que o formato de revisão individual.$$, explicacao = $$O número de gestores presentes não é o que explica a diferença de eficiência — o ganho vem de evitar repetir a mesma comparação entre colaboradores várias vezes, não do tamanho do grupo reunido.$$, correta = false
where questao_id = 'dfd7332f-761d-4944-81c1-1702b0defceb' and letra = 'C';
update alternativas set texto = $$Revisar pessoa por pessoa é sempre mais justo, mesmo sendo mais lento, porque cada colaborador recebe atenção individual dedicada.$$, explicacao = $$Atenção individual não está em jogo aqui: no comitê único, cada colaborador também é discutido individualmente — a diferença é que a comparação entre pares acontece uma vez só, com todo mundo à mesa, em vez de ser refeita repetidamente a cada revisão isolada.$$, correta = false
where questao_id = 'dfd7332f-761d-4944-81c1-1702b0defceb' and letra = 'D';
update alternativas set texto = $$Porque, no comitê único, cada comparação relevante entre colaboradores é feita uma única vez, com o contexto de todos disponível ao mesmo tempo; já revisar pessoa por pessoa, refazendo a comparação com o time inteiro a cada rodada, repete o mesmo trabalho de comparação muitas vezes — multiplicando o esforço total pelo número de colaboradores revisados.$$, explicacao = $$Correto! Assim como reorganizar um conjunto inteiro de uma vez é mais eficiente do que refazer comparações repetidas para cada item isoladamente, calibrar o time todo junto evita que a mesma comparação entre pares de colaboradores seja refeita várias vezes — o formato em comitê único faz o trabalho de comparação convergir muito mais rápido do que revisões sequenciais e repetitivas.$$, correta = true
where questao_id = 'dfd7332f-761d-4944-81c1-1702b0defceb' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$Você tem uma lista de tarefas do dia com prazos diferentes. Qual prática ajuda mais a garantir que você sempre trabalhe primeiro na tarefa mais urgente, mesmo quando novas tarefas chegam ao longo do dia?$$
where id = 'e5c03093-83a7-49dd-9b4e-afd048be3f22';

update alternativas set texto = $$Trabalhar sempre na primeira tarefa que foi anotada na lista, na ordem em que apareceu.$$, explicacao = $$Seguir só a ordem de chegada ignora o prazo real de cada tarefa — uma tarefa urgente que chegou depois ficaria esperando atrás de outras menos urgentes, o que não é o resultado desejado.$$, correta = false
where questao_id = 'e5c03093-83a7-49dd-9b4e-afd048be3f22' and letra = 'B';
update alternativas set texto = $$Trabalhar sempre na última tarefa anotada, presumindo que é a mais recente e, portanto, a mais importante.$$, explicacao = $$Ser a tarefa mais recente não significa ser a mais urgente — uma tarefa antiga pode ter um prazo mais apertado do que uma que acabou de chegar; o critério certo é o prazo, não a ordem de chegada.$$, correta = false
where questao_id = 'e5c03093-83a7-49dd-9b4e-afd048be3f22' and letra = 'C';
update alternativas set texto = $$Ignorar prazos e trabalhar nas tarefas mais fáceis primeiro, deixando as mais urgentes por último.$$, explicacao = $$Priorizar pela facilidade, ignorando o prazo, é o oposto do que se busca aqui: tarefas urgentes podem ficar sem tempo hábil se forem sistematicamente deixadas para o final.$$, correta = false
where questao_id = 'e5c03093-83a7-49dd-9b4e-afd048be3f22' and letra = 'D';
update alternativas set texto = $$Manter a lista organizada por prazo/urgência (não por ordem de chegada), reavaliando a prioridade sempre que uma tarefa nova entra na lista.$$, explicacao = $$Correto! Organizar por urgência, e não por ordem de chegada, garante que uma tarefa com prazo mais apertado que chegou depois ainda seja tratada antes de outra menos urgente que já estava na lista — é isso que uma lista de prioridade bem mantida proporciona.$$, correta = true
where questao_id = 'e5c03093-83a7-49dd-9b4e-afd048be3f22' and letra = 'A';

update questoes set codigo_snippet = null, enunciado = $$A empresa passa por uma reorganização: um time é dividido em dois, cada um com um novo gestor. Uma pessoa do RH sugere apenas "copiar" a lista antiga de subordinados do gestor original para os dois novos gestores, sem atualizar individualmente quem reporta a quem no sistema. Por que essa abordagem provavelmente vai gerar problemas, e o que deveria ser feito no lugar?$$
where id = 'f8caee80-1221-4638-a834-987f7342ba58';

update alternativas set texto = $$Não há problema real: como os dois novos times vieram do mesmo time original, o sistema vai entender automaticamente quem pertence a cada um.$$, explicacao = $$Sistemas de RH não inferem automaticamente uma nova divisão organizacional — cada reporte precisa ser explicitamente atualizado para refletir a estrutura nova, ou o sistema continuará refletindo a estrutura antiga.$$, correta = false
where questao_id = 'f8caee80-1221-4638-a834-987f7342ba58' and letra = 'B';
update alternativas set texto = $$O problema só apareceria se a reorganização envolvesse mais de cem colaboradores; para times pequenos, copiar a lista antiga funciona bem.$$, explicacao = $$O tamanho do time não muda a necessidade de atualizar cada reporte individualmente — mesmo em times pequenos, uma referência de reporte desatualizada pode gerar problemas em aprovações, acessos e relatórios organizacionais.$$, correta = false
where questao_id = 'f8caee80-1221-4638-a834-987f7342ba58' and letra = 'C';
update alternativas set texto = $$A reorganização deveria acontecer a cada mudança de gestor, para nunca ser necessário atualizar o sistema.$$, explicacao = $$Isso inverte a lógica do problema: é justamente quando a estrutura muda que o sistema precisa ser atualizado — evitar reorganizações não é uma alternativa viável nem resolve a necessidade de manter os dados corretos quando a mudança de fato ocorre.$$, correta = false
where questao_id = 'f8caee80-1221-4638-a834-987f7342ba58' and letra = 'D';
update alternativas set texto = $$Porque cada colaborador precisa ter seu reporte atualizado explicitamente para o novo gestor correto — copiar a lista antiga sem essa atualização deixaria referências desatualizadas, com colaboradores aparecendo sob o gestor errado ou sob os dois gestores ao mesmo tempo no sistema.$$, explicacao = $$Correto! Sempre que a estrutura organizacional muda, cada referência de reporte precisa ser atualizada individualmente para refletir a nova estrutura — assumir que a divisão antiga "ainda serve" sem atualizar cada pessoa gera inconsistência no sistema de RH e pode até afetar aprovações e acessos baseados em hierarquia.$$, correta = true
where questao_id = 'f8caee80-1221-4638-a834-987f7342ba58' and letra = 'A';
