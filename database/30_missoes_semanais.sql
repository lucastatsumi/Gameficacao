-- ============================================================
-- 30_missoes_semanais.sql — Missão semanal (roadmap v2, 4.3): a
-- extensão que ficou de fora da rodada de missões diárias. Mesmo
-- modelo de `missoes_catalogo`, mas com janela de 7 dias em vez de 1
-- dia: `periodo` diferencia os dois tipos de atribuição e a nova
-- tabela `missoes_da_semana` usa o rótulo ISO 'YYYY-Www' de
-- utils/semana.js (já usado por ligas e kudos) em vez de `date`.
--
-- Recompensa maior: fichas + um cosmético exclusivo (`item_recompensa_id`
-- aponta pra itens_catalogo). O item é concedido, nunca comprado — a
-- coluna `itens_catalogo.exclusivo` tira o item da loja normal, mesmo
-- padrão de exclusividade que `temporada_id` já usa (motivo diferente,
-- coluna própria pra não confundir os dois).
-- Aplicar via MCP como migration "30_missoes_semanais".
-- ============================================================

alter table missoes_catalogo add column periodo text not null default 'dia' check (periodo in ('dia', 'semana'));

alter table missoes_catalogo drop constraint missoes_catalogo_tipo_check;
alter table missoes_catalogo add constraint missoes_catalogo_tipo_check
  check (tipo in ('acertos_dia', 'aprovar_quiz', 'quiz_sem_dica', 'usar_poder', 'dar_kudos', 'acertos_semana'));

alter table missoes_catalogo add column item_recompensa_id int references itens_catalogo(id);

alter table itens_catalogo add column exclusivo boolean not null default false;

insert into itens_catalogo (chave, tipo, nome, descricao, raridade, preco, exclusivo, parametro) values
  ('titulo_maratonista', 'titulo', 'Título: O Maratonista', 'Concedido pela missão semanal — não está à venda', 'raro', 40, true, '{"titulo": "O Maratonista"}');

insert into missoes_catalogo (chave, tipo, descricao, parametro, recompensa_fichas, periodo, item_recompensa_id) values
  ('acertos_semana_15', 'acertos_semana', 'Acumule 15 acertos na semana', 15, 20, 'semana',
   (select id from itens_catalogo where chave = 'titulo_maratonista'));

create table missoes_da_semana (
  user_id   uuid not null references profiles(id) on delete cascade,
  missao_id int  not null references missoes_catalogo(id),
  semana    text not null,
  progresso int  not null default 0,
  concluida boolean not null default false,
  primary key (user_id, missao_id, semana)
);

create index idx_missoes_da_semana_user on missoes_da_semana (user_id, semana);

alter table missoes_da_semana enable row level security;
