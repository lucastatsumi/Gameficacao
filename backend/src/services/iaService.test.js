import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';
import { HttpError } from '../utils/httpError.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));
vi.mock('./temaService.js', () => ({
  exigirFaseEditavel: vi.fn(async () => ({ id: 101, tema_id: 2 })),
  exigirTemaEditavel: vi.fn(async () => ({ id: 2 })),
}));
vi.mock('./questaoService.js', () => ({
  criarQuestao: vi.fn(async (_id, dados) => {
    if (dados.alternativas.filter((a) => a.correta).length !== 1) {
      throw new HttpError(400, 'Exatamente uma alternativa deve ser a correta');
    }
    return { id: `q-${dados.enunciado.length}`, enunciado: dados.enunciado };
  }),
}));

const { db } = await import('../config/supabase.js');
const { criarQuestao } = await import('./questaoService.js');
const ia = await import('./iaService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

function clienteFalso(dados, extra = {}) {
  const create = vi.fn(async () => ({
    model: 'claude-opus-5-5',
    stop_reason: 'end_turn',
    usage: { input_tokens: 1000, output_tokens: 500 },
    content: [{ type: 'text', text: JSON.stringify(dados) }],
    ...extra,
  }));
  ia.definirClienteIa({ beta: { messages: { create } } });
  return create;
}

const alternativas = (correta = 'A') =>
  ['A', 'B', 'C', 'D'].map((letra) => ({
    letra,
    texto: `Opção ${letra}`,
    correta: letra === correta,
    explicacao: 'Porque sim.',
  }));

const contexto = () => ({
  fases: [ok({ id: 101, nome: 'Fundamentos da LGPD', descricao: null })],
  temas: [ok({ id: 2, nome: 'LGPD e Privacidade', descricao: null })],
  competencias: [ok([{ id: 10, nome: 'Bases legais' }])],
  geracoes_ia: [ok(null)],
});

beforeEach(() => vi.clearAllMocks());

describe('custoEstimado / notaPonderada', () => {
  it('custo pelo preço por milhão de tokens do modelo', () => {
    expect(ia.custoEstimado('claude-opus-5-5', 1_000_000, 100_000)).toBe(6);
  });

  it('nota final usa os pesos da rubrica e limita cada critério a 0..100', () => {
    const rubrica = { criterios: [{ peso: 75 }, { peso: 25 }] };
    expect(ia.notaPonderada(rubrica, [100, 0])).toBe(75);
    expect(ia.notaPonderada(rubrica, [150, -10])).toBe(75);
  });
});

describe('gerarQuestoes', () => {
  it('valida a quantidade antes de chamar a IA', async () => {
    const create = clienteFalso({ questoes: [] });
    await expect(ia.gerarQuestoes({ id: 'g1' }, { fase_id: 101, quantidade: 50 })).rejects.toMatchObject({
      status: 400,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('salva como rascunho inativo, rejeita inválidas e registra o custo', async () => {
    const mock = configurarDb(contexto());
    const create = clienteFalso({
      questoes: [
        { enunciado: 'Cenário válido', dificuldade: 'media', competencia: 'bases legais', fonte_trecho: '', alternativas: alternativas() },
        { enunciado: 'Duas certas', dificuldade: 'facil', competencia: '', fonte_trecho: '', alternativas: alternativas().map((a) => ({ ...a, correta: true })) },
      ],
    });

    const r = await ia.gerarQuestoes({ id: 'g1', empresa_id: 'e1' }, { fase_id: 101, quantidade: 2 });

    expect(r.rascunhos).toHaveLength(1);
    expect(r.rejeitadas).toEqual([expect.objectContaining({ motivo: expect.stringContaining('uma alternativa') })]);
    const [, dados, extras] = criarQuestao.mock.calls[0];
    expect(dados).toMatchObject({ fase_id: 101, tempo_limite_seg: 60, xp_valor: 15, competencia_ids: [10] });
    expect(extras).toMatchObject({ ativa: false, status_revisao: 'pendente_revisao', origem: 'ia_geracao' });

    const pedido = create.mock.calls[0][0];
    expect(pedido).toMatchObject({ model: 'claude-opus-5-5', fallbacks: 'default' });
    expect(pedido.output_config.format.type).toBe('json_schema');
    expect(mock.chainsPara('geracoes_ia')[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({ empresa_id: 'e1', tipo: 'geracao', itens: 1, custo_usd: 0.014 }),
    );
  });

  it('recusa da IA vira 422 e nada é salvo', async () => {
    configurarDb(contexto());
    clienteFalso({}, { stop_reason: 'refusal', content: [] });
    await expect(ia.gerarQuestoes({ id: 'g1' }, { fase_id: 101, quantidade: 1 })).rejects.toMatchObject({
      status: 422,
    });
    expect(criarQuestao).not.toHaveBeenCalled();
  });
});

describe('gerarDeDocumento', () => {
  it('descarta questão cujo trecho citado não existe no texto', async () => {
    configurarDb(contexto());
    clienteFalso({
      questoes: [
        { enunciado: 'Citou certo', dificuldade: 'media', competencia: '', fonte_trecho: 'reembolso   em até 30 dias', alternativas: alternativas() },
        { enunciado: 'Inventou', dificuldade: 'media', competencia: '', fonte_trecho: 'trecho que não existe', alternativas: alternativas() },
      ],
    });
    const r = await ia.gerarDeDocumento(
      { id: 'g1' },
      {
        fase_id: 101,
        quantidade: 2,
        documento: { tipo: 'texto', conteudo: 'A política prevê reembolso em até 30 dias após a compra.' },
      },
    );
    expect(r.rascunhos.map((q) => q.enunciado)).toEqual(['Citou certo']);
    expect(r.rejeitadas[0].motivo).toMatch(/trecho citado/);
  });

  it('rejeita tipo de documento desconhecido', async () => {
    await expect(
      ia.gerarDeDocumento({ id: 'g1' }, { fase_id: 101, quantidade: 1, documento: { tipo: 'docx' } }),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe('corrigirRespostaAberta', () => {
  it('a nota final é calculada no servidor pelos pesos, não pela IA', async () => {
    configurarDb({ geracoes_ia: [ok(null)] });
    clienteFalso({
      criterios: [
        { criterio: 'x', nota: 90, comentario: 'bom' },
        { criterio: 'y', nota: 30, comentario: 'faltou' },
      ],
      justificativa: 'ok',
    });
    const r = await ia.corrigirRespostaAberta(
      { id: 'c1' },
      {
        enunciado: 'Explique',
        rubrica: { criterios: [{ criterio: 'Cita o canal', peso: 50 }, { criterio: 'Explica o porquê', peso: 50 }] },
      },
      'texto',
    );
    expect(r.nota).toBe(60);
    expect(r.feedback.map((f) => f.criterio)).toEqual(['Cita o canal', 'Explica o porquê']);
  });
});
