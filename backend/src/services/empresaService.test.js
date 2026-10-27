import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok, fail } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { criarEmpresa, entrarNaEmpresa, minhaEmpresa, definirPapel, roleDoPapel } = await import(
  './empresaService.js'
);

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

describe('roleDoPapel', () => {
  it('colaborador é aluno; dono e gestor são professor', () => {
    expect(roleDoPapel('colaborador')).toBe('aluno');
    expect(roleDoPapel('gestor')).toBe('professor');
    expect(roleDoPapel('dono')).toBe('professor');
  });
});

describe('criarEmpresa', () => {
  it('exige nome e impede dono duplicado', async () => {
    await expect(criarEmpresa({ id: 'u' }, ' ')).rejects.toMatchObject({ status: 400 });
    await expect(criarEmpresa({ id: 'u', papel: 'dono' }, 'X')).rejects.toMatchObject({ status: 409 });
  });

  it('cria a empresa e promove o criador a dono/professor', async () => {
    const mock = configurarDb({ empresas: [ok({ id: 'e1' })], profiles: [ok(null)] });
    const e = await criarEmpresa({ id: 'u1', papel: 'colaborador' }, 'Acme');
    expect(e.id).toBe('e1');
    expect(mock.chainsPara('profiles')[0].update).toHaveBeenCalledWith({
      empresa_id: 'e1',
      papel: 'dono',
      role: 'professor',
    });
  });

  it('tenta de novo em colisão de código (23505)', async () => {
    configurarDb({
      empresas: [fail({ code: '23505' }), ok({ id: 'e1' })],
      profiles: [ok(null)],
    });
    expect((await criarEmpresa({ id: 'u1' }, 'Acme')).id).toBe('e1');
  });
});

describe('entrarNaEmpresa', () => {
  it('404 para código inexistente', async () => {
    configurarDb({ empresas: [ok(null)] });
    await expect(entrarNaEmpresa({ id: 'u1', papel: 'colaborador' }, 'zzz')).rejects.toMatchObject({
      status: 404,
    });
  });
  it('gestor/dono não trocam de empresa por convite (409)', async () => {
    await expect(entrarNaEmpresa({ id: 'u', papel: 'gestor' }, 'ABC')).rejects.toMatchObject({
      status: 409,
    });
  });
  it('entra como colaborador', async () => {
    const mock = configurarDb({ empresas: [ok({ id: 'e1', nome: 'Acme' })], profiles: [ok(null)] });
    await entrarNaEmpresa({ id: 'u1', papel: 'colaborador' }, ' abc ');
    expect(mock.chainsPara('empresas')[0].eq).toHaveBeenCalledWith('codigo_convite', 'ABC');
    expect(mock.chainsPara('profiles')[0].update).toHaveBeenCalledWith({
      empresa_id: 'e1',
      papel: 'colaborador',
    });
  });
});

describe('minhaEmpresa', () => {
  it('colaborador não vê o código de convite', async () => {
    configurarDb({ empresas: [ok({ id: 'e1', nome: 'A', codigo_convite: 'XYZ' })] });
    const e = await minhaEmpresa({ empresa_id: 'e1', papel: 'colaborador' });
    expect(e).not.toHaveProperty('codigo_convite');
  });
  it('gestor vê', async () => {
    configurarDb({ empresas: [ok({ id: 'e1', nome: 'A', codigo_convite: 'XYZ' })] });
    expect((await minhaEmpresa({ empresa_id: 'e1', papel: 'gestor' })).codigo_convite).toBe('XYZ');
  });
});

describe('definirPapel', () => {
  const dono = { id: 'd1', empresa_id: 'e1', papel: 'dono' };

  it('valida papel e impede autoalteração', async () => {
    await expect(definirPapel(dono, 'm1', 'dono')).rejects.toMatchObject({ status: 400 });
    await expect(definirPapel(dono, 'd1', 'gestor')).rejects.toMatchObject({ status: 400 });
  });

  it('só atua dentro da empresa do dono e nunca sobre outro dono', async () => {
    const mock = configurarDb({ profiles: [ok([{ id: 'm1' }])] });
    await definirPapel(dono, 'm1', 'gestor');
    const chain = mock.chainsPara('profiles')[0];
    expect(chain.update).toHaveBeenCalledWith({ papel: 'gestor', role: 'professor' });
    expect(chain.eq).toHaveBeenCalledWith('empresa_id', 'e1');
    expect(chain.neq).toHaveBeenCalledWith('papel', 'dono');
  });

  it('404 se o membro é de outra empresa', async () => {
    configurarDb({ profiles: [ok([])] });
    await expect(definirPapel(dono, 'x', 'gestor')).rejects.toMatchObject({ status: 404 });
  });
});
