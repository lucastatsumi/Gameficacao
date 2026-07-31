import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok, fail } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { lancarRaid, raidAtivo, aplicarDano } = await import('./raidService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

const AGORA = new Date('2026-02-10T12:00:00Z');
const FIM_LONGE = new Date(AGORA.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 dias
const FIM_PERTO = new Date(AGORA.getTime() + 10 * 60 * 60 * 1000).toISOString(); // 10h (dentro das 24h)

describe('lancarRaid', () => {
  it('rejeita gestor que não é dono da turma (exigirTurmaDoProfessor)', async () => {
    configurarDb({ turmas: [ok(null)] });
    await expect(lancarRaid('prof-1', 't1', AGORA)).rejects.toMatchObject({ status: 404 });
  });

  it('rejeita turma sem alunos matriculados', async () => {
    configurarDb({
      turmas: [ok({ id: 't1', nome: 'Turma A' })],
      matriculas: [ok([])],
    });
    await expect(lancarRaid('prof-1', 't1', AGORA)).rejects.toMatchObject({ status: 400 });
  });

  it('hp_total = número de membros x 40 e fim = agora + 7 dias', async () => {
    const mock = configurarDb({
      turmas: [ok({ id: 't1', nome: 'Turma A' })],
      matriculas: [ok([{ user_id: 'u1' }, { user_id: 'u2' }, { user_id: 'u3' }])],
      raids: [ok({ id: 'r1', turma_id: 't1', hp_total: 120, hp_atual: 120, status: 'ativo' })],
    });

    const raid = await lancarRaid('prof-1', 't1', AGORA);

    expect(raid.id).toBe('r1');
    const insert = mock.chainsPara('raids')[0].insert;
    expect(insert).toHaveBeenCalledWith({
      turma_id: 't1',
      hp_total: 120,
      hp_atual: 120,
      fim: new Date(AGORA.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'ativo',
      criado_por: 'prof-1',
    });
  });

  it('rejeita lançar um segundo raid ativo para a mesma turma (23505 -> erro amigável)', async () => {
    configurarDb({
      turmas: [ok({ id: 't1', nome: 'Turma A' })],
      matriculas: [ok([{ user_id: 'u1' }])],
      raids: [fail({ code: '23505', message: 'duplicate key' })],
    });

    await expect(lancarRaid('prof-1', 't1', AGORA)).rejects.toMatchObject({ status: 409 });
  });

  it('propaga erro que não seja de colisão do índice único', async () => {
    configurarDb({
      turmas: [ok({ id: 't1', nome: 'Turma A' })],
      matriculas: [ok([{ user_id: 'u1' }])],
      raids: [fail({ code: 'outro-erro' })],
    });

    await expect(lancarRaid('prof-1', 't1', AGORA)).rejects.toBeTruthy();
  });
});

describe('raidAtivo', () => {
  it('rejeita usuário que não é matriculado nem professor da turma (404)', async () => {
    configurarDb({
      matriculas: [ok(null)],
      turmas: [ok(null)],
    });
    await expect(raidAtivo('estranho', 't1')).rejects.toMatchObject({ status: 404 });
  });

  it('permite acesso a aluno matriculado na turma', async () => {
    configurarDb({
      matriculas: [ok({ turma_id: 't1' })],
      raids: [ok(null)],
    });
    expect(await raidAtivo('aluno-1', 't1')).toBeNull();
  });

  it('permite acesso ao professor dono da turma mesmo sem matrícula', async () => {
    configurarDb({
      matriculas: [ok(null)],
      turmas: [ok({ id: 't1' })],
      raids: [ok(null)],
    });
    expect(await raidAtivo('prof-1', 't1')).toBeNull();
  });

  it('retorna null quando a turma não tem raid ativo', async () => {
    configurarDb({
      matriculas: [ok({ turma_id: 't1' })],
      raids: [ok(null)],
    });
    expect(await raidAtivo('aluno-1', 't1')).toBeNull();
  });

  it('devolve o raid com o placar de contribuição somado por jogador (desc)', async () => {
    configurarDb({
      matriculas: [ok({ turma_id: 't1' })],
      raids: [ok({ id: 'r1', turma_id: 't1', hp_atual: 80, hp_total: 120 })],
      raid_contribuicoes: [
        ok([
          { user_id: 'u1', dano: 5, profiles: { nome: 'Ana' } },
          { user_id: 'u2', dano: 10, profiles: { nome: 'Bea' } },
          { user_id: 'u1', dano: 3, profiles: { nome: 'Ana' } },
        ]),
      ],
    });

    const raid = await raidAtivo('aluno-1', 't1');
    expect(raid.hp_atual).toBe(80);
    expect(raid.placar).toEqual([
      { user_id: 'u2', nome: 'Bea', dano_total: 10 },
      { user_id: 'u1', nome: 'Ana', dano_total: 8 },
    ]);
  });
});

describe('aplicarDano', () => {
  it('não toca o banco quando não há tentativa_id', async () => {
    configurarDb({});
    expect(await aplicarDano('u1', undefined, AGORA)).toBeNull();
    expect(db.from).not.toHaveBeenCalled();
  });

  it('não faz nada quando o jogador não está em nenhuma turma', async () => {
    configurarDb({ matriculas: [ok([])] });
    expect(await aplicarDano('u1', 'tent1', AGORA)).toBeNull();
    expect(db.from).toHaveBeenCalledTimes(1); // só a consulta de matrículas
  });

  it('não faz nada quando nenhuma turma do jogador tem raid ativo', async () => {
    const mock = configurarDb({
      matriculas: [ok([{ turma_id: 't1' }])],
      raids: [ok(null)],
    });
    expect(await aplicarDano('u1', 'tent1', AGORA)).toBeNull();
    expect(mock.chainsPara('respostas')).toHaveLength(0);
  });

  it('soma o dano ponderado por dificuldade (só respostas corretas contam)', async () => {
    const mock = configurarDb({
      matriculas: [ok([{ turma_id: 't1' }])],
      raids: [ok({ id: 'r1', turma_id: 't1', hp_atual: 100, fim: FIM_LONGE }), ok(null)],
      respostas: [
        ok([
          { correta: true, questoes: { dificuldade: 'facil' } },
          { correta: true, questoes: { dificuldade: 'media' } },
          { correta: true, questoes: { dificuldade: 'dificil' } },
          { correta: false, questoes: { dificuldade: 'dificil' } }, // errada não conta
        ]),
      ],
      raid_contribuicoes: [ok(null)],
    });

    const resultado = await aplicarDano('u1', 'tent1', AGORA);

    expect(resultado).toEqual({ dano_causado: 7, raid_derrotado: false, raid_id: 'r1' }); // 1+2+4
    const updateHp = mock.chainsPara('raids')[1].update;
    expect(updateHp).toHaveBeenCalledWith({ hp_atual: 93 });
    const insertContribuicao = mock.chainsPara('raid_contribuicoes')[0].insert;
    expect(insertContribuicao).toHaveBeenCalledWith({
      raid_id: 'r1',
      user_id: 'u1',
      dano: 7,
      tentativa_id: 'tent1',
    });
  });

  it('dobra o dano dentro da janela de 24h antes do fim ("enfurece")', async () => {
    configurarDb({
      matriculas: [ok([{ turma_id: 't1' }])],
      raids: [ok({ id: 'r1', turma_id: 't1', hp_atual: 100, fim: FIM_PERTO }), ok(null)],
      respostas: [ok([{ correta: true, questoes: { dificuldade: 'media' } }])], // base = 2
      raid_contribuicoes: [ok(null)],
    });

    const resultado = await aplicarDano('u1', 'tent1', AGORA);
    expect(resultado.dano_causado).toBe(4); // 2 x 2
  });

  it('não dobra o dano fora da janela de 24h', async () => {
    configurarDb({
      matriculas: [ok([{ turma_id: 't1' }])],
      raids: [ok({ id: 'r1', turma_id: 't1', hp_atual: 100, fim: FIM_LONGE }), ok(null)],
      respostas: [ok([{ correta: true, questoes: { dificuldade: 'media' } }])], // base = 2
      raid_contribuicoes: [ok(null)],
    });

    const resultado = await aplicarDano('u1', 'tent1', AGORA);
    expect(resultado.dano_causado).toBe(2);
  });

  it('não toca o HP nem insere contribuição quando o dano é 0 (tudo errado)', async () => {
    const mock = configurarDb({
      matriculas: [ok([{ turma_id: 't1' }])],
      raids: [ok({ id: 'r1', turma_id: 't1', hp_atual: 50, fim: FIM_LONGE })],
      respostas: [ok([{ correta: false, questoes: { dificuldade: 'dificil' } }])],
    });

    expect(await aplicarDano('u1', 'tent1', AGORA)).toBeNull();
    expect(mock.chainsPara('raids')).toHaveLength(1); // só a leitura do raid ativo, sem update
    expect(mock.chainsPara('raid_contribuicoes')).toHaveLength(0);
  });

  it('HP nunca fica negativo: derrota flipa o status uma vez e credita fichas a TODOS os membros; segunda corrida (0 linhas afetadas) não paga de novo', async () => {
    const mock = configurarDb({
      matriculas: [
        ok([{ turma_id: 't1' }]), // turmasDoUsuario (1ª chamada)
        ok([{ user_id: 'u1' }, { user_id: 'u2' }]), // membrosDaTurma (recompensa da 1ª chamada)
        ok([{ turma_id: 't1' }]), // turmasDoUsuario (2ª chamada)
      ],
      raids: [
        ok({ id: 'r1', turma_id: 't1', hp_atual: 3, fim: FIM_LONGE }), // fetch raid ativo (1ª chamada)
        ok(null), // update hp_atual (1ª chamada)
        ok([{ id: 'r1' }]), // tentarDerrotarRaid: 1 linha afetada (1ª chamada VENCE a corrida)
        ok({ id: 'r1', turma_id: 't1', hp_atual: 0, fim: FIM_LONGE }), // fetch raid ativo (2ª chamada — ainda "ativo" no mock)
        ok(null), // update hp_atual (2ª chamada)
        ok([]), // tentarDerrotarRaid: 0 linhas afetadas (2ª chamada PERDE a corrida)
      ],
      respostas: [
        ok([{ correta: true, questoes: { dificuldade: 'dificil' } }]), // dano 4 (1ª chamada)
        ok([{ correta: true, questoes: { dificuldade: 'facil' } }]), // dano 1 (2ª chamada)
      ],
      raid_contribuicoes: [ok(null), ok(null)],
      transacoes_fichas: [ok(null), ok(null)],
    });

    const primeira = await aplicarDano('u1', 'tent1', AGORA);
    expect(primeira).toEqual({ dano_causado: 4, raid_derrotado: true, raid_id: 'r1' });

    // hp_atual não pode ficar negativo (3 - 4 = -1 -> floor em 0)
    const updateHpPrimeira = mock.chainsPara('raids')[1].update;
    expect(updateHpPrimeira).toHaveBeenCalledWith({ hp_atual: 0 });

    const chamadasFichas = mock.chainsPara('transacoes_fichas').map((c) => c.insert.mock.calls[0][0]);
    expect(chamadasFichas).toEqual([
      { user_id: 'u1', quantidade: 20, motivo: 'raid_derrotado', referencia: 'r1' },
      { user_id: 'u2', quantidade: 20, motivo: 'raid_derrotado', referencia: 'r1' },
    ]);

    const segunda = await aplicarDano('u1', 'tent2', AGORA);
    expect(segunda).toEqual({ dano_causado: 1, raid_derrotado: false, raid_id: 'r1' });

    // nenhuma ficha extra foi concedida pela segunda chamada (perdeu a corrida)
    expect(mock.chainsPara('transacoes_fichas')).toHaveLength(2);
  });
});
