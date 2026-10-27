import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok, fail } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { criarCampanha, verificarCampanhas, rankingDaCampanha } = await import(
  './campanhaService.js'
);

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

const AGORA = new Date('2026-10-15T12:00:00Z');
const BADGE = { id: 7, nome: 'Campanha: Outubro', descricao: 'd', icone: 'trophy' };
const ATIVA = {
  id: 'c1',
  nome: 'Outubro',
  inicio: '2026-10-01T00:00:00Z',
  fim: '2026-10-31T00:00:00Z',
  min_quizzes: 2,
  badge_id: 7,
  badges: BADGE,
};

describe('criarCampanha', () => {
  const dados = { nome: 'Outubro', inicio: '2026-10-01', fim: '2026-10-31' };

  it('exige nome e período válido', async () => {
    await expect(criarCampanha('g', { ...dados, nome: ' ' })).rejects.toMatchObject({ status: 400 });
    await expect(criarCampanha('g', { ...dados, fim: '2026-09-01' })).rejects.toMatchObject({
      status: 400,
    });
  });

  it('cria evento + badge do tipo campanha + registro', async () => {
    const mock = configurarDb({
      eventos: [ok({ id: 3, inicio: '2026-10-01T00:00:00Z', fim: '2026-10-31T00:00:00Z' })],
      badges: [ok(BADGE)],
      campanhas: [ok({ id: 'c1' })],
    });
    await criarCampanha('g', dados);
    expect(mock.chainsPara('badges')[0].insert.mock.calls[0][0]).toMatchObject({
      tipo_condicao: 'campanha',
      parametro: { min_quizzes: 5 },
    });
    expect(mock.chainsPara('campanhas')[0].insert.mock.calls[0][0]).toMatchObject({
      evento_id: 3,
      badge_id: 7,
    });
  });

  it('desfaz o evento se a badge falhar', async () => {
    const mock = configurarDb({
      eventos: [ok({ id: 3, inicio: 'a', fim: 'b' }), ok(null)],
      badges: [fail({ code: '23505' })],
    });
    await expect(criarCampanha('g', dados)).rejects.toMatchObject({ status: 409 });
    expect(mock.chainsPara('eventos')[1].delete).toHaveBeenCalled();
  });
});

describe('verificarCampanhas', () => {
  it('sem campanha ativa não consulta mais nada', async () => {
    configurarDb({ campanhas: [ok([])] });
    expect(await verificarCampanhas('u1', AGORA)).toEqual([]);
  });

  it('concede a badge ao bater a meta', async () => {
    const mock = configurarDb({
      campanhas: [ok([ATIVA])],
      usuario_badges: [ok([]), ok(null)],
      tentativas: [ok([{ id: 1 }, { id: 2 }])],
    });
    const r = await verificarCampanhas('u1', AGORA);
    expect(r).toEqual([BADGE]);
    expect(mock.chainsPara('usuario_badges')[1].insert).toHaveBeenCalledWith({
      user_id: 'u1',
      badge_id: 7,
    });
  });

  it('não concede abaixo da meta nem repete a badge', async () => {
    configurarDb({
      campanhas: [ok([ATIVA])],
      usuario_badges: [ok([])],
      tentativas: [ok([{ id: 1 }])],
    });
    expect(await verificarCampanhas('u1', AGORA)).toEqual([]);
    configurarDb({ campanhas: [ok([ATIVA])], usuario_badges: [ok([{ badge_id: 7 }])] });
    expect(await verificarCampanhas('u1', AGORA)).toEqual([]);
  });
});

describe('rankingDaCampanha', () => {
  it('404 se não existe', async () => {
    configurarDb({ campanhas: [ok(null)] });
    await expect(rankingDaCampanha('x')).rejects.toMatchObject({ status: 404 });
  });
  it('soma XP por usuário dentro da janela, ordenado', async () => {
    configurarDb({
      campanhas: [ok({ inicio: 'a', fim: 'b' })],
      tentativas: [
        ok([
          { user_id: 'u1', xp_ganho: 10, profiles: { nome: 'Ana' } },
          { user_id: 'u2', xp_ganho: 50, profiles: { nome: 'Beto' } },
          { user_id: 'u1', xp_ganho: 15, profiles: { nome: 'Ana' } },
        ]),
      ],
    });
    expect(await rankingDaCampanha('c1')).toEqual([
      { posicao: 1, nome: 'Beto', xp: 50 },
      { posicao: 2, nome: 'Ana', xp: 25 },
    ]);
  });
});

describe('campanhas — isolamento por empresa', () => {
  it('ranking de campanha de outra empresa responde 404', async () => {
    const mock = configurarDb({ campanhas: [ok(null)] });
    await expect(rankingDaCampanha('c1', 'empresa-A')).rejects.toMatchObject({ status: 404 });
    expect(mock.chainsPara('campanhas')[0].eq).toHaveBeenCalledWith('empresa_id', 'empresa-A');
  });

  it('ranking só soma XP de quem é da mesma empresa', async () => {
    configurarDb({
      campanhas: [ok({ inicio: 'a', fim: 'b' })],
      tentativas: [
        ok([
          { user_id: 'u1', xp_ganho: 10, profiles: { nome: 'Ana', empresa_id: 'empresa-A' } },
          { user_id: 'u2', xp_ganho: 99, profiles: { nome: 'Intruso', empresa_id: 'empresa-B' } },
        ]),
      ],
    });
    expect(await rankingDaCampanha('c1', 'empresa-A')).toEqual([
      { posicao: 1, nome: 'Ana', xp: 10 },
    ]);
  });

  it('verificarCampanhas filtra pela empresa do usuário', async () => {
    const mock = configurarDb({ campanhas: [ok([])] });
    await verificarCampanhas('u1', AGORA, 'empresa-A');
    expect(mock.chainsPara('campanhas')[0].eq).toHaveBeenCalledWith('empresa_id', 'empresa-A');
  });
});
