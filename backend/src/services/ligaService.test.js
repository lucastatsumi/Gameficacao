import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';
import { semanaIso } from '../utils/semana.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { registrarXpNaLiga, statusDaLiga } = await import('./ligaService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

const semanaAtual = semanaIso();

describe('registrarXpNaLiga', () => {
  it('xp_ganho <= 0 não faz nenhuma consulta', async () => {
    configurarDb({});
    await registrarXpNaLiga('user-1', 0);
    await registrarXpNaLiga('user-1', -5);
    expect(db.from).not.toHaveBeenCalled();
  });

  it('balde da semana já existe: só soma o xp, sem tocar em jogador', async () => {
    const mock = configurarDb({
      ligas_semana: [
        ok({ user_id: 'user-1', semana: semanaAtual, divisao: 'bronze', xp_semana: 12 }),
        ok(null), // update
      ],
    });

    await registrarXpNaLiga('user-1', 8);

    expect(mock.chainsPara('ligas_semana')[1].update).toHaveBeenCalledWith({ xp_semana: 20 });
    expect(mock.chainsPara('ligas_jogador')).toHaveLength(0);
  });

  it('primeiro acesso do jogador: cria divisão bronze e balde novo', async () => {
    const mock = configurarDb({
      ligas_semana: [
        ok(null), // buscarSemana (não existe ainda)
        ok(null), // fecharSemanaPendente: sem pendente
        ok(null), // upsert do balde novo
        ok({ user_id: 'user-1', semana: semanaAtual, divisao: 'bronze', xp_semana: 0 }), // releitura
        ok(null), // update do xp
      ],
      ligas_jogador: [
        ok(null), // select: sem jogador ainda
        ok(null), // upsert bronze
        ok({ user_id: 'user-1', divisao: 'bronze' }), // releitura pós-fechamento
      ],
    });

    await registrarXpNaLiga('user-1', 10);

    expect(mock.chainsPara('ligas_jogador')[1].upsert).toHaveBeenCalledWith(
      { user_id: 'user-1', divisao: 'bronze' },
      { onConflict: 'user_id', ignoreDuplicates: true }
    );
    expect(mock.chainsPara('ligas_semana')[2].upsert).toHaveBeenCalledWith(
      { user_id: 'user-1', semana: semanaAtual, divisao: 'bronze', xp_semana: 0 },
      { onConflict: 'user_id,semana', ignoreDuplicates: true }
    );
    expect(mock.chainsPara('ligas_semana')[4].update).toHaveBeenCalledWith({ xp_semana: 10 });
    expect(mock.chainsPara('transacoes_fichas')).toHaveLength(0);
  });

  it('virada de semana: quem termina no topo da divisão promove e ganha 20 fichas', async () => {
    const cohort = [
      { user_id: 'user-1', xp_semana: 80 },
      { user_id: 'user-2', xp_semana: 50 },
      { user_id: 'user-3', xp_semana: 40 },
      { user_id: 'user-4', xp_semana: 30 },
      { user_id: 'user-5', xp_semana: 20 },
    ];
    const mock = configurarDb({
      ligas_semana: [
        ok(null), // buscarSemana atual: não existe
        ok({ user_id: 'user-1', semana: '2026-W29', divisao: 'prata', xp_semana: 80 }), // pendente
        ok(cohort), // cohort da semana fechada
        ok([{ user_id: 'user-1', semana: '2026-W29' }]), // update fechada=true (afetou 1 linha)
        ok(null), // upsert do balde novo
        ok({ user_id: 'user-1', semana: semanaAtual, divisao: 'ouro', xp_semana: 0 }), // releitura
        ok(null), // update do xp
      ],
      ligas_jogador: [
        ok({ user_id: 'user-1', divisao: 'prata' }), // garantirJogador inicial
        ok(null), // update de divisão
        ok({ user_id: 'user-1', divisao: 'ouro' }), // releitura pós-fechamento
      ],
      transacoes_fichas: [ok(null)],
    });

    await registrarXpNaLiga('user-1', 15);

    expect(mock.chainsPara('ligas_semana')[3].update).toHaveBeenCalledWith({ fechada: true });
    expect(mock.chainsPara('ligas_jogador')[1].update).toHaveBeenCalledWith(
      expect.objectContaining({ divisao: 'ouro' })
    );
    expect(mock.chainsPara('transacoes_fichas')[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        quantidade: 20,
        motivo: 'liga_semana',
        referencia: '2026-W29',
      })
    );
    expect(mock.chainsPara('ligas_semana')[4].upsert).toHaveBeenCalledWith(
      { user_id: 'user-1', semana: semanaAtual, divisao: 'ouro', xp_semana: 0 },
      { onConflict: 'user_id,semana', ignoreDuplicates: true }
    );
  });

  it('virada de semana: quem termina no fundo rebaixa e ganha só 5 fichas', async () => {
    const cohort = [
      { user_id: 'user-2', xp_semana: 80 },
      { user_id: 'user-3', xp_semana: 50 },
      { user_id: 'user-4', xp_semana: 40 },
      { user_id: 'user-5', xp_semana: 30 },
      { user_id: 'user-1', xp_semana: 5 },
    ];
    const mock = configurarDb({
      ligas_semana: [
        ok(null),
        ok({ user_id: 'user-1', semana: '2026-W29', divisao: 'ouro', xp_semana: 5 }),
        ok(cohort),
        ok([{ user_id: 'user-1', semana: '2026-W29' }]),
        ok(null),
        ok({ user_id: 'user-1', semana: semanaAtual, divisao: 'prata', xp_semana: 0 }),
        ok(null),
      ],
      ligas_jogador: [
        ok({ user_id: 'user-1', divisao: 'ouro' }),
        ok(null),
        ok({ user_id: 'user-1', divisao: 'prata' }),
      ],
      transacoes_fichas: [ok(null)],
    });

    await registrarXpNaLiga('user-1', 3);

    expect(mock.chainsPara('ligas_jogador')[1].update).toHaveBeenCalledWith(
      expect.objectContaining({ divisao: 'prata' })
    );
    expect(mock.chainsPara('transacoes_fichas')[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({ quantidade: 5, motivo: 'liga_semana' })
    );
  });

  it('bronze não rebaixa abaixo de bronze mesmo no fundo da divisão', async () => {
    const cohort = [
      { user_id: 'user-2', xp_semana: 80 },
      { user_id: 'user-1', xp_semana: 1 },
    ];
    const mock = configurarDb({
      ligas_semana: [
        ok(null),
        ok({ user_id: 'user-1', semana: '2026-W29', divisao: 'bronze', xp_semana: 1 }),
        ok(cohort),
        ok([{ user_id: 'user-1', semana: '2026-W29' }]),
        ok(null),
        ok({ user_id: 'user-1', semana: semanaAtual, divisao: 'bronze', xp_semana: 0 }),
        ok(null),
      ],
      ligas_jogador: [
        ok({ user_id: 'user-1', divisao: 'bronze' }),
        ok(null),
        ok({ user_id: 'user-1', divisao: 'bronze' }),
      ],
      transacoes_fichas: [ok(null)],
    });

    await registrarXpNaLiga('user-1', 3);

    expect(mock.chainsPara('ligas_jogador')[1].update).toHaveBeenCalledWith(
      expect.objectContaining({ divisao: 'bronze' })
    );
  });

  it('fechamento concorrente (já fechada por outra requisição) não paga fichas de novo', async () => {
    const mock = configurarDb({
      ligas_semana: [
        ok(null),
        ok({ user_id: 'user-1', semana: '2026-W29', divisao: 'prata', xp_semana: 80 }),
        ok([{ user_id: 'user-1', xp_semana: 80 }]),
        ok([]), // update fechada=true não afetou linha (outra request já fechou)
        ok(null), // upsert do balde novo
        ok({ user_id: 'user-1', semana: semanaAtual, divisao: 'prata', xp_semana: 0 }),
        ok(null),
      ],
      ligas_jogador: [
        ok({ user_id: 'user-1', divisao: 'prata' }),
        ok({ user_id: 'user-1', divisao: 'prata' }), // releitura sem mudança
      ],
    });

    await registrarXpNaLiga('user-1', 5);

    expect(mock.chainsPara('transacoes_fichas')).toHaveLength(0);
    expect(mock.chainsPara('ligas_jogador')).toHaveLength(2); // sem update de divisão
  });
});

describe('statusDaLiga', () => {
  it('devolve divisão, xp da semana, posição e ranking da divisão', async () => {
    configurarDb({
      ligas_semana: [
        ok({ user_id: 'user-1', semana: semanaAtual, divisao: 'ouro', xp_semana: 35 }),
        ok([
          { user_id: 'user-2', xp_semana: 50, profiles: { nome: 'Bea' } },
          { user_id: 'user-1', xp_semana: 35, profiles: { nome: 'Ana' } },
          { user_id: 'user-3', xp_semana: 10, profiles: { nome: 'Cid' } },
        ]),
      ],
    });

    const status = await statusDaLiga('user-1');

    expect(status).toMatchObject({
      semana: semanaAtual,
      divisao: 'ouro',
      xp_semana: 35,
      posicao: 2,
      total_na_divisao: 3,
    });
    expect(status.ranking).toEqual([
      { posicao: 1, user_id: 'user-2', nome: 'Bea', xp_semana: 50 },
      { posicao: 2, user_id: 'user-1', nome: 'Ana', xp_semana: 35 },
      { posicao: 3, user_id: 'user-3', nome: 'Cid', xp_semana: 10 },
    ]);
  });
});
