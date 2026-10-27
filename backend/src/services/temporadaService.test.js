import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok, fail } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const {
  criarTemporada,
  listarTemporadas,
  temporadaAtiva,
  definirTrilha,
  concederPontosTemporada,
  progressoDoJogador,
  hallDaFama,
} = await import('./temporadaService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

const AGORA = new Date('2026-02-15T12:00:00Z');

describe('criarTemporada — validação', () => {
  it('rejeita nome vazio', async () => {
    await expect(
      criarTemporada({ nome: '  ', inicio: '2026-01-01', fim: '2026-03-01' }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejeita fim antes ou igual ao início', async () => {
    await expect(
      criarTemporada({ nome: 'Q1', inicio: '2026-03-01', fim: '2026-01-01' }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('cria com tema null quando não informado', async () => {
    const mock = configurarDb({ temporadas: [ok({ id: 1, nome: 'Q1', tema: null })] });
    await criarTemporada({ nome: 'Q1', inicio: '2026-01-01', fim: '2026-03-01' });

    const insertChain = mock.chainsPara('temporadas')[0];
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Q1', tema: null }),
    );
  });
});

describe('listarTemporadas', () => {
  it('classifica status por futura/ativa/encerrada comparando com agora', async () => {
    const agora = new Date();
    const ontem = new Date(agora.getTime() - 86_400_000).toISOString();
    const amanha = new Date(agora.getTime() + 86_400_000).toISOString();
    const depoisDeAmanha = new Date(agora.getTime() + 2 * 86_400_000).toISOString();

    configurarDb({
      temporadas: [
        ok([
          { id: 1, nome: 'Passada', inicio: ontem, fim: ontem },
          { id: 2, nome: 'Presente', inicio: ontem, fim: amanha },
          { id: 3, nome: 'Futura', inicio: amanha, fim: depoisDeAmanha },
        ]),
      ],
    });

    const temporadas = await listarTemporadas();
    expect(temporadas.find((t) => t.id === 1).status).toBe('encerrada');
    expect(temporadas.find((t) => t.id === 2).status).toBe('ativa');
    expect(temporadas.find((t) => t.id === 3).status).toBe('futura');
  });
});

describe('definirTrilha — validação', () => {
  it('rejeita trilha vazia', async () => {
    await expect(definirTrilha(1, [])).rejects.toMatchObject({ status: 400 });
  });

  it('rejeita degrau de fichas sem fichas > 0', async () => {
    await expect(
      definirTrilha(1, [{ pontos_necessarios: 100, tipo: 'fichas', fichas: 0 }]),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejeita degrau cosmético sem item_catalogo_id', async () => {
    await expect(
      definirTrilha(1, [{ pontos_necessarios: 100, tipo: 'cosmetico' }]),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejeita tipo desconhecido', async () => {
    await expect(definirTrilha(1, [{ pontos_necessarios: 100, tipo: 'xp' }])).rejects.toMatchObject(
      { status: 400 },
    );
  });

  it('substitui a trilha existente (delete + insert)', async () => {
    const mock = configurarDb({
      temporadas: [ok({ id: 1, empresa_id: null })],
      temporada_recompensas: [
        ok(null), // delete
        ok([
          {
            id: 1,
            temporada_id: 1,
            posicao: 1,
            pontos_necessarios: 100,
            tipo: 'fichas',
            fichas: 20,
          },
          {
            id: 2,
            temporada_id: 1,
            posicao: 2,
            pontos_necessarios: 200,
            tipo: 'cosmetico',
            item_catalogo_id: 9,
          },
        ]), // insert().select()
      ],
    });

    const degraus = await definirTrilha(1, [
      { pontos_necessarios: 100, tipo: 'fichas', fichas: 20 },
      { pontos_necessarios: 200, tipo: 'cosmetico', item_catalogo_id: 9 },
    ]);

    expect(degraus).toHaveLength(2);
    const deleteChain = mock.chainsPara('temporada_recompensas')[0];
    expect(deleteChain.delete).toHaveBeenCalled();
    expect(deleteChain.eq).toHaveBeenCalledWith('temporada_id', 1);

    const insertChain = mock.chainsPara('temporada_recompensas')[1];
    expect(insertChain.insert).toHaveBeenCalledWith([
      {
        temporada_id: 1,
        posicao: 1,
        pontos_necessarios: 100,
        tipo: 'fichas',
        fichas: 20,
        item_catalogo_id: null,
      },
      {
        temporada_id: 1,
        posicao: 2,
        pontos_necessarios: 200,
        tipo: 'cosmetico',
        fichas: null,
        item_catalogo_id: 9,
      },
    ]);
  });
});

describe('temporadaAtiva', () => {
  it('retorna null quando não há temporada no período', async () => {
    configurarDb({ temporadas: [ok(null)] });
    expect(await temporadaAtiva(AGORA)).toBeNull();
  });
});

describe('concederPontosTemporada', () => {
  it('não toca o banco quando não há xp ganho', async () => {
    configurarDb({});
    await expect(concederPontosTemporada('u1', 0, AGORA)).resolves.toEqual([]);
    expect(db.from).not.toHaveBeenCalled();
  });

  it('não faz nada quando não há temporada ativa', async () => {
    configurarDb({ temporadas: [ok(null)] });
    const resultado = await concederPontosTemporada('u1', 30, AGORA);
    expect(resultado).toEqual([]);
  });

  it('soma pontos e não resgata nada abaixo do primeiro marco', async () => {
    const mock = configurarDb({
      temporadas: [ok({ id: 1, nome: 'Q1', inicio: '2026-01-01', fim: '2026-03-01' })],
      temporada_pontos: [
        ok({ temporada_id: 1, user_id: 'u1', pontos: 10 }), // buscarOuCriarLinha
        ok(null), // update
      ],
      temporada_recompensas: [ok([])], // nenhum degrau <= pontos
    });

    const concedidos = await concederPontosTemporada('u1', 15, AGORA);

    expect(concedidos).toEqual([]);
    const update = mock.chainsPara('temporada_pontos')[1].update;
    expect(update).toHaveBeenCalledWith({ pontos: 25 });
  });

  it('matricula o jogador na temporada quando ele ainda não tem linha', async () => {
    const mock = configurarDb({
      temporadas: [ok({ id: 1, nome: 'Q1', inicio: '2026-01-01', fim: '2026-03-01' })],
      temporada_pontos: [
        ok(null), // buscarOuCriarLinha: ainda não existe
        ok(null), // upsert
        ok(null), // update
      ],
      temporada_recompensas: [ok([])],
    });

    await concederPontosTemporada('novo', 15, AGORA);

    const upsert = mock.chainsPara('temporada_pontos')[1].upsert;
    expect(upsert).toHaveBeenCalledWith(
      { temporada_id: 1, user_id: 'novo', pontos: 0 },
      { onConflict: 'temporada_id,user_id', ignoreDuplicates: true },
    );
    const update = mock.chainsPara('temporada_pontos')[2].update;
    expect(update).toHaveBeenCalledWith({ pontos: 15 });
  });

  it('resgata degrau de fichas ao cruzar o marco', async () => {
    const mock = configurarDb({
      temporadas: [ok({ id: 1, nome: 'Q1', inicio: '2026-01-01', fim: '2026-03-01' })],
      temporada_pontos: [ok({ temporada_id: 1, user_id: 'u1', pontos: 90 }), ok(null)],
      temporada_recompensas: [
        ok([
          {
            id: 5,
            temporada_id: 1,
            posicao: 1,
            pontos_necessarios: 100,
            tipo: 'fichas',
            fichas: 20,
          },
        ]),
      ],
      temporada_resgates: [ok([]), ok(null)], // já resgatados (nenhum), insert do resgate
      transacoes_fichas: [ok(null)],
    });

    const concedidos = await concederPontosTemporada('u1', 15, AGORA); // 90 + 15 = 105

    expect(concedidos).toEqual([
      { id: 5, temporada_id: 1, posicao: 1, pontos_necessarios: 100, tipo: 'fichas', fichas: 20 },
    ]);

    const insertResgate = mock.chainsPara('temporada_resgates')[1].insert;
    expect(insertResgate).toHaveBeenCalledWith({ user_id: 'u1', recompensa_id: 5 });

    const insertFichas = mock.chainsPara('transacoes_fichas')[0].insert;
    expect(insertFichas).toHaveBeenCalledWith({
      user_id: 'u1',
      quantidade: 20,
      motivo: 'temporada_recompensa',
      referencia: '5',
    });
  });

  it('resgata degrau cosmético concedendo posse do item (sem debitar fichas)', async () => {
    const mock = configurarDb({
      temporadas: [ok({ id: 1, nome: 'Q1', inicio: '2026-01-01', fim: '2026-03-01' })],
      temporada_pontos: [ok({ temporada_id: 1, user_id: 'u1', pontos: 190 }), ok(null)],
      temporada_recompensas: [
        ok([
          {
            id: 7,
            temporada_id: 1,
            posicao: 2,
            pontos_necessarios: 200,
            tipo: 'cosmetico',
            item_catalogo_id: 42,
          },
        ]),
      ],
      temporada_resgates: [ok([]), ok(null)],
      itens_do_jogador: [ok(null)],
    });

    const concedidos = await concederPontosTemporada('u1', 10, AGORA); // 190 + 10 = 200

    expect(concedidos).toHaveLength(1);
    const insertItem = mock.chainsPara('itens_do_jogador')[0].insert;
    expect(insertItem).toHaveBeenCalledWith({ user_id: 'u1', item_id: 42 });
  });

  it('não resgata de novo um degrau já resgatado', async () => {
    const mock = configurarDb({
      temporadas: [ok({ id: 1, nome: 'Q1', inicio: '2026-01-01', fim: '2026-03-01' })],
      temporada_pontos: [ok({ temporada_id: 1, user_id: 'u1', pontos: 190 }), ok(null)],
      temporada_recompensas: [
        ok([
          {
            id: 5,
            temporada_id: 1,
            posicao: 1,
            pontos_necessarios: 100,
            tipo: 'fichas',
            fichas: 20,
          },
        ]),
      ],
      temporada_resgates: [ok([{ recompensa_id: 5 }])], // já resgatado
    });

    const concedidos = await concederPontosTemporada('u1', 10, AGORA);
    expect(concedidos).toEqual([]);
    // nem chegou a tentar inserir o resgate de novo
    expect(mock.chainsPara('temporada_resgates')).toHaveLength(1);
  });

  it('resgate concorrente (23505) é ignorado sem lançar erro', async () => {
    const mock = configurarDb({
      temporadas: [ok({ id: 1, nome: 'Q1', inicio: '2026-01-01', fim: '2026-03-01' })],
      temporada_pontos: [ok({ temporada_id: 1, user_id: 'u1', pontos: 90 }), ok(null)],
      temporada_recompensas: [
        ok([
          {
            id: 5,
            temporada_id: 1,
            posicao: 1,
            pontos_necessarios: 100,
            tipo: 'fichas',
            fichas: 20,
          },
        ]),
      ],
      temporada_resgates: [ok([]), fail({ code: '23505', message: 'duplicate key' })],
    });

    const concedidos = await concederPontosTemporada('u1', 15, AGORA);
    expect(concedidos).toEqual([]);
    // nenhuma ficha foi concedida, já que o insert do resgate falhou
    expect(mock.chainsPara('transacoes_fichas')).toHaveLength(0);
  });
});

describe('progressoDoJogador', () => {
  it('retorna null quando não há temporada ativa', async () => {
    configurarDb({ temporadas: [ok(null)] });
    expect(await progressoDoJogador('u1', AGORA)).toBeNull();
  });

  it('monta a trilha inteira com o que já foi resgatado', async () => {
    configurarDb({
      temporadas: [ok({ id: 1, nome: 'Q1', inicio: '2026-01-01', fim: '2026-03-01' })],
      temporada_pontos: [ok({ pontos: 150 })],
      temporada_recompensas: [
        ok([
          { id: 5, posicao: 1, pontos_necessarios: 100, tipo: 'fichas', fichas: 20 },
          { id: 7, posicao: 2, pontos_necessarios: 200, tipo: 'cosmetico', item_catalogo_id: 42 },
        ]),
      ],
      temporada_resgates: [ok([{ recompensa_id: 5 }])],
    });

    const progresso = await progressoDoJogador('u1', AGORA);
    expect(progresso.pontos).toBe(150);
    expect(progresso.status).toBe('ativa');
    expect(progresso.trilha.find((d) => d.id === 5).resgatada).toBe(true);
    expect(progresso.trilha.find((d) => d.id === 7).resgatada).toBe(false);
  });

  it('pontos zerados quando o jogador ainda não tem linha na temporada', async () => {
    configurarDb({
      temporadas: [ok({ id: 1, nome: 'Q1', inicio: '2026-01-01', fim: '2026-03-01' })],
      temporada_pontos: [ok(null)],
      temporada_recompensas: [ok([])],
      temporada_resgates: [ok([])],
    });

    const progresso = await progressoDoJogador('novo', AGORA);
    expect(progresso.pontos).toBe(0);
    expect(progresso.trilha).toEqual([]);
  });
});

describe('hallDaFama', () => {
  it('devolve o ranking ordenado por posição', async () => {
    const mock = configurarDb({
      ranking_temporada: [ok([{ id: 'u1', nome: 'Ana', pontos: 300, posicao: 1 }])],
    });

    const ranking = await hallDaFama(1);
    expect(ranking).toHaveLength(1);
    const chain = mock.chainsPara('ranking_temporada')[0];
    expect(chain.eq).toHaveBeenCalledWith('temporada_id', 1);
  });
});
