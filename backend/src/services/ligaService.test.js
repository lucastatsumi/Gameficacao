import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok, fail } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { ligaAtual, concederXpSemana } = await import('./ligaService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

// Segunda-feira -> semana atual 2026-W03, semana anterior 2026-W02.
const AGORA = new Date('2026-01-12T12:00:00Z');

describe('ligaAtual', () => {
  it('primeiro acesso sem fechamento pendente: matricula em bronze', async () => {
    const mock = configurarDb({
      ligas_fechamentos: [ok(null)], // trava do fechamento: reservada com sucesso
      ligas_semana: [
        ok([]), // rollover: nenhuma linha na semana anterior
        ok(null), // buscarLinha da semana atual: ainda não existe
        ok(null), // matricularNaLiga: upsert
        ok({ user_id: 'u1', semana: '2026-W03', divisao: 'bronze', xp_semana: 0 }), // re-fetch
      ],
      ranking_liga: [ok([{ id: 'u1', nome: 'Ana', xp_semana: 0, posicao: 1 }])],
    });

    const liga = await ligaAtual('u1', AGORA);

    expect(liga.semana).toBe('2026-W03');
    expect(liga.divisao).toBe('bronze');
    expect(liga.xp_semana).toBe(0);
    expect(liga.ranking).toHaveLength(1);

    const upsert = mock.chainsPara('ligas_semana')[2].upsert;
    expect(upsert).toHaveBeenCalledWith(
      { user_id: 'u1', semana: '2026-W03', divisao: 'bronze', xp_semana: 0 },
      { onConflict: 'user_id,semana', ignoreDuplicates: true }
    );
  });

  it('já matriculado na semana: devolve direto, sem matricular de novo', async () => {
    configurarDb({
      ligas_fechamentos: [ok(null)],
      ligas_semana: [
        ok([]), // rollover: nada pra fechar
        ok({ user_id: 'u1', semana: '2026-W03', divisao: 'prata', xp_semana: 40 }),
      ],
      ranking_liga: [ok([])],
    });

    const liga = await ligaAtual('u1', AGORA);
    expect(liga.divisao).toBe('prata');
    expect(liga.xp_semana).toBe(40);
  });

  it('fechamento já processado por outra requisição: não consulta a semana anterior', async () => {
    const mock = configurarDb({
      ligas_fechamentos: [fail({ code: '23505', message: 'duplicate key' })],
      ligas_semana: [ok({ user_id: 'u1', semana: '2026-W03', divisao: 'ouro', xp_semana: 55 })],
      ranking_liga: [ok([])],
    });

    const liga = await ligaAtual('u1', AGORA);
    expect(liga.divisao).toBe('ouro');
    // só a busca da linha atual: nenhuma consulta de rollover foi feita
    expect(mock.chainsPara('ligas_semana')).toHaveLength(1);
  });
});

describe('concederXpSemana', () => {
  it('não toca o banco quando não há xp ganho', async () => {
    configurarDb({});
    await expect(concederXpSemana('u1', 0, AGORA)).resolves.toBeUndefined();
    expect(db.from).not.toHaveBeenCalled();
  });

  it('soma o xp ao acumulador existente da semana', async () => {
    const mock = configurarDb({
      ligas_fechamentos: [ok(null)],
      ligas_semana: [
        ok([]), // rollover: nada pra fechar
        ok({ user_id: 'u1', semana: '2026-W03', divisao: 'prata', xp_semana: 40 }),
        ok(null), // update
      ],
    });

    await concederXpSemana('u1', 15, AGORA);

    const update = mock.chainsPara('ligas_semana')[2].update;
    expect(update).toHaveBeenCalledWith({ xp_semana: 55 });
  });

  it('divisão com um único jogador não promove nem rebaixa (mantém)', async () => {
    const mock = configurarDb({
      ligas_fechamentos: [ok(null)],
      ligas_semana: [
        ok([{ user_id: 'solo', divisao: 'ouro', xp_semana: 30 }]), // rollover
        ok(null), // upsert das novas linhas
        ok({ user_id: 'solo', semana: '2026-W03', divisao: 'ouro', xp_semana: 0 }),
        ok(null), // update do xp
      ],
      transacoes_fichas: [ok(null)],
    });

    await concederXpSemana('solo', 10, AGORA);

    const upsert = mock.chainsPara('ligas_semana')[1].upsert;
    const linhas = upsert.mock.calls[0][0];
    expect(linhas).toEqual([{ user_id: 'solo', semana: '2026-W03', divisao: 'ouro', xp_semana: 0 }]);

    const insertFichas = mock.chainsPara('transacoes_fichas')[0].insert;
    expect(insertFichas).toHaveBeenCalledWith({
      user_id: 'solo',
      quantidade: 15,
      motivo: 'liga_semana',
      referencia: '2026-W02',
    });
  });

  it('promove o topo e rebaixa o fundo de uma divisão intermediária (5 jogadores)', async () => {
    const linhasAnteriores = [
      { user_id: 'u3', divisao: 'prata', xp_semana: 80 },
      { user_id: 'u1', divisao: 'prata', xp_semana: 100 },
      { user_id: 'u5', divisao: 'prata', xp_semana: 60 },
      { user_id: 'u2', divisao: 'prata', xp_semana: 90 },
      { user_id: 'u4', divisao: 'prata', xp_semana: 70 },
    ];
    const mock = configurarDb({
      ligas_fechamentos: [ok(null)],
      ligas_semana: [
        ok(linhasAnteriores),
        ok(null), // upsert das novas linhas
        ok({ user_id: 'u3', semana: '2026-W03', divisao: 'prata', xp_semana: 0 }),
        ok(null), // update do xp de u3
      ],
      // ordem processada é sempre por xp desc: u1(subiu), u2, u3, u4 (mantêm), u5 (desceu)
      transacoes_fichas: [ok(null), ok(null), ok(null), ok(null), ok(null)],
    });

    await concederXpSemana('u3', 5, AGORA);

    const upsert = mock.chainsPara('ligas_semana')[1].upsert;
    const linhas = upsert.mock.calls[0][0];
    expect(linhas).toEqual(
      expect.arrayContaining([
        { user_id: 'u1', semana: '2026-W03', divisao: 'ouro', xp_semana: 0 },
        { user_id: 'u2', semana: '2026-W03', divisao: 'prata', xp_semana: 0 },
        { user_id: 'u3', semana: '2026-W03', divisao: 'prata', xp_semana: 0 },
        { user_id: 'u4', semana: '2026-W03', divisao: 'prata', xp_semana: 0 },
        { user_id: 'u5', semana: '2026-W03', divisao: 'bronze', xp_semana: 0 },
      ])
    );

    const chamadasFichas = mock.chainsPara('transacoes_fichas').map((c) => c.insert.mock.calls[0][0]);
    expect(chamadasFichas).toEqual([
      { user_id: 'u1', quantidade: 25, motivo: 'liga_semana', referencia: '2026-W02' },
      { user_id: 'u2', quantidade: 15, motivo: 'liga_semana', referencia: '2026-W02' },
      { user_id: 'u3', quantidade: 15, motivo: 'liga_semana', referencia: '2026-W02' },
      { user_id: 'u4', quantidade: 15, motivo: 'liga_semana', referencia: '2026-W02' },
      { user_id: 'u5', quantidade: 5, motivo: 'liga_semana', referencia: '2026-W02' },
    ]);

    // u3 mantém xp 0 da rollover + 5 concedidos por esta tentativa
    const update = mock.chainsPara('ligas_semana')[3].update;
    expect(update).toHaveBeenCalledWith({ xp_semana: 5 });
  });

  it('não deixa o topo passar de diamante nem o fundo cair de bronze (clamp)', async () => {
    const linhasAnteriores = [
      { user_id: 'bronze_alto', divisao: 'bronze', xp_semana: 20 },
      { user_id: 'bronze_baixo', divisao: 'bronze', xp_semana: 10 },
      { user_id: 'diamante_alto', divisao: 'diamante', xp_semana: 50 },
      { user_id: 'diamante_baixo', divisao: 'diamante', xp_semana: 30 },
    ];
    const mock = configurarDb({
      ligas_fechamentos: [ok(null)],
      ligas_semana: [
        ok(linhasAnteriores),
        ok(null), // upsert
        ok({ user_id: 'bronze_baixo', semana: '2026-W03', divisao: 'bronze', xp_semana: 0 }),
        ok(null), // update
      ],
      transacoes_fichas: [ok(null), ok(null), ok(null), ok(null)],
    });

    await concederXpSemana('bronze_baixo', 10, AGORA);

    const upsert = mock.chainsPara('ligas_semana')[1].upsert;
    const linhas = upsert.mock.calls[0][0];
    expect(linhas).toEqual(
      expect.arrayContaining([
        { user_id: 'bronze_alto', semana: '2026-W03', divisao: 'prata', xp_semana: 0 }, // subiu
        { user_id: 'bronze_baixo', semana: '2026-W03', divisao: 'bronze', xp_semana: 0 }, // clamp no piso
        { user_id: 'diamante_alto', semana: '2026-W03', divisao: 'diamante', xp_semana: 0 }, // clamp no teto
        { user_id: 'diamante_baixo', semana: '2026-W03', divisao: 'ouro', xp_semana: 0 }, // desceu
      ])
    );
  });
});

describe('ligaAtual — isolamento por empresa', () => {
  it('a classificação filtra pela empresa informada', async () => {
    const mock = configurarDb({
      ligas_fechamentos: [ok(null)],
      ligas_semana: [
        ok([]), // rollover: nenhuma linha na semana anterior
        ok({ user_id: 'u1', semana: '2026-W03', divisao: 'bronze', xp_semana: 0 }),
      ],
      ranking_liga: [ok([])],
    });
    await ligaAtual('u1', AGORA, 'empresa-A');
    expect(mock.chainsPara('ranking_liga')[0].eq).toHaveBeenCalledWith('empresa_id', 'empresa-A');
  });
});
