import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok, fail } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));
vi.mock('./badgeService.js', () => ({ verificarBadges: vi.fn().mockResolvedValue([]) }));

const { db } = await import('../config/supabase.js');
const { iniciarQuiz, responderQuestao, finalizarQuiz } = await import('./quizService.js');
const { HttpError } = await import('../utils/httpError.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.useRealTimers());

describe('iniciarQuiz', () => {
  it('bloqueia a fase se o requisito anterior não foi concluído', async () => {
    configurarDb({
      fases: [ok({ id: 2, fase_requisito_id: 1 })],
      progresso_fase: [ok({ concluida: false })],
    });

    await expect(iniciarQuiz('user-1', 2)).rejects.toMatchObject({
      status: 403,
    });
  });

  it('rejeita fase sem questões ativas', async () => {
    configurarDb({
      fases: [ok({ id: 1, fase_requisito_id: null })],
      tentativas: [ok(null)], // abandonarTentativasAbertas (update, sem terminal)
      questoes: [ok([])],
    });

    await expect(iniciarQuiz('user-1', 1)).rejects.toMatchObject({ status: 404 });
  });

  it('sorteia até QUESTOES_POR_QUIZ questões e não acrescenta campos de gabarito', async () => {
    // A query real usa `.select('id, ..., alternativas ( id, letra, texto )')` —
    // o Postgrest já restringe as colunas antes de chegar aqui. O stub simula
    // exatamente essa projeção (sem `correta`/`explicacao`).
    const questoesBrutas = Array.from({ length: 15 }, (_, i) => ({
      id: `q${i}`,
      enunciado: `Questão ${i}`,
      tempo_limite_seg: 30,
      alternativas: [
        { id: 'a1', letra: 'A', texto: 'x' },
        { id: 'a2', letra: 'B', texto: 'y' },
      ],
    }));

    configurarDb({
      fases: [ok({ id: 1, fase_requisito_id: null, nome: 'Listas' })],
      tentativas: [ok(null), ok({ id: 'tent-1' })],
      questoes: [ok(questoesBrutas)],
    });

    const resultado = await iniciarQuiz('user-1', 1);

    expect(resultado.questoes).toHaveLength(10); // QUESTOES_POR_QUIZ
    for (const q of resultado.questoes) {
      for (const alt of q.alternativas) {
        expect(Object.keys(alt).sort()).toEqual(['id', 'letra', 'texto']);
      }
    }
  });

  it('funciona com menos questões que QUESTOES_POR_QUIZ e preserva o formato (ex.: fase bônus com 5 questões)', async () => {
    const questoesBrutas = Array.from({ length: 5 }, (_, i) => ({
      id: `b${i}`,
      enunciado: `Batalha ${i}`,
      tempo_limite_seg: 15,
      formato: 'batalha_complexidade',
      alternativas: [
        { id: 'a1', letra: 'A', texto: 'O(n)' },
        { id: 'a2', letra: 'B', texto: 'O(log n)' },
      ],
    }));

    configurarDb({
      fases: [ok({ id: 6, fase_requisito_id: null, nome: 'Batalha de Complexidade' })],
      tentativas: [ok(null), ok({ id: 'tent-2' })],
      questoes: [ok(questoesBrutas)],
    });

    const resultado = await iniciarQuiz('user-1', 6);

    expect(resultado.questoes).toHaveLength(5);
    expect(resultado.questoes.every((q) => q.formato === 'batalha_complexidade')).toBe(true);
  });
});

describe('responderQuestao', () => {
  const questaoBase = {
    id: 'q1',
    fase_id: 1,
    tempo_limite_seg: 30,
    alternativas: [
      { id: 'a-certa', letra: 'A', correta: true, explicacao: 'Porque sim.' },
      { id: 'a-errada', letra: 'B', correta: false, explicacao: 'Porque não.' },
    ],
  };

  it('rejeita responder uma tentativa já finalizada', async () => {
    configurarDb({
      tentativas: [ok({ id: 't1', user_id: 'user-1', finalizada_em: '2026-01-01T00:00:00Z' })],
    });

    await expect(
      responderQuestao('user-1', { tentativa_id: 't1', questao_id: 'q1' })
    ).rejects.toMatchObject({ status: 409 });
  });

  it('marca como INCORRETA quando o tempo estourou, mesmo com a alternativa certa', async () => {
    const inicio = new Date('2026-01-01T10:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(new Date(inicio.getTime() + 40_000)); // 40s depois (limite 30s + 5s tolerância)

    const mock = configurarDb({
      tentativas: [
        ok({ id: 't1', user_id: 'user-1', finalizada_em: null, fase_id: 1, iniciada_em: inicio.toISOString() }),
      ],
      questoes: [ok(questaoBase)],
      poderes_usados: [ok(null)],
      respostas: [ok(null), ok(null)], // sem resposta anterior; depois o insert
      dicas_usadas: [ok(null)],
    });

    const fb = await responderQuestao('user-1', {
      tentativa_id: 't1',
      questao_id: 'q1',
      alternativa_id: 'a-certa',
    });

    expect(fb.tempo_esgotado).toBe(true);
    expect(fb.correta).toBe(false);

    const insertChain = mock.chainsPara('respostas')[1];
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ alternativa_id: null, correta: false })
    );
  });

  it('corrige certo dentro do tempo', async () => {
    const inicio = new Date('2026-01-01T10:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(new Date(inicio.getTime() + 5_000));

    configurarDb({
      tentativas: [
        ok({ id: 't1', user_id: 'user-1', finalizada_em: null, fase_id: 1, iniciada_em: inicio.toISOString() }),
      ],
      questoes: [ok(questaoBase)],
      poderes_usados: [ok(null)],
      respostas: [ok(null), ok(null)],
      dicas_usadas: [ok(null)],
    });

    const fb = await responderQuestao('user-1', {
      tentativa_id: 't1',
      questao_id: 'q1',
      alternativa_id: 'a-certa',
    });

    expect(fb.tempo_esgotado).toBe(false);
    expect(fb.correta).toBe(true);
    expect(fb.alternativa_correta).toEqual({ id: 'a-certa', letra: 'A' });
  });

  it('rejeita alternativa que não pertence à questão', async () => {
    const inicio = new Date();
    configurarDb({
      tentativas: [
        ok({ id: 't1', user_id: 'user-1', finalizada_em: null, fase_id: 1, iniciada_em: inicio.toISOString() }),
      ],
      questoes: [ok(questaoBase)],
      poderes_usados: [ok(null)],
      respostas: [ok(null)],
    });

    await expect(
      responderQuestao('user-1', { tentativa_id: 't1', questao_id: 'q1', alternativa_id: 'nao-existe' })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('trata resposta duplicada (constraint 23505) como conflito', async () => {
    const inicio = new Date();
    configurarDb({
      tentativas: [
        ok({ id: 't1', user_id: 'user-1', finalizada_em: null, fase_id: 1, iniciada_em: inicio.toISOString() }),
      ],
      questoes: [ok(questaoBase)],
      poderes_usados: [ok(null)],
      respostas: [ok(null), fail({ code: '23505' })],
      dicas_usadas: [ok(null)],
    });

    await expect(
      responderQuestao('user-1', { tentativa_id: 't1', questao_id: 'q1', alternativa_id: 'a-certa' })
    ).rejects.toMatchObject({ status: 409 });
  });
});

describe('finalizarQuiz — regra anti-farming de XP', () => {
  it('numa primeira tentativa, todo o XP bruto vira XP ganho', async () => {
    configurarDb({
      tentativas: [
        ok({
          id: 't1',
          user_id: 'user-1',
          finalizada_em: null,
          fase_id: 1,
          quiz_custom_id: null,
          total_questoes: 2,
        }),
        ok(null), // update tentativas
      ],
      respostas: [
        ok([
          { correta: true, usou_dica: false, tempo_resposta_ms: 1000, questoes: { xp_valor: 10 } },
          { correta: true, usou_dica: false, tempo_resposta_ms: 2000, questoes: { xp_valor: 15 } },
        ]),
        ok([]), // melhorXpBrutoAnterior: nenhuma tentativa anterior
      ],
      progresso_fase: [ok(null), ok({ concluida: true })],
      fases: [ok({ ordem: 1, nome: 'Listas' })],
      profiles: [ok(null)],
      eventos: [ok([])],
    });

    const usuario = { id: 'user-1', xp_total: 0, nivel: 1 };
    const res = await finalizarQuiz(usuario, 't1');

    expect(res.xp_bruto).toBe(25);
    expect(res.xp_ganho).toBe(25);
    expect(res.aprovada).toBe(true); // 2/2 >= 70%
    expect(res.evento).toBeNull();
  });

  it('com evento ativo na fase, multiplica o XP bruto antes da regra anti-farming', async () => {
    configurarDb({
      tentativas: [
        ok({
          id: 't3',
          user_id: 'user-1',
          finalizada_em: null,
          fase_id: 1,
          quiz_custom_id: null,
          total_questoes: 2,
        }),
        ok(null),
      ],
      respostas: [
        ok([{ correta: true, usou_dica: false, tempo_resposta_ms: 1000, questoes: { xp_valor: 10 } }]),
        ok([]),
      ],
      progresso_fase: [ok(null), ok({ concluida: false })],
      fases: [ok({ ordem: 1, nome: 'Listas' })],
      profiles: [ok(null)],
      eventos: [ok([{ id: 1, nome: 'Semana das Listas', fase_id: 1, multiplicador_xp: 2 }])],
    });

    const usuario = { id: 'user-1', xp_total: 0, nivel: 1 };
    const res = await finalizarQuiz(usuario, 't3');

    expect(res.xp_bruto).toBe(20); // 10 * 2
    expect(res.evento).toEqual({ nome: 'Semana das Listas', multiplicador_xp: 2 });
  });

  it('repetir a fase só rende XP que EXCEDE o recorde anterior', async () => {
    configurarDb({
      tentativas: [
        ok({
          id: 't2',
          user_id: 'user-1',
          finalizada_em: null,
          fase_id: 1,
          quiz_custom_id: null,
          total_questoes: 2,
        }),
        ok(null),
      ],
      respostas: [
        ok([{ correta: true, usou_dica: false, tempo_resposta_ms: 1000, questoes: { xp_valor: 10 } }]),
        ok([
          {
            tentativa_id: 't1-anterior',
            usou_dica: false,
            questoes: { xp_valor: 25 },
          },
        ]),
      ],
      progresso_fase: [ok({ concluida: true }), ok({ concluida: true })],
      fases: [ok({ ordem: 1, nome: 'Listas' })],
      profiles: [ok(null)],
      eventos: [ok([])],
    });

    const usuario = { id: 'user-1', xp_total: 25, nivel: 1 };
    const res = await finalizarQuiz(usuario, 't2');

    expect(res.xp_bruto).toBe(10);
    expect(res.xp_ganho).toBe(0); // 10 não supera o recorde de 25
  });

  it('rejeita finalizar uma tentativa já finalizada', async () => {
    configurarDb({
      tentativas: [ok({ id: 't1', user_id: 'user-1', finalizada_em: '2026-01-01T00:00:00Z' })],
    });

    const usuario = { id: 'user-1', xp_total: 0, nivel: 1 };
    await expect(finalizarQuiz(usuario, 't1')).rejects.toMatchObject({ status: 409 });
  });
});
