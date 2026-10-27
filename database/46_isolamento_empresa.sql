-- ============================================================
-- 46_isolamento_empresa.sql — Fecha as lacunas de isolamento por empresa
-- da migração 45 (roadmap v2, H5): eventos, campanhas e ligas.
-- Kudos e raids dispensam coluna nova: kudos valida a empresa do
-- destinatário em kudosService; raids já são escopados por turma.
-- ============================================================

-- null = global (eventos legados continuam valendo para todas as empresas)
alter table eventos   add column if not exists empresa_id uuid references empresas(id);
alter table campanhas add column if not exists empresa_id uuid references empresas(id);
create index if not exists idx_eventos_empresa on eventos (empresa_id);

-- Campanhas já criadas pertencem à empresa do gestor que as criou.
update campanhas c set empresa_id = p.empresa_id
  from profiles p where p.id = c.gestor_id and c.empresa_id is null;

-- Liga semanal: promoção/rebaixamento e classificação por empresa
-- (coluna nova no FIM da view, exigência do CREATE OR REPLACE VIEW).
create or replace view ranking_liga as
select
  ls.user_id as id,
  p.nome,
  ls.semana,
  ls.divisao,
  ls.xp_semana,
  rank() over (partition by ls.semana, ls.divisao, p.empresa_id order by ls.xp_semana desc) as posicao,
  p.empresa_id
from ligas_semana ls
join profiles p on p.id = ls.user_id
where p.role = 'aluno';

alter view ranking_liga set (security_invoker = true);
