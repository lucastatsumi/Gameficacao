import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { extrairJson, gerarRascunhos, aprovarRascunho, descartarRascunho } = await import(
  './iaService.js'
);

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

const alt = (letra, correta) => ({ letra, texto: `Texto ${letra}`, correta, explicacao: `Porque ${letra}` });
const QUESTAO_OK = {
  enunciado: 'O que fazer ao receber um e-mail suspeito?',
  dificuldade: 'facil',
  alternativas: [alt('A', true), alt('B', false), alt('C', false), alt('D', false)],
};
const QUESTAO_INVALIDA = { ...QUESTAO_OK, alternativas: [alt('A', true), alt('B', true)] };

function mockFetch(corpo, { ok: sucesso = true, status = 200 } = {}) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: sucesso,
    status,
    json: async () => corpo,
  });
}

const respostaClaude = (itens) => ({
  content: [{ type: 'text', text: '```json\n' + JSON.stringify(itens) + '\n```' }],
  usage: { input_tokens: 100, output_tokens: 400 },
});

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ANTHROPIC_API_KEY = 'chave-teste';
});
afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
});

describe('extrairJson', () => {
  it('aceita JSON cercado por markdown e texto', () => {
    expect(extrairJson('Segue:\n```json\n[{"a":1}]\n```')).toEqual([{ a: 1 }]);
  });
  it('lança 502 quando não há JSON', () => {
    expect(() => extrairJson('sem json')).toThrowError(expect.objectContaining({ status: 502 }));
  });
});

describe('gerarRascunhos', () => {
  it('503 sem chave de API configurada', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(gerarRascunhos('p1', { fase_id: 1, tema: 'LGPD' })).rejects.toMatchObject({
      status: 503,
    });
  });

  it('valida entrada (quantidade fora do limite)', async () => {
    await expect(
      gerarRascunhos('p1', { fase_id: 1, tema: 'LGPD', quantidade: 50 })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('salva só os válidos como rascunho e conta os descartados', async () => {
    mockFetch(respostaClaude([QUESTAO_OK, QUESTAO_INVALIDA]));
    const mock = configurarDb({ rascunhos_questoes: [ok([{ id: 'r1' }])] });

    const r = await gerarRascunhos('p1', { fase_id: 1, tema: 'LGPD', quantidade: 2 });

    expect(r.descartadas).toBe(1);
    expect(r.tokens_saida).toBe(400);
    const linhas = mock.chainsPara('rascunhos_questoes')[0].insert.mock.calls[0][0];
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toMatchObject({ fase_id: 1, criado_por: 'p1', tokens_entrada: 100 });
    // chave só vai no header para a API, nunca para o banco
    expect(JSON.stringify(linhas)).not.toContain('chave-teste');
  });

  it('502 quando a API da IA falha', async () => {
    mockFetch({}, { ok: false, status: 500 });
    await expect(gerarRascunhos('p1', { fase_id: 1, tema: 'LGPD' })).rejects.toMatchObject({
      status: 502,
    });
  });
});

describe('revisão de rascunhos', () => {
  it('rascunho inexistente é 404 e já revisado é 409', async () => {
    configurarDb({ rascunhos_questoes: [ok(null)] });
    await expect(descartarRascunho('x')).rejects.toMatchObject({ status: 404 });
    configurarDb({ rascunhos_questoes: [ok({ id: 'r1', status: 'aprovado' })] });
    await expect(descartarRascunho('r1')).rejects.toMatchObject({ status: 409 });
  });

  it('descartar marca o status', async () => {
    const mock = configurarDb({
      rascunhos_questoes: [ok({ id: 'r1', status: 'pendente_revisao' }), ok(null)],
    });
    await descartarRascunho('r1');
    expect(mock.chainsPara('rascunhos_questoes')[1].update).toHaveBeenCalledWith({
      status: 'descartado',
    });
  });

  it('aprovar cria a questão pelo caminho normal e marca aprovado', async () => {
    const payload = { ...QUESTAO_OK, fase_id: 1, formato: 'padrao' };
    const mock = configurarDb({
      rascunhos_questoes: [ok({ id: 'r1', status: 'pendente_revisao', payload }), ok(null)],
      questoes: [ok({ id: 'q1' })],
      alternativas: [ok(null)],
    });
    const q = await aprovarRascunho('p1', 'r1');
    expect(q.id).toBe('q1');
    expect(mock.chainsPara('questoes')[0].insert.mock.calls[0][0]).toMatchObject({
      criada_por: 'p1',
    });
    expect(mock.chainsPara('rascunhos_questoes')[1].update).toHaveBeenCalledWith({
      status: 'aprovado',
    });
  });
});
