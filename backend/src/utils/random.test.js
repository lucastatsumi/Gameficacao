import { describe, it, expect } from 'vitest';
import { embaralhar, gerarCodigoAcesso } from './random.js';

describe('embaralhar', () => {
  it('preserva os mesmos elementos (permutação, não perde nem duplica)', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8];
    const resultado = embaralhar(original);
    expect(resultado).toHaveLength(original.length);
    expect([...resultado].sort()).toEqual([...original].sort());
  });

  it('não muta o array original', () => {
    const original = [1, 2, 3, 4, 5];
    const copia = [...original];
    embaralhar(original);
    expect(original).toEqual(copia);
  });

  it('lida com array vazio e de um elemento', () => {
    expect(embaralhar([])).toEqual([]);
    expect(embaralhar([42])).toEqual([42]);
  });
});

describe('gerarCodigoAcesso', () => {
  it('gera código com o tamanho padrão de 6 caracteres', () => {
    expect(gerarCodigoAcesso()).toHaveLength(6);
  });

  it('respeita um tamanho customizado', () => {
    expect(gerarCodigoAcesso(10)).toHaveLength(10);
  });

  it('nunca usa caracteres ambíguos (0, O, 1, I, L)', () => {
    for (let i = 0; i < 200; i++) {
      const codigo = gerarCodigoAcesso(12);
      expect(codigo).not.toMatch(/[0O1IL]/);
    }
  });
});
