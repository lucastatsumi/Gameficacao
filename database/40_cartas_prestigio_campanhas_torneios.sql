-- ============================================================
-- 40_cartas_prestigio_campanhas_torneios.sql — Fecha o Horizonte 4
-- (cartas 4.9, prestígio 4.11, campanhas e torneios) e o dashboard com
-- evolução temporal do Horizonte 5.
-- ============================================================

-- ---------- 4.9 Cartas colecionáveis de conhecimento ----------
-- O catálogo de cartas É a tabela competencias (1 carta por competência;
-- o verso é competencias.resumo). Dominar a competência (≥ 5 respostas
-- e ≥ 80% de acerto — utils/proficiencia.js) revela a carta.
create table cartas_do_jogador (
  user_id        uuid not null references profiles(id) on delete cascade,
  competencia_id int  not null references competencias(id) on delete cascade,
  revelada_em    timestamptz not null default now(),
  primary key (user_id, competencia_id)
);
alter table cartas_do_jogador enable row level security;

-- Completar o álbum de um tema rende uma badge (uma por tema do catálogo)
insert into badges (nome, descricao, icone, tipo_condicao, parametro)
select 'Álbum: ' || t.nome, 'Revele todas as cartas do tema ' || t.nome || '.', '🃏',
       'album_completo', jsonb_build_object('tema_id', t.id)
from temas t
where t.empresa_id is null
on conflict (nome) do nothing;

-- ---------- 4.11 Prestígio (Nova Jornada+) ----------
-- Quem concluiu a trilha de um tema pode reiniciá-la com modificadores
-- (sem questões fáceis, timer −25%). O progresso dos módulos do tema
-- reinicia; score/competências NÃO (vêm de respostas, que ficam).
create table prestigios (
  user_id     uuid not null references profiles(id) on delete cascade,
  tema_id     int  not null references temas(id) on delete cascade,
  ciclo       int  not null check (ciclo >= 1),
  iniciado_em timestamptz not null default now(),
  primary key (user_id, tema_id, ciclo)
);
alter table prestigios enable row level security;

-- A tentativa guarda o ciclo e o fator de tempo com que foi aberta: o
-- timer do servidor usa o fator, e a regra anti-farming de XP compara só
-- com tentativas do MESMO ciclo (cada Nova Jornada volta a render XP).
alter table tentativas add column ciclo_prestigio int not null default 0;
alter table tentativas add column fator_tempo numeric(3, 2) not null default 1
  check (fator_tempo > 0 and fator_tempo <= 1);

insert into badges (nome, descricao, icone, tipo_condicao, parametro) values
  ('Nova Jornada', 'Prestigie a trilha de um tema pela primeira vez.', '⭐', 'prestigio', '{"ciclos": 1}'),
  ('Veterano da Jornada', 'Acumule 3 ciclos de prestígio.', '🌟', 'prestigio', '{"ciclos": 3}')
on conflict (nome) do nothing;

-- ---------- Campanhas temáticas ----------
-- Empacota evento (XP multiplicado) + badge exclusiva + meta do período
-- + ranking próprio numa ação só do gestor.
create table campanhas (
  id               serial primary key,
  empresa_id       uuid references empresas(id) on delete cascade,
  nome             text not null,
  descricao        text,
  tema_id          int references temas(id) on delete set null,  -- null = todos os temas
  inicio           timestamptz not null,
  fim              timestamptz not null check (fim > inicio),
  meta_quizzes     int not null default 5 check (meta_quizzes > 0), -- quizzes aprovados no período
  evento_id        int references eventos(id) on delete set null,
  badge_id         int references badges(id) on delete set null,
  criada_por       uuid references profiles(id),
  created_at       timestamptz not null default now()
);
create index idx_campanhas_periodo on campanhas (empresa_id, inicio, fim);
alter table campanhas enable row level security;

-- ---------- Torneio entre equipes ----------
-- Resultado do desafio assíncrono (antes só existia o convite): quem
-- aceitou e se bateu a pontuação do colega. É a matéria-prima do placar.
create table desafio_resultados (
  desafio_id   uuid not null references desafios(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,
  tentativa_id uuid not null unique references tentativas(id) on delete cascade,
  acertos      int  not null,
  venceu       boolean not null,
  registrado_em timestamptz not null default now(),
  primary key (desafio_id, user_id)
);
create index idx_desafio_resultados_data on desafio_resultados (registrado_em) where venceu;
alter table desafio_resultados enable row level security;

create table torneios (
  id            serial primary key,
  empresa_id    uuid references empresas(id) on delete cascade,
  nome          text not null,
  inicio        timestamptz not null,
  fim           timestamptz not null check (fim > inicio),
  fichas_premio int not null default 50 check (fichas_premio > 0),
  premiado_em   timestamptz,          -- trava do pagamento do pódio (lazy, sem cron)
  equipe_campea uuid references turmas(id) on delete set null,
  criado_por    uuid references profiles(id),
  created_at    timestamptz not null default now()
);
create index idx_torneios_periodo on torneios (empresa_id, inicio, fim);
alter table torneios enable row level security;

-- ---------- H5: dashboard com evolução temporal ----------
-- Agregado do momento não mostra tendência: guardamos um snapshot por
-- dia e equipe (tirado de forma lazy no primeiro acesso do dia ao
-- dashboard). Valores são acumulados até o dia.
create table snapshots_equipe (
  dia          date not null,
  turma_id     uuid not null references turmas(id) on delete cascade,
  score_medio  numeric(5, 1),
  tentativas   int not null default 0,
  membros      int not null default 0,
  primary key (dia, turma_id)
);

create table snapshots_competencias (
  dia            date not null,
  turma_id       uuid not null references turmas(id) on delete cascade,
  competencia_id int  not null references competencias(id) on delete cascade,
  total          int  not null,
  acertos        int  not null,
  primary key (dia, turma_id, competencia_id)
);

alter table snapshots_equipe       enable row level security;
alter table snapshots_competencias enable row level security;
