-- ============================================================
-- 44_titulo_campeao_torneio.sql — Cosmético de pódio do torneio entre
-- equipes (roadmap v2, H4): título exclusivo (não vendido na loja) dado
-- a todos os membros da equipe campeã (ver torneioService.encerrarTorneio).
-- ============================================================

insert into itens_catalogo (chave, tipo, nome, descricao, raridade, preco, exclusivo, parametro)
values (
  'titulo_campeao_torneio', 'titulo', 'Título: Campeão do Torneio',
  'Concedido à equipe campeã de um torneio — não está à venda', 'epico', 80, true,
  '{"titulo": "Campeão do Torneio"}'
)
on conflict (chave) do nothing;
