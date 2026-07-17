import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { criarDesafio, obterDesafio } = await import('./desafioService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

describe('criarDesafio', () => {
  it('rejeita sem fase_id', async () => {
    await expect(criarDesafio('user-1', undefined)).rejects.toMatchObject({ status: 400 });
  });

  it('rejeita se o aluno nunca jogou essa fase', async () => {
    configurarDb({ progresso_fase: [ok(null)] });
    await expect(criarDesafio('user-1', 1)).rejects.toMatchObject({ status: 400 });
  });

  it('rejeita se a melhor pontuação é 0 (nunca acertou nada)', async () => {
    configurarDb({ progresso_fase: [ok({ melhor_pontuacao: 0 })] });
    await expect(criarDesafio('user-1', 1)).rejects.toMatchObject({ status: 400 });
  });

  it('cria o desafio com a melhor pontuação do aluno como alvo', async () => {
    const mock = configurarDb({
      progresso_fase: [ok({ melhor_pontuacao: 8 })],
      desafios: [ok({ id: 'desafio-1' })],
    });

    const resultado = await criarDesafio('user-1', 1);
    expect(resultado).toEqual({ id: 'desafio-1' });

    const insertChain = mock.chainsPara('desafios')[0];
    expect(insertChain.insert).toHaveBeenCalledWith({
      criador_id: 'user-1',
      fase_id: 1,
      acertos_alvo: 8,
    });
  });
});

describe('obterDesafio', () => {
  it('rejeita desafio inexistente', async () => {
    configurarDb({ desafios: [ok(null)] });
    await expect(obterDesafio('desafio-x')).rejects.toMatchObject({ status: 404 });
  });

  it('monta fase e nome do criador a partir do embed', async () => {
    configurarDb({
      desafios: [
        ok({
          id: 'desafio-1',
          acertos_alvo: 8,
          criado_em: '2026-07-17T10:00:00Z',
          fases: { id: 1, nome: 'Listas' },
          profiles: { nome: 'Ana' },
        }),
      ],
    });

    const desafio = await obterDesafio('desafio-1');
    expect(desafio).toEqual({
      id: 'desafio-1',
      fase: { id: 1, nome: 'Listas' },
      criador_nome: 'Ana',
      acertos_alvo: 8,
      criado_em: '2026-07-17T10:00:00Z',
    });
  });

  it('usa "Alguém" se o perfil do criador não vier no embed (defensivo)', async () => {
    configurarDb({
      desafios: [
        ok({
          id: 'desafio-2',
          acertos_alvo: 5,
          criado_em: '2026-07-17T10:00:00Z',
          fases: { id: 2, nome: 'Pilhas' },
          profiles: null,
        }),
      ],
    });

    const desafio = await obterDesafio('desafio-2');
    expect(desafio.criador_nome).toBe('Alguém');
  });
});
