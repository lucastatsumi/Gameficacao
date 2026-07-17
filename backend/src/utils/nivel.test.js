import { describe, expect, it } from 'vitest';
import { nivelPorXp, xpParaNivel } from './nivel.js';

describe('nivel', () => {
  it('nível 1 no XP zero', () => {
    expect(nivelPorXp(0)).toBe(1);
  });

  it('xpParaNivel e nivelPorXp são inversas nos limiares', () => {
    for (let nivel = 1; nivel <= 10; nivel++) {
      const xpNecessario = xpParaNivel(nivel);
      expect(nivelPorXp(xpNecessario)).toBe(nivel);
    }
  });

  it('não sobe de nível 1 XP antes do limiar', () => {
    const xpDoNivel5 = xpParaNivel(5);
    expect(nivelPorXp(xpDoNivel5 - 1)).toBe(4);
  });

  it('segue a curva quadrática documentada (100, 400, 900...)', () => {
    expect(xpParaNivel(2)).toBe(100);
    expect(xpParaNivel(3)).toBe(400);
    expect(xpParaNivel(4)).toBe(900);
  });
});
