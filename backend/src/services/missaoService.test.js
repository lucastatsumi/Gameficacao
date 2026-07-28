import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fail, makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const {
  missoesDoDia,
  registrarQuizNasMissoes,
  registrarKudosNaMissao,
  missoesDaSemana,
  registrarQuizNasMissoesSemanais,
} = await import('./missaoService.js');

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
  { id: 5, chave: 'kudos_1', tipo: 'dar_kudos', descricao: 'Reconheça um colega', parametro: 1, recompensa_fichas: 8 },
  { id: 6, chave: 'kudos_2', tipo: 'dar_kudos', descricao: 'Reconheça 2 colegas', parametro: 2, recompensa_fichas: 12 },
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

const AGORA_SEMANA = new Date('2026-07-25T12:00:00Z'); // semanaIso -> '2026-W30'

const CATALOGO_SEMANA = [
  {
    id: 7,
    chave: 'acertos_semana_15',
    tipo: 'acertos_semana',
    descricao: 'Acumule 15 acertos na semana',
    parametro: 15,
    recompensa_fichas: 20,
    item_recompensa_id: 9,
  },
];

function atribuidaSemana(missao, extra = {}) {
  return {
    missao_id: missao.id,
    semana: '2026-W30',
    progresso: 0,
    concluida: false,
    missoes_catalogo: {
      chave: missao.chave,
      tipo: missao.tipo,
      descricao: missao.descricao,
      parametro: missao.parametro,
      recompensa_fichas: missao.recompensa_fichas,
      item_recompensa_id: missao.item_recompensa_id,
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

describe('registrarKudosNaMissao', () => {
  it('sem missão dar_kudos pendente hoje: não toca o banco de novo', async () => {
    const mock = configurarDb({
      missoes_do_dia: [ok([atribuida(CATALOGO[0])])], // só uma missão sorteada, e não é kudos
    });

    expect(await registrarKudosNaMissao('user-1')).toBeNull();
    expect(mock.chainsPara('missoes_do_dia')).toHaveLength(1); // só a leitura
  });

  it('progride sem concluir e não paga fichas', async () => {
    const mock = configurarDb({
      missoes_do_dia: [ok([atribuida(CATALOGO[5])]), ok(null)],
    });

    expect(await registrarKudosNaMissao('user-1')).toBeNull();
    expect(mock.chainsPara('missoes_do_dia')[1].update).toHaveBeenCalledWith({
      progresso: 1,
      concluida: false,
    });
    expect(mock.chainsPara('transacoes_fichas')).toHaveLength(0);
  });

  it('concluir paga fichas e devolve a missão', async () => {
    const mock = configurarDb({
      missoes_do_dia: [ok([atribuida(CATALOGO[4])]), ok(null)],
      transacoes_fichas: [ok(null)],
    });

    const concluida = await registrarKudosNaMissao('user-1');
    expect(concluida).toEqual({
      chave: 'kudos_1',
      descricao: 'Reconheça um colega',
      recompensa_fichas: 8,
    });
    expect(mock.chainsPara('missoes_do_dia')[1].update).toHaveBeenCalledWith({
      progresso: 1,
      concluida: true,
    });
    expect(mock.chainsPara('transacoes_fichas')[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({ quantidade: 8, motivo: 'missao', referencia: 'kudos_1' })
    );
  });

  it('missão já concluída não progride nem paga de novo', async () => {
    const mock = configurarDb({
      missoes_do_dia: [ok([atribuida(CATALOGO[4], { progresso: 1, concluida: true })])],
    });

    expect(await registrarKudosNaMissao('user-1')).toBeNull();
    expect(mock.chainsPara('missoes_do_dia')).toHaveLength(1);
  });
});

describe('missoesDaSemana', () => {
  it('primeiro acesso da semana atribui todo o catálogo periodo=semana', async () => {
    const mock = configurarDb({
      missoes_da_semana: [ok([]), ok(null), ok([atribuidaSemana(CATALOGO_SEMANA[0])])],
      missoes_catalogo: [ok(CATALOGO_SEMANA)],
    });

    const missoes = await missoesDaSemana('user-1', AGORA_SEMANA);
    expect(missoes).toHaveLength(1);
    expect(missoes[0]).toMatchObject({ chave: 'acertos_semana_15', semana: '2026-W30' });

    const [selectChain] = mock.chainsPara('missoes_catalogo');
    expect(selectChain.eq).toHaveBeenCalledWith('periodo', 'semana');

    const upsert = mock.chainsPara('missoes_da_semana')[1].upsert;
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert.mock.calls[0][0]).toEqual([{ user_id: 'user-1', missao_id: 7, semana: '2026-W30' }]);
  });

  it('já atribuída na semana: devolve direto, sem sortear de novo', async () => {
    const mock = configurarDb({
      missoes_da_semana: [ok([atribuidaSemana(CATALOGO_SEMANA[0], { progresso: 6 })])],
    });

    const missoes = await missoesDaSemana('user-1', AGORA_SEMANA);
    expect(missoes[0]).toMatchObject({ chave: 'acertos_semana_15', progresso: 6, parametro: 15 });
    expect(mock.chainsPara('missoes_catalogo')).toHaveLength(0);
  });
});

describe('registrarQuizNasMissoesSemanais', () => {
  const resultadoBase = { acertos: 10 };

  it('acumula progresso sem concluir e não paga fichas nem concede item', async () => {
    const mock = configurarDb({
      missoes_da_semana: [ok([atribuidaSemana(CATALOGO_SEMANA[0])]), ok(null)],
    });

    const concluidas = await registrarQuizNasMissoesSemanais('user-1', resultadoBase, AGORA_SEMANA);
    expect(concluidas).toEqual([]);
    expect(mock.chainsPara('missoes_da_semana')[1].update).toHaveBeenCalledWith({
      progresso: 10,
      concluida: false,
    });
    expect(mock.chainsPara('transacoes_fichas')).toHaveLength(0);
    expect(mock.chainsPara('itens_do_jogador')).toHaveLength(0);
  });

  it('concluir paga fichas e concede o cosmético exclusivo uma única vez', async () => {
    const mock = configurarDb({
      missoes_da_semana: [ok([atribuidaSemana(CATALOGO_SEMANA[0], { progresso: 8 })]), ok(null)],
      transacoes_fichas: [ok(null)],
      itens_do_jogador: [ok(null)],
    });

    const concluidas = await registrarQuizNasMissoesSemanais('user-1', resultadoBase, AGORA_SEMANA);
    expect(concluidas).toEqual([
      {
        chave: 'acertos_semana_15',
        descricao: 'Acumule 15 acertos na semana',
        recompensa_fichas: 20,
        item_concedido: true,
      },
    ]);
    expect(mock.chainsPara('missoes_da_semana')[1].update).toHaveBeenCalledWith({
      progresso: 15, // trava no parametro mesmo com acertos sobrando
      concluida: true,
    });
    expect(mock.chainsPara('transacoes_fichas')[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({ quantidade: 20, motivo: 'missao_semanal', referencia: 'acertos_semana_15' })
    );
    expect(mock.chainsPara('itens_do_jogador')[0].insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      item_id: 9,
    });
  });

  it('cosmético já possuído (semana anterior) não falha — ignora o conflito 23505', async () => {
    const mock = configurarDb({
      missoes_da_semana: [ok([atribuidaSemana(CATALOGO_SEMANA[0], { progresso: 14 })]), ok(null)],
      transacoes_fichas: [ok(null)],
      itens_do_jogador: [fail({ code: '23505' })],
    });

    const concluidas = await registrarQuizNasMissoesSemanais('user-1', resultadoBase, AGORA_SEMANA);
    expect(concluidas[0].chave).toBe('acertos_semana_15');
    expect(mock.chainsPara('itens_do_jogador')).toHaveLength(1);
  });

  it('missão já concluída não progride nem paga de novo', async () => {
    const mock = configurarDb({
      missoes_da_semana: [ok([atribuidaSemana(CATALOGO_SEMANA[0], { progresso: 15, concluida: true })])],
    });

    expect(await registrarQuizNasMissoesSemanais('user-1', resultadoBase, AGORA_SEMANA)).toEqual([]);
    expect(mock.chainsPara('missoes_da_semana')).toHaveLength(1); // só a leitura
  });
});
