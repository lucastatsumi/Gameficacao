-- ============================================================
-- 36_empresas_multitenancy.sql — Horizonte 1 (onboarding da empresa)
-- + Horizonte 5 (multi-tenancy e papéis granulares)
--
-- Modelo de tenant: `empresa_id` nas entidades-raiz. NULL é o espaço
-- "legado" (tudo que existia antes desta migration) e se comporta como
-- um tenant próprio: quem não tem empresa só enxerga quem também não
-- tem — nada muda para a base atual.
--
-- O backend acessa o banco com service_role (ignora RLS), então o
-- isolamento de verdade é feito nas queries do Express
-- (utils/empresa.js: doTenant). As views de ranking/relatório passam a
-- expor `empresa_id` e particionar o RANK() por ela — a posição de
-- alguém nunca é calculada contra pessoas de outra empresa. RLS continua
-- habilitado sem policies (segunda barreira, ver docs/arquitetura.md).
--
-- Papéis granulares (profiles.papel): dono > gestor > colaborador.
-- `role` continua sendo o portão das rotas /admin: dono e gestor têm
-- role = 'professor'; colaborador, role = 'aluno'.
-- ============================================================

create table empresas (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  codigo_convite text not null unique,   -- colaborador entra na empresa com este código
  dono_id        uuid not null references profiles(id),
  created_at     timestamptz not null default now()
);

-- Temas do CATÁLOGO que a empresa ativou (temas próprios dela já são
-- visíveis por temas.empresa_id).
create table empresa_temas (
  empresa_id uuid not null references empresas(id) on delete cascade,
  tema_id    int  not null references temas(id)    on delete cascade,
  primary key (empresa_id, tema_id)
);

alter table profiles add column empresa_id uuid references empresas(id) on delete set null;
alter table profiles add column papel text not null default 'colaborador'
  check (papel in ('dono', 'gestor', 'colaborador'));
-- Professores legados viram gestores do espaço legado
update profiles set papel = 'gestor' where role = 'professor';

alter table temas          add constraint temas_empresa_fk foreign key (empresa_id) references empresas(id) on delete cascade;
alter table turmas         add column empresa_id uuid references empresas(id) on delete cascade;
alter table quizzes_custom add column empresa_id uuid references empresas(id) on delete cascade;
alter table eventos        add column empresa_id uuid references empresas(id) on delete cascade;
alter table temporadas     add column empresa_id uuid references empresas(id) on delete cascade;

create index idx_profiles_empresa on profiles (empresa_id);
create index idx_turmas_empresa   on turmas (empresa_id);
create index idx_temas_empresa    on temas (empresa_id);

alter table empresas      enable row level security;
alter table empresa_temas enable row level security;

-- ---------- Views: expõem empresa_id e particionam por ela ----------
-- (create or replace só permite ACRESCENTAR colunas no fim — por isso
-- empresa_id vem por último em todas)

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

create or replace view ranking_fase as
select
  t.fase_id,
  p.id,
  p.nome,
  sum(t.xp_ganho)::int as xp_fase,
  rank() over (partition by t.fase_id, p.empresa_id order by sum(t.xp_ganho) desc) as posicao,
  p.empresa_id
from tentativas t
join profiles p on p.id = t.user_id
where p.role = 'aluno' and t.finalizada_em is not null
group by t.fase_id, p.id, p.nome, p.empresa_id;

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

create or replace view ranking_temporada as
select
  tp.user_id as id,
  p.nome,
  tp.temporada_id,
  tp.pontos,
  rank() over (partition by tp.temporada_id, p.empresa_id order by tp.pontos desc) as posicao,
  p.empresa_id
from temporada_pontos tp
join profiles p on p.id = tp.user_id
where p.role = 'aluno';

-- Relatórios do gestor: agregados POR EMPRESA de quem respondeu. Um
-- tema do catálogo é compartilhado entre empresas, mas o gestor só vê o
-- desempenho do próprio pessoal.
drop view if exists desempenho_questoes;
create view desempenho_questoes as
select
  q.id as questao_id,
  q.fase_id,
  left(q.enunciado, 80) as enunciado_resumo,
  q.dificuldade,
  count(r.id) as total_respostas,
  count(r.id) filter (where r.correta) as acertos,
  round(100.0 * count(r.id) filter (where r.correta) / nullif(count(r.id), 0), 1) as taxa_acerto_pct,
  round(avg(r.tempo_resposta_ms) / 1000.0, 1) as tempo_medio_seg,
  p.empresa_id
from respostas r
join tentativas t on t.id = r.tentativa_id
join profiles p on p.id = t.user_id
join questoes q on q.id = r.questao_id
group by q.id, q.fase_id, q.enunciado, q.dificuldade, p.empresa_id;

drop view if exists desempenho_fases;
create view desempenho_fases as
select
  f.id as fase_id,
  f.nome as fase_nome,
  f.ordem,
  count(t.id) as total_tentativas,
  count(t.id) filter (where t.aprovada) as total_aprovadas,
  round(100.0 * count(t.id) filter (where t.aprovada) / nullif(count(t.id), 0), 1) as taxa_aprovacao_pct,
  round(avg(100.0 * t.acertos / nullif(t.total_questoes, 0))::numeric, 1) as media_acerto_pct,
  p.empresa_id,
  f.tema_id
from tentativas t
join fases f on f.id = t.fase_id
join profiles p on p.id = t.user_id
where t.finalizada_em is not null
group by f.id, f.nome, f.ordem, p.empresa_id, f.tema_id;

alter view ranking_global      set (security_invoker = true);
alter view ranking_fase        set (security_invoker = true);
alter view ranking_liga        set (security_invoker = true);
alter view ranking_temporada   set (security_invoker = true);
alter view desempenho_questoes set (security_invoker = true);
alter view desempenho_fases    set (security_invoker = true);
