import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { filtrarFasesPorTemas, temasPermitidos, criarTema, definirTemasDaTurma } = await import(
  './trilhaService.js'
);

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

describe('filtrarFasesPorTemas', () => {
  const fases = [
    { id: 1, tema_id: 1 },
    { id: 2, tema_id: 2 },
    { id: 3, tema_id: null },
  ];
  it('sem restrição devolve tudo', () => {
    expect(filtrarFasesPorTemas(fases, null)).toEqual(fases);
  });
  it('com restrição mantém só os temas atribuídos (e fases sem tema)', () => {
    expect(filtrarFasesPorTemas(fases, new Set([2])).map((f) => f.id)).toEqual([2, 3]);
  });
});

describe('temasPermitidos', () => {
  it('união dos temas de todas as equipes', async () => {
    configurarDb({
      matriculas: [
        ok([
          { turmas: { turma_temas: [{ tema_id: 1 }] } },
          { turmas: { turma_temas: [{ tema_id: 2 }, { tema_id: 1 }] } },
        ]),
      ],
    });
    expect(await temasPermitidos('u1')).toEqual(new Set([1, 2]));
  });
  it('equipes sem atribuição = sem restrição (null)', async () => {
    configurarDb({ matriculas: [ok([{ turmas: { turma_temas: [] } }])] });
    expect(await temasPermitidos('u1')).toBeNull();
  });
});

describe('criarTema', () => {
  it('exige nome (400)', async () => {
    await expect(criarTema('  ')).rejects.toMatchObject({ status: 400 });
  });
  it('nome repetido vira 409', async () => {
    configurarDb({ temas: [{ data: null, error: { code: '23505' } }] });
    await expect(criarTema('LGPD')).rejects.toMatchObject({ status: 409 });
  });
});

describe('definirTemasDaTurma', () => {
  it('rejeita turma que não é do gestor (404)', async () => {
    configurarDb({ turmas: [ok(null)] });
    await expect(definirTemasDaTurma('p1', 't1', [1])).rejects.toMatchObject({ status: 404 });
  });
  it('rejeita lista inválida (400)', async () => {
    configurarDb({ turmas: [ok({ id: 't1' })] });
    await expect(definirTemasDaTurma('p1', 't1', ['x'])).rejects.toMatchObject({ status: 400 });
  });
  it('substitui as atribuições', async () => {
    const mock = configurarDb({
      turmas: [ok({ id: 't1' })],
      turma_temas: [ok(null), ok(null)],
    });
    await definirTemasDaTurma('p1', 't1', [1, 1, 2]);
    expect(mock.chainsPara('turma_temas')[1].insert).toHaveBeenCalledWith([
      { turma_id: 't1', tema_id: 1 },
      { turma_id: 't1', tema_id: 2 },
    ]);
  });
});
