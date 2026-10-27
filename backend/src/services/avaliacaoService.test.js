import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));
vi.mock('./temaService.js', () => ({
  temasVisiveis: vi.fn(async () => [{ id: 1, nome: 'LGPD e Privacidade' }]),
}));

const { db } = await import('../config/supabase.js');
const { certificado, codigoCertificado, minhasCompetencias, resumoPorTema } =
  await import('./avaliacaoService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

const usuario = { id: 'u1', nome: 'Ana', empresa_id: null };
const competencias = [
  { id: 10, nome: 'Bases legais', tema_id: 1 },
  { id: 11, nome: 'Incidentes', tema_id: 1 },
];

describe('minhasCompetencias', () => {
  it('lista todas as competências dos temas visíveis, mesmo sem respostas', async () => {
    configurarDb({
      competencias: [ok(competencias)],
      desempenho_competencias: [ok([{ user_id: 'u1', competencia_id: 10, total: 5, acertos: 4 }])],
    });
    const linhas = await minhasCompetencias(usuario);
    expect(linhas).toEqual([
      expect.objectContaining({ id: 10, pct: 80, dominada: true, tema: 'LGPD e Privacidade' }),
      expect.objectContaining({ id: 11, total: 0, pct: null, dominada: false }),
    ]);
  });
});

describe('resumoPorTema', () => {
  it('calcula score médio, cobertura e trilha concluída', async () => {
    configurarDb({
      fases: [ok([{ id: 101 }])],
      competencias: [ok(competencias)],
      desempenho_competencias: [
        ok([
          { competencia_id: 10, total: 3, acertos: 3 },
          { competencia_id: 11, total: 2, acertos: 1 },
        ]),
      ],
      progresso_fase: [ok([{ fase_id: 101, concluida: true, concluida_em: '2026-10-01T10:00:00Z' }])],
      tentativas: [ok([{ score: '80.0' }, { score: '90.0' }])],
    });
    const resumo = await resumoPorTema(usuario, { id: 1, nome: 'LGPD' });
    expect(resumo).toMatchObject({
      score_medio: 85,
      cobertura_pct: 50,
      trilha_concluida: true,
      concluido_em: '2026-10-01T10:00:00Z',
      nivel: 'Praticante',
    });
  });
});

describe('certificado', () => {
  it('só emite com a trilha concluída', async () => {
    configurarDb({
      fases: [ok([{ id: 101 }, { id: 102 }])],
      competencias: [ok([])],
      desempenho_competencias: [ok([])],
      progresso_fase: [ok([{ fase_id: 101, concluida: true }])],
      tentativas: [ok([])],
    });
    await expect(certificado(usuario, 1)).rejects.toMatchObject({ status: 403 });
  });

  it('tema fora dos visíveis vira 404', async () => {
    await expect(certificado(usuario, 99)).rejects.toMatchObject({ status: 404 });
  });

  it('código de verificação é estável e curto', () => {
    const a = codigoCertificado('u1', 1, '2026-10-01');
    expect(a).toHaveLength(12);
    expect(codigoCertificado('u1', 1, '2026-10-01')).toBe(a);
    expect(codigoCertificado('u2', 1, '2026-10-01')).not.toBe(a);
  });
});
