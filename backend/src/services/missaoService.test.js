import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { missoesDoDia, registrarQuizNasMissoes } = await import('./missaoService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

const CATALOGO = [
  { id: 1, chave: 'acertos_5', tipo: 'acertos_dia', descricao: 'Acerte 5', parametro: 5, recompensa_fichas: 10 },
  { id: 2, chave: 'aprovar_1', tipo: 'aprovar_quiz', descricao: 'Aprove 1', parametro: 1, recompensa_fichas: 10 },
  { id: 3, chave: 'sem_dica_1', tipo: 'quiz_sem_dica', descricao: 'Sem dica', parametro: 1, recompensa_fichas: 15 },
  { id: 4, chave: 'poder_1', tipo: 'usar_poder', descricao: 'Use poder', parametro: 1, recompensa_fichas: 5 },
];

function atribuida(missao, extra = {}) {
  return {
    missao_id: missao.id,
    dia: '2026-07-18',
    progresso: 0,
    concluida: false,
    missoes_catalogo: {
      chave: missao.chave,
      tipo: missao.tipo,
      descricao: missao.descricao,
      parametro: missao.parametro,
      recompensa_fichas: missao.recompensa_fichas,
    },
    ...extra,
  };
}

describe('missoesDoDia', () => {
  it('sorteio do primeiro acesso é determinístico e grava 3 missões', async () => {
    const atribuicoes = [atribuida(CATALOGO[0]), atribuida(CATALOGO[1]), atribuida(CATALOGO[2])];
    const mock = configurarDb({
      missoes_do_dia: [ok([]), ok(null), ok(atribuicoes)], // vazio -> upsert -> releitura
      missoes_catalogo: [ok(CATALOGO)],
    });

    const missoes = await missoesDoDia('user-1');
    expect(missoes).toHaveLength(3);

    const upsert = mock.chainsPara('missoes_do_dia')[1].upsert;
    expect(upsert).toHaveBeenCalledTimes(1);
    const linhas = upsert.mock.calls[0][0];
    expect(linhas).toHaveLength(3);
    expect(new Set(linhas.map((l) => l.missao_id)).size).toBe(3); // sem repetição
  });

  it('já atribuídas hoje: devolve direto, sem sortear de novo', async () => {
    const mock = configurarDb({
      missoes_do_dia: [ok([atribuida(CATALOGO[0], { progresso: 3 })])],
    });

    const missoes = await missoesDoDia('user-1');
    expect(missoes[0]).toMatchObject({ chave: 'acertos_5', progresso: 3, parametro: 5 });
    expect(mock.chainsPara('missoes_catalogo')).toHaveLength(0);
  });
});

describe('registrarQuizNasMissoes', () => {
  const resultadoBase = { acertos: 3, aprovada: true, sem_dica: false };

  it('acumula progresso sem concluir e não paga fichas', async () => {
    const mock = configurarDb({
      missoes_do_dia: [ok([atribuida(CATALOGO[0])]), ok(null)], // busca + update
    });

    const concluidas = await registrarQuizNasMissoes('user-1', resultadoBase, 't1');
    expect(concluidas).toEqual([]);
    expect(mock.chainsPara('missoes_do_dia')[1].update).toHaveBeenCalledWith({
      progresso: 3,
      concluida: false,
    });
    expect(mock.chainsPara('transacoes_fichas')).toHaveLength(0);
  });

  it('concluir paga fichas uma única vez e devolve a missão para a celebração', async () => {
    const mock = configurarDb({
      missoes_do_dia: [ok([atribuida(CATALOGO[0], { progresso: 4 })]), ok(null)],
      transacoes_fichas: [ok(null)],
    });

    const concluidas = await registrarQuizNasMissoes('user-1', resultadoBase, 't1');
    expect(concluidas).toEqual([
      { chave: 'acertos_5', descricao: 'Acerte 5', recompensa_fichas: 10 },
    ]);
    expect(mock.chainsPara('missoes_do_dia')[1].update).toHaveBeenCalledWith({
      progresso: 5, // trava no parametro mesmo com acertos sobrando
      concluida: true,
    });
    expect(mock.chainsPara('transacoes_fichas')[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({ quantidade: 10, motivo: 'missao', referencia: 'acertos_5' })
    );
  });

  it('missão já concluída não progride nem paga de novo', async () => {
    const mock = configurarDb({
      missoes_do_dia: [ok([atribuida(CATALOGO[0], { progresso: 5, concluida: true })])],
    });

    expect(await registrarQuizNasMissoes('user-1', resultadoBase, 't1')).toEqual([]);
    expect(mock.chainsPara('missoes_do_dia')).toHaveLength(1); // só a leitura
  });

  it('quiz_sem_dica exige aprovação E sem_dica do resultado', async () => {
    const mock = configurarDb({
      missoes_do_dia: [ok([atribuida(CATALOGO[2])])],
    });
    await registrarQuizNasMissoes('user-1', { ...resultadoBase, sem_dica: false }, 't1');
    expect(mock.chainsPara('missoes_do_dia')).toHaveLength(1); // nenhum update

    const mock2 = configurarDb({
      missoes_do_dia: [ok([atribuida(CATALOGO[2])]), ok(null)],
      transacoes_fichas: [ok(null)],
    });
    const concluidas = await registrarQuizNasMissoes(
      'user-1',
      { ...resultadoBase, sem_dica: true },
      't1'
    );
    expect(concluidas[0].chave).toBe('sem_dica_1');
    expect(mock2.chainsPara('transacoes_fichas')).toHaveLength(1);
  });

  it('usar_poder só consulta poderes_usados quando a missão está pendente, e conta a tentativa', async () => {
    const mock = configurarDb({
      missoes_do_dia: [ok([atribuida(CATALOGO[3])]), ok(null)],
      poderes_usados: [ok([{ id: 'p1' }])],
      transacoes_fichas: [ok(null)],
    });

    const concluidas = await registrarQuizNasMissoes('user-1', resultadoBase, 't1');
    expect(concluidas[0].chave).toBe('poder_1');
    expect(mock.chainsPara('poderes_usados')).toHaveLength(1);
  });
});
