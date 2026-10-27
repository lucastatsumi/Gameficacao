import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { filtrarAchados, auditarFase, resolverSugestao } = await import('./auditoriaService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ANTHROPIC_API_KEY = 'k';
});
afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
});

describe('filtrarAchados', () => {
  const ids = new Set(['q1']);
  it('descarta questão desconhecida, tipo inválido e descrição vazia', () => {
    const r = filtrarAchados(
      [
        { questao_id: 'q1', tipo: 'ambiguidade', descricao: ' Duas respostas defensáveis ' },
        { questao_id: 'q9', tipo: 'ambiguidade', descricao: 'x' },
        { questao_id: 'q1', tipo: 'inventado', descricao: 'x' },
        { questao_id: 'q1', tipo: 'outro', descricao: '  ' },
      ],
      ids
    );
    expect(r).toEqual([
      { questao_id: 'q1', tipo: 'ambiguidade', descricao: 'Duas respostas defensáveis' },
    ]);
  });
  it('saída que não é array vira lista vazia', () => {
    expect(filtrarAchados({ a: 1 }, ids)).toEqual([]);
  });
});

describe('auditarFase', () => {
  it('404 quando não há questões', async () => {
    configurarDb({ questoes: [ok([])] });
    await expect(auditarFase('g', 1)).rejects.toMatchObject({ status: 404 });
  });

  it('grava só os achados válidos', async () => {
    const questoes = [
      { id: 'q1', enunciado: 'Pergunta?', alternativas: [{ letra: 'A', texto: 'x', correta: true }] },
    ];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [
          {
            type: 'text',
            text: JSON.stringify([
              { questao_id: 'q1', tipo: 'erro_tecnico', descricao: 'Big-O errado' },
              { questao_id: 'fantasma', tipo: 'outro', descricao: 'nada' },
            ]),
          },
        ],
        usage: { input_tokens: 10, output_tokens: 5 },
      }),
    });
    const mock = configurarDb({ questoes: [ok(questoes)], auditoria_sugestoes: [ok([{ id: 's1' }])] });

    const r = await auditarFase('g', 1);

    expect(r.auditadas).toBe(1);
    expect(mock.chainsPara('auditoria_sugestoes')[0].insert).toHaveBeenCalledWith([
      { questao_id: 'q1', tipo: 'erro_tecnico', descricao: 'Big-O errado', criado_por: 'g' },
    ]);
  });
});

describe('resolverSugestao', () => {
  it('rejeita status inválido (400) e sugestão inexistente (404)', async () => {
    await expect(resolverSugestao('s1', 'apagada')).rejects.toMatchObject({ status: 400 });
    configurarDb({ auditoria_sugestoes: [ok([])] });
    await expect(resolverSugestao('s1', 'resolvida')).rejects.toMatchObject({ status: 404 });
  });
});
