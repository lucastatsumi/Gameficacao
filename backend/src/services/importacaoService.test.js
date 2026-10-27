import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn(), auth: { admin: { inviteUserByEmail: vi.fn() } } } }));

const { db } = await import('../config/supabase.js');
const { parseCsv, validarLinhas, importarColaboradores } = await import('./importacaoService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

describe('parseCsv', () => {
  it('lê vírgula, aspas com vírgula/aspas escapadas e BOM', () => {
    const m = parseCsv('﻿nome,email,equipe\n"Silva, Ana",ana@x.com,"Vendas ""Sul"""\n');
    expect(m).toEqual([
      ['nome', 'email', 'equipe'],
      ['Silva, Ana', 'ana@x.com', 'Vendas "Sul"'],
    ]);
  });
  it('detecta ponto e vírgula (Excel pt-BR) e CRLF, ignora linhas vazias', () => {
    const m = parseCsv('nome;email\r\nAna;ana@x.com\r\n\r\nBia;bia@x.com');
    expect(m).toEqual([['nome', 'email'], ['Ana', 'ana@x.com'], ['Bia', 'bia@x.com']]);
  });
});

describe('validarLinhas', () => {
  it('exige as colunas nome e email no cabeçalho', () => {
    expect(() => validarLinhas([['nome', 'mail'], ['a', 'b']])).toThrowError(
      expect.objectContaining({ status: 400 })
    );
    expect(() => validarLinhas([['nome', 'email']])).toThrowError(expect.objectContaining({ status: 400 }));
  });
  it('separa válidos de erros (vazio, inválido, repetido) com o número da linha', () => {
    const { itens, erros } = validarLinhas([
      ['Nome', 'Email', 'Equipe'],
      ['Ana', 'ANA@x.com', 'Vendas'],
      ['', 'b@x.com', ''],
      ['Caio', 'sem-arroba', ''],
      ['Ana 2', 'ana@x.com', ''],
    ]);
    expect(itens).toEqual([{ linha: 2, nome: 'Ana', email: 'ana@x.com', equipe: 'Vendas' }]);
    expect(erros.map((e) => [e.linha, e.erro])).toEqual([
      [3, 'nome vazio'],
      [4, 'e-mail inválido'],
      [5, 'e-mail repetido no arquivo'],
    ]);
  });
  it('limita a 200 linhas', () => {
    const linhas = Array.from({ length: 201 }, (_, i) => [`N${i}`, `u${i}@x.com`]);
    expect(() => validarLinhas([['nome', 'email'], ...linhas])).toThrowError(
      expect.objectContaining({ status: 400 })
    );
  });
});

describe('importarColaboradores', () => {
  const gestor = { id: 'g1', empresa_id: 'e1' };
  const csv = 'nome,email,equipe\nAna,ana@x.com,Vendas\nBia,bia@x.com,Inexistente\nCaio,caio@x.com,';

  it('400 se o gestor não tem empresa', async () => {
    await expect(importarColaboradores({ id: 'g1' }, csv)).rejects.toMatchObject({ status: 400 });
  });

  it('convida, associa à empresa e matricula; reporta equipe inexistente e convite que falha', async () => {
    db.auth.admin.inviteUserByEmail
      .mockResolvedValueOnce({ data: { user: { id: 'u-ana' } }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'already registered' } });
    const mock = configurarDb({
      turmas: [ok([{ id: 't1', nome: 'Vendas' }])],
      profiles: [ok(null)],
      matriculas: [ok(null)],
    });

    const r = await importarColaboradores(gestor, csv);

    expect(r.convidados).toBe(1);
    expect(r.erros).toEqual([
      { linha: 3, email: 'bia@x.com', erro: 'equipe "Inexistente" não encontrada' },
      { linha: 4, email: 'caio@x.com', erro: 'already registered' },
    ]);
    expect(db.auth.admin.inviteUserByEmail).toHaveBeenCalledWith('ana@x.com', { data: { nome: 'Ana' } });
    expect(mock.chainsPara('profiles')[0].update).toHaveBeenCalledWith({
      empresa_id: 'e1',
      papel: 'colaborador',
    });
    expect(mock.chainsPara('matriculas')[0].insert).toHaveBeenCalledWith({
      user_id: 'u-ana',
      turma_id: 't1',
    });
  });
});
