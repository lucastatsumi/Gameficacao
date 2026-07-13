-- ============================================================
-- 06_quiz_custom_dicas.sql — Quizzes customizados por professor
-- (turma, tempo, sons, dicas) + dica por questão.
-- Já aplicado via MCP como migration "06_quiz_custom_dicas".
-- ============================================================

-- Dica opcional por questão (feedback pedagógico ANTES de responder;
-- usar a dica reduz o XP da questão pela metade)
alter table questoes add column dica text;

-- Quiz montado pelo professor para uma turma
create table quizzes_custom (
  id               uuid primary key default gen_random_uuid(),
  turma_id         uuid not null references turmas(id) on delete cascade,
  professor_id     uuid not null references profiles(id),
  titulo           text not null,
  descricao        text,
  -- null = usa o tempo de cada questão; valor = tempo fixo para todas
  tempo_limite_seg int check (tempo_limite_seg is null or tempo_limite_seg >= 10),
  sons             boolean not null default true,
  permitir_dicas   boolean not null default true,
  ativo            boolean not null default true,
  created_at       timestamptz not null default now()
);

create table quiz_custom_questoes (
  quiz_id    uuid not null references quizzes_custom(id) on delete cascade,
  questao_id uuid not null references questoes(id),
  ordem      int  not null default 0,
  primary key (quiz_id, questao_id)
);

-- Tentativa pode vir de uma FASE ou de um QUIZ CUSTOM (exatamente um)
alter table tentativas add column quiz_custom_id uuid references quizzes_custom(id);
alter table tentativas alter column fase_id drop not null;
alter table tentativas add constraint tentativa_origem check (
  (fase_id is not null and quiz_custom_id is null) or
  (fase_id is null and quiz_custom_id is not null)
);

-- Registro de dica usada (servidor decide a penalidade, não o cliente)
create table dicas_usadas (
  tentativa_id uuid not null references tentativas(id) on delete cascade,
  questao_id   uuid not null references questoes(id),
  usada_em     timestamptz not null default now(),
  primary key (tentativa_id, questao_id)
);

alter table respostas add column usou_dica boolean not null default false;

-- RLS: mesmo padrão do projeto (habilitado sem policies; API usa service role)
alter table quizzes_custom      enable row level security;
alter table quiz_custom_questoes enable row level security;
alter table dicas_usadas        enable row level security;

create index idx_quizzes_turma on quizzes_custom (turma_id) where ativo;
create index idx_tentativas_quiz_custom on tentativas (quiz_custom_id);

-- ranking_fase: tentativas de quiz custom (fase_id null) ficam de fora
create or replace view ranking_fase as
select
  t.fase_id,
  p.id,
  p.nome,
  sum(t.xp_ganho)::int as xp_fase,
  rank() over (partition by t.fase_id order by sum(t.xp_ganho) desc) as posicao
from tentativas t
join profiles p on p.id = t.user_id
where p.role = 'aluno' and t.finalizada_em is not null and t.fase_id is not null
group by t.fase_id, p.id, p.nome;

-- create or replace view reseta as opções: reforça o security_invoker
alter view ranking_fase set (security_invoker = true);
