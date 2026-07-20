-- ============================================================
-- 23_loja.sql — Loja de poderes e cosméticos (roadmap v2, seção 4.2).
-- Poderes são CONSUMÍVEIS: comprar credita o estoque em usuario_poderes
-- (não entram em itens_do_jogador). Cosméticos (paleta do avatar, título
-- exibível) são PERMANENTES: compra única registrada em itens_do_jogador
-- e o que está em uso fica em profiles.equipados (jsonb).
-- Sem pay-to-win: nenhum item da loja afeta a correção/score — poderes
-- já existiam como recompensa; cosméticos são 100% visuais.
-- Aplicar via MCP como migration "23_loja".
-- ============================================================

create table itens_catalogo (
  id        serial primary key,
  chave     text not null unique,   -- 'paleta_esmeralda', 'titulo_implacavel', 'poder_tempo_extra'
  tipo      text not null check (tipo in ('poder', 'paleta', 'titulo')),
  nome      text not null,
  descricao text,
  raridade  text not null default 'comum' check (raridade in ('comum', 'raro', 'epico')),
  preco     int  not null check (preco > 0),
  -- parametro: {"poder": "tempo_extra"} | {"pele": "#...", "acento": "#..."} | {"titulo": "..."}
  parametro jsonb not null default '{}'
);

create table itens_do_jogador (
  user_id     uuid not null references profiles(id) on delete cascade,
  item_id     int  not null references itens_catalogo(id),
  comprado_em timestamptz not null default now(),
  primary key (user_id, item_id) -- cosmético é compra única
);

-- O que o jogador está usando: {"paleta": "paleta_esmeralda", "titulo": "titulo_implacavel"}
alter table profiles add column equipados jsonb not null default '{}';

alter table itens_catalogo enable row level security;
alter table itens_do_jogador enable row level security;

insert into itens_catalogo (chave, tipo, nome, descricao, raridade, preco, parametro) values
  -- Poderes (consumíveis — creditam usuario_poderes)
  ('poder_tempo_extra', 'poder', 'Poder: +15s', '1 uso de tempo extra numa questão', 'comum', 10, '{"poder": "tempo_extra"}'),
  ('poder_eliminar', 'poder', 'Poder: 50/50', '1 uso de eliminar uma alternativa errada', 'comum', 15, '{"poder": "eliminar_alternativa"}'),
  ('poder_pular', 'poder', 'Poder: Pular', '1 uso de pular questão sem perder XP', 'raro', 25, '{"poder": "pular_questao"}'),
  -- Paletas do avatar (cosmético permanente)
  ('paleta_esmeralda', 'paleta', 'Paleta Esmeralda', 'Avatar em tons de verde-joia', 'comum', 20, '{"pele": "#34d399", "acento": "#065f46"}'),
  ('paleta_solar', 'paleta', 'Paleta Solar', 'Avatar em laranja incandescente', 'raro', 40, '{"pele": "#fb923c", "acento": "#9a3412"}'),
  ('paleta_vazio', 'paleta', 'Paleta do Vazio', 'Avatar em púrpura do fim do universo', 'epico', 80, '{"pele": "#c084fc", "acento": "#581c87"}'),
  -- Títulos exibíveis no perfil (cosmético permanente)
  ('titulo_persistente', 'titulo', 'Título: O Persistente', 'Exibido junto ao seu nome', 'comum', 20, '{"titulo": "O Persistente"}'),
  ('titulo_cacador', 'titulo', 'Título: Caçador de Bugs', 'Exibido junto ao seu nome', 'raro', 40, '{"titulo": "Caçador de Bugs"}'),
  ('titulo_implacavel', 'titulo', 'Título: O Implacável', 'Exibido junto ao seu nome', 'epico', 80, '{"titulo": "O Implacável"}');
