import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { verificarCartas, album } = await import('./cartaService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

const respostas = (tag, total, acertos) =>
  Array.from({ length: total }, (_, i) => ({
    correta: i < acertos,
    questoes: { competencias: [tag] },
  }));

const CATALOGO = [
  { competencia: 'Listas', resumo: 'Sequência encadeada' },
  { competencia: 'Árvores', resumo: 'Hierarquia' },
];

describe('verificarCartas', () => {
  it('concede só a carta com ≥10 respostas e ≥80% de acerto', async () => {
    const mock = configurarDb({
      respostas: [ok([...respostas('Listas', 10, 9), ...respostas('Árvores', 10, 5)])],
      cartas_catalogo: [ok(CATALOGO)],
      cartas_do_jogador: [ok([]), ok(null)],
    });
    const novas = await verificarCartas('u1');
    expect(novas.map((c) => c.competencia)).toEqual(['Listas']);
    expect(mock.chainsPara('cartas_do_jogador')[1].upsert).toHaveBeenCalled();
  });

  it('amostra pequena não desbloqueia (9 respostas)', async () => {
    configurarDb({
      respostas: [ok(respostas('Listas', 9, 9))],
      cartas_catalogo: [ok(CATALOGO)],
      cartas_do_jogador: [ok([])],
    });
    expect(await verificarCartas('u1')).toEqual([]);
  });

  it('não repete carta que o jogador já tem', async () => {
    configurarDb({
      respostas: [ok(respostas('Listas', 10, 10))],
      cartas_catalogo: [ok(CATALOGO)],
      cartas_do_jogador: [ok([{ competencia: 'Listas' }])],
    });
    expect(await verificarCartas('u1')).toEqual([]);
  });
});

describe('album', () => {
  it('esconde o resumo das cartas não conquistadas', async () => {
    configurarDb({
      cartas_catalogo: [ok(CATALOGO)],
      cartas_do_jogador: [ok([{ competencia: 'Listas' }])],
    });
    expect(await album('u1')).toEqual([
      { competencia: 'Listas', conquistada: true, resumo: 'Sequência encadeada' },
      { competencia: 'Árvores', conquistada: false },
    ]);
  });
});
