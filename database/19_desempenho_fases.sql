-- ============================================================
-- 19_desempenho_fases.sql — Visão do professor: desempenho agregado
-- POR FASE (não só por questão individual). Item do roadmap de
-- relatórios do professor (docs/ROADMAP.md, "Médio prazo").
-- Aplicar via MCP como migration "19_desempenho_fases".
-- ============================================================

create or replace view desempenho_fases as
select
  f.id as fase_id,
  f.nome as fase_nome,
  f.ordem,
  count(t.id) as total_tentativas,
  count(t.id) filter (where t.aprovada) as total_aprovadas,
  round(100.0 * count(t.id) filter (where t.aprovada) / nullif(count(t.id), 0), 1) as taxa_aprovacao_pct,
  round(avg(100.0 * t.acertos / nullif(t.total_questoes, 0))::numeric, 1) as media_acerto_pct
from fases f
left join tentativas t on t.fase_id = f.id and t.finalizada_em is not null
group by f.id, f.nome, f.ordem
order by f.ordem;

-- Mesma regra de segurança das demais views de relatório (04_hardening.sql):
-- security invoker, senão rodaria como SECURITY DEFINER e furaria o RLS.
alter view desempenho_fases set (security_invoker = true);
