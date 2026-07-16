import { describe, it, expect } from 'vitest';
import { escaparCsv, slug } from './relatorioService.js';

describe('escaparCsv', () => {
  it('deixa valores simples intactos', () => {
    expect(escaparCsv('Lucas')).toBe('Lucas');
    expect(escaparCsv(42)).toBe('42');
  });

  it('converte null e undefined em string vazia', () => {
    expect(escaparCsv(null)).toBe('');
    expect(escaparCsv(undefined)).toBe('');
  });

  it('preserva o zero (não vira vazio)', () => {
    expect(escaparCsv(0)).toBe('0');
  });

  it('envolve em aspas quando há o separador ";"', () => {
    expect(escaparCsv('Silva; Souza')).toBe('"Silva; Souza"');
  });

  it('envolve em aspas quando há quebra de linha', () => {
    expect(escaparCsv('linha1\nlinha2')).toBe('"linha1\nlinha2"');
    expect(escaparCsv('a\r\nb')).toBe('"a\r\nb"');
  });

  it('duplica aspas internas e envolve o campo', () => {
    expect(escaparCsv('diz "olá"')).toBe('"diz ""olá"""');
  });
});

describe('slug', () => {
  it('minúsculas com hífens no lugar de espaços', () => {
    expect(slug('Turma A')).toBe('turma-a');
  });

  it('remove acentos', () => {
    expect(slug('Estrutura de Dados — Ção')).toBe('estrutura-de-dados-cao');
  });

  it('colapsa símbolos e separadores repetidos em um único hífen', () => {
    expect(slug('3ºA / Manhã!!!')).toBe('3-a-manha');
  });

  it('remove hífens das pontas', () => {
    expect(slug('  ...Turma...  ')).toBe('turma');
  });
});
