import { describe, expect, it } from 'vitest';
import { criarPrng, embaralharComSeed } from './seed.js';

describe('criarPrng', () => {
  it('mesma seed produz a mesma sequência', () => {
    const a = criarPrng('user-1:2026-07-18');
    const b = criarPrng('user-1:2026-07-18');
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('seeds diferentes divergem', () => {
    const a = criarPrng('2026-07-18');
    const b = criarPrng('2026-07-19');
    expect([a(), a(), a()]).not.toEqual([b(), b(), b()]);
  });

  it('valores sempre em [0, 1)', () => {
    const prng = criarPrng('x');
    for (let i = 0; i < 100; i++) {
      const v = prng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('embaralharComSeed', () => {
  it('é determinístico e preserva os elementos sem mutar o original', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8];
    const r1 = embaralharComSeed(original, criarPrng('s'));
    const r2 = embaralharComSeed(original, criarPrng('s'));
    expect(r1).toEqual(r2);
    expect([...r1].sort()).toEqual([...original].sort());
    expect(original).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});
