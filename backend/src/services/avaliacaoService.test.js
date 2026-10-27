import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { proficienciaDoUsuario, agregarCompetencias, certificadoDoTema } = await import(
  './avaliacaoService.js'
);

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

const FASES = [
  { id: 1, tema_id: 1, temas: { id: 1, nome: 'Compliance' } },
  { id: 2, tema_id: 1, temas: { id: 1, nome: 'Compliance' } },
];

describe('proficienciaDoUsuario', () => {
  it('usuário sem progresso é iniciante com score nulo', async () => {
    configurarDb({ fases: [ok(FASES)], progresso_fase: [ok([])], tentativas: [ok([])] });
    const [p] = await proficienciaDoUsuario('u1');
    expect(p).toMatchObject({ tema: 'Compliance', modulos_concluidos: 0, score_medio: null, proficiencia: 'iniciante' });
  });

  it('trilha completa com bom score vira proficiente, usando o melhor score por fase', async () => {
    configurarDb({
      fases: [ok(FASES)],
      progresso_fase: [
        ok([
          { fase_id: 1, concluida: true },
          { fase_id: 2, concluida: true },
        ]),
      ],
      tentativas: [
        ok([
          { fase_id: 1, score: 60 },
          { fase_id: 1, score: 80 },
          { fase_id: 2, score: 80 },
        ]),
      ],
    });
    const [p] = await proficienciaDoUsuario('u1');
    expect(p).toMatchObject({ score_medio: 80, modulos_concluidos: 2, proficiencia: 'proficiente' });
  });
});

describe('agregarCompetencias', () => {
  it('agrega por tag e ordena pelos maiores gaps primeiro', () => {
    const r = agregarCompetencias([
      { correta: true, questoes: { competencias: ['lgpd'] } },
      { correta: false, questoes: { competencias: ['lgpd', 'incidente'] } },
      { correta: false, questoes: { competencias: ['incidente'] } },
      { correta: true, questoes: { competencias: [] } },
    ]);
    expect(r).toEqual([
      { competencia: 'incidente', respondidas: 2, acertos: 0, taxa_acerto: 0 },
      { competencia: 'lgpd', respondidas: 2, acertos: 1, taxa_acerto: 50 },
    ]);
  });
});

describe('certificadoDoTema', () => {
  it('bloqueia quando há módulos pendentes (403)', async () => {
    configurarDb({
      fases: [ok(FASES)],
      progresso_fase: [ok([{ fase_id: 1, concluida: true }])],
      tentativas: [ok([])],
    });
    await expect(certificadoDoTema({ id: 'u1', nome: 'Ana' }, 1)).rejects.toMatchObject({ status: 403 });
  });

  it('tema inexistente é 404', async () => {
    configurarDb({ fases: [ok(FASES)], progresso_fase: [ok([])], tentativas: [ok([])] });
    await expect(certificadoDoTema({ id: 'u1', nome: 'Ana' }, 99)).rejects.toMatchObject({ status: 404 });
  });

  it('emite com nome, tema e score quando completo', async () => {
    configurarDb({
      fases: [ok(FASES)],
      progresso_fase: [ok(FASES.map((f) => ({ fase_id: f.id, concluida: true })))],
      tentativas: [ok([{ fase_id: 1, score: 95 }, { fase_id: 2, score: 91 }])],
    });
    const c = await certificadoDoTema({ id: 'u1', nome: 'Ana' }, '1');
    expect(c).toMatchObject({ nome: 'Ana', tema: 'Compliance', score_medio: 93, proficiencia: 'referencia' });
  });
});
