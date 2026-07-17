import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok, fail } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { estoqueDoUsuario, concederPoder, usarPoder } = await import('./poderService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

describe('estoqueDoUsuario', () => {
  it('devolve 0 para poderes que o usuário nunca ganhou', async () => {
    configurarDb({ usuario_poderes: [ok([{ poder: 'eliminar_alternativa', quantidade: 2 }])] });

    const estoque = await estoqueDoUsuario('user-1');
    expect(estoque).toEqual({ eliminar_alternativa: 2, tempo_extra: 0, pular_questao: 0 });
  });
});

describe('concederPoder', () => {
  it('soma à quantidade existente', async () => {
    const mock = configurarDb({
      usuario_poderes: [ok({ quantidade: 3 }), ok(null)],
    });

    await concederPoder('user-1', 'tempo_extra', 2);

    const upsertChain = mock.chainsPara('usuario_poderes')[1];
    expect(upsertChain.upsert).toHaveBeenCalledWith(
      { user_id: 'user-1', poder: 'tempo_extra', quantidade: 5 },
      { onConflict: 'user_id,poder' }
    );
  });

  it('começa do zero quando não havia registro', async () => {
    const mock = configurarDb({
      usuario_poderes: [ok(null), ok(null)],
    });

    await concederPoder('user-1', 'eliminar_alternativa', 1);

    const upsertChain = mock.chainsPara('usuario_poderes')[1];
    expect(upsertChain.upsert).toHaveBeenCalledWith(
      { user_id: 'user-1', poder: 'eliminar_alternativa', quantidade: 1 },
      { onConflict: 'user_id,poder' }
    );
  });
});

describe('usarPoder', () => {
  const questaoComAlternativas = {
    id: 'q1',
    fase_id: 1,
    alternativas: [
      { id: 'a-certa', correta: true },
      { id: 'a-errada-1', correta: false },
      { id: 'a-errada-2', correta: false },
    ],
  };

  it('rejeita poder desconhecido', async () => {
    await expect(
      usarPoder('user-1', { tentativa_id: 't1', questao_id: 'q1', poder: 'invencibilidade' })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejeita usar em tentativa já finalizada', async () => {
    configurarDb({
      tentativas: [ok({ id: 't1', user_id: 'user-1', finalizada_em: '2026-01-01T00:00:00Z' })],
    });

    await expect(
      usarPoder('user-1', { tentativa_id: 't1', questao_id: 'q1', poder: 'tempo_extra' })
    ).rejects.toMatchObject({ status: 409 });
  });

  it('rejeita sem estoque do poder', async () => {
    configurarDb({
      tentativas: [ok({ id: 't1', user_id: 'user-1', finalizada_em: null, fase_id: 1 })],
      questoes: [ok(questaoComAlternativas)],
      usuario_poderes: [ok(null)],
    });

    await expect(
      usarPoder('user-1', { tentativa_id: 't1', questao_id: 'q1', poder: 'tempo_extra' })
    ).rejects.toMatchObject({ status: 400, message: expect.stringContaining('não tem esse poder') });
  });

  it('concede tempo_extra: registra o uso, debita o estoque e devolve 15s', async () => {
    const mock = configurarDb({
      tentativas: [ok({ id: 't1', user_id: 'user-1', finalizada_em: null, fase_id: 1 })],
      questoes: [ok(questaoComAlternativas)],
      usuario_poderes: [ok({ quantidade: 2 }), ok(null)],
      poderes_usados: [ok(null)],
    });

    const resultado = await usarPoder('user-1', {
      tentativa_id: 't1',
      questao_id: 'q1',
      poder: 'tempo_extra',
    });

    expect(resultado).toEqual({ poder: 'tempo_extra', segundos_extra: 15 });

    const insertChain = mock.chainsPara('poderes_usados')[0];
    expect(insertChain.insert).toHaveBeenCalledWith({
      tentativa_id: 't1',
      questao_id: 'q1',
      poder: 'tempo_extra',
      segundos_extra: 15,
    });

    const debitoChain = mock.chainsPara('usuario_poderes')[1];
    expect(debitoChain.update).toHaveBeenCalledWith({ quantidade: 1 });
  });

  it('eliminar_alternativa NUNCA remove a alternativa correta', async () => {
    const mock = configurarDb({
      tentativas: [ok({ id: 't1', user_id: 'user-1', finalizada_em: null, fase_id: 1 })],
      questoes: [ok(questaoComAlternativas)],
      usuario_poderes: [ok({ quantidade: 1 }), ok(null)],
      poderes_usados: [ok(null)],
    });

    const resultado = await usarPoder('user-1', {
      tentativa_id: 't1',
      questao_id: 'q1',
      poder: 'eliminar_alternativa',
    });

    expect(resultado.poder).toBe('eliminar_alternativa');
    expect(['a-errada-1', 'a-errada-2']).toContain(resultado.alternativa_removida_id);

    const insertChain = mock.chainsPara('poderes_usados')[0];
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ poder: 'eliminar_alternativa', segundos_extra: null })
    );
  });

  it('trata uso duplicado do mesmo poder na mesma questão (23505) como conflito', async () => {
    configurarDb({
      tentativas: [ok({ id: 't1', user_id: 'user-1', finalizada_em: null, fase_id: 1 })],
      questoes: [ok(questaoComAlternativas)],
      usuario_poderes: [ok({ quantidade: 1 })],
      poderes_usados: [fail({ code: '23505' })],
    });

    await expect(
      usarPoder('user-1', { tentativa_id: 't1', questao_id: 'q1', poder: 'tempo_extra' })
    ).rejects.toMatchObject({ status: 409 });
  });

  it('pular_questao: registra o uso, debita o estoque e não mexe em alternativas', async () => {
    const mock = configurarDb({
      tentativas: [ok({ id: 't1', user_id: 'user-1', finalizada_em: null, fase_id: 1 })],
      questoes: [ok(questaoComAlternativas)],
      respostas: [ok(null)], // ainda não respondida
      usuario_poderes: [ok({ quantidade: 1 }), ok(null)],
      poderes_usados: [ok(null)],
    });

    const resultado = await usarPoder('user-1', {
      tentativa_id: 't1',
      questao_id: 'q1',
      poder: 'pular_questao',
    });

    expect(resultado).toEqual({ poder: 'pular_questao', pulada: true });

    const insertChain = mock.chainsPara('poderes_usados')[0];
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ poder: 'pular_questao', segundos_extra: null })
    );
  });

  it('rejeita pular_questao se a questão já foi respondida', async () => {
    configurarDb({
      tentativas: [ok({ id: 't1', user_id: 'user-1', finalizada_em: null, fase_id: 1 })],
      questoes: [ok(questaoComAlternativas)],
      respostas: [ok({ id: 'r1' })], // já respondida
    });

    await expect(
      usarPoder('user-1', { tentativa_id: 't1', questao_id: 'q1', poder: 'pular_questao' })
    ).rejects.toMatchObject({ status: 409 });
  });

  it('rejeita questão que não pertence à fase da tentativa', async () => {
    configurarDb({
      tentativas: [ok({ id: 't1', user_id: 'user-1', finalizada_em: null, fase_id: 2 })],
      questoes: [ok({ ...questaoComAlternativas, fase_id: 1 })],
    });

    await expect(
      usarPoder('user-1', { tentativa_id: 't1', questao_id: 'q1', poder: 'tempo_extra' })
    ).rejects.toMatchObject({ status: 400 });
  });
});
