import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';
import { semanaIsoDe } from '../utils/semana.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { registrarXpNaLiga, classificacaoDaLiga, fecharSemanaDaDivisao, calcularFichasPorPosicao } =
  await import('./ligaService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

const SEMANA_ATUAL = semanaIsoDe();
const SEMANA_PASSADA = '2000-W01';

describe('calcularFichasPorPosicao', () => {
  it('interpola linearmente entre o topo e a base pela posição', () => {
    expect(calcularFichasPorPosicao(1, 5)).toBe(20); // 1º lugar: topo
    expect(calcularFichasPorPosicao(5, 5)).toBe(5); // último: base
    expect(calcularFichasPorPosicao(2, 5)).toBe(16);
    expect(calcularFichasPorPosicao(3, 5)).toBe(13);
    expect(calcularFichasPorPosicao(4, 5)).toBe(9);
  });

  it('divisão com 1 único membro leva o valor do topo', () => {
    expect(calcularFichasPorPosicao(1, 1)).toBe(20);
  });

  it('sem membros não paga nada', () => {
    expect(calcularFichasPorPosicao(1, 0)).toBe(0);
  });
});

describe('registrarXpNaLiga', () => {
  it('mesma semana: só soma o XP ao acumulado, sem mexer em divisão', async () => {
    const linhaExistente = { user_id: 'A', divisao: 'bronze', xp_semana: 30, semana: SEMANA_ATUAL };
    const mock = configurarDb({
      ligas_semana: [ok(linhaExistente), ok({ ...linhaExistente, xp_semana: 45 })],
    });

    const resultado = await registrarXpNaLiga('A', 15);
    expect(resultado.xp_semana).toBe(45);
    expect(mock.chainsPara('ligas_semana')[1].update).toHaveBeenCalledWith({ xp_semana: 45 });
  });

  it('jogador novo é criado em bronze, na semana corrente, sem precisar fechar nada', async () => {
    const criada = { user_id: 'B', divisao: 'bronze', xp_semana: 0, semana: SEMANA_ATUAL };
    const mock = configurarDb({
      ligas_semana: [ok(null), ok(criada), ok({ ...criada, xp_semana: 10 })],
    });

    const resultado = await registrarXpNaLiga('B', 10);
    expect(mock.chainsPara('ligas_semana')[1].insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'B', divisao: 'bronze', xp_semana: 0, semana: SEMANA_ATUAL })
    );
    expect(resultado.xp_semana).toBe(10);
  });

  it('xp_ganho <= 0 não altera a linha (regra anti-farming herdada)', async () => {
    const linha = { user_id: 'A', divisao: 'bronze', xp_semana: 30, semana: SEMANA_ATUAL };
    const mock = configurarDb({ ligas_semana: [ok(linha)] });

    const resultado = await registrarXpNaLiga('A', 0);
    expect(resultado).toEqual(linha);
    expect(mock.chainsPara('ligas_semana')).toHaveLength(1); // só a leitura, nenhum update
  });

  it('virada de semana: fecha a divisão inteira (promove topo, rebaixa base, paga fichas por posição)', async () => {
    // 5 membros da divisão bronze na semana passada, em ordem embaralhada
    // de propósito — a função precisa ordenar por xp_semana ela mesma.
    const membros = [
      { user_id: 'D', xp_semana: 20 },
      { user_id: 'B', xp_semana: 80 },
      { user_id: 'E', xp_semana: 0 },
      { user_id: 'A', xp_semana: 100 },
      { user_id: 'C', xp_semana: 50 },
    ];

    const mock = configurarDb({
      ligas_semana: [
        ok({ user_id: 'A', divisao: 'bronze', xp_semana: 100, semana: SEMANA_PASSADA }), // 1: linha de A
        ok(membros), // 2: membros da divisão a fechar
        ok(null), // 3: update A (rank 1, promove)
        ok(null), // 4: update B (rank 2)
        ok(null), // 5: update C (rank 3)
        ok(null), // 6: update D (rank 4)
        ok(null), // 7: update E (rank 5, sem xp — rebaixaria, mas já é bronze)
        ok({ user_id: 'A', divisao: 'prata', xp_semana: 0, semana: SEMANA_ATUAL }), // 8: refetch de A
        ok({ user_id: 'A', divisao: 'prata', xp_semana: 15, semana: SEMANA_ATUAL }), // 9: update final (+15 XP)
      ],
      transacoes_fichas: [ok(null), ok(null), ok(null), ok(null)], // A, B, C, D — E não pontuou
    });

    const resultado = await registrarXpNaLiga('A', 15);

    expect(resultado).toMatchObject({ divisao: 'prata', xp_semana: 15, semana: SEMANA_ATUAL });

    const updatesLigas = mock.chainsPara('ligas_semana').slice(2, 7); // as 5 atualizações de fechamento
    expect(updatesLigas[0].update).toHaveBeenCalledWith({
      divisao: 'prata',
      xp_semana: 0,
      semana: SEMANA_ATUAL,
    }); // A: rank 1 de 5 -> top 20% promove
    expect(updatesLigas[1].update).toHaveBeenCalledWith({
      divisao: 'bronze',
      xp_semana: 0,
      semana: SEMANA_ATUAL,
    }); // B: meio da tabela, mantém
    expect(updatesLigas[4].update).toHaveBeenCalledWith({
      divisao: 'bronze', // E: rebaixaria, mas já é a divisão mais baixa
      xp_semana: 0,
      semana: SEMANA_ATUAL,
    });

    const fichas = mock.chainsPara('transacoes_fichas').map((c) => c.insert.mock.calls[0][0]);
    expect(fichas).toEqual([
      expect.objectContaining({ user_id: 'A', quantidade: 20, motivo: 'liga_semanal' }),
      expect.objectContaining({ user_id: 'B', quantidade: 16, motivo: 'liga_semanal' }),
      expect.objectContaining({ user_id: 'C', quantidade: 13, motivo: 'liga_semanal' }),
      expect.objectContaining({ user_id: 'D', quantidade: 9, motivo: 'liga_semanal' }),
    ]); // E fica de fora: xp_semana 0 não paga
  });
});

describe('fecharSemanaDaDivisao', () => {
  it('divisão já fechada por outra requisição vira no-op', async () => {
    const mock = configurarDb({ ligas_semana: [ok([])] });

    await fecharSemanaDaDivisao('bronze', SEMANA_PASSADA, SEMANA_ATUAL);
    expect(mock.chainsPara('ligas_semana')).toHaveLength(1); // só a leitura vazia
    expect(mock.chainsPara('transacoes_fichas')).toHaveLength(0);
  });
});

describe('classificacaoDaLiga', () => {
  it('devolve a divisão do jogador com o ranking ordenado pelo xp da semana', async () => {
    const minha = { user_id: 'A', divisao: 'ouro', xp_semana: 40, semana: SEMANA_ATUAL };
    const ranking = [
      { user_id: 'A', xp_semana: 40, profiles: { nome: 'Ana' } },
      { user_id: 'C', xp_semana: 10, profiles: { nome: 'Caio' } },
    ];
    const mock = configurarDb({ ligas_semana: [ok(minha), ok(ranking)] });

    const resultado = await classificacaoDaLiga('A');
    expect(resultado.divisao).toBe('ouro');
    expect(resultado.xp_semana).toBe(40);
    expect(resultado.ranking).toEqual([
      { posicao: 1, nome: 'Ana', xp_semana: 40, voce: true },
      { posicao: 2, nome: 'Caio', xp_semana: 10, voce: false },
    ]);
    expect(mock.chainsPara('ligas_semana')[1].order).toHaveBeenCalledWith('xp_semana', {
      ascending: false,
    });
  });
});
