-- ============================================================
-- 42_campanhas.sql — Campanha temática (roadmap v2, H4): empacota um
-- evento de XP multiplicado + uma badge exclusiva + ranking próprio da
-- janela. A badge usa o tipo 'campanha', que o motor de badges NUNCA
-- concede sozinho: quem concede é campanhaService.verificarCampanhas.
-- ============================================================

alter type tipo_condicao_badge add value if not exists 'campanha';

create table if not exists campanhas (
  id           uuid primary key default gen_random_uuid(),
  gestor_id    uuid not null references profiles(id),
  nome         text not null,
  evento_id    int  not null references eventos(id) on delete cascade,
  badge_id     int  not null references badges(id),
  inicio       timestamptz not null,
  fim          timestamptz not null check (fim > inicio),
  min_quizzes  int  not null default 5 check (min_quizzes >= 1),
  created_at   timestamptz not null default now()
);
create index if not exists idx_campanhas_periodo on campanhas (inicio, fim);
alter table campanhas enable row level security;
