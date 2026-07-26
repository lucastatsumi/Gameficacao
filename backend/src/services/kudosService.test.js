import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));
vi.mock('./missaoService.js', () => ({ registrarKudosNaMissao: vi.fn() }));

const { db } = await import('../config/supabase.js');
const { registrarKudosNaMissao } = await import('./missaoService.js');
const { resumoDeKudos, darKudos, KUDOS_POR_SEMANA } = await import('./kudosService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

// Terça-feira -> semana 2026-W30.
const AGORA = new Date('2026-07-21T15:00:00Z');

describe('resumoDeKudos', () => {
  it('conta dados e recebidos na semana atual', async () => {
    configurarDb({
      kudos: [ok([{ id: 'k1' }]), ok([{ id: 'k2' }, { id: 'k3' }])],
    });

    const resumo = await resumoDeKudos('u1', AGORA);
    expect(resumo).toEqual({ semana: '2026-W30', dados: 1, restantes: 2, recebidos: 2 });
  });
});

describe('darKudos', () => {
  it('rejeita autokudos sem consultar o banco', async () => {
    configurarDb({});
    await expect(darKudos('u1', 'u1', AGORA)).rejects.toThrow('si mesmo');
    expect(db.from).not.toHaveBeenCalled();
  });

  it('rejeita para_usuario ausente', async () => {
    configurarDb({});
    await expect(darKudos('u1', undefined, AGORA)).rejects.toThrow('obrigatório');
  });

  it('rejeita colega inexistente', async () => {
    configurarDb({
      profiles: [ok(null)],
    });
    await expect(darKudos('u1', 'fantasma', AGORA)).rejects.toThrow('não encontrado');
  });

  it('concede kudos e fichas quando não há reciprocidade nem teto atingido', async () => {
    const mock = configurarDb({
      profiles: [ok({ id: 'u2' })],
      kudos: [
        ok([]), // dadosNaSemana (de u1)
        ok([]), // recebeuKudosHoje (u2 -> u1 hoje)
        ok([]), // fichasDeKudosNaSemana (recebidas por u2)
        ok(null), // insert
      ],
      transacoes_fichas: [ok(null)],
    });

    const resultado = await darKudos('u1', 'u2', AGORA);

    expect(resultado).toEqual({ fichas_concedidas: true, restantes: 2 });
    expect(mock.chainsPara('kudos')[3].insert).toHaveBeenCalledWith({
      de_usuario: 'u1',
      para_usuario: 'u2',
      semana: '2026-W30',
      fichas_concedidas: true,
    });
    expect(mock.chainsPara('transacoes_fichas')[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u2', quantidade: 3, motivo: 'kudos_recebido', referencia: 'u1' })
    );
    expect(registrarKudosNaMissao).toHaveBeenCalledWith('u1');
  });

  it('recusa quando o jogador já usou os 3 kudos da semana', async () => {
    configurarDb({
      profiles: [ok({ id: 'u2' })],
      kudos: [ok([{ id: 'k1' }, { id: 'k2' }, { id: 'k3' }])], // dadosNaSemana = 3
    });

    await expect(darKudos('u1', 'u2', AGORA)).rejects.toThrow('já usou seus 3 kudos');
  });

  it('kudos recíproco no mesmo dia não rende fichas', async () => {
    const mock = configurarDb({
      profiles: [ok({ id: 'u2' })],
      kudos: [
        ok([]), // dadosNaSemana
        ok([{ id: 'k-reciproco' }]), // u2 já deu kudos a u1 hoje
        ok(null), // insert
      ],
    });

    const resultado = await darKudos('u1', 'u2', AGORA);

    expect(resultado.fichas_concedidas).toBe(false);
    expect(mock.chainsPara('kudos')[2].insert).toHaveBeenCalledWith(
      expect.objectContaining({ fichas_concedidas: false })
    );
    expect(mock.chainsPara('transacoes_fichas')).toHaveLength(0);
  });

  it('teto semanal de fichas por kudos recebidos: além do teto, kudos vale mas não paga', async () => {
    const mock = configurarDb({
      profiles: [ok({ id: 'u2' })],
      kudos: [
        ok([]), // dadosNaSemana
        ok([]), // recebeuKudosHoje
        ok([{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }]), // 5 * 3 fichas = teto batido
        ok(null), // insert
      ],
    });

    const resultado = await darKudos('u1', 'u2', AGORA);

    expect(resultado.fichas_concedidas).toBe(false);
    expect(mock.chainsPara('transacoes_fichas')).toHaveLength(0);
  });

  it('kudos duplicado ao mesmo colega na semana vira erro amigável (23505)', async () => {
    configurarDb({
      profiles: [ok({ id: 'u2' })],
      kudos: [
        ok([]),
        ok([]),
        ok([]),
        { data: null, error: { code: '23505', message: 'duplicate key' } },
      ],
    });

    await expect(darKudos('u1', 'u2', AGORA)).rejects.toThrow('já deu kudos a este colega');
  });
});

describe('constante de negócio', () => {
  it('KUDOS_POR_SEMANA é 3', () => {
    expect(KUDOS_POR_SEMANA).toBe(3);
  });
});
