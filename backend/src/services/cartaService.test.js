import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok, fail } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { verificarCartaFase, listarCartas } = await import('./cartaService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

describe('verificarCartaFase', () => {
  it('sem tentativa_id: no-op', async () => {
    const resultado = await verificarCartaFase('u1', undefined);
    expect(resultado).toBeNull();
    expect(db.from).not.toHaveBeenCalled();
  });

  it('fase_id null (tentativa de quiz custom ou desafio diário): no-op', async () => {
    configurarDb({ tentativas: [ok({ fase_id: null })] });
    const resultado = await verificarCartaFase('u1', 't1');
    expect(resultado).toBeNull();
    expect(db.from).not.toHaveBeenCalledWith('cartas_do_jogador');
  });

  it('já tem a carta da fase: no-op, não agrega tentativas de novo', async () => {
    configurarDb({
      tentativas: [ok({ fase_id: 3 })],
      cartas_do_jogador: [ok({ user_id: 'u1' })],
    });
    const resultado = await verificarCartaFase('u1', 't1');
    expect(resultado).toBeNull();
  });

  it('abaixo de 10 questões respondidas no total: não concede', async () => {
    configurarDb({
      tentativas: [ok({ fase_id: 3 }), ok([{ acertos: 8, total_questoes: 9 }])],
      cartas_do_jogador: [ok(null)],
    });
    const resultado = await verificarCartaFase('u1', 't1');
    expect(resultado).toBeNull();
  });

  it('abaixo de 80% de precisão agregada: não concede', async () => {
    configurarDb({
      tentativas: [ok({ fase_id: 3 }), ok([{ acertos: 7, total_questoes: 10 }])],
      cartas_do_jogador: [ok(null)],
    });
    const resultado = await verificarCartaFase('u1', 't1');
    expect(resultado).toBeNull();
  });

  it('exatamente no limiar (10 questões, 80% de acerto agregando várias tentativas): concede', async () => {
    configurarDb({
      tentativas: [
        ok({ fase_id: 3 }),
        ok([
          { acertos: 3, total_questoes: 5 },
          { acertos: 5, total_questoes: 5 },
        ]),
      ],
      cartas_do_jogador: [ok(null), ok(null)],
      fases: [ok({ nome: 'Fase 3' })],
    });
    const resultado = await verificarCartaFase('u1', 't1');
    expect(resultado).toEqual({ fase_id: 3, fase_nome: 'Fase 3' });
  });

  it('conflito 23505 no insert (concorrência) é ignorado, devolve null', async () => {
    configurarDb({
      tentativas: [ok({ fase_id: 3 }), ok([{ acertos: 10, total_questoes: 10 }])],
      cartas_do_jogador: [ok(null), fail({ code: '23505', message: 'duplicate key' })],
    });
    const resultado = await verificarCartaFase('u1', 't1');
    expect(resultado).toBeNull();
    expect(db.from).not.toHaveBeenCalledWith('fases');
  });

  it('erro diferente de 23505 no insert propaga', async () => {
    configurarDb({
      tentativas: [ok({ fase_id: 3 }), ok([{ acertos: 10, total_questoes: 10 }])],
      cartas_do_jogador: [ok(null), fail({ code: '500', message: 'boom' })],
    });
    await expect(verificarCartaFase('u1', 't1')).rejects.toMatchObject({ code: '500' });
  });
});

describe('listarCartas', () => {
  it('devolve uma entrada por fase, ordenada, com conquistadas marcadas', async () => {
    configurarDb({
      fases: [
        ok([
          { id: 1, nome: 'Fase 1', ordem: 1 },
          { id: 2, nome: 'Fase 2', ordem: 2 },
          { id: 3, nome: 'Fase 3', ordem: 3 },
        ]),
      ],
      cartas_do_jogador: [ok([{ fase_id: 1, conquistada_em: '2026-01-01T00:00:00Z' }])],
    });
    const resultado = await listarCartas('u1');
    expect(resultado).toEqual({
      cartas: [
        { fase_id: 1, fase_nome: 'Fase 1', ordem: 1, conquistada: true, conquistada_em: '2026-01-01T00:00:00Z' },
        { fase_id: 2, fase_nome: 'Fase 2', ordem: 2, conquistada: false, conquistada_em: null },
        { fase_id: 3, fase_nome: 'Fase 3', ordem: 3, conquistada: false, conquistada_em: null },
      ],
      total: 3,
      conquistadas: 1,
    });
  });

  it('sem nenhuma carta conquistada: conquistadas = 0', async () => {
    configurarDb({
      fases: [ok([{ id: 1, nome: 'Fase 1', ordem: 1 }])],
      cartas_do_jogador: [ok([])],
    });
    const resultado = await listarCartas('u1');
    expect(resultado.conquistadas).toBe(0);
    expect(resultado.total).toBe(1);
    expect(resultado.cartas[0].conquistada).toBe(false);
  });
});
