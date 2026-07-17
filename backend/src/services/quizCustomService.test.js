import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';
import { HttpError } from '../utils/httpError.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { criarQuiz } = await import('./quizCustomService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

const DADOS_BASE = {
  titulo: 'Desafio relâmpago',
  questao_ids: ['q1', 'q2'],
};

describe('quizCustomService.criarQuiz — validação', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejeita título vazio sem consultar o banco', async () => {
    await expect(criarQuiz('user-1', { ...DADOS_BASE, titulo: '  ' })).rejects.toThrow(HttpError);
    expect(db.from).not.toHaveBeenCalled();
  });

  it('rejeita tempo_limite_seg menor que 10', async () => {
    await expect(
      criarQuiz('user-1', { ...DADOS_BASE, tempo_limite_seg: 5 })
    ).rejects.toThrow(/tempo_limite_seg/);
  });

  it('rejeita lista de questões vazia', async () => {
    await expect(criarQuiz('user-1', { ...DADOS_BASE, questao_ids: [] })).rejects.toThrow(
      /Selecione de 1 a/
    );
  });

  it('rejeita mais de 20 questões', async () => {
    const ids = Array.from({ length: 21 }, (_, i) => `q${i}`);
    await expect(criarQuiz('user-1', { ...DADOS_BASE, questao_ids: ids })).rejects.toThrow(
      /Selecione de 1 a 20/
    );
  });

  it('rejeita questões repetidas', async () => {
    await expect(
      criarQuiz('user-1', { ...DADOS_BASE, questao_ids: ['q1', 'q1'] })
    ).rejects.toThrow(/repetidas/);
  });

  it('rejeita se alguma questão não existe ou está desativada', async () => {
    configurarDb({ questoes: [ok([{ id: 'q1' }])] }); // só 1 das 2 veio de volta
    await expect(criarQuiz('user-1', DADOS_BASE)).rejects.toThrow(/não existe ou está desativada/);
  });

  it('cria o quiz quando tudo é válido', async () => {
    configurarDb({
      questoes: [ok([{ id: 'q1' }, { id: 'q2' }])],
      quizzes_custom: [ok({ id: 'quiz-1', criador_id: 'user-1' })],
      quiz_custom_questoes: [ok(null)],
    });

    const criado = await criarQuiz('user-1', DADOS_BASE);
    expect(criado.id).toBe('quiz-1');
    expect(criado.total_questoes).toBe(2);
  });

  it('rejeita vidas menor que 1', async () => {
    await expect(criarQuiz('user-1', { ...DADOS_BASE, vidas: 0 })).rejects.toThrow(/vidas/);
  });

  it('rejeita vidas não inteiro', async () => {
    await expect(criarQuiz('user-1', { ...DADOS_BASE, vidas: 2.5 })).rejects.toThrow(/vidas/);
  });

  it('cria "boss fight" com vidas definidas e grava no insert', async () => {
    const mock = configurarDb({
      questoes: [ok([{ id: 'q1' }, { id: 'q2' }])],
      quizzes_custom: [ok({ id: 'quiz-1', criador_id: 'user-1' })],
      quiz_custom_questoes: [ok(null)],
    });

    await criarQuiz('user-1', { ...DADOS_BASE, vidas: 3 });

    const insertChain = mock.chainsPara('quizzes_custom')[0];
    expect(insertChain.insert).toHaveBeenCalledWith(expect.objectContaining({ vidas: 3 }));
  });

  it('vidas fica null (sem limite) quando não informado', async () => {
    const mock = configurarDb({
      questoes: [ok([{ id: 'q1' }, { id: 'q2' }])],
      quizzes_custom: [ok({ id: 'quiz-1', criador_id: 'user-1' })],
      quiz_custom_questoes: [ok(null)],
    });

    await criarQuiz('user-1', DADOS_BASE);

    const insertChain = mock.chainsPara('quizzes_custom')[0];
    expect(insertChain.insert).toHaveBeenCalledWith(expect.objectContaining({ vidas: null }));
  });

  it('desfaz a criação (compensação) se a inserção das questões falhar', async () => {
    configurarDb({
      questoes: [ok([{ id: 'q1' }, { id: 'q2' }])],
      quizzes_custom: [ok({ id: 'quiz-1', criador_id: 'user-1' }), ok(null)], // insert + delete de compensação
      quiz_custom_questoes: [{ data: null, error: new Error('falhou') }],
    });

    await expect(criarQuiz('user-1', DADOS_BASE)).rejects.toThrow('falhou');
    expect(db.from).toHaveBeenCalledWith('quizzes_custom');
  });
});
