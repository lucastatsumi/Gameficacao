-- ============================================================
-- 37_cartas.sql — Cartas colecionáveis (roadmap v2, 4.9) + competências
-- padrão. Cada competência dominada (≥80% de acerto em ≥10 respostas)
-- revela uma carta cujo verso é o resumo do conceito.
-- ============================================================

-- Questões sem tag herdam o nome da fase como competência (ponto de
-- partida; o gestor refina depois).
update questoes q
   set competencias = array[f.nome]
  from fases f
 where f.id = q.fase_id and coalesce(array_length(q.competencias, 1), 0) = 0;

create table if not exists cartas_catalogo (
  competencia text primary key,
  tema_id     int references temas(id),
  resumo      text not null
);

insert into cartas_catalogo (competencia, tema_id, resumo)
select f.nome, f.tema_id, coalesce(f.descricao, f.nome)
  from fases f
on conflict (competencia) do nothing;

create table if not exists cartas_do_jogador (
  user_id        uuid not null references profiles(id) on delete cascade,
  competencia    text not null references cartas_catalogo(competencia),
  conquistada_em timestamptz not null default now(),
  primary key (user_id, competencia)
);

alter table cartas_catalogo   enable row level security;
alter table cartas_do_jogador enable row level security;
