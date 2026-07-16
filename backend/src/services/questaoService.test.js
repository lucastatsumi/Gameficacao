import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok, fail } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { criarQuestao, atualizarQuestao, desativarQuestao } = await import('./questaoService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

const ALTERNATIVAS_PADRAO = ['A', 'B', 'C', 'D'].map((letra) => ({
  letra,
  texto: `Texto ${letra}`,
  correta: letra === 'A',
  explicacao: `Explicação ${letra}`,
}));

const ALTERNATIVAS_BATALHA = ['A', 'B'].map((letra) => ({
  letra,
  texto: `O(${letra})`,
  correta: letra === 'A',
  explicacao: `Explicação ${letra}`,
}));

const DADOS_BASE = { fase_id: 1, enunciado: 'Enunciado', alternativas: ALTERNATIVAS_PADRAO };

describe('criarQuestao — validação', () => {
  it('rejeita sem fase_id', async () => {
    await expect(criarQuestao('prof-1', { ...DADOS_BASE, fase_id: undefined })).rejects.toMatchObject({
      status: 400,
    });
  });

  it('rejeita formato padrão com menos de 4 alternativas', async () => {
    await expect(
      criarQuestao('prof-1', { ...DADOS_BASE, alternativas: ALTERNATIVAS_PADRAO.slice(0, 3) })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejeita mais de uma alternativa correta', async () => {
    const alts = ALTERNATIVAS_PADRAO.map((a, i) => ({ ...a, correta: i < 2 }));
    await expect(criarQuestao('prof-1', { ...DADOS_BASE, alternativas: alts })).rejects.toMatchObject({
      status: 400,
    });
  });

  it('rejeita nenhuma alternativa correta', async () => {
    const alts = ALTERNATIVAS_PADRAO.map((a) => ({ ...a, correta: false }));
    await expect(criarQuestao('prof-1', { ...DADOS_BASE, alternativas: alts })).rejects.toMatchObject({
      status: 400,
    });
  });

  it('rejeita alternativa sem explicação', async () => {
    const alts = ALTERNATIVAS_PADRAO.map((a, i) => (i === 0 ? { ...a, explicacao: '' } : a));
    await expect(criarQuestao('prof-1', { ...DADOS_BASE, alternativas: alts })).rejects.toMatchObject({
      status: 400,
    });
  });

  it('rejeita formato desconhecido', async () => {
    await expect(
      criarQuestao('prof-1', { ...DADOS_BASE, formato: 'inexistente' })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejeita batalha_complexidade com 4 alternativas (exige exatamente 2)', async () => {
    await expect(
      criarQuestao('prof-1', {
        ...DADOS_BASE,
        formato: 'batalha_complexidade',
        alternativas: ALTERNATIVAS_PADRAO,
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('aceita batalha_complexidade com exatamente 2 alternativas (A/B)', async () => {
    configurarDb({
      questoes: [ok({ id: 'q1' })],
      alternativas: [ok(null)],
    });

    const criada = await criarQuestao('prof-1', {
      ...DADOS_BASE,
      formato: 'batalha_complexidade',
      alternativas: ALTERNATIVAS_BATALHA,
    });
    expect(criada.alternativas).toHaveLength(2);
  });

  it('cria com formato padrão (default) e grava formato no insert', async () => {
    const mock = configurarDb({
      questoes: [ok({ id: 'q1' })],
      alternativas: [ok(null)],
    });

    await criarQuestao('prof-1', DADOS_BASE);

    const insertChain = mock.chainsPara('questoes')[0];
    expect(insertChain.insert).toHaveBeenCalledWith(expect.objectContaining({ formato: 'padrao' }));
  });

  it('desfaz a criação se a inserção das alternativas falhar', async () => {
    configurarDb({
      questoes: [ok({ id: 'q1' }), ok(null)], // insert + delete de compensação
      alternativas: [fail(new Error('falhou'))],
    });

    await expect(criarQuestao('prof-1', DADOS_BASE)).rejects.toThrow('falhou');
  });
});

describe('atualizarQuestao', () => {
  it('rejeita questão inexistente', async () => {
    configurarDb({ questoes: [ok(null)] });
    await expect(atualizarQuestao('q-inexistente', DADOS_BASE)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('ignora "formato" do payload e usa o já salvo (não permite mudar formato na edição)', async () => {
    configurarDb({
      questoes: [
        ok({
          id: 'q1',
          formato: 'batalha_complexidade',
          alternativas: [
            { id: 'a1', letra: 'A' },
            { id: 'a2', letra: 'B' },
          ],
        }),
      ],
    });

    // Tenta editar mandando formato "padrao" com 4 alternativas — deve
    // falhar porque a questão salva é batalha_complexidade (2 alternativas).
    await expect(
      atualizarQuestao('q1', { ...DADOS_BASE, formato: 'padrao', alternativas: ALTERNATIVAS_PADRAO })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejeita alternativa com letra que não existe na questão', async () => {
    configurarDb({
      questoes: [
        ok({
          id: 'q1',
          formato: 'padrao',
          alternativas: [{ id: 'a1', letra: 'A' }], // faltam B, C, D — dado incompleto de propósito
        }),
        ok(null), // update questoes
      ],
      alternativas: [ok(null), ok(null)], // reset + update de A (a busca por B já falha em seguida)
    });

    await expect(atualizarQuestao('q1', DADOS_BASE)).rejects.toMatchObject({ status: 400 });
  });

  it('atualiza questão e alternativas existentes com sucesso', async () => {
    const mock = configurarDb({
      questoes: [
        ok({
          id: 'q1',
          formato: 'padrao',
          alternativas: [
            { id: 'a1', letra: 'A' },
            { id: 'a2', letra: 'B' },
            { id: 'a3', letra: 'C' },
            { id: 'a4', letra: 'D' },
          ],
        }),
        ok(null), // update questoes
      ],
      alternativas: [ok(null), ok(null), ok(null), ok(null), ok(null)], // reset + 4 updates
    });

    const res = await atualizarQuestao('q1', DADOS_BASE);
    expect(res.id).toBe('q1');
    expect(mock.chainsPara('alternativas')).toHaveLength(5);
  });
});

describe('desativarQuestao', () => {
  it('rejeita questão inexistente', async () => {
    configurarDb({ questoes: [ok(null)] });
    await expect(desativarQuestao('q-inexistente')).rejects.toMatchObject({ status: 404 });
  });

  it('desativa (soft-delete) com sucesso', async () => {
    configurarDb({ questoes: [ok({ id: 'q1' })] });
    await expect(desativarQuestao('q1')).resolves.toBeUndefined();
  });
});
