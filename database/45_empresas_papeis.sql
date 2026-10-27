-- ============================================================
-- 45_empresas_papeis.sql — Multi-tenancy e papéis granulares (roadmap v2,
-- H5). ADITIVO e retrocompatível: tudo o que existe hoje vira "Empresa
-- Padrão"; colunas novas são anuláveis onde faz sentido.
--
-- ATENÇÃO: o backend acessa o banco com a service_role (ignora RLS), então
-- o isolamento é aplicado no CÓDIGO (filtros por empresa_id nos services).
-- RLS segue habilitada sem policies para bloquear acesso direto pela anon key.
--
-- Papéis (profiles.papel): dono > gestor > colaborador. `role`
-- (professor/aluno) continua existindo: gestor/dono => professor.
-- ============================================================

create table if not exists empresas (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  codigo_convite text not null unique,  -- colaboradores entram na empresa com este código
  created_at     timestamptz not null default now()
);
alter table empresas enable row level security;

alter table profiles add column if not exists empresa_id uuid references empresas(id);
alter table profiles add column if not exists papel text
  check (papel in ('dono', 'gestor', 'colaborador'));
alter table turmas   add column if not exists empresa_id uuid references empresas(id);
-- null = tema do catálogo global (visível a todas as empresas)
alter table temas    add column if not exists empresa_id uuid references empresas(id);

create index if not exists idx_profiles_empresa on profiles (empresa_id);
create index if not exists idx_turmas_empresa   on turmas (empresa_id);

-- Backfill: uma empresa padrão abriga todos os dados atuais.
insert into empresas (nome, codigo_convite)
select 'Empresa Padrão', 'PADRAO'
where not exists (select 1 from empresas);

update profiles set empresa_id = (select id from empresas order by created_at limit 1)
  where empresa_id is null;
update turmas set empresa_id = (select id from empresas order by created_at limit 1)
  where empresa_id is null;
update profiles set papel = case when role = 'professor' then 'gestor' else 'colaborador' end
  where papel is null;

-- Ranking global passa a ser por empresa (a coluna nova vai no FIM da view,
-- exigência do CREATE OR REPLACE VIEW).
create or replace view ranking_global as
select
  p.id,
  p.nome,
  p.nivel,
  p.xp_total,
  rank() over (partition by p.empresa_id order by p.xp_total desc) as posicao,
  classe.fase_nome as classe_fase,
  p.empresa_id
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
