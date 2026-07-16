import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok, fail } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const {
  entrarNaTurma,
  minhasTurmas,
  criarTurma,
  turmasDoProfessor,
  exigirTurmaDoProfessor,
  alunosDaTurma,
} = await import('./turmaService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

describe('entrarNaTurma', () => {
  it('rejeita código vazio sem consultar o banco', async () => {
    await expect(entrarNaTurma('user-1', '  ')).rejects.toMatchObject({ status: 400 });
    expect(db.from).not.toHaveBeenCalled();
  });

  it('rejeita turma inexistente', async () => {
    configurarDb({ turmas: [ok(null)] });
    await expect(entrarNaTurma('user-1', 'ABC123')).rejects.toMatchObject({ status: 404 });
  });

  it('busca o código em maiúsculas e sem espaços', async () => {
    const mock = configurarDb({
      turmas: [ok({ id: 't1', nome: 'Turma A' })],
      matriculas: [ok(null)],
    });
    await entrarNaTurma('user-1', '  abc123  ');

    const selectChain = mock.chainsPara('turmas')[0];
    expect(selectChain.eq).toHaveBeenCalledWith('codigo_acesso', 'ABC123');
  });

  it('trata matrícula duplicada (23505) como conflito', async () => {
    configurarDb({
      turmas: [ok({ id: 't1', nome: 'Turma A' })],
      matriculas: [fail({ code: '23505' })],
    });
    await expect(entrarNaTurma('user-1', 'ABC123')).rejects.toMatchObject({ status: 409 });
  });

  it('matricula com sucesso e retorna a turma', async () => {
    configurarDb({
      turmas: [ok({ id: 't1', nome: 'Turma A' })],
      matriculas: [ok(null)],
    });
    const turma = await entrarNaTurma('user-1', 'ABC123');
    expect(turma).toEqual({ id: 't1', nome: 'Turma A' });
  });
});

describe('minhasTurmas', () => {
  it('achata matriculado_em junto com os dados da turma', async () => {
    configurarDb({
      matriculas: [
        ok([
          { matriculado_em: '2026-01-01', turmas: { id: 't1', nome: 'Turma A', codigo_acesso: 'ABC123' } },
        ]),
      ],
    });
    const turmas = await minhasTurmas('user-1');
    expect(turmas).toEqual([
      { id: 't1', nome: 'Turma A', codigo_acesso: 'ABC123', matriculado_em: '2026-01-01' },
    ]);
  });
});

describe('criarTurma', () => {
  it('rejeita nome vazio sem consultar o banco', async () => {
    await expect(criarTurma('prof-1', '  ')).rejects.toMatchObject({ status: 400 });
    expect(db.from).not.toHaveBeenCalled();
  });

  it('cria de primeira quando o código não colide', async () => {
    configurarDb({ turmas: [ok({ id: 't1', codigo_acesso: 'XYZ999' })] });
    const turma = await criarTurma('prof-1', 'Turma A');
    expect(turma.id).toBe('t1');
  });

  it('tenta de novo em caso de colisão de código (23505) e desiste após 5 tentativas', async () => {
    configurarDb({
      turmas: Array.from({ length: 5 }, () => fail({ code: '23505' })),
    });
    await expect(criarTurma('prof-1', 'Turma A')).rejects.toMatchObject({ status: 500 });
  });

  it('propaga erro que não seja de colisão de código', async () => {
    configurarDb({ turmas: [fail({ code: 'outro-erro' })] });
    await expect(criarTurma('prof-1', 'Turma A')).rejects.toBeTruthy();
  });
});

describe('turmasDoProfessor', () => {
  it('extrai total_alunos da contagem de matrículas', async () => {
    configurarDb({
      turmas: [
        ok([
          { id: 't1', nome: 'Turma A', codigo_acesso: 'ABC123', created_at: '2026-01-01', matriculas: [{ count: 5 }] },
          { id: 't2', nome: 'Turma B', codigo_acesso: 'DEF456', created_at: '2026-01-02', matriculas: [] },
        ]),
      ],
    });
    const turmas = await turmasDoProfessor('prof-1');
    expect(turmas[0].total_alunos).toBe(5);
    expect(turmas[1].total_alunos).toBe(0);
    expect(turmas[0]).not.toHaveProperty('matriculas');
  });
});

describe('exigirTurmaDoProfessor', () => {
  it('rejeita turma que não pertence ao professor', async () => {
    configurarDb({ turmas: [ok(null)] });
    await expect(exigirTurmaDoProfessor('prof-1', 't1')).rejects.toMatchObject({ status: 404 });
  });

  it('retorna a turma quando pertence ao professor', async () => {
    configurarDb({ turmas: [ok({ id: 't1', nome: 'Turma A' })] });
    const turma = await exigirTurmaDoProfessor('prof-1', 't1');
    expect(turma.id).toBe('t1');
  });
});

describe('alunosDaTurma', () => {
  it('valida posse da turma antes de listar os alunos', async () => {
    configurarDb({ turmas: [ok(null)] });
    await expect(alunosDaTurma('prof-1', 't1')).rejects.toMatchObject({ status: 404 });
    expect(db.from).not.toHaveBeenCalledWith('desempenho_alunos');
  });

  it('lista alunos ordenados por xp_total (delegado à query)', async () => {
    configurarDb({
      turmas: [ok({ id: 't1', nome: 'Turma A' })],
      desempenho_alunos: [ok([{ user_id: 'u1', xp_total: 100 }])],
    });
    const alunos = await alunosDaTurma('prof-1', 't1');
    expect(alunos).toEqual([{ user_id: 'u1', xp_total: 100 }]);
  });
});
