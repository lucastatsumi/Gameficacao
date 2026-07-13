-- ============================================================
-- 02_views.sql — Views de ranking e funções auxiliares
-- Ranking é dado DERIVADO: nunca armazenar posição em tabela.
-- ============================================================

-- ---------- Nível calculado a partir do XP ----------
-- Curva quadrática: nível 2 = 100 XP, nível 3 = 400 XP, nível 4 = 900 XP...
-- Fórmula: nivel = floor(sqrt(xp / 100)) + 1
create or replace function nivel_por_xp(xp int)
returns int
language sql
immutable
as $$
  select floor(sqrt(xp / 100.0))::int + 1;
$$;

-- XP necessário para atingir determinado nível (usado na barra de progresso)
create or replace function xp_para_nivel(nivel int)
returns int
language sql
immutable
as $$
  select ((nivel - 1) * (nivel - 1) * 100)::int;
$$;

-- ---------- Ranking global ----------
create or replace view ranking_global as
select
  p.id,
  p.nome,
  p.nivel,
  p.xp_total,
  rank() over (order by p.xp_total desc) as posicao
from profiles p
where p.role = 'aluno';

-- ---------- Ranking por turma ----------
create or replace view ranking_turma as
select
  m.turma_id,
  p.id,
  p.nome,
  p.nivel,
  p.xp_total,
  rank() over (partition by m.turma_id order by p.xp_total desc) as posicao
from profiles p
join matriculas m on m.user_id = p.id
where p.role = 'aluno';

-- ---------- Ranking por fase (XP ganho apenas naquela fase) ----------
create or replace view ranking_fase as
select
  t.fase_id,
  p.id,
  p.nome,
  sum(t.xp_ganho)::int as xp_fase,
  rank() over (partition by t.fase_id order by sum(t.xp_ganho) desc) as posicao
from tentativas t
join profiles p on p.id = t.user_id
where p.role = 'aluno' and t.finalizada_em is not null
group by t.fase_id, p.id, p.nome;

-- ---------- Visão do professor: desempenho por questão ----------
-- Percentual de erro por questão — identifica os conceitos em que a
-- turma mais tem dificuldade (base do relatório do TCC).
create or replace view desempenho_questoes as
select
  q.id as questao_id,
  q.fase_id,
  left(q.enunciado, 80) as enunciado_resumo,
  q.dificuldade,
  count(r.id) as total_respostas,
  count(r.id) filter (where r.correta) as acertos,
  round(100.0 * count(r.id) filter (where r.correta) / nullif(count(r.id), 0), 1) as taxa_acerto_pct,
  round(avg(r.tempo_resposta_ms) / 1000.0, 1) as tempo_medio_seg
from questoes q
left join respostas r on r.questao_id = q.id
group by q.id, q.fase_id, q.enunciado, q.dificuldade;

-- ---------- Visão do professor: desempenho por aluno da turma ----------
create or replace view desempenho_alunos as
select
  m.turma_id,
  p.id as user_id,
  p.nome,
  p.nivel,
  p.xp_total,
  count(distinct pf.fase_id) filter (where pf.concluida) as fases_concluidas,
  coalesce(sum(pf.num_tentativas), 0)::int as total_tentativas,
  (select count(*) from usuario_badges ub where ub.user_id = p.id) as total_badges
from profiles p
join matriculas m on m.user_id = p.id
left join progresso_fase pf on pf.user_id = p.id
where p.role = 'aluno'
group by m.turma_id, p.id, p.nome, p.nivel, p.xp_total;
