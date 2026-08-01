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

// Segunda-feira -> início da semana ISO é a própria data às 00:00 UTC.
const AGORA = new Date('2026-01-12T15:00:00Z');

describe('mascoteDaTurma', () => {
  it('nega acesso a quem não é matriculado nem professor da turma', async () => {
    configurarDb({
      matriculas: [ok(null)], // não matriculado
      turmas: [ok(null)], // nem professor dono
    });

    await expect(mascoteDaTurma('intruso', 't1', AGORA)).rejects.toMatchObject({ status: 404 });
  });

  it('permite acesso ao professor dono mesmo sem matrícula', async () => {
    const mock = configurarDb({
      matriculas: [
        ok(null), // acesso: não matriculado
        ok([]), // membrosDaTurma: turma vazia
      ],
      turmas: [ok({ id: 't1' })], // acesso: é o professor dono
    });

    const mascote = await mascoteDaTurma('prof1', 't1', AGORA);

    expect(mascote).toEqual({
      humor: 'dormindo',
      forma: 'filhote',
      percentual_ativos: 0,
      semanas_consecutivas: 0,
    });
    expect(mock.chainsPara('tentativas')).toHaveLength(0); // turma vazia nunca consulta tentativas
  });

  it('turma 100% ativa na semana atual: humor radiante', async () => {
    configurarDb({
      matriculas: [
        ok({ turma_id: 't1' }), // acesso: matriculado
        ok([{ user_id: 'u1' }, { user_id: 'u2' }]), // membros
      ],
      tentativas: [
        ok([{ user_id: 'u1' }, { user_id: 'u2' }]), // semana atual: 2/2 ativos
        ok([]), // semana -1: ninguém ativo, quebra a sequência
      ],
    });

    const mascote = await mascoteDaTurma('u1', 't1', AGORA);

    expect(mascote.humor).toBe('radiante');
    expect(mascote.percentual_ativos).toBe(1);
    expect(mascote.semanas_consecutivas).toBe(1);
    expect(mascote.forma).toBe('filhote');
  });

  it('sequência de semanas ativas consecutivas eleva a forma para adulto', async () => {
    configurarDb({
      matriculas: [ok({ turma_id: 't1' }), ok([{ user_id: 'u1' }, { user_id: 'u2' }])],
      tentativas: [
        ok([{ user_id: 'u1' }]), // semana atual: 50% (limiar)
        ok([{ user_id: 'u1' }, { user_id: 'u2' }]), // semana -1: 100%
        ok([{ user_id: 'u1' }]), // semana -2: 50%
        ok([]), // semana -3: 0%, quebra
      ],
    });

    const mascote = await mascoteDaTurma('u1', 't1', AGORA);

    expect(mascote.humor).toBe('feliz'); // 50% na semana atual
    expect(mascote.semanas_consecutivas).toBe(3);
    expect(mascote.forma).toBe('adulto');
  });

  it('turma pouco ativa: humor dormindo', async () => {
    configurarDb({
      matriculas: [ok({ turma_id: 't1' }), ok([{ user_id: 'u1' }, { user_id: 'u2' }])],
      tentativas: [ok([])], // 0% ativos na semana atual, sequência já quebra no i=0
    });

    const mascote = await mascoteDaTurma('u1', 't1', AGORA);

    expect(mascote.humor).toBe('dormindo');
    expect(mascote.semanas_consecutivas).toBe(0);
  });
});
