-- ============================================================
-- 27_ligas_semanais.sql — Ligas semanais (roadmap v2, seção 4.5): o
-- ranking global por xp_total premia veteranos para sempre, e o novato
-- nunca alcança. A liga resolve isso competindo por XP GANHO NA SEMANA,
-- dentro de uma divisão (bronze/prata/ouro/diamante) reavaliada a cada
-- virada de semana.
--
-- Um registro por jogador POR SEMANA ISO (formato 'YYYY-Www' — string
-- ordenável cronologicamente mesmo virando o ano, ver utils/semana.js).
-- Sem cron: o fechamento (promoção/rebaixamento da semana anterior) é
-- LAZY, calculado no backend (ligaService) no primeiro acesso do
-- jogador na semana nova, a partir do próprio ranking já congelado da
-- semana anterior — nenhuma coluna/rotina de fechamento em massa é
-- necessária aqui.
-- Aplicar via MCP como migration "27_ligas_semanais".
-- ============================================================

create table ligas_semana (
  user_id    uuid not null references profiles(id) on delete cascade,
  semana     text not null, -- ISO 'YYYY-Www', ex. '2026-W03'
  divisao    text not null default 'bronze' check (divisao in ('bronze', 'prata', 'ouro', 'diamante')),
  xp_semana  int  not null default 0 check (xp_semana >= 0),
  primary key (user_id, semana)
);

-- Ranking de uma divisão numa semana (usado tanto para exibir o quadro
-- quanto para o fechamento lazy calcular quem promove/rebaixa)
create index idx_ligas_semana_divisao on ligas_semana (semana, divisao, xp_semana desc);

alter table ligas_semana enable row level security;
