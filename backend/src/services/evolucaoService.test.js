import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { agruparPorSemana, ultimasSemanas, evolucaoDaTurma } = await import('./evolucaoService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

const AGORA = new Date('2026-02-10T12:00:00Z'); // terça

describe('ultimasSemanas', () => {
  it('devolve N rótulos consecutivos terminando na semana atual', () => {
    const r = ultimasSemanas(3, AGORA);
    expect(r).toHaveLength(3);
    expect(r[2]).toBe('2026-W07');
    expect(r[0]).toBe('2026-W05');
  });
});

describe('agruparPorSemana', () => {
  it('agrega por semana, mantém semanas vazias e ignora fora da janela', () => {
    const semanas = ultimasSemanas(3, AGORA);
    const serie = agruparPorSemana(
      [
        { user_id: 'a', xp_ganho: 10, score: 80, finalizada_em: '2026-02-09T10:00:00Z' },
        { user_id: 'b', xp_ganho: 20, score: 60, finalizada_em: '2026-02-10T10:00:00Z' },
        { user_id: 'a', xp_ganho: 5, score: null, finalizada_em: '2026-02-10T11:00:00Z' },
        { user_id: 'a', xp_ganho: 99, score: 100, finalizada_em: '2025-06-01T10:00:00Z' },
      ],
      semanas
    );
    expect(serie[0]).toMatchObject({ tentativas: 0, score_medio: null, colaboradores_ativos: 0 });
    expect(serie[2]).toEqual({
      semana: '2026-W07',
      tentativas: 3,
      xp_total: 35,
      colaboradores_ativos: 2,
      score_medio: 70,
    });
  });
});

describe('evolucaoDaTurma', () => {
  it('valida o número de semanas (400)', async () => {
    await expect(evolucaoDaTurma('g', 't', 100, AGORA)).rejects.toMatchObject({ status: 400 });
  });
  it('404 para turma de outro gestor', async () => {
    configurarDb({ turmas: [ok(null)] });
    await expect(evolucaoDaTurma('g', 't', 4, AGORA)).rejects.toMatchObject({ status: 404 });
  });
  it('turma sem membros devolve série vazia sem consultar tentativas', async () => {
    configurarDb({ turmas: [ok({ id: 't' })], matriculas: [ok([])] });
    const r = await evolucaoDaTurma('g', 't', 4, AGORA);
    expect(r.membros).toBe(0);
    expect(r.serie).toHaveLength(4);
  });
});
