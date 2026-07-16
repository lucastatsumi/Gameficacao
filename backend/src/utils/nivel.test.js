import { describe, it, expect } from 'vitest';
import { nivelPorXp, xpParaNivel, progressoNivelPct } from './nivel.js';

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

describe('progressoNivelPct', () => {
  it('vale 0% no piso do nível', () => {
    expect(progressoNivelPct(0, 1)).toBe(0);
    expect(progressoNivelPct(100, 2)).toBe(0);
    expect(progressoNivelPct(400, 3)).toBe(0);
  });

  it('vale ~100% na iminência do próximo nível', () => {
    // nível 1 vai de 0 a 100 XP; 99 XP é 99% do caminho
    expect(progressoNivelPct(99, 1)).toBe(99);
    // nível 2 vai de 100 a 400 XP (faixa de 300); 250 XP = metade do caminho
    expect(progressoNivelPct(250, 2)).toBe(50);
  });

  it('arredonda para o inteiro mais próximo', () => {
    // nível 2: faixa 100→400 (300). 200 XP = (200-100)/300 = 33,33% → 33
    expect(progressoNivelPct(200, 2)).toBe(33);
  });

  it('atinge 100% exatamente no XP do próximo nível', () => {
    expect(progressoNivelPct(100, 1)).toBe(100);
    expect(progressoNivelPct(400, 2)).toBe(100);
  });
});
