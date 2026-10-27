-- ============================================================
-- 34_limpeza_conteudo_corporativo.sql — Remove os últimos resquícios
-- do conteúdo de Engenharia de Software/Estrutura de Dados e reforça
-- os módulos de formato especial (duelo e passo a passo), que tinham
-- poucas questões (5 e 3).
--
-- Contexto: a 31 reescrevia as questões por posição com
-- "order by created_at offset N", e várias questões do seed foram
-- inseridas no MESMO statement (created_at empatado). Como cada UPDATE
-- gera uma nova versão física da linha, o "N-ésimo" mudava entre um
-- statement e outro — numa base fresca, enunciados corporativos
-- acabavam com alternativas de outra questão (às vezes ainda de CS) e
-- questões de CS sobreviviam intactas. A 31 foi corrigida para
-- desempatar por id; esta migration é a rede de segurança para
-- qualquer base onde a 31 antiga já rodou (inclusive produção, caso
-- algum resquício tenha sobrado): é um no-op onde o conteúdo já está
-- limpo.
--
-- Soft-delete (ativa = false), nunca DELETE: respostas antigas
-- referenciam essas questões e o histórico não pode quebrar.
-- Idempotente: os inserts são guardados por "where not exists" no
-- enunciado.
-- ============================================================

-- ---------- 1. Desativa questões com conteúdo técnico ----------
-- Só questões do seed (criada_por is null) — nunca mexe no que um gestor
-- cadastrou à mão. O casamento olha enunciado + alternativas +
-- explicações + passos, porque o bug da 31 podia deixar o enunciado
-- corporativo e as alternativas técnicas.
update questoes q set ativa = false
where q.criada_por is null
  and q.ativa
  and (
    q.codigo_snippet is not null
    or (
      q.enunciado || ' ' || coalesce(q.passos::text, '') || ' ' || coalesce((
        select string_agg(a.texto || ' ' || a.explicacao, ' ')
        from alternativas a where a.questao_id = q.id
      ), '')
    ) ~* '(\marrays?\M|\mheaps?\M|\mBST\M|\mgrafos?\M|\mhash\M|recursiv|recursão|algoritmo|\mpilhas?\M|\mFIFO\M|\mLIFO\M|\mdeque\M|lista ligada|O\((1|n|log)|\mBFS\M|\mDFS\M|Dijkstra|sift-|\mRPN\M|pós-fixa|stack|code review|bubble|merge sort|quick ?sort|busca bin[aá]ria|complexidade|logar[ií]tm|ponteiro|\mnós?\M|big-?o)'
  );

-- O campo de trecho de código vira "texto de apoio" (ex.: cláusula de
-- uma política) — nenhum seed corporativo usa código.
update questoes set codigo_snippet = null
where criada_por is null and codigo_snippet is not null;

alter table questoes alter column linguagem set default 'texto';

-- ---------- 2. Cosmético com tema técnico ----------
update itens_catalogo
set nome = 'Título: Solucionador(a)', parametro = '{"titulo": "Solucionador(a)"}'
where chave = 'titulo_cacador';

-- ---------- 3. Reforço do módulo de duelo (ordem 6) ----------
with dados(n, enunciado) as (values
  (1, 'Você recebe no chat um pedido de um colega de outra área para "dar uma olhada rápida" num relatório, mas está no meio de uma entrega com prazo para daqui a 1 hora. Qual atitude é mais adequada?'),
  (2, 'Na reunião, você discorda da proposta apresentada por um colega mais experiente. Qual é a melhor forma de se posicionar?'),
  (3, 'Você cometeu um erro que atrasou a entrega do time em um dia. Qual atitude é mais adequada?'),
  (4, 'Um cliente pede um prazo que você sabe que o time não consegue cumprir. O que fazer?')
),
inseridas as (
  insert into questoes (fase_id, enunciado, linguagem, dificuldade, tempo_limite_seg, xp_valor, formato)
  select (select id from fases where ordem = 6), d.enunciado, 'texto', 'media', 15, 20, 'batalha_complexidade'
  from dados d
  where not exists (select 1 from questoes q where q.enunciado = d.enunciado)
  returning id, enunciado
)
insert into alternativas (questao_id, letra, texto, correta, explicacao)
select i.id, a.letra, a.texto, a.correta, a.explicacao
from inseridas i
join dados d on d.enunciado = i.enunciado
join (values
  (1, 'A', 'Responder que pode ajudar depois da entrega e combinar um horário.', true,
   'Correto! Combinar um horário respeita o colega e protege o seu compromisso — ninguém fica sem resposta.'),
  (1, 'B', 'Largar a entrega para ajudar na hora, porque ajudar é sempre prioridade.', false,
   'Colaborar é importante, mas abandonar um compromisso com prazo sem negociar gera atraso e retrabalho para outras pessoas.'),
  (2, 'A', 'Expor a discordância com respeito, trazendo dados e perguntando o que você pode estar deixando passar.', true,
   'Correto! Discordância bem argumentada melhora decisões; a pergunta aberta mostra que o foco é o resultado, não ter razão.'),
  (2, 'B', 'Ficar em silêncio na reunião e comentar com outros colegas depois.', false,
   'Guardar a opinião e comentar depois tira do time a chance de decidir com todas as informações e desgasta a confiança.'),
  (3, 'A', 'Assumir o erro com o time, explicar o que aconteceu e propor como evitar que se repita.', true,
   'Correto! Transparência e foco na correção constroem confiança — o time aprende com o erro em vez de esconder problemas.'),
  (3, 'B', 'Não comentar nada e torcer para ninguém perceber de onde veio o atraso.', false,
   'Esconder o erro impede que a causa seja corrigida e, quando descoberto, custa muito mais confiança do que admitir na hora.'),
  (4, 'A', 'Explicar com transparência o prazo realista e oferecer alternativas, como uma entrega parcial.', true,
   'Correto! Expectativa alinhada desde o início vale mais que uma promessa quebrada; alternativas mantêm o cliente bem atendido.'),
  (4, 'B', 'Aceitar o prazo para não desagradar e ver depois como resolver.', false,
   'Prometer o que não dá para cumprir gera frustração maior lá na frente e sobrecarrega o time.')
) as a(n, letra, texto, correta, explicacao) on a.n = d.n;

-- ---------- 4. Reforço do módulo passo a passo (ordem 7) ----------
insert into questoes (fase_id, enunciado, linguagem, dificuldade, tempo_limite_seg, xp_valor, formato, passos, ordem_correta)
select (select id from fases where ordem = 7), v.enunciado, 'texto', v.dificuldade::dificuldade_questao, 30, v.xp, 'reordenar_algoritmo', v.passos::jsonb, v.ordem::jsonb
from (values
  ('Você vai tirar férias de duas semanas. Coloque os passos na ordem certa para sair sem deixar o time na mão.', 'facil', 20,
   '[{"id":"p1","texto":"Combinar o período com o gestor e registrar a solicitação no sistema com antecedência"},{"id":"p2","texto":"Documentar o status das suas demandas e combinar quem cobre cada uma"},{"id":"p3","texto":"Configurar a resposta automática de ausência indicando quem procurar"},{"id":"p4","texto":"Na volta, pedir um resumo do que mudou e retomar as demandas"}]',
   '["p1","p2","p3","p4"]'),
  ('Você precisa dar um feedback de melhoria para um colega. Coloque os passos na ordem certa.', 'media', 20,
   '[{"id":"p1","texto":"Escolher um momento reservado e combinar a conversa com o colega"},{"id":"p2","texto":"Descrever a situação concreta e o impacto que ela teve, sem julgar a pessoa"},{"id":"p3","texto":"Ouvir a visão do colega sobre o que aconteceu"},{"id":"p4","texto":"Combinar juntos um próximo passo e quando conversar de novo"}]',
   '["p1","p2","p3","p4"]'),
  ('Você perdeu o crachá de acesso ao prédio. Coloque os passos na ordem certa.', 'facil', 20,
   '[{"id":"p1","texto":"Comunicar imediatamente a perda à segurança patrimonial para bloquear o crachá"},{"id":"p2","texto":"Avisar o gestor e pedir acesso provisório pelo canal oficial"},{"id":"p3","texto":"Solicitar a emissão de um novo crachá"}]',
   '["p1","p2","p3"]')
) as v(enunciado, dificuldade, xp, passos, ordem)
where not exists (select 1 from questoes q where q.enunciado = v.enunciado);
