import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const {
  filtrarTemasVisiveis,
  temasVisiveis,
  exigirTemaEditavel,
  criarModulo,
  definirTemasDaTurma,
} = await import('./temaService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

const CATALOGO_A = { id: 1, empresa_id: null };
const CATALOGO_B = { id: 2, empresa_id: null };
const PROPRIO_E1 = { id: 3, empresa_id: 'e1' };
const PROPRIO_E2 = { id: 4, empresa_id: 'e2' };
const TODOS = [CATALOGO_A, CATALOGO_B, PROPRIO_E1, PROPRIO_E2];

describe('filtrarTemasVisiveis', () => {
  it('sem empresa (espaço legado): todo o catálogo e nenhum tema próprio', () => {
    const ids = filtrarTemasVisiveis({ temas: TODOS, empresaId: null, ativadosCatalogo: [] }).map(
      (t) => t.id,
    );
    expect(ids).toEqual([1, 2]);
  });

  it('com empresa: só os temas do catálogo ativados + os próprios dela', () => {
    const ids = filtrarTemasVisiveis({ temas: TODOS, empresaId: 'e1', ativadosCatalogo: [2] }).map(
      (t) => t.id,
    );
    expect(ids).toEqual([2, 3]);
  });

  it('nunca mostra tema próprio de outra empresa, mesmo se "ativado"', () => {
    const ids = filtrarTemasVisiveis({ temas: TODOS, empresaId: 'e1', ativadosCatalogo: [4] }).map(
      (t) => t.id,
    );
    expect(ids).toEqual([3]);
  });

  it('trilha da equipe restringe aos temas atribuídos', () => {
    const ids = filtrarTemasVisiveis({
      temas: TODOS,
      empresaId: 'e1',
      ativadosCatalogo: [1, 2],
      atribuidosEquipes: [1],
    }).map((t) => t.id);
    expect(ids).toEqual([1]);
  });
});

describe('temasVisiveis', () => {
  it('gestor não sofre a restrição de equipe (não consulta matrículas)', async () => {
    const mock = configurarDb({ temas: [ok(TODOS)], empresa_temas: [ok([{ tema_id: 1 }])] });
    const temas = await temasVisiveis({ id: 'g1', role: 'professor', empresa_id: 'e1' });
    expect(temas.map((t) => t.id)).toEqual([1, 3]);
    expect(mock.chainsPara('matriculas')).toHaveLength(0);
  });

  it('colaborador em equipe com trilha vê só a trilha', async () => {
    configurarDb({
      temas: [ok(TODOS)],
      empresa_temas: [ok([{ tema_id: 1 }, { tema_id: 2 }])],
      matriculas: [ok([{ turma_id: 't1' }])],
      turma_temas: [ok([{ tema_id: 2 }])],
    });
    const temas = await temasVisiveis({ id: 'c1', role: 'aluno', empresa_id: 'e1' });
    expect(temas.map((t) => t.id)).toEqual([2]);
  });
});

describe('exigirTemaEditavel', () => {
  it('gestor de empresa não edita tema do catálogo', async () => {
    configurarDb({ temas: [ok(CATALOGO_A)] });
    await expect(exigirTemaEditavel({ empresa_id: 'e1' }, 1)).rejects.toMatchObject({ status: 404 });
  });

  it('gestor legado edita o catálogo', async () => {
    configurarDb({ temas: [ok(CATALOGO_A)] });
    await expect(exigirTemaEditavel({ empresa_id: null }, 1)).resolves.toEqual(CATALOGO_A);
  });

  it('gestor não edita tema de outra empresa', async () => {
    configurarDb({ temas: [ok(PROPRIO_E2)] });
    await expect(exigirTemaEditavel({ empresa_id: 'e1' }, 4)).rejects.toMatchObject({ status: 404 });
  });
});

describe('criarModulo', () => {
  it('usa a próxima ordem global e encadeia no último módulo do tema', async () => {
    const mock = configurarDb({
      temas: [ok(PROPRIO_E1)],
      fases: [ok({ ordem: 301 }), ok({ id: 77 }), ok({ id: 78 })],
    });
    await criarModulo({ id: 'g1', empresa_id: 'e1' }, 3, { nome: ' Módulo novo ' });
    const insert = mock.chainsPara('fases')[2].insert;
    expect(insert).toHaveBeenCalledWith({
      nome: 'Módulo novo',
      descricao: null,
      ordem: 302,
      fase_requisito_id: 77,
      tema_id: 3,
    });
  });
});

describe('definirTemasDaTurma', () => {
  it('rejeita tema que não está ativo na empresa do gestor', async () => {
    configurarDb({
      turmas: [ok({ id: 't1' })],
      temas: [ok(TODOS)],
      empresa_temas: [ok([{ tema_id: 1 }])],
    });
    await expect(
      definirTemasDaTurma({ id: 'g1', role: 'professor', empresa_id: 'e1' }, 't1', [4]),
    ).rejects.toMatchObject({ status: 400 });
  });
});
