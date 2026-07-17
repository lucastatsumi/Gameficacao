import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { rankingGlobal, rankingPorTurma, rankingPorFase } = await import('./rankingService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

describe('rankingGlobal', () => {
  it('formata classe_fase em "Mestre de X" e usa null quando o aluno não concluiu nenhuma fase', async () => {
    configurarDb({
      ranking_global: [
        ok([
          { id: 'user-1', nome: 'Ana', nivel: 5, xp_total: 900, classe_fase: 'Árvores', posicao: 1 },
          { id: 'user-2', nome: 'Bia', nivel: 1, xp_total: 0, classe_fase: null, posicao: 2 },
        ]),
      ],
    });

    const { ranking, minha_posicao } = await rankingGlobal('user-1');
    expect(ranking[0]).toEqual({
      id: 'user-1',
      nome: 'Ana',
      nivel: 5,
      xp_total: 900,
      posicao: 1,
      classe: 'Mestre de Árvores',
    });
    expect(ranking[1].classe).toBeNull();
    expect(minha_posicao.classe).toBe('Mestre de Árvores');
  });

  it('quando o usuário não está no top carregado, busca a posição dele separadamente (também formatada)', async () => {
    configurarDb({
      ranking_global: [
        ok([{ id: 'user-2', nome: 'Bia', nivel: 3, xp_total: 300, classe_fase: null, posicao: 1 }]),
        ok({ id: 'user-1', nome: 'Ana', nivel: 1, xp_total: 10, classe_fase: 'Listas', posicao: 50 }),
      ],
    });

    const { minha_posicao } = await rankingGlobal('user-1');
    expect(minha_posicao).toEqual({
      id: 'user-1',
      nome: 'Ana',
      nivel: 1,
      xp_total: 10,
      posicao: 50,
      classe: 'Mestre de Listas',
    });
  });
});

describe('rankingPorTurma', () => {
  it('rejeita aluno que não está matriculado na turma', async () => {
    configurarDb({ matriculas: [ok(null)] });
    await expect(
      rankingPorTurma({ id: 'user-1', role: 'aluno' }, 'turma-1')
    ).rejects.toMatchObject({ status: 403 });
  });

  it('formata classe_fase para cada linha do ranking da turma', async () => {
    configurarDb({
      matriculas: [ok({ user_id: 'user-1' })],
      ranking_turma: [
        ok([
          {
            turma_id: 'turma-1',
            id: 'user-1',
            nome: 'Ana',
            nivel: 2,
            xp_total: 150,
            classe_fase: 'Pilhas',
            posicao: 1,
          },
        ]),
      ],
    });

    const { ranking, minha_posicao } = await rankingPorTurma({ id: 'user-1', role: 'aluno' }, 'turma-1');
    expect(ranking[0].classe).toBe('Mestre de Pilhas');
    expect(minha_posicao.classe).toBe('Mestre de Pilhas');
  });
});

describe('rankingPorFase', () => {
  it('não depende de classe (ranking de XP só daquela fase)', async () => {
    configurarDb({
      ranking_fase: [ok([{ fase_id: 1, id: 'user-1', nome: 'Ana', xp_fase: 80, posicao: 1 }])],
    });

    const { ranking, minha_posicao } = await rankingPorFase('user-1', 1);
    expect(ranking).toEqual([{ fase_id: 1, id: 'user-1', nome: 'Ana', xp_fase: 80, posicao: 1 }]);
    expect(minha_posicao).toEqual({ fase_id: 1, id: 'user-1', nome: 'Ana', xp_fase: 80, posicao: 1 });
  });
});
