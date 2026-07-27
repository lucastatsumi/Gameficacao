-- ============================================================
-- 29_temporadas.sql — Temporadas e passe de missões (roadmap v2,
-- 4.6): arco de longo prazo renovável (8–12 semanas) com uma trilha
-- fixa de recompensas desbloqueada por PONTOS DE TEMPORADA (= XP
-- ganho no período, mesmo padrão de xp_semana em ligas_semana —
-- ver backend/src/services/ligaService.js).
--
-- O placar "congela" sozinho ao fim do período: pontos só somam
-- dentro de [inicio, fim] (mesma ideia de eventoAtivoParaFase em
-- eventoService.js), então uma temporada encerrada já é hall da
-- fama consultável sem precisar de snapshot nem cron externo.
--
-- Cosméticos exclusivos da trilha reusam itens_catalogo/
-- itens_do_jogador (o mesmo equipar/exibir de lojaService.js) —
-- só que CONCEDIDOS ao cruzar o marco, nunca comprados; a coluna
-- temporada_id abaixo é o que os tira da loja normal (ver filtro em
-- lojaService.listarCatalogo).
-- Aplicar via MCP como migration "29_temporadas".
-- ============================================================

create table temporadas (
  id         serial primary key,
  nome       text not null,
  tema       text,
  inicio     timestamptz not null,
  fim        timestamptz not null check (fim > inicio),
  created_at timestamptz not null default now()
);

alter table temporadas enable row level security;

create index idx_temporadas_periodo on temporadas (inicio, fim);

-- Acumulador de pontos por jogador dentro da temporada.
create table temporada_pontos (
  temporada_id int  not null references temporadas(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,
  pontos       int  not null default 0 check (pontos >= 0),
  primary key (temporada_id, user_id)
);

alter table temporada_pontos enable row level security;

-- Marca um item do catálogo como exclusivo desta temporada (nunca
-- volta à loja normal — só é concedido pela trilha).
alter table itens_catalogo add column temporada_id int references temporadas(id);

-- Trilha de recompensas: degraus fixos por pontos_necessarios
-- crescente. 'fichas' credita o ledger existente; 'cosmetico'
-- referencia um item exclusivo (espera-se temporada_id = esta
-- temporada, validado em temporadaService.definirTrilha).
create table temporada_recompensas (
  id                 serial primary key,
  temporada_id       int  not null references temporadas(id) on delete cascade,
  posicao            int  not null check (posicao > 0),
  pontos_necessarios int  not null check (pontos_necessarios > 0),
  tipo               text not null check (tipo in ('fichas', 'cosmetico')),
  fichas             int  check (fichas is null or fichas > 0),
  item_catalogo_id   int  references itens_catalogo(id),
  unique (temporada_id, posicao),
  unique (temporada_id, pontos_necessarios),
  check (
    (tipo = 'fichas' and fichas is not null and item_catalogo_id is null) or
    (tipo = 'cosmetico' and item_catalogo_id is not null and fichas is null)
  )
);

alter table temporada_recompensas enable row level security;

-- Resgates: idempotência do desbloqueio automático ao cruzar o
-- marco (mesma ideia de trava por unique de ligas_fechamentos).
create table temporada_resgates (
  user_id       uuid not null references profiles(id) on delete cascade,
  recompensa_id int  not null references temporada_recompensas(id) on delete cascade,
  resgatada_em  timestamptz not null default now(),
  primary key (user_id, recompensa_id)
);

alter table temporada_resgates enable row level security;

create or replace view ranking_temporada as
select
  tp.user_id as id,
  p.nome,
  tp.temporada_id,
  tp.pontos,
  rank() over (partition by tp.temporada_id order by tp.pontos desc) as posicao
from temporada_pontos tp
join profiles p on p.id = tp.user_id
where p.role = 'aluno';

-- Mesma regra de segurança das demais views (04_hardening.sql):
-- security invoker, senão rodaria como SECURITY DEFINER e furaria o RLS.
alter view ranking_temporada set (security_invoker = true);
