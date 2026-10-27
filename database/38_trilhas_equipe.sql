-- ============================================================
-- 38_trilhas_equipe.sql — Trilhas por equipe (roadmap v2, H1): o gestor
-- (professor dono da turma) escolhe quais temas cada equipe vê. Turma
-- sem nenhuma atribuição continua vendo tudo (compatível com o legado).
-- ============================================================

create table if not exists turma_temas (
  turma_id uuid not null references turmas(id) on delete cascade,
  tema_id  int  not null references temas(id) on delete cascade,
  primary key (turma_id, tema_id)
);
alter table turma_temas enable row level security;
