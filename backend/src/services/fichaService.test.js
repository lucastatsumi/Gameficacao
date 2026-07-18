import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { saldoDeFichas, concederFichas, debitarFichas, recompensarQuiz } =
  await import('./fichaService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

describe('saldoDeFichas', () => {
  it('soma créditos e débitos do ledger', async () => {
    configurarDb({
      transacoes_fichas: [ok([{ quantidade: 10 }, { quantidade: 5 }, { quantidade: -8 }])],
    });
    expect(await saldoDeFichas('user-1')).toBe(7);
  });

  it('sem transações, saldo é zero', async () => {
    configurarDb({ transacoes_fichas: [ok([])] });
    expect(await saldoDeFichas('user-1')).toBe(0);
  });
});

describe('concederFichas', () => {
  it('rejeita quantidade não positiva', async () => {
    await expect(concederFichas('user-1', 0, 'x')).rejects.toMatchObject({ status: 400 });
    await expect(concederFichas('user-1', -5, 'x')).rejects.toMatchObject({ status: 400 });
  });

  it('insere transação positiva com motivo e referência', async () => {
    const mock = configurarDb({ transacoes_fichas: [ok(null)] });
    await concederFichas('user-1', 10, 'quiz_aprovado', 't1');
    expect(mock.chainsPara('transacoes_fichas')[0].insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      quantidade: 10,
      motivo: 'quiz_aprovado',
      referencia: 't1',
    });
  });
});

describe('debitarFichas', () => {
  it('recusa débito maior que o saldo (402), sem inserir nada', async () => {
    const mock = configurarDb({ transacoes_fichas: [ok([{ quantidade: 5 }])] });
    await expect(debitarFichas('user-1', 10, 'compra_loja')).rejects.toMatchObject({ status: 402 });
    expect(mock.chainsPara('transacoes_fichas')).toHaveLength(1); // só a consulta de saldo
  });

  it('debita como transação negativa e devolve o novo saldo', async () => {
    const mock = configurarDb({
      transacoes_fichas: [ok([{ quantidade: 30 }]), ok(null)],
    });
    const novoSaldo = await debitarFichas('user-1', 10, 'compra_loja', 'item-1');
    expect(novoSaldo).toBe(20);
    expect(mock.chainsPara('transacoes_fichas')[1].insert).toHaveBeenCalledWith(
      expect.objectContaining({ quantidade: -10, motivo: 'compra_loja' })
    );
  });
});

describe('recompensarQuiz', () => {
  const resultadoAprovado = { aprovada: true, xp_ganho: 20, acertos: 8, total_questoes: 10 };

  it('não paga tentativa reprovada nem tentativa sem XP novo (anti-farming)', async () => {
    expect(await recompensarQuiz('u', { ...resultadoAprovado, aprovada: false }, 't')).toBe(0);
    expect(await recompensarQuiz('u', { ...resultadoAprovado, xp_ganho: 0 }, 't')).toBe(0);
  });

  it('aprovado rende 10; perfeito rende 10 + 5', async () => {
    configurarDb({
      transacoes_fichas: [ok([]), ok(null)], // fichas de hoje + insert aprovado
    });
    expect(await recompensarQuiz('u', resultadoAprovado, 't')).toBe(10);

    configurarDb({
      transacoes_fichas: [ok([]), ok(null), ok(null)], // hoje + aprovado + perfeito
    });
    const perfeito = { ...resultadoAprovado, acertos: 10 };
    expect(await recompensarQuiz('u', perfeito, 't')).toBe(15);
  });

  it('teto diário de 50: concede só o que resta e zera quando estourou', async () => {
    // já ganhou 45 hoje -> só 5 restam (nem chega no bônus de perfeito)
    configurarDb({
      transacoes_fichas: [ok([{ quantidade: 45 }]), ok(null)],
    });
    const perfeito = { ...resultadoAprovado, acertos: 10 };
    expect(await recompensarQuiz('u', perfeito, 't')).toBe(5);

    // já ganhou 50 -> nada
    configurarDb({ transacoes_fichas: [ok([{ quantidade: 50 }])] });
    expect(await recompensarQuiz('u', perfeito, 't')).toBe(0);
  });
});
