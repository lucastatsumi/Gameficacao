import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { idsDoDesafio, iniciarDesafioDiario, statusDoDia, QUESTOES_DESAFIO } =
  await import('./desafioDiarioService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

const BANCO = Array.from({ length: 12 }, (_, i) => ({ id: `q${String(i).padStart(2, '0')}` }));

describe('idsDoDesafio', () => {
  it('mesmo dia -> mesmos ids na mesma ordem, mesmo com o banco vindo embaralhado', async () => {
    configurarDb({ questoes: [ok(BANCO)] });
    const a = await idsDoDesafio('2026-07-19');

    configurarDb({ questoes: [ok([...BANCO].reverse())] });
    const b = await idsDoDesafio('2026-07-19');

    expect(a).toEqual(b);
    expect(a).toHaveLength(QUESTOES_DESAFIO);
  });

  it('dias diferentes -> sorteios diferentes', async () => {
    configurarDb({ questoes: [ok(BANCO)] });
    const a = await idsDoDesafio('2026-07-19');
    configurarDb({ questoes: [ok(BANCO)] });
    const b = await idsDoDesafio('2026-07-20');
    expect(a).not.toEqual(b);
  });
});

describe('iniciarDesafioDiario', () => {
  const questoesCompletas = (ids) =>
    ids.map((id) => ({
      id,
      enunciado: `Enunciado ${id}`,
      tempo_limite_seg: 30,
      formato: 'padrao',
      alternativas: [{ id: 'a1', letra: 'A', texto: 'x' }],
    }));

  it('já jogou hoje (mesmo sem finalizar) -> 409', async () => {
    configurarDb({
      tentativas: [ok({ id: 't-hoje', finalizada_em: null })],
    });

    await expect(iniciarDesafioDiario('user-1')).rejects.toMatchObject({ status: 409 });
  });

  it('abre a tentativa marcada com desafio_dia e devolve as questões na ordem do dia', async () => {
    configurarDb({
      tentativas: [ok(null), ok({ id: 't-nova' })],
      questoes: [ok(BANCO), ok(questoesCompletas(BANCO.map((q) => q.id)))],
    });

    const res = await iniciarDesafioDiario('user-1');
    expect(res.desafio_diario).toBe(true);
    expect(res.tentativa_id).toBe('t-nova');
    expect(res.questoes).toHaveLength(QUESTOES_DESAFIO);
    expect(res.fase.nome).toBe('Desafio Diário');
  });

  it('corrida entre duas abas: o índice único (23505) vira 409 amigável', async () => {
    configurarDb({
      tentativas: [ok(null), { data: null, error: { code: '23505' } }],
      questoes: [ok(BANCO), ok(questoesCompletas(BANCO.map((q) => q.id)))],
    });

    await expect(iniciarDesafioDiario('user-1')).rejects.toMatchObject({ status: 409 });
  });
});

describe('statusDoDia', () => {
  it('monta o ranking do dia marcando o próprio jogador', async () => {
    configurarDb({
      tentativas: [
        ok([
          { user_id: 'user-2', acertos: 5, total_questoes: 5, finalizada_em: 'x', profiles: { nome: 'Bia' } },
          { user_id: 'user-1', acertos: 4, total_questoes: 5, finalizada_em: 'y', profiles: { nome: 'Ana' } },
        ]),
        ok({ id: 't1', acertos: 4, total_questoes: 5, finalizada_em: 'y' }),
      ],
    });

    const status = await statusDoDia('user-1');
    expect(status.ja_jogou).toBe(true);
    expect(status.minha_pontuacao).toEqual({ acertos: 4, total_questoes: 5 });
    expect(status.ranking[0]).toMatchObject({ posicao: 1, nome: 'Bia', voce: false });
    expect(status.ranking[1]).toMatchObject({ posicao: 2, nome: 'Ana', voce: true });
  });

  it('sem tentativa hoje: ja_jogou false e pontuação null', async () => {
    configurarDb({ tentativas: [ok([]), ok(null)] });
    const status = await statusDoDia('user-1');
    expect(status.ja_jogou).toBe(false);
    expect(status.minha_pontuacao).toBeNull();
    expect(status.ranking).toEqual([]);
  });
});
