import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';
import { semanaIsoAnterior, semanaIsoDeHoje } from '../utils/semana.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { minhaLiga, registrarXpNaLiga } = await import('./ligaService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

const AGORA = new Date('2026-01-12T10:00:00Z');
const SEMANA = semanaIsoDeHoje(AGORA);
const SEMANA_ANT = semanaIsoAnterior(AGORA);

function registro(overrides = {}) {
  return { user_id: 'user-1', semana: SEMANA, divisao: 'bronze', xp_semana: 0, ...overrides };
}

describe('minhaLiga', () => {
  it('primeiro acesso de todos: estreia em bronze e devolve o quadro da divisão', async () => {
    const mock = configurarDb({
      ligas_semana: [
        ok(null), // já existe registro da semana?
        ok(null), // registro mais recente anterior (nunca jogou)
        ok(registro()), // upsert -> select -> maybeSingle
        ok([{ user_id: 'user-1', xp_semana: 0, profiles: { nome: 'Ana' } }]), // ranking da divisão
      ],
    });

    const liga = await minhaLiga('user-1', AGORA);

    expect(liga.divisao).toBe('bronze');
    expect(liga.semana).toBe(SEMANA);
    expect(liga.ranking).toEqual([{ posicao: 1, nome: 'Ana', xp_semana: 0, voce: true }]);
    expect(mock.chainsPara('ligas_semana')[2].upsert).toHaveBeenCalledWith(
      { user_id: 'user-1', semana: SEMANA, divisao: 'bronze', xp_semana: 0 },
      { onConflict: 'user_id,semana', ignoreDuplicates: true },
    );
    expect(mock.chainsPara('transacoes_fichas')).toHaveLength(0);
  });

  it('corrida na criação: upsert perde, relê o registro que a outra requisição criou', async () => {
    configurarDb({
      ligas_semana: [
        ok(null),
        ok(null),
        ok(null), // upsert não retornou linha (outra requisição já inseriu)
        ok(registro()), // releitura
        ok([]), // ranking
      ],
    });

    const liga = await minhaLiga('user-1', AGORA);
    expect(liga.divisao).toBe('bronze');
  });

  it('já tem registro da semana: não recria, só devolve o quadro', async () => {
    const mock = configurarDb({
      ligas_semana: [
        ok(registro({ divisao: 'ouro', xp_semana: 42 })),
        ok([{ user_id: 'user-1', xp_semana: 42, profiles: { nome: 'Ana' } }]),
      ],
    });

    const liga = await minhaLiga('user-1', AGORA);
    expect(liga).toMatchObject({ divisao: 'ouro', xp_semana: 42 });
    expect(mock.chainsPara('ligas_semana')).toHaveLength(2);
  });
});

describe('registrarXpNaLiga', () => {
  it('soma o xp ganho ao acumulador da semana já existente', async () => {
    const mock = configurarDb({
      ligas_semana: [ok(registro({ xp_semana: 10 })), ok(null)],
    });

    await registrarXpNaLiga('user-1', 5, AGORA);

    expect(mock.chainsPara('ligas_semana')[1].update).toHaveBeenCalledWith({ xp_semana: 15 });
  });

  it('xp zero ou negativo não toca no banco', async () => {
    const mock = configurarDb({ ligas_semana: [] });
    await registrarXpNaLiga('user-1', 0, AGORA);
    await registrarXpNaLiga('user-1', -3, AGORA);
    expect(mock.chainsPara('ligas_semana')).toHaveLength(0);
  });
});

describe('fechamento lazy da semana anterior', () => {
  function grupoDeCinco(xpDoUsuario, resto = [90, 80, 70, 60]) {
    return [
      { user_id: 'user-1', xp_semana: xpDoUsuario },
      ...resto.map((xp, i) => ({ user_id: `u${i}`, xp_semana: xp })),
    ];
  }

  it('top 20% da divisão promove e paga fichas do tier de promoção', async () => {
    const mock = configurarDb({
      ligas_semana: [
        ok(null),
        ok(registro({ semana: SEMANA_ANT, divisao: 'bronze', xp_semana: 100 })),
        ok(grupoDeCinco(100).sort((a, b) => b.xp_semana - a.xp_semana)),
        ok(registro({ divisao: 'prata' })),
        ok([]),
      ],
      transacoes_fichas: [ok(null)],
    });

    const liga = await minhaLiga('user-1', AGORA);

    expect(liga.divisao).toBe('prata');
    expect(mock.chainsPara('transacoes_fichas')[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({
        quantidade: Math.round(5 * 1.5),
        motivo: 'liga_semanal',
        referencia: SEMANA_ANT,
      }),
    );
  });

  it('bottom 20% da divisão rebaixa e paga fichas do tier de rebaixamento', async () => {
    const mock = configurarDb({
      ligas_semana: [
        ok(null),
        ok(registro({ semana: SEMANA_ANT, divisao: 'ouro', xp_semana: 10 })),
        ok(grupoDeCinco(10, [100, 90, 80, 70]).sort((a, b) => b.xp_semana - a.xp_semana)), // usuário é o pior colocado
        ok(registro({ divisao: 'prata' })),
        ok([]),
      ],
      transacoes_fichas: [ok(null)],
    });

    const liga = await minhaLiga('user-1', AGORA);

    expect(liga.divisao).toBe('prata');
    expect(mock.chainsPara('transacoes_fichas')[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({
        quantidade: Math.round(12 * 0.5),
        motivo: 'liga_semanal',
        referencia: SEMANA_ANT,
      }),
    );
  });

  it('diamante não promove além do topo', async () => {
    const mock = configurarDb({
      ligas_semana: [
        ok(null),
        ok(registro({ semana: SEMANA_ANT, divisao: 'diamante', xp_semana: 100 })),
        ok(grupoDeCinco(100).sort((a, b) => b.xp_semana - a.xp_semana)),
        ok(registro({ divisao: 'diamante' })),
        ok([]),
      ],
      transacoes_fichas: [ok(null)],
    });

    const liga = await minhaLiga('user-1', AGORA);
    expect(liga.divisao).toBe('diamante');
    expect(mock.chainsPara('transacoes_fichas')[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({ quantidade: 20 }), // fichas de "manteve" (base cheio)
    );
  });

  it('bronze não rebaixa além do piso', async () => {
    configurarDb({
      ligas_semana: [
        ok(null),
        ok(registro({ semana: SEMANA_ANT, divisao: 'bronze', xp_semana: 10 })),
        ok(grupoDeCinco(10, [100, 90, 80, 70]).sort((a, b) => b.xp_semana - a.xp_semana)),
        ok(registro({ divisao: 'bronze' })),
        ok([]),
      ],
      transacoes_fichas: [ok(null)],
    });

    const liga = await minhaLiga('user-1', AGORA);
    expect(liga.divisao).toBe('bronze');
  });

  it('divisão pequena (menos de 5 jogadores) nunca promove nem rebaixa', async () => {
    const mock = configurarDb({
      ligas_semana: [
        ok(null),
        ok(registro({ semana: SEMANA_ANT, divisao: 'bronze', xp_semana: 5 })),
        ok([
          { user_id: 'u2', xp_semana: 999 },
          { user_id: 'user-1', xp_semana: 5 },
        ]),
        ok(registro({ divisao: 'bronze' })),
        ok([]),
      ],
      transacoes_fichas: [ok(null)],
    });

    const liga = await minhaLiga('user-1', AGORA);
    expect(liga.divisao).toBe('bronze');
    expect(mock.chainsPara('transacoes_fichas')[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({ quantidade: 5 }),
    );
  });

  it('pulou uma semana: retoma na mesma divisão, sem processar fechamento nem pagar fichas', async () => {
    const semanaMuitoAntes = semanaIsoAnterior(new Date(AGORA.getTime() - 14 * 86400000));
    const mock = configurarDb({
      ligas_semana: [
        ok(null),
        ok(registro({ semana: semanaMuitoAntes, divisao: 'ouro' })),
        ok(registro({ divisao: 'ouro' })),
        ok([]),
      ],
    });

    const liga = await minhaLiga('user-1', AGORA);
    expect(liga.divisao).toBe('ouro');
    expect(mock.chainsPara('transacoes_fichas')).toHaveLength(0);
  });
});
