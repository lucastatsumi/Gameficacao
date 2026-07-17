-- ============================================================
-- 20_ranking_classe.sql — Traz a "classe" (fase de maior ordem já
-- concluída) para o ranking global e por turma. Hoje só aparecia no
-- Perfil (perfilService.classeDoJogador); esta migration fecha a
-- lacuna documentada no roadmap ("ainda não aparece no Ranking").
-- Aplicar via MCP como migration "20_ranking_classe".
-- ============================================================

-- `classe_fase` precisa ser a ÚLTIMA coluna: CREATE OR REPLACE VIEW só
-- aceita ACRESCENTAR colunas no fim, nunca inserir no meio (o Postgres
-- rejeita com "cannot change name of view column" se a ordem mudar).
create or replace view ranking_global as
select
  p.id,
  p.nome,
  p.nivel,
  p.xp_total,
  rank() over (order by p.xp_total desc) as posicao,
  classe.fase_nome as classe_fase
from profiles p
left join lateral (
  select f.nome as fase_nome
  from progresso_fase pf
  join fases f on f.id = pf.fase_id
  where pf.user_id = p.id and pf.concluida
  order by f.ordem desc
  limit 1
) classe on true
where p.role = 'aluno';

create or replace view ranking_turma as
select
  m.turma_id,
  p.id,
  p.nome,
  p.nivel,
  p.xp_total,
  rank() over (partition by m.turma_id order by p.xp_total desc) as posicao,
  classe.fase_nome as classe_fase
from profiles p
join matriculas m on m.user_id = p.id
left join lateral (
  select f.nome as fase_nome
  from progresso_fase pf
  join fases f on f.id = pf.fase_id
  where pf.user_id = p.id and pf.concluida
  order by f.ordem desc
  limit 1
) classe on true
where p.role = 'aluno';

-- CREATE OR REPLACE VIEW preserva reloptions já setados, mas reafirmar aqui
-- é barato e remove qualquer dúvida (mesma regra de 04_hardening.sql).
alter view ranking_global set (security_invoker = true);
alter view ranking_turma  set (security_invoker = true);
