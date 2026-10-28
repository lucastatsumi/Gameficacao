import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok, fail } from '../test/dbMock.js';

// Cartas (4.9), prestígio (4.11), torneio entre equipes, resultado de
// desafio e campanhas — o resto do Horizonte 4.

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));
vi.mock('./temaService.js', () => ({
  temasVisiveis: vi.fn(async () => [{ id: 2, nome: 'LGPD' }]),
  exigirTemaVisivel: vi.fn(async () => {}),
}));
vi.mock('./badgeService.js', () => ({
  verificarBadges: vi.fn(async (_id, ctx) =>
    ctx.albunsCompletos || ctx.ciclosPrestigio || ctx.campanhasCumpridas ? [{ id: 99, nome: 'Badge' }] : []
  ),
}));
vi.mock('./fichaService.js', () => ({ concederFichas: vi.fn(async () => {}) }));
vi.mock('./eventoService.js', () => ({ criarEvento: vi.fn(async () => ({ id: 7 })) }));

const { db } = await import('../config/supabase.js');
const { verificarBadges } = await import('./badgeService.js');
const { concederFichas } = await import('./fichaService.js');
const { revelarCartas, album } = await import('./cartaService.js');
const { prestigiar, modificadoresDaFase } = await import('./prestigioService.js');
const { montarPlacar, torneiosDoTenant, criarTorneio } = await import('./torneioService.js');
const { registrarResultado } = await import('./desafioService.js');
const { criarCampanha } = await import('./campanhaService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

const competencias = [
  { id: 10, nome: 'Bases legais', tema_id: 2, resumo: 'verso 10' },
  { id: 11, nome: 'Incidentes', tema_id: 2, resumo: 'verso 11' },
];

describe('cartas colecionáveis', () => {
  it('revela só a competência dominada e ainda não revelada', async () => {
    const mock = configurarDb({
      desempenho_competencias: [
        ok([
          { competencia_id: 10, total: 5, acertos: 5 },
          { competencia_id: 11, total: 5, acertos: 2 },
        ]),
      ],
      cartas_do_jogador: [ok([]), ok(null)],
      competencias: [ok(competencias)],
    });
    const r = await revelarCartas({ id: 'u1' });
    expect(r.cartas_novas).toEqual([{ id: 10, nome: 'Bases legais', tema_id: 2 }]);
    expect(r.badges_novas).toEqual([]); // álbum ainda incompleto
    expect(mock.chainsPara('cartas_do_jogador')[1].upsert).toHaveBeenCalled();
  });

  it('completar o álbum do tema concede a badge', async () => {
    configurarDb({
      desempenho_competencias: [ok([{ competencia_id: 11, total: 6, acertos: 6 }])],
      cartas_do_jogador: [ok([{ competencia_id: 10, revelada_em: '2026-10-01' }]), ok(null)],
      competencias: [ok(competencias)],
    });
    const r = await revelarCartas({ id: 'u1' });
    expect(verificarBadges).toHaveBeenCalledWith('u1', { albunsCompletos: [2] });
    expect(r.badges_novas).toHaveLength(1);
  });

  it('o álbum esconde o verso das cartas não reveladas', async () => {
    configurarDb({
      competencias: [ok(competencias)],
      cartas_do_jogador: [ok([{ competencia_id: 10, revelada_em: '2026-10-01' }])],
    });
    const [tema] = await album({ id: 'u1' });
    expect(tema).toMatchObject({ reveladas: 1, total: 2, completo: false });
    expect(tema.cartas[1]).toMatchObject({ revelada: false, resumo: null });
    expect(tema.cartas[0].resumo).toBe('verso 10');
  });
});

describe('prestígio', () => {
  it('exige a trilha inteira concluída', async () => {
    configurarDb({
      fases: [ok([{ id: 101 }, { id: 102 }])],
      progresso_fase: [ok([{ fase_id: 101, concluida: true }])],
    });
    await expect(prestigiar({ id: 'u1' }, 2)).rejects.toMatchObject({ status: 403 });
  });

  it('abre o próximo ciclo, reinicia o progresso do tema e concede badge', async () => {
    const mock = configurarDb({
      fases: [ok([{ id: 101 }])],
      progresso_fase: [ok([{ fase_id: 101, concluida: true }]), ok(null)],
      prestigios: [ok({ ciclo: 1 }), ok(null), { data: null, count: 2, error: null }],
    });
    const r = await prestigiar({ id: 'u1' }, 2);
    expect(r.ciclo).toBe(2);
    expect(mock.chainsPara('prestigios')[1].insert).toHaveBeenCalledWith({ user_id: 'u1', tema_id: 2, ciclo: 2 });
    expect(mock.chainsPara('progresso_fase')[1].delete).toHaveBeenCalled();
    expect(verificarBadges).toHaveBeenCalledWith('u1', { ciclosPrestigio: 2 });
  });

  it('modificadores só valem para o tema prestigiado', async () => {
    configurarDb({ fases: [ok({ tema_id: 2 })], prestigios: [ok(null)] });
    expect(await modificadoresDaFase('u1', 101)).toEqual({});
    configurarDb({ fases: [ok({ tema_id: 2 })], prestigios: [ok({ ciclo: 1 })] });
    expect(await modificadoresDaFase('u1', 101)).toEqual({ ciclo: 1, fatorTempo: 0.75, semFaceis: true });
  });
});

describe('torneio entre equipes', () => {
  it('placar soma as vitórias dos membros por equipe', () => {
    const placar = montarPlacar(
      new Map([
        ['a', 2],
        ['b', 1],
      ]),
      [
        { user_id: 'a', turma_id: 't1' },
        { user_id: 'b', turma_id: 't2' },
        { user_id: 'c', turma_id: 't2' },
      ],
      [
        { id: 't1', nome: 'Comercial' },
        { id: 't2', nome: 'Suporte' },
      ]
    );
    expect(placar.map((p) => [p.nome, p.vitorias, p.posicao])).toEqual([
      ['Comercial', 2, 1],
      ['Suporte', 1, 2],
    ]);
  });

  it('encerrado: só quem trava premiado_em paga as fichas da equipe campeã', async () => {
    const torneio = {
      id: 5,
      empresa_id: null,
      inicio: '2026-10-01T00:00:00Z',
      fim: '2026-10-10T00:00:00Z',
      fichas_premio: 40,
      premiado_em: null,
    };
    const filas = () => ({
      torneios: [ok([torneio]), ok({ ...torneio, premiado_em: 'agora' })],
      turmas: [ok([{ id: 't1', nome: 'Comercial' }])],
      matriculas: [ok([{ user_id: 'a', turma_id: 't1' }, { user_id: 'b', turma_id: 't1' }])],
      desafio_resultados: [ok([{ user_id: 'a' }])],
    });
    configurarDb(filas());
    await torneiosDoTenant({ empresa_id: null }, new Date('2026-10-20T00:00:00Z'));
    expect(concederFichas).toHaveBeenCalledTimes(2);

    // Outra requisição perdeu a corrida da trava: não paga de novo
    vi.clearAllMocks();
    const segunda = filas();
    segunda.torneios[1] = ok(null);
    configurarDb(segunda);
    await torneiosDoTenant({ empresa_id: null }, new Date('2026-10-20T00:00:00Z'));
    expect(concederFichas).not.toHaveBeenCalled();
  });

  it('valida o período', async () => {
    await expect(
      criarTorneio({ id: 'g1' }, { nome: 'X', inicio: '2026-10-10', fim: '2026-10-01' })
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe('resultado do desafio', () => {
  const desafio = {
    id: 'd1',
    criador_id: 'criador',
    fase_id: 101,
    acertos_alvo: 6,
    criado_em: '2026-10-01T10:00:00Z',
    profiles: { empresa_id: null },
  };

  it('vence quem supera os acertos do criador', async () => {
    const mock = configurarDb({
      desafios: [ok(desafio)],
      tentativas: [
        ok({ id: 't1', fase_id: 101, acertos: 7, iniciada_em: '2026-10-02T00:00:00Z', finalizada_em: '2026-10-02T00:10:00Z' }),
      ],
      desafio_resultados: [ok(null)],
    });
    const r = await registrarResultado({ id: 'u1' }, 'd1', 't1');
    expect(r).toEqual({ venceu: true, acertos: 7, acertos_alvo: 6 });
    expect(mock.chainsPara('desafio_resultados')[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({ venceu: true })
    );
  });

  it('tentativa anterior ao convite não vale', async () => {
    configurarDb({
      desafios: [ok(desafio)],
      tentativas: [
        ok({ id: 't1', fase_id: 101, acertos: 9, iniciada_em: '2026-09-30T00:00:00Z', finalizada_em: '2026-09-30T00:10:00Z' }),
      ],
    });
    await expect(registrarResultado({ id: 'u1' }, 'd1', 't1')).rejects.toMatchObject({ status: 400 });
  });

  it('criador não responde o próprio desafio; repetir vira 409', async () => {
    configurarDb({ desafios: [ok(desafio)] });
    await expect(registrarResultado({ id: 'criador' }, 'd1', 't1')).rejects.toMatchObject({ status: 400 });

    configurarDb({
      desafios: [ok(desafio)],
      tentativas: [
        ok({ id: 't1', fase_id: 101, acertos: 1, iniciada_em: '2026-10-02T00:00:00Z', finalizada_em: '2026-10-02T00:10:00Z' }),
      ],
      desafio_resultados: [fail({ code: '23505' })],
    });
    await expect(registrarResultado({ id: 'u1' }, 'd1', 't1')).rejects.toMatchObject({ status: 409 });
  });
});

describe('campanhas', () => {
  it('cria campanha + evento + badge exclusiva numa ação só', async () => {
    const mock = configurarDb({
      campanhas: [ok({ id: 3 }), ok({ id: 3, evento_id: 7, badge_id: 50 })],
      badges: [ok({ id: 50 })],
    });
    const c = await criarCampanha(
      { id: 'g1', empresa_id: 'e1' },
      { nome: 'Outubro da Segurança', inicio: '2026-10-01', fim: '2026-10-31', meta_quizzes: 4, multiplicador_xp: 2 }
    );
    expect(c).toMatchObject({ evento_id: 7, badge_id: 50 });
    expect(mock.chainsPara('badges')[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({ tipo_condicao: 'campanha', parametro: { campanha_id: 3 } })
    );
  });

  it('rejeita multiplicador ≤ 1', async () => {
    await expect(
      criarCampanha({ id: 'g1' }, { nome: 'X', inicio: '2026-10-01', fim: '2026-10-31', multiplicador_xp: 1 })
    ).rejects.toMatchObject({ status: 400 });
  });
});
