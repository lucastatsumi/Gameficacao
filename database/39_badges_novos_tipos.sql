-- ============================================================
-- 39_badges_novos_tipos.sql — Novos tipos de condição de badge para
-- as mecânicas da 40 (mesmo padrão da 17/18: o valor novo do enum
-- precisa estar comitado antes de ser usado num insert, então fica numa
-- migration separada).
-- ============================================================

alter type tipo_condicao_badge add value if not exists 'album_completo'; -- parametro: {"tema_id": 2}
alter type tipo_condicao_badge add value if not exists 'campanha';       -- parametro: {"campanha_id": 1}
alter type tipo_condicao_badge add value if not exists 'prestigio';      -- parametro: {"ciclos": 1}
