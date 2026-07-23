import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));
vi.mock('../utils/semana.js', () => ({ semanaAtual: () => '2026-W30' }));

const { db } = await import('../config/supabase.js');
const { minhaLiga, registrarXpNaLiga, rankingDaLiga, FICHAS_PROMOVIDO, FICHAS_MEIO, FICHAS_REBAIXADO } =
  await import('./ligaService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

describe('minhaLiga', () => {
  it('primeiro acesso: cria linha em bronze na semana atual', async () => {
    const criada = { user_id: 'u1', divisao: 'bronze', xp_semana: 0, semana: '2026-W30' };
    const mock = configurarDb({
      ligas_semana: [ok(null), ok(criada)], // busca (nada) -> insert+select
    });

    const liga = await minhaLiga('u1');
    expect(liga).toEqual({ divisao: 'bronze', xp_semana: 0, semana: '2026-W30' });
    expect(mock.chainsPara('ligas_semana')[1].insert).toHaveBeenCalledWith({
      user_id: 'u1',
      divisao: 'bronze',
      xp_semana: 0,
      semana: '2026-W30',
    });
  });

  it('já em dia na semana atual: devolve direto, sem fechar nada', async () => {
    const linha = { user_id: 'u1', divisao: 'prata', xp_semana: 40, semana: '2026-W30' };
    const mock = configurarDb({ ligas_semana: [ok(linha)] });

    const liga = await minhaLiga('u1');
    expect(liga).toEqual({ divisao: 'prata', xp_semana: 40, semana: '2026-W30' });
    expect(mock.chainsPara('ligas_semana')).toHaveLength(1);
  });

  it('semana virou e o jogador está sozinho na divisão: sem promoção/rebaixamento, ganha fichas do meio', async () => {
    const antiga = { user_id: 'u1', divisao: 'bronze', xp_semana: 30, semana: '2026-W29' };
    const membros = [{ user_id: 'u1', xp_semana: 30 }];
    const reaberta = { user_id: 'u1', divisao: 'bronze', xp_semana: 0, semana: '2026-W30' };
    const mock = configurarDb({
      ligas_semana: [
        ok(antiga), // buscarOuCriar -> já existe
        ok(membros), // fecharSemana: membros da divisão na semana antiga
        ok(null), // update do fechamento
        ok(reaberta), // releitura final
      ],
      transacoes_fichas: [ok(null)],
    });

    const liga = await minhaLiga('u1');
    expect(liga).toEqual({ divisao: 'bronze', xp_semana: 0, semana: '2026-W30' });

    expect(mock.chainsPara('ligas_semana')[2].update).toHaveBeenCalledWith({
      divisao: 'bronze',
      xp_semana: 0,
      semana: '2026-W30',
    });
    expect(mock.chainsPara('transacoes_fichas')[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({ quantidade: FICHAS_MEIO, motivo: 'liga_semana', referencia: 'bronze' })
    );
  });

  it('fecha a semana promovendo o top 20% e rebaixando o bottom 20% de 5 jogadores', async () => {
    const antiga = { user_id: 'u3', divisao: 'prata', xp_semana: 50, semana: '2026-W29' };
    const membros = [
      { user_id: 'u1', xp_semana: 100 }, // 1º -> promovido
      { user_id: 'u2', xp_semana: 80 }, // 2º -> meio
      { user_id: 'u3', xp_semana: 50 }, // 3º -> meio
      { user_id: 'u4', xp_semana: 20 }, // 4º -> meio
      { user_id: 'u5', xp_semana: 5 }, // 5º -> rebaixado
    ];
    const reaberta = { user_id: 'u3', divisao: 'prata', xp_semana: 0, semana: '2026-W30' };
    const mock = configurarDb({
      ligas_semana: [
        ok(antiga),
        ok(membros),
        ok(null), // update u1
        ok(null), // update u2
        ok(null), // update u3
        ok(null), // update u4
        ok(null), // update u5
        ok(reaberta),
      ],
      transacoes_fichas: [ok(null), ok(null), ok(null), ok(null), ok(null)],
    });

    await minhaLiga('u3');

    const updates = mock.chainsPara('ligas_semana').slice(2, 7).map((c) => c.update.mock.calls[0][0]);
    expect(updates[0]).toMatchObject({ divisao: 'ouro' }); // u1 promovido
    expect(updates[1]).toMatchObject({ divisao: 'prata' }); // u2 meio
    expect(updates[2]).toMatchObject({ divisao: 'prata' }); // u3 meio
    expect(updates[3]).toMatchObject({ divisao: 'prata' }); // u4 meio
    expect(updates[4]).toMatchObject({ divisao: 'bronze' }); // u5 rebaixado

    const fichas = mock.chainsPara('transacoes_fichas').map((c) => c.insert.mock.calls[0][0].quantidade);
    expect(fichas).toEqual([FICHAS_PROMOVIDO, FICHAS_MEIO, FICHAS_MEIO, FICHAS_MEIO, FICHAS_REBAIXADO]);
  });

  it('bronze não rebaixa mais e diamante não promove mais', async () => {
    const antigaBronze = { user_id: 'u2', divisao: 'bronze', xp_semana: 1, semana: '2026-W29' };
    const membrosBronze = [
      { user_id: 'u1', xp_semana: 10 },
      { user_id: 'u2', xp_semana: 1 },
    ];
    const mock = configurarDb({
      ligas_semana: [
        ok(antigaBronze),
        ok(membrosBronze),
        ok(null),
        ok(null),
        ok({ user_id: 'u2', divisao: 'bronze', xp_semana: 0, semana: '2026-W30' }),
      ],
      transacoes_fichas: [ok(null), ok(null)],
    });

    await minhaLiga('u2');
    const updates = mock.chainsPara('ligas_semana').slice(2, 4).map((c) => c.update.mock.calls[0][0]);
    expect(updates[1]).toMatchObject({ divisao: 'bronze' }); // não pode cair de bronze
  });

  it('já fechada por outra requisição concorrente: não reprocessa', async () => {
    const antiga = { user_id: 'u1', divisao: 'bronze', xp_semana: 30, semana: '2026-W29' };
    const reaberta = { user_id: 'u1', divisao: 'bronze', xp_semana: 0, semana: '2026-W30' };
    const mock = configurarDb({
      ligas_semana: [
        ok(antiga),
        ok([]), // ninguém mais com a semana antiga: já fechou
        ok(reaberta),
      ],
    });

    const liga = await minhaLiga('u1');
    expect(liga.semana).toBe('2026-W30');
    expect(mock.chainsPara('transacoes_fichas')).toHaveLength(0);
  });
});

describe('registrarXpNaLiga', () => {
  it('soma xp_ganho ao acumulado da semana', async () => {
    const linha = { user_id: 'u1', divisao: 'bronze', xp_semana: 10, semana: '2026-W30' };
    const mock = configurarDb({
      ligas_semana: [ok(linha), ok(null)], // minhaLiga (já em dia) -> update
    });

    const liga = await registrarXpNaLiga('u1', { xp_ganho: 25 });
    expect(liga.xp_semana).toBe(35);
    expect(mock.chainsPara('ligas_semana')[1].update).toHaveBeenCalledWith({ xp_semana: 35 });
  });

  it('xp_ganho zero (repetição sem recorde): não atualiza nada', async () => {
    const linha = { user_id: 'u1', divisao: 'bronze', xp_semana: 10, semana: '2026-W30' };
    const mock = configurarDb({ ligas_semana: [ok(linha)] });

    const liga = await registrarXpNaLiga('u1', { xp_ganho: 0 });
    expect(liga.xp_semana).toBe(10);
    expect(mock.chainsPara('ligas_semana')).toHaveLength(1);
  });
});

describe('rankingDaLiga', () => {
  it('lista a divisão do jogador ordenada por xp_semana, marcando "voce"', async () => {
    const linha = { user_id: 'u2', divisao: 'prata', xp_semana: 20, semana: '2026-W30' };
    const listagem = [
      { user_id: 'u1', xp_semana: 40, profiles: { nome: 'Ana' } },
      { user_id: 'u2', xp_semana: 20, profiles: { nome: 'Bea' } },
    ];
    configurarDb({
      ligas_semana: [ok(linha), ok(listagem)],
    });

    const resultado = await rankingDaLiga('u2');
    expect(resultado.divisao).toBe('prata');
    expect(resultado.ranking).toEqual([
      { posicao: 1, nome: 'Ana', xp_semana: 40, voce: false },
      { posicao: 2, nome: 'Bea', xp_semana: 20, voce: true },
    ]);
  });
});
