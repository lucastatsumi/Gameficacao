import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { calcularNota, responderAberta, revisarNota } = await import('./abertaService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

const RUBRICA = [
  { criterio: 'Identifica o risco', peso: 2 },
  { criterio: 'Propõe ação', peso: 1 },
];

const avaliacaoIa = (a, b) => ({
  criterios: [
    { criterio: 'Identifica o risco', pontos: a, feedback: 'ok' },
    { criterio: 'Propõe ação', pontos: b, feedback: 'ok' },
  ],
  feedback_geral: 'Bom trabalho',
});

function mockIa(objeto) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      content: [{ type: 'text', text: '```json\n' + JSON.stringify(objeto) + '\n```' }],
      usage: {},
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ANTHROPIC_API_KEY = 'k';
});
afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
});

describe('calcularNota', () => {
  it('média ponderada pelos pesos da rubrica, calculada no servidor', () => {
    // (100*2 + 40*1) / 3 = 80
    expect(calcularNota(RUBRICA, avaliacaoIa(100, 40)).nota).toBe(80);
  });
  it('limita pontos fora de 0–100', () => {
    expect(calcularNota(RUBRICA, avaliacaoIa(500, -20)).nota).toBe(67);
  });
  it('devolve null se faltar critério ou vier lixo', () => {
    expect(calcularNota(RUBRICA, { criterios: [avaliacaoIa(1, 1).criterios[0]] })).toBeNull();
    expect(calcularNota(RUBRICA, { criterios: 'x' })).toBeNull();
    expect(calcularNota(RUBRICA, null)).toBeNull();
  });
});

describe('responderAberta', () => {
  const tentativa = { id: 't1', user_id: 'u1', fase_id: 1, iniciada_em: new Date().toISOString() };
  const questao = {
    id: 'q1',
    fase_id: 1,
    enunciado: 'Descreva o que fazer',
    tempo_limite_seg: 120,
    formato: 'resposta_aberta',
    rubrica: RUBRICA,
  };
  const dados = { tentativa_id: 't1', questao_id: 'q1', texto: 'Eu reportaria ao time de segurança' };

  function filas(extra = {}) {
    return {
      tentativas: [ok(tentativa)],
      questoes: [ok(questao)],
      respostas: [ok(null), ok(null), ok(null)], // existente, última, insert
      ...extra,
    };
  }

  it('corrige, persiste uma vez e aprova com nota >= 70', async () => {
    mockIa(avaliacaoIa(90, 70));
    const mock = configurarDb(filas());
    const r = await responderAberta('u1', dados);
    expect(r).toMatchObject({ correta: true, nota: 83, tempo_esgotado: false });
    const gravado = mock.chainsPara('respostas')[2].insert.mock.calls[0][0];
    expect(gravado).toMatchObject({ nota: 83, nota_ia: 83, correta: true, alternativa_id: null });
    expect(gravado.texto_resposta).toBe(dados.texto);
  });

  it('nota baixa reprova', async () => {
    mockIa(avaliacaoIa(20, 20));
    configurarDb(filas());
    expect((await responderAberta('u1', dados)).correta).toBe(false);
  });

  it('409 sem chamar a IA se já respondeu', async () => {
    global.fetch = vi.fn();
    configurarDb(filas({ respostas: [ok({ id: 'r1' })] }));
    await expect(responderAberta('u1', dados)).rejects.toMatchObject({ status: 409 });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('texto vazio dá nota 0 sem chamar a IA', async () => {
    global.fetch = vi.fn();
    configurarDb(filas());
    const r = await responderAberta('u1', { ...dados, texto: '   ' });
    expect(r).toMatchObject({ nota: 0, correta: false });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('502 quando a IA devolve avaliação incompleta (nada é gravado)', async () => {
    mockIa({ criterios: [] });
    const mock = configurarDb(filas());
    await expect(responderAberta('u1', dados)).rejects.toMatchObject({ status: 502 });
    expect(mock.chainsPara('respostas')).toHaveLength(2);
  });

  it('rejeita questão de outro formato e texto longo demais', async () => {
    configurarDb({ tentativas: [ok(tentativa)], questoes: [ok({ ...questao, formato: 'padrao' })] });
    await expect(responderAberta('u1', dados)).rejects.toMatchObject({ status: 400 });
    await expect(
      responderAberta('u1', { ...dados, texto: 'x'.repeat(2001) })
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe('revisarNota', () => {
  it('valida a faixa (400) e 404 se não for resposta aberta', async () => {
    await expect(revisarNota('g', 'r1', 101)).rejects.toMatchObject({ status: 400 });
    configurarDb({ respostas: [ok([])] });
    await expect(revisarNota('g', 'r1', 50)).rejects.toMatchObject({ status: 404 });
  });
  it('sobrescreve nota/correta e registra o revisor, preservando nota_ia', async () => {
    const mock = configurarDb({ respostas: [ok([{ id: 'r1' }])] });
    await revisarNota('g', 'r1', 90);
    const campos = mock.chainsPara('respostas')[0].update.mock.calls[0][0];
    expect(campos).toMatchObject({ nota: 90, correta: true, revisada_por: 'g' });
    expect(campos).not.toHaveProperty('nota_ia');
  });
});
