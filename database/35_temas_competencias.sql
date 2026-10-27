-- ============================================================
-- 35_temas_competencias.sql — Fundação multi-tema (roadmap v2, H1):
-- `temas` agrupa fases (módulos) numa trilha; `questoes.competencias`
-- são as tags que alimentam a matriz de competências (H3).
-- Tudo o que já existe vira o tema 1 (Estrutura de Dados, demo).
-- ============================================================

create table if not exists temas (
  id        serial primary key,
  nome      text not null unique,
  descricao text,
  ativo     boolean not null default true
);
alter table temas enable row level security;

insert into temas (nome, descricao)
values ('Estrutura de Dados', 'Trilha de demonstração com o conteúdo original do jogo')
on conflict (nome) do nothing;

alter table fases add column if not exists tema_id int references temas(id);
update fases set tema_id = (select id from temas where nome = 'Estrutura de Dados')
  where tema_id is null;
create index if not exists idx_fases_tema on fases (tema_id);

alter table questoes add column if not exists competencias text[] not null default '{}';
create index if not exists idx_questoes_competencias on questoes using gin (competencias);
