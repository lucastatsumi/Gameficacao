import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { calcularPlacar, criarTorneio, encerrarTorneio } = await import('./torneioService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

describe('calcularPlacar', () => {
  it('ordena pela média por membro, não pela soma', () => {
    const p = calcularPlacar([
      { turma_id: 'g', nome: 'Grande', membros: 10, xp_total: 300 },
      { turma_id: 'p', nome: 'Pequena', membros: 2, xp_total: 100 },
    ]);
    expect(p.map((e) => e.turma_id)).toEqual(['p', 'g']);
    expect(p[0]).toMatchObject({ media_xp: 50, posicao: 1 });
  });
  it('equipe sem membros tem média 0 (sem divisão por zero)', () => {
    expect(calcularPlacar([{ turma_id: 'x', nome: 'X', membros: 0, xp_total: 0 }])[0].media_xp).toBe(0);
  });
});

describe('criarTorneio', () => {
  const base = { nome: 'Outubro', inicio: '2026-10-01', fim: '2026-10-31', turma_ids: ['a', 'b'] };
  it('exige período válido e ≥2 equipes', async () => {
    await expect(criarTorneio('g', { ...base, fim: '2026-09-01' })).rejects.toMatchObject({ status: 400 });
    await expect(criarTorneio('g', { ...base, turma_ids: ['a'] })).rejects.toMatchObject({ status: 400 });
  });
  it('rejeita equipe de outro gestor (404)', async () => {
    configurarDb({ turmas: [ok([{ id: 'a' }])] });
    await expect(criarTorneio('g', base)).rejects.toMatchObject({ status: 404 });
  });
  it('cria torneio e vincula as equipes', async () => {
    const mock = configurarDb({
      turmas: [ok([{ id: 'a' }, { id: 'b' }])],
      torneios: [ok({ id: 't1' })],
      torneio_equipes: [ok(null)],
    });
    const t = await criarTorneio('g', base);
    expect(t.id).toBe('t1');
    expect(mock.chainsPara('torneio_equipes')[0].insert).toHaveBeenCalledWith([
      { torneio_id: 't1', turma_id: 'a' },
      { torneio_id: 't1', turma_id: 'b' },
    ]);
  });
});

describe('encerrarTorneio', () => {
  const torneio = {
    id: 't1',
    gestor_id: 'g',
    fim: '2026-10-31T00:00:00Z',
    inicio: '2026-10-01T00:00:00Z',
    torneio_equipes: [
      { turma_id: 'a', turmas: { id: 'a', nome: 'A', matriculas: [{ user_id: 'u1' }] } },
      { turma_id: 'b', turmas: { id: 'b', nome: 'B', matriculas: [{ user_id: 'u2' }] } },
    ],
  };
  const depois = new Date('2026-11-02T00:00:00Z');

  it('409 enquanto em andamento', async () => {
    configurarDb({ torneios: [ok(torneio)], tentativas: [ok([])] });
    await expect(encerrarTorneio('g', 't1', new Date('2026-10-15'))).rejects.toMatchObject({ status: 409 });
  });

  it('404 para quem não é o gestor', async () => {
    configurarDb({ torneios: [ok(torneio)], tentativas: [ok([])] });
    await expect(encerrarTorneio('outro', 't1', depois)).rejects.toMatchObject({ status: 404 });
  });

  it('409 se outra chamada já encerrou (sem pagar de novo)', async () => {
    configurarDb({ torneios: [ok(torneio), ok([])], tentativas: [ok([])] });
    await expect(encerrarTorneio('g', 't1', depois)).rejects.toMatchObject({ status: 409 });
  });

  it('paga o pódio por membro e ignora equipe sem XP', async () => {
    const mock = configurarDb({
      torneios: [ok(torneio), ok([{ id: 't1' }])],
      tentativas: [ok([{ user_id: 'u1', xp_ganho: 50 }])],
      transacoes_fichas: [ok(null)],
    });
    const placar = await encerrarTorneio('g', 't1', depois);
    expect(placar[0]).toMatchObject({ turma_id: 'a', posicao: 1 });
    expect(placar[0].membros_ids).toBeUndefined();
    const inserts = mock.chainsPara('transacoes_fichas');
    expect(inserts).toHaveLength(1); // só u1 (equipe B ficou com 0 XP)
    expect(inserts[0].insert).toHaveBeenCalledWith({
      user_id: 'u1',
      quantidade: 30,
      motivo: 'torneio_podio',
      referencia: 't1',
    });
  });
});
