import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { debitarFichas } from './fichaService.js';
import { concederPoder } from './poderService.js';

// Loja (roadmap v2, 4.2). Poder é consumível (credita usuario_poderes a
// cada compra); paleta/título são permanentes (compra única em
// itens_do_jogador; o que está em uso fica em profiles.equipados).

export async function listarCatalogo(userId) {
  const [{ data: itens, error }, possuidos, equipados] = await Promise.all([
    db.from('itens_catalogo').select('*').order('preco', { ascending: true }),
    itensDoJogador(userId),
    equipadosDoJogador(userId),
  ]);
  if (error) throw error;

  return (itens ?? []).map((item) => ({
    ...item,
    possuido: possuidos.has(item.id),
    equipado: Object.values(equipados).includes(item.chave),
  }));
}

export async function comprarItem(userId, itemId) {
  const item = await buscarItem(itemId);

  if (item.tipo === 'poder') {
    await debitarFichas(userId, item.preco, 'compra_loja', item.chave);
    await concederPoder(userId, item.parametro.poder, 1);
    return { item: item.chave, tipo: item.tipo };
  }

  // Cosmético: compra única
  const possuidos = await itensDoJogador(userId);
  if (possuidos.has(item.id)) throw new HttpError(409, 'Você já possui este item');

  await debitarFichas(userId, item.preco, 'compra_loja', item.chave);
  const { error } = await db
    .from('itens_do_jogador')
    .insert({ user_id: userId, item_id: item.id });
  if (error) throw error;

  return { item: item.chave, tipo: item.tipo };
}

// Equipa (ou desequipa, com itemId null + tipo) um cosmético possuído.
export async function equiparItem(userId, { item_id: itemId, tipo }) {
  let equipados = await equipadosDoJogador(userId);

  if (itemId == null) {
    if (!['paleta', 'titulo'].includes(tipo)) {
      throw new HttpError(400, 'Para desequipar, informe tipo "paleta" ou "titulo"');
    }
    equipados = { ...equipados };
    delete equipados[tipo];
  } else {
    const item = await buscarItem(itemId);
    if (item.tipo === 'poder') throw new HttpError(400, 'Poder não é equipável');
    const possuidos = await itensDoJogador(userId);
    if (!possuidos.has(item.id)) throw new HttpError(403, 'Você não possui este item');
    equipados = { ...equipados, [item.tipo]: item.chave };
  }

  const { error } = await db.from('profiles').update({ equipados }).eq('id', userId);
  if (error) throw error;
  return { equipados };
}

// Cosméticos em uso, já resolvidos para os parâmetros de exibição
// (cores da paleta / texto do título) — consumido pelo GET /perfil.
export async function cosmeticosEquipados(userId) {
  const equipados = await equipadosDoJogador(userId);
  const chaves = Object.values(equipados);
  if (!chaves.length) return { paleta: null, titulo: null };

  const { data, error } = await db
    .from('itens_catalogo')
    .select('chave, tipo, parametro')
    .in('chave', chaves);
  if (error) throw error;

  const porTipo = Object.fromEntries((data ?? []).map((i) => [i.tipo, i.parametro]));
  return { paleta: porTipo.paleta ?? null, titulo: porTipo.titulo?.titulo ?? null };
}

// ---------------------------------------------------------------

async function buscarItem(itemId) {
  if (!itemId) throw new HttpError(400, 'item_id é obrigatório');
  const { data: item, error } = await db
    .from('itens_catalogo')
    .select('*')
    .eq('id', itemId)
    .maybeSingle();
  if (error) throw error;
  if (!item) throw new HttpError(404, 'Item não encontrado');
  return item;
}

async function itensDoJogador(userId) {
  const { data, error } = await db
    .from('itens_do_jogador')
    .select('item_id')
    .eq('user_id', userId);
  if (error) throw error;
  return new Set((data ?? []).map((i) => i.item_id));
}

async function equipadosDoJogador(userId) {
  const { data, error } = await db
    .from('profiles')
    .select('equipados')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.equipados ?? {};
}
