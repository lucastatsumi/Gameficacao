import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { listarCatalogo, comprarItem, equiparItem, cosmeticosEquipados } =
  await import('./lojaService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

const PALETA = {
  id: 4,
  chave: 'paleta_esmeralda',
  tipo: 'paleta',
  nome: 'Paleta Esmeralda',
  preco: 20,
  parametro: { pele: '#34d399', acento: '#065f46' },
};
const PODER = {
  id: 1,
  chave: 'poder_tempo_extra',
  tipo: 'poder',
  nome: 'Poder: +15s',
  preco: 10,
  parametro: { poder: 'tempo_extra' },
};

describe('listarCatalogo', () => {
  it('marca possuído e equipado por jogador', async () => {
    configurarDb({
      itens_catalogo: [ok([PODER, PALETA])],
      itens_do_jogador: [ok([{ item_id: 4 }])],
      profiles: [ok({ equipados: { paleta: 'paleta_esmeralda' } })],
    });

    const catalogo = await listarCatalogo('user-1');
    expect(catalogo.find((i) => i.id === 4)).toMatchObject({ possuido: true, equipado: true });
    expect(catalogo.find((i) => i.id === 1)).toMatchObject({ possuido: false, equipado: false });
  });
});

describe('comprarItem', () => {
  it('poder: debita fichas e credita o estoque em usuario_poderes (consumível)', async () => {
    const mock = configurarDb({
      itens_catalogo: [ok(PODER)],
      transacoes_fichas: [ok([{ quantidade: 30 }]), ok(null)], // saldo + débito
      usuario_poderes: [ok({ user_id: 'user-1', poder: 'tempo_extra', quantidade: 0 }), ok(null)],
    });

    const res = await comprarItem('user-1', 1);
    expect(res).toEqual({ item: 'poder_tempo_extra', tipo: 'poder' });
    expect(mock.chainsPara('transacoes_fichas')[1].insert).toHaveBeenCalledWith(
      expect.objectContaining({ quantidade: -10, motivo: 'compra_loja' })
    );
  });

  it('cosmético: recusa comprar de novo (409) sem debitar', async () => {
    const mock = configurarDb({
      itens_catalogo: [ok(PALETA)],
      itens_do_jogador: [ok([{ item_id: 4 }])],
    });

    await expect(comprarItem('user-1', 4)).rejects.toMatchObject({ status: 409 });
    expect(mock.chainsPara('transacoes_fichas')).toHaveLength(0);
  });

  it('cosmético: sem saldo, falha com 402 e não registra posse', async () => {
    const mock = configurarDb({
      itens_catalogo: [ok(PALETA)],
      itens_do_jogador: [ok([])],
      transacoes_fichas: [ok([{ quantidade: 5 }])], // saldo insuficiente
    });

    await expect(comprarItem('user-1', 4)).rejects.toMatchObject({ status: 402 });
    expect(mock.chainsPara('itens_do_jogador')).toHaveLength(1); // só a consulta de posse
  });

  it('cosmético: compra registra posse depois do débito', async () => {
    const mock = configurarDb({
      itens_catalogo: [ok(PALETA)],
      itens_do_jogador: [ok([]), ok(null)],
      transacoes_fichas: [ok([{ quantidade: 50 }]), ok(null)],
    });

    await comprarItem('user-1', 4);
    expect(mock.chainsPara('itens_do_jogador')[1].insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      item_id: 4,
    });
  });
});

describe('equiparItem', () => {
  it('recusa equipar item que o jogador não possui (403)', async () => {
    configurarDb({
      profiles: [ok({ equipados: {} })],
      itens_catalogo: [ok(PALETA)],
      itens_do_jogador: [ok([])],
    });

    await expect(equiparItem('user-1', { item_id: 4 })).rejects.toMatchObject({ status: 403 });
  });

  it('equipa cosmético possuído gravando a chave por tipo', async () => {
    const mock = configurarDb({
      profiles: [ok({ equipados: { titulo: 'titulo_cacador' } }), ok(null)],
      itens_catalogo: [ok(PALETA)],
      itens_do_jogador: [ok([{ item_id: 4 }])],
    });

    const res = await equiparItem('user-1', { item_id: 4 });
    expect(res.equipados).toEqual({ titulo: 'titulo_cacador', paleta: 'paleta_esmeralda' });
    expect(mock.chainsPara('profiles')[1].update).toHaveBeenCalledWith({
      equipados: { titulo: 'titulo_cacador', paleta: 'paleta_esmeralda' },
    });
  });

  it('desequipa por tipo com item_id null', async () => {
    configurarDb({
      profiles: [ok({ equipados: { paleta: 'paleta_esmeralda' } }), ok(null)],
    });

    const res = await equiparItem('user-1', { item_id: null, tipo: 'paleta' });
    expect(res.equipados).toEqual({});
  });

  it('poder não é equipável (400)', async () => {
    configurarDb({
      profiles: [ok({ equipados: {} })],
      itens_catalogo: [ok(PODER)],
    });

    await expect(equiparItem('user-1', { item_id: 1 })).rejects.toMatchObject({ status: 400 });
  });
});

describe('cosmeticosEquipados', () => {
  it('resolve as chaves equipadas para os parâmetros de exibição', async () => {
    configurarDb({
      profiles: [ok({ equipados: { paleta: 'paleta_esmeralda', titulo: 'titulo_implacavel' } })],
      itens_catalogo: [
        ok([
          { chave: 'paleta_esmeralda', tipo: 'paleta', parametro: { pele: '#34d399', acento: '#065f46' } },
          { chave: 'titulo_implacavel', tipo: 'titulo', parametro: { titulo: 'O Implacável' } },
        ]),
      ],
    });

    const res = await cosmeticosEquipados('user-1');
    expect(res).toEqual({
      paleta: { pele: '#34d399', acento: '#065f46' },
      titulo: 'O Implacável',
    });
  });

  it('sem nada equipado, devolve nulls com uma única consulta', async () => {
    const mock = configurarDb({ profiles: [ok({ equipados: {} })] });
    expect(await cosmeticosEquipados('user-1')).toEqual({ paleta: null, titulo: null });
    expect(mock.chainsPara('itens_catalogo')).toHaveLength(0);
  });
});
