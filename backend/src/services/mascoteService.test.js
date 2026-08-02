import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { mascoteDaTurma } = await import('./mascoteService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

const AGORA = new Date('2026-02-10T12:00:00Z'); // terça-feira
const DIA_MS = 24 * 60 * 60 * 1000;

// data que cai i semanas ISO antes de AGORA (mesmo dia da semana, então
// sempre uma semana ISO inteira antes por vez)
function dataDaSemana(i) {
  return new Date(AGORA.getTime() - i * 7 * DIA_MS);
}

const CINCO_MEMBROS = [
  { user_id: 'u1' },
  { user_id: 'u2' },
  { user_id: 'u3' },
  { user_id: 'u4' },
  { user_id: 'u5' },
];

describe('mascoteDaTurma', () => {
  it('rejeita usuário que não é matriculado nem professor da turma (404)', async () => {
    configurarDb({ matriculas: [ok(null)], turmas: [ok(null)] });
    await expect(mascoteDaTurma('estranho', 't1', AGORA)).rejects.toMatchObject({ status: 404 });
  });

  it('permite acesso ao professor dono da turma mesmo sem matrícula', async () => {
    configurarDb({
      matriculas: [ok(null), ok([])],
      turmas: [ok({ id: 't1' })],
    });
    const resultado = await mascoteDaTurma('prof-1', 't1', AGORA);
    expect(resultado).toEqual({ humor: 'neutro', percentual_ativos: 0, forma: 'filhote', semanas_consecutivas: 0 });
  });

  it('turma sem membros: neutro/filhote/0%, sem divisão por zero', async () => {
    configurarDb({
      matriculas: [ok({ turma_id: 't1' }), ok([])],
    });
    const resultado = await mascoteDaTurma('aluno-1', 't1', AGORA);
    expect(resultado).toEqual({ humor: 'neutro', percentual_ativos: 0, forma: 'filhote', semanas_consecutivas: 0 });
    expect(db.from).not.toHaveBeenCalledWith('tentativas');
  });

  describe('humor da semana atual (percentual de membros distintos ativos)', () => {
    it('radiante quando >= 80% dos membros estão ativos', async () => {
      configurarDb({
        matriculas: [ok({ turma_id: 't1' }), ok(CINCO_MEMBROS)],
        tentativas: [
          ok([
            { user_id: 'u1', finalizada_em: dataDaSemana(0).toISOString() },
            { user_id: 'u2', finalizada_em: dataDaSemana(0).toISOString() },
            { user_id: 'u3', finalizada_em: dataDaSemana(0).toISOString() },
            { user_id: 'u4', finalizada_em: dataDaSemana(0).toISOString() },
          ]),
        ],
      });
      const resultado = await mascoteDaTurma('aluno-1', 't1', AGORA);
      expect(resultado.percentual_ativos).toBe(80);
      expect(resultado.humor).toBe('radiante');
    });

    it('feliz quando >= 50% e < 80% dos membros estão ativos', async () => {
      configurarDb({
        matriculas: [ok({ turma_id: 't1' }), ok(CINCO_MEMBROS)],
        tentativas: [
          ok([
            { user_id: 'u1', finalizada_em: dataDaSemana(0).toISOString() },
            { user_id: 'u2', finalizada_em: dataDaSemana(0).toISOString() },
            { user_id: 'u3', finalizada_em: dataDaSemana(0).toISOString() },
          ]),
        ],
      });
      const resultado = await mascoteDaTurma('aluno-1', 't1', AGORA);
      expect(resultado.percentual_ativos).toBe(60);
      expect(resultado.humor).toBe('feliz');
    });

    it('neutro quando >= 20% e < 50% dos membros estão ativos', async () => {
      configurarDb({
        matriculas: [ok({ turma_id: 't1' }), ok(CINCO_MEMBROS)],
        tentativas: [ok([{ user_id: 'u1', finalizada_em: dataDaSemana(0).toISOString() }])],
      });
      const resultado = await mascoteDaTurma('aluno-1', 't1', AGORA);
      expect(resultado.percentual_ativos).toBe(20);
      expect(resultado.humor).toBe('neutro');
    });

    it('dormindo quando < 20% dos membros estão ativos (inclui semana sem nenhuma tentativa)', async () => {
      configurarDb({
        matriculas: [ok({ turma_id: 't1' }), ok(CINCO_MEMBROS)],
        tentativas: [ok([])],
      });
      const resultado = await mascoteDaTurma('aluno-1', 't1', AGORA);
      expect(resultado.percentual_ativos).toBe(0);
      expect(resultado.humor).toBe('dormindo');
    });

    it('conta usuários distintos, não linhas (várias tentativas do mesmo usuário na semana contam uma vez)', async () => {
      configurarDb({
        matriculas: [ok({ turma_id: 't1' }), ok(CINCO_MEMBROS)],
        tentativas: [
          ok([
            { user_id: 'u1', finalizada_em: dataDaSemana(0).toISOString() },
            { user_id: 'u1', finalizada_em: dataDaSemana(0).toISOString() },
            { user_id: 'u1', finalizada_em: dataDaSemana(0).toISOString() },
          ]),
        ],
      });
      const resultado = await mascoteDaTurma('aluno-1', 't1', AGORA);
      expect(resultado.percentual_ativos).toBe(20); // 1 de 5, não 3 de 5
    });
  });

  describe('semanas_consecutivas e forma (evolução)', () => {
    it('conta semanas anteriores não-dormentes e para no primeiro buraco', async () => {
      configurarDb({
        matriculas: [ok({ turma_id: 't1' }), ok(CINCO_MEMBROS)],
        tentativas: [
          ok([
            // semana -1: 60% (3 de 5) — ativa
            { user_id: 'u1', finalizada_em: dataDaSemana(1).toISOString() },
            { user_id: 'u2', finalizada_em: dataDaSemana(1).toISOString() },
            { user_id: 'u3', finalizada_em: dataDaSemana(1).toISOString() },
            // semana -2: 20% (1 de 5) — ainda conta (limite inclusive)
            { user_id: 'u1', finalizada_em: dataDaSemana(2).toISOString() },
            // semana -3: nenhuma tentativa — dormente, quebra o streak
          ]),
        ],
      });
      const resultado = await mascoteDaTurma('aluno-1', 't1', AGORA);
      expect(resultado.semanas_consecutivas).toBe(2);
      expect(resultado.forma).toBe('filhote');
    });

    it('forma "adulto" a partir de 4 semanas consecutivas (limite inclusive)', async () => {
      const linhas = [1, 2, 3, 4].map((i) => ({ user_id: 'u1', finalizada_em: dataDaSemana(i).toISOString() }));
      // semana -5 fica sem registro -> dormente, encerra o streak em 4
      configurarDb({
        matriculas: [ok({ turma_id: 't1' }), ok(CINCO_MEMBROS)],
        tentativas: [ok(linhas)],
      });
      const resultado = await mascoteDaTurma('aluno-1', 't1', AGORA);
      expect(resultado.semanas_consecutivas).toBe(4);
      expect(resultado.forma).toBe('adulto');
    });

    it('3 semanas consecutivas ainda é "filhote" (abaixo do limite de 4)', async () => {
      const linhas = [1, 2, 3].map((i) => ({ user_id: 'u1', finalizada_em: dataDaSemana(i).toISOString() }));
      configurarDb({
        matriculas: [ok({ turma_id: 't1' }), ok(CINCO_MEMBROS)],
        tentativas: [ok(linhas)],
      });
      const resultado = await mascoteDaTurma('aluno-1', 't1', AGORA);
      expect(resultado.semanas_consecutivas).toBe(3);
      expect(resultado.forma).toBe('filhote');
    });

    it('forma "lendario" a partir de 12 semanas consecutivas (limite inclusive)', async () => {
      const linhas = Array.from({ length: 12 }, (_, idx) => ({
        user_id: 'u1',
        finalizada_em: dataDaSemana(idx + 1).toISOString(),
      }));
      // semana -13 fica sem registro -> dormente, encerra o streak em 12
      configurarDb({
        matriculas: [ok({ turma_id: 't1' }), ok(CINCO_MEMBROS)],
        tentativas: [ok(linhas)],
      });
      const resultado = await mascoteDaTurma('aluno-1', 't1', AGORA);
      expect(resultado.semanas_consecutivas).toBe(12);
      expect(resultado.forma).toBe('lendario');
    });

    it('a semana atual (em andamento) nunca entra no cálculo do streak', async () => {
      configurarDb({
        matriculas: [ok({ turma_id: 't1' }), ok(CINCO_MEMBROS)],
        tentativas: [
          ok([
            // só a semana atual tem atividade — não deve contar como streak
            { user_id: 'u1', finalizada_em: dataDaSemana(0).toISOString() },
          ]),
        ],
      });
      const resultado = await mascoteDaTurma('aluno-1', 't1', AGORA);
      expect(resultado.semanas_consecutivas).toBe(0);
      expect(resultado.forma).toBe('filhote');
    });
  });
});
