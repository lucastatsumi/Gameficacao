import { describe, expect, it } from 'vitest';
import { classeDaFase } from './classe.js';

describe('classeDaFase', () => {
  it('formata "Mestre de <fase>" quando há nome', () => {
    expect(classeDaFase('Árvores')).toBe('Mestre de Árvores');
  });

  it('retorna null sem nome de fase', () => {
    expect(classeDaFase(null)).toBeNull();
    expect(classeDaFase(undefined)).toBeNull();
    expect(classeDaFase('')).toBeNull();
  });
});
