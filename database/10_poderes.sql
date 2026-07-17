-- ============================================================
-- 10_poderes.sql — Poderes (power-ups) usáveis durante o quiz.
-- Mecânica de engajamento do roadmap (docs/ROADMAP.md, seção 2).
-- Aplicar via MCP como migration "10_poderes".
--
-- Regra de design: o poder é sempre resolvido NO SERVIDOR — o cliente só
-- pede "usar poder X nesta questão" e recebe o efeito já aplicado
-- (alternativa a esconder / segundos extras). O gabarito nunca é exposto.
-- ============================================================

create type tipo_poder as enum (
  'eliminar_alternativa', -- remove 1 alternativa errada da questão atual
  'tempo_extra'           -- soma 15s ao tempo limite da questão atual
);

-- Estoque de poderes por aluno
create table usuario_poderes (
  user_id    uuid not null references profiles(id) on delete cascade,
  poder      tipo_poder not null,
  quantidade int not null default 0 check (quantidade >= 0),
  primary key (user_id, poder)
);

-- Registro de uso: no máximo 1 uso de cada poder por questão dentro da
-- mesma tentativa. `segundos_extra` só é preenchido para tempo_extra —
-- o servidor consulta essa tabela em /quiz/responder para somar ao
-- tempo limite antes de decidir se a resposta chegou no prazo.
create table poderes_usados (
  tentativa_id   uuid not null references tentativas(id) on delete cascade,
  questao_id     uuid not null references questoes(id),
  poder          tipo_poder not null,
  segundos_extra int,
  usado_em       timestamptz not null default now(),
  primary key (tentativa_id, questao_id, poder)
);

alter table usuario_poderes  enable row level security;
alter table poderes_usados   enable row level security;

create index idx_poderes_usados_tentativa on poderes_usados (tentativa_id, questao_id);
