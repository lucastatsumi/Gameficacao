import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { eventoAtivoParaFase } = await import('./eventoService.js');

function configurarDb(filas) {
  db.from.mockImplementation(makeDb(filas).from);
}

beforeEach(() => vi.clearAllMocks());

describe('eventoAtivoParaFase', () => {
  it('retorna null quando não há eventos', async () => {
    configurarDb({ eventos: [ok([])] });
    expect(await eventoAtivoParaFase(1)).toBeNull();
  });

  it('ignora evento de outra fase específica', async () => {
    configurarDb({
      eventos: [ok([{ id: 1, fase_id: 2, multiplicador_xp: 2 }])],
    });
    expect(await eventoAtivoParaFase(1)).toBeNull();
  });

  it('aplica evento com fase_id null a qualquer fase', async () => {
    configurarDb({
      eventos: [ok([{ id: 1, fase_id: null, multiplicador_xp: 1.5 }])],
    });
    const evento = await eventoAtivoParaFase(5);
    expect(evento.multiplicador_xp).toBe(1.5);
  });

  it('com múltiplos eventos aplicáveis, escolhe o maior multiplicador', async () => {
    configurarDb({
      eventos: [
        ok([
          { id: 1, fase_id: null, multiplicador_xp: 1.5 },
          { id: 2, fase_id: 3, multiplicador_xp: 3 },
          { id: 3, fase_id: 3, multiplicador_xp: 2 },
        ]),
      ],
    });
    const evento = await eventoAtivoParaFase(3);
    expect(evento.id).toBe(2);
    expect(evento.multiplicador_xp).toBe(3);
  });
});
