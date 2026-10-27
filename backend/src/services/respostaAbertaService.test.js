import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));
vi.mock('./quizService.js', () => ({
  buscarTentativa: vi.fn(async () => ({
    id: 't1',
    fase_id: 101,
    iniciada_em: new Date().toISOString(),
    finalizada_em: null,
  })),
  exigirQuestaoNoQuiz: vi.fn(),
}));
vi.mock('./iaService.js', () => ({
  LIMITE_RESPOSTA_ABERTA: 3000,
  NOTA_APROVACAO_ABERTA: 70,
  iaConfigurada: vi.fn(() => true),
  corrigirRespostaAberta: vi.fn(async () => ({
    nota: 82,
    feedback: [{ criterio: 'x', nota: 82, comentario: 'bom' }],
    justificativa: 'ok',
    modelo: 'claude-opus-5-5',
  })),
}));

const { db } = await import('../config/supabase.js');
const ia = await import('./iaService.js');
const { responderAberta, revisarAvaliacao } = await import('./respostaAbertaService.js');
const { validarPayload } = await vi.importActual('./questaoService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

const questao = {
  id: 'q1',
  fase_id: 101,
  enunciado: 'Explique',
  tempo_limite_seg: 180,
  formato: 'resposta_aberta',
  rubrica: { criterios: [{ criterio: 'x', peso: 100 }] },
};

beforeEach(() => vi.clearAllMocks());

describe('responderAberta', () => {
  it('grava a resposta, persiste a avaliação da IA e aprova com nota ≥ 70', async () => {
    const mock = configurarDb({
      questoes: [ok(questao)],
      respostas: [ok(null), ok({ id: 'r1' })],
      avaliacoes_abertas: [ok(null)],
    });
    const r = await responderAberta({ id: 'c1' }, { tentativa_id: 't1', questao_id: 'q1', texto: ' minha resposta ' });

    expect(r).toMatchObject({ correta: true, nota: 82, pendente: false });
    expect(mock.chainsPara('respostas')[1].insert).toHaveBeenCalledWith(
      expect.objectContaining({ correta: true, texto_resposta: 'minha resposta', alternativa_id: null }),
    );
    expect(mock.chainsPara('avaliacoes_abertas')[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({ resposta_id: 'r1', status: 'avaliada', nota_ia: 82 }),
    );
  });

  it('sem IA configurada a resposta fica pendente para o gestor (não trava o quiz)', async () => {
    ia.iaConfigurada.mockReturnValueOnce(false);
    const mock = configurarDb({
      questoes: [ok(questao)],
      respostas: [ok(null), ok({ id: 'r1' })],
      avaliacoes_abertas: [ok(null)],
    });
    const r = await responderAberta({ id: 'c1' }, { tentativa_id: 't1', questao_id: 'q1', texto: 'resposta' });
    expect(r).toMatchObject({ correta: false, nota: null, pendente: true });
    expect(mock.chainsPara('avaliacoes_abertas')[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pendente', nota_ia: null }),
    );
  });

  it('resposta em branco vale 0 sem gastar chamada de IA', async () => {
    configurarDb({
      questoes: [ok(questao)],
      respostas: [ok(null), ok({ id: 'r1' })],
      avaliacoes_abertas: [ok(null)],
    });
    const r = await responderAberta({ id: 'c1' }, { tentativa_id: 't1', questao_id: 'q1', texto: '   ' });
    expect(r).toMatchObject({ nota: 0, correta: false });
    expect(ia.corrigirRespostaAberta).not.toHaveBeenCalled();
  });

  it('rejeita questão que não é aberta', async () => {
    configurarDb({ questoes: [ok({ ...questao, formato: 'padrao' })] });
    await expect(
      responderAberta({ id: 'c1' }, { tentativa_id: 't1', questao_id: 'q1', texto: 'x' }),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe('revisarAvaliacao', () => {
  it('avaliação de outra empresa vira 404', async () => {
    configurarDb({ avaliacoes_abertas: [ok(null)] });
    await expect(revisarAvaliacao({ id: 'g1', empresa_id: 'e1' }, 'r1', { nota: 50 })).rejects.toMatchObject({
      status: 404,
    });
  });

  it('sobrescreve a nota e ajusta respostas.correta', async () => {
    const mock = configurarDb({
      avaliacoes_abertas: [ok({ resposta_id: 'r1' }), ok(null)],
      respostas: [ok(null)],
    });
    await revisarAvaliacao({ id: 'g1', empresa_id: null }, 'r1', { nota: 40 });
    expect(mock.chainsPara('respostas')[0].update).toHaveBeenCalledWith({ correta: false });
  });
});

describe('validarPayload — resposta_aberta', () => {
  const base = { fase_id: 1, enunciado: 'Explique', formato: 'resposta_aberta', tempo_limite_seg: 180 };

  it('exige rubrica com critérios e normaliza os pesos para 100', () => {
    expect(() => validarPayload({ ...base, rubrica: { criterios: [] } })).toThrow(/rubrica/);
    const q = validarPayload({
      ...base,
      rubrica: { criterios: [{ criterio: 'A', peso: 1 }, { criterio: 'B', peso: 3 }] },
    });
    expect(q.rubrica.criterios.map((c) => c.peso)).toEqual([25, 75]);
    expect(q.alternativas).toEqual([]);
  });
});
