-- ============================================================
-- 01_schema.sql — Criação das tabelas do serious game
-- Executar no SQL Editor do Supabase (já inclui auth.users)
-- ============================================================

-- ---------- Tipos enumerados ----------
create type user_role as enum ('aluno', 'professor');
create type dificuldade_questao as enum ('facil', 'media', 'dificil');
create type tipo_condicao_badge as enum (
  'xp_acumulado',      -- parametro: {"xp": 1000}
  'fase_concluida',    -- parametro: {"fase_ordem": 1}
  'sequencia_acertos', -- parametro: {"acertos": 10}
  'quiz_perfeito',     -- parametro: {}
  'velocidade'         -- parametro: {"tempo_medio_ms": 15000}
);

-- ---------- Perfis (estende auth.users do Supabase) ----------
-- Não armazena senha: credenciais ficam em auth.users, gerenciadas
-- pelo Supabase Auth. O id é o mesmo UUID do usuário autenticado.
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nome       text not null,
  email      text not null unique,
  role       user_role not null default 'aluno',
  nivel      int  not null default 1,
  xp_total   int  not null default 0 check (xp_total >= 0),
  created_at timestamptz not null default now()
);

-- Cria o perfil automaticamente quando um usuário se cadastra.
-- O nome vem do metadata enviado no signUp do frontend.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', 'Jogador'),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Turmas ----------
create table turmas (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  codigo_acesso text not null unique,  -- aluno entra na turma digitando este código
  professor_id  uuid not null references profiles(id),
  created_at    timestamptz not null default now()
);

create table matriculas (
  user_id        uuid not null references profiles(id) on delete cascade,
  turma_id       uuid not null references turmas(id)   on delete cascade,
  matriculado_em timestamptz not null default now(),
  primary key (user_id, turma_id)
);

-- ---------- Fases ----------
create table fases (
  id                serial primary key,
  nome              text not null,
  descricao         text,
  ordem             int  not null unique,
  fase_requisito_id int references fases(id)  -- null = fase inicial (sempre liberada)
);

-- ---------- Questões e alternativas ----------
create table questoes (
  id              uuid primary key default gen_random_uuid(),
  fase_id         int  not null references fases(id),
  enunciado       text not null,               -- cenário + pergunta
  codigo_snippet  text,                        -- opcional
  linguagem       text not null default 'javascript',
  dificuldade     dificuldade_questao not null default 'media',
  tempo_limite_seg int not null default 60 check (tempo_limite_seg > 0),
  xp_valor        int  not null default 10 check (xp_valor > 0),
  ativa           boolean not null default true, -- soft-delete: preserva histórico de respostas
  criada_por      uuid references profiles(id),
  created_at      timestamptz not null default now()
);

create table alternativas (
  id         uuid primary key default gen_random_uuid(),
  questao_id uuid not null references questoes(id) on delete cascade,
  letra      char(1) not null check (letra in ('A', 'B', 'C', 'D')),
  texto      text not null,
  correta    boolean not null default false,
  explicacao text not null,
  unique (questao_id, letra)
);

-- Garante no máximo UMA alternativa correta por questão
create unique index uma_correta_por_questao
  on alternativas (questao_id) where correta;

-- ---------- Tentativas e respostas (histórico granular) ----------
create table tentativas (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  fase_id        int  not null references fases(id),
  iniciada_em    timestamptz not null default now(),  -- registrada pelo SERVIDOR
  finalizada_em  timestamptz,
  acertos        int not null default 0,
  total_questoes int not null default 0,
  xp_ganho       int not null default 0,
  aprovada       boolean not null default false
);

create table respostas (
  id               uuid primary key default gen_random_uuid(),
  tentativa_id     uuid not null references tentativas(id) on delete cascade,
  questao_id       uuid not null references questoes(id),
  alternativa_id   uuid references alternativas(id), -- null = tempo esgotado sem responder
  correta          boolean not null default false,
  tempo_resposta_ms int,
  respondida_em    timestamptz not null default now(),
  unique (tentativa_id, questao_id)  -- impede responder a mesma questão 2x no mesmo quiz
);

-- ---------- Resumo de progresso por fase (cache) ----------
create table progresso_fase (
  user_id          uuid not null references profiles(id) on delete cascade,
  fase_id          int  not null references fases(id),
  concluida        boolean not null default false,
  melhor_pontuacao int not null default 0,
  num_tentativas   int not null default 0,
  concluida_em     timestamptz,
  primary key (user_id, fase_id)
);

-- ---------- Badges ----------
create table badges (
  id            serial primary key,
  nome          text not null unique,
  descricao     text not null,
  icone         text,                          -- nome do ícone ou emoji
  tipo_condicao tipo_condicao_badge not null,
  parametro     jsonb not null default '{}'    -- condição verificável por código
);

create table usuario_badges (
  user_id        uuid not null references profiles(id) on delete cascade,
  badge_id       int  not null references badges(id)   on delete cascade,
  conquistado_em timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- ---------- Índices de consulta frequente ----------
create index idx_questoes_fase      on questoes (fase_id) where ativa;
create index idx_tentativas_user    on tentativas (user_id, fase_id);
create index idx_respostas_tentativa on respostas (tentativa_id);
create index idx_respostas_questao  on respostas (questao_id);
create index idx_matriculas_turma   on matriculas (turma_id);

-- ---------- Row Level Security ----------
-- O backend Express acessa o banco com a SERVICE_ROLE_KEY, que ignora RLS.
-- Habilitar RLS sem policies bloqueia acesso direto pela anon key do
-- frontend — toda escrita passa obrigatoriamente pela API.
alter table profiles        enable row level security;
alter table turmas          enable row level security;
alter table matriculas      enable row level security;
alter table fases           enable row level security;
alter table questoes        enable row level security;
alter table alternativas    enable row level security;
alter table tentativas      enable row level security;
alter table respostas       enable row level security;
alter table progresso_fase  enable row level security;
alter table badges          enable row level security;
alter table usuario_badges  enable row level security;
