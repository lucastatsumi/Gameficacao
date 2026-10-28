import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok, fail } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { criarEmpresa, entrarNaEmpresa, definirPapel, minhaEmpresa, roleDoPapel } =
  await import('./empresaService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

describe('roleDoPapel', () => {
  it('dono e gestor acessam o painel; colaborador joga', () => {
    expect(roleDoPapel('dono')).toBe('professor');
    expect(roleDoPapel('gestor')).toBe('professor');
    expect(roleDoPapel('colaborador')).toBe('aluno');
  });
});

describe('criarEmpresa', () => {
  it('quem já tem empresa não cria outra', async () => {
    await expect(
      criarEmpresa({ id: 'u1', empresa_id: 'e1' }, { nome: 'X', tema_ids: [1] }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('exige ao menos um tema do catálogo', async () => {
    await expect(criarEmpresa({ id: 'u1' }, { nome: 'X', tema_ids: [] })).rejects.toMatchObject({
      status: 400,
    });
  });

  it('cria, ativa os temas e promove o criador a dono', async () => {
    const mock = configurarDb({
      temas: [ok([{ id: 1 }, { id: 2 }])],
      empresas: [fail({ code: '23505' }), ok({ id: 'e1', nome: 'Acme' })], // 1ª colisão de código
      empresa_temas: [ok(null)],
      profiles: [ok(null)],
    });
    const empresa = await criarEmpresa({ id: 'u1' }, { nome: ' Acme ', tema_ids: [1, 2, 2] });

    expect(empresa).toMatchObject({ id: 'e1', tema_ids: [1, 2] });
    expect(mock.chainsPara('profiles')[0].update).toHaveBeenCalledWith({
      empresa_id: 'e1',
      papel: 'dono',
      role: 'professor',
    });
  });
});

describe('entrarNaEmpresa', () => {
  it('código inexistente vira 404', async () => {
    configurarDb({ empresas: [ok(null)] });
    await expect(entrarNaEmpresa({ id: 'u1' }, 'abc')).rejects.toMatchObject({ status: 404 });
  });

  it('entra como colaborador', async () => {
    const mock = configurarDb({ empresas: [ok({ id: 'e1', nome: 'Acme' })], profiles: [ok(null)] });
    await entrarNaEmpresa({ id: 'u1' }, ' abc ');
    expect(mock.chainsPara('empresas')[0].eq).toHaveBeenCalledWith('codigo_convite', 'ABC');
    expect(mock.chainsPara('profiles')[0].update).toHaveBeenCalledWith({
      empresa_id: 'e1',
      papel: 'colaborador',
      role: 'aluno',
    });
  });
});

describe('definirPapel', () => {
  const dono = { id: 'd1', empresa_id: 'e1', papel: 'dono' };

  it('só o dono altera papéis', async () => {
    await expect(
      definirPapel({ id: 'g1', empresa_id: 'e1', papel: 'gestor' }, 'u2', 'gestor'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('não aceita promover a dono', async () => {
    await expect(definirPapel(dono, 'u2', 'dono')).rejects.toMatchObject({ status: 400 });
  });

  it('membro de outra empresa vira 404', async () => {
    configurarDb({ profiles: [ok(null)] });
    await expect(definirPapel(dono, 'u2', 'gestor')).rejects.toMatchObject({ status: 404 });
  });

  it('promove a gestor ajustando o role e filtrando pela empresa do dono', async () => {
    const mock = configurarDb({ profiles: [ok({ id: 'u2', nome: 'Ana', papel: 'gestor' })] });
    await definirPapel(dono, 'u2', 'gestor');
    const chain = mock.chainsPara('profiles')[0];
    expect(chain.update).toHaveBeenCalledWith({ papel: 'gestor', role: 'professor' });
    expect(chain.eq).toHaveBeenCalledWith('empresa_id', 'e1');
  });
});

describe('minhaEmpresa', () => {
  it('colaborador não recebe o código de convite', async () => {
    configurarDb({
      empresas: [ok({ id: 'e1', nome: 'Acme', codigo_convite: 'SEGREDO1' })],
      empresa_temas: [ok([{ tema_id: 1 }])],
    });
    const empresa = await minhaEmpresa({ empresa_id: 'e1', papel: 'colaborador' });
    expect(empresa.codigo_convite).toBeNull();
  });
});
