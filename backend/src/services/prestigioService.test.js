import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok, fail } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { statusDePrestigio, prestigiar, cicloAtual } = await import('./prestigioService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

const FASES = [
  { id: 1, tema_id: 1, temas: { nome: 'Compliance' } },
  { id: 2, tema_id: 1, temas: { nome: 'Compliance' } },
];
const TUDO_CONCLUIDO = [
  { fase_id: 1, concluida: true },
  { fase_id: 2, concluida: true },
];

describe('cicloAtual', () => {
  it('0 sem prestígio, senão o maior ciclo', async () => {
    configurarDb({ prestigios: [ok([])] });
    expect(await cicloAtual('u1', 1)).toBe(0);
    configurarDb({ prestigios: [ok([{ ciclo: 2 }])] });
    expect(await cicloAtual('u1', 1)).toBe(2);
  });
});

describe('statusDePrestigio', () => {
  it('só pode prestigiar com todos os módulos concluídos', async () => {
    configurarDb({
      fases: [ok(FASES)],
      progresso_fase: [ok([{ fase_id: 1, concluida: true }])],
      prestigios: [ok([])],
    });
    const [s] = await statusDePrestigio('u1');
    expect(s).toMatchObject({ tema_id: 1, ciclo: 0, pode_prestigiar: false });
  });
});

describe('prestigiar', () => {
  it('bloqueia trilha incompleta (403)', async () => {
    configurarDb({ fases: [ok(FASES)], progresso_fase: [ok([])], prestigios: [ok([])] });
    await expect(prestigiar('u1', 1)).rejects.toMatchObject({ status: 403 });
  });

  it('registra o próximo ciclo e reinicia o progresso do tema', async () => {
    const mock = configurarDb({
      fases: [ok(FASES), ok([{ id: 1 }, { id: 2 }])],
      progresso_fase: [ok(TUDO_CONCLUIDO), ok(null)],
      prestigios: [ok([{ tema_id: 1, ciclo: 1 }]), ok(null)],
    });
    const r = await prestigiar('u1', '1');
    expect(r).toEqual({ tema_id: 1, tema: 'Compliance', ciclo: 2 });
    expect(mock.chainsPara('prestigios')[1].insert).toHaveBeenCalledWith({
      user_id: 'u1',
      tema_id: 1,
      ciclo: 2,
    });
    expect(mock.chainsPara('progresso_fase')[1].update).toHaveBeenCalledWith({ concluida: false });
  });

  it('duplo clique (23505) vira 409', async () => {
    configurarDb({
      fases: [ok(FASES)],
      progresso_fase: [ok(TUDO_CONCLUIDO)],
      prestigios: [ok([]), fail({ code: '23505' })],
    });
    await expect(prestigiar('u1', 1)).rejects.toMatchObject({ status: 409 });
  });
});
