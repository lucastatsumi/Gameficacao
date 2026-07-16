import { describe, it, expect } from 'vitest';
import { nivelPorXp, xpParaNivel } from './nivel.js';

describe('nivelPorXp', () => {
  it('começa no nível 1 com 0 XP', () => {
    expect(nivelPorXp(0)).toBe(1);
  });

  it('segue a curva quadrática documentada (100/400/900 XP)', () => {
    expect(nivelPorXp(99)).toBe(1);
    expect(nivelPorXp(100)).toBe(2);
    expect(nivelPorXp(399)).toBe(2);
    expect(nivelPorXp(400)).toBe(3);
    expect(nivelPorXp(900)).toBe(4);
  });
});

describe('xpParaNivel', () => {
  it('é o inverso da curva de nivelPorXp nos limiares', () => {
    expect(xpParaNivel(1)).toBe(0);
    expect(xpParaNivel(2)).toBe(100);
    expect(xpParaNivel(3)).toBe(400);
    expect(xpParaNivel(4)).toBe(900);
  });

  it('o XP mínimo de um nível sempre resolve para aquele nível', () => {
    for (let nivel = 1; nivel <= 10; nivel++) {
      expect(nivelPorXp(xpParaNivel(nivel))).toBe(nivel);
    }
  });
});
