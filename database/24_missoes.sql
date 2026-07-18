-- ============================================================
-- 24_missoes.sql — Missões diárias (roadmap v2, seção 4.3): 3 missões
-- sorteadas por jogador por dia (sorteio DETERMINÍSTICO por
-- user_id + data, então re-consultar nunca muda as missões do dia).
-- O progresso é verificado 100% no servidor, no mesmo hook de
-- finalizarQuiz que já verifica badges — o cliente nunca reporta
-- progresso. Recompensa em fichas (ledger da migration 22).
-- Aplicar via MCP como migration "24_missoes".
-- ============================================================

create table missoes_catalogo (
  id                serial primary key,
  chave             text not null unique,
  -- acertos_dia: acumule N acertos hoje | aprovar_quiz: aprove N quizzes
  -- quiz_sem_dica: aprove 1 quiz sem dica | usar_poder: use 1 poder
  tipo              text not null check (tipo in ('acertos_dia', 'aprovar_quiz', 'quiz_sem_dica', 'usar_poder')),
  descricao         text not null,
  parametro         int  not null default 1 check (parametro > 0),
  recompensa_fichas int  not null check (recompensa_fichas > 0)
);

create table missoes_do_dia (
  user_id   uuid not null references profiles(id) on delete cascade,
  missao_id int  not null references missoes_catalogo(id),
  dia       date not null,
  progresso int  not null default 0,
  concluida boolean not null default false,
  primary key (user_id, missao_id, dia)
);

create index idx_missoes_do_dia_user on missoes_do_dia (user_id, dia);

alter table missoes_catalogo enable row level security;
alter table missoes_do_dia enable row level security;

insert into missoes_catalogo (chave, tipo, descricao, parametro, recompensa_fichas) values
  ('acertos_5', 'acertos_dia', 'Acerte 5 questões hoje', 5, 10),
  ('acertos_10', 'acertos_dia', 'Acerte 10 questões hoje', 10, 15),
  ('aprovar_1', 'aprovar_quiz', 'Aprove 1 quiz hoje', 1, 10),
  ('aprovar_2', 'aprovar_quiz', 'Aprove 2 quizzes hoje', 2, 15),
  ('sem_dica_1', 'quiz_sem_dica', 'Aprove 1 quiz sem usar nenhuma dica', 1, 15),
  ('poder_1', 'usar_poder', 'Use 1 poder durante um quiz', 1, 5);
