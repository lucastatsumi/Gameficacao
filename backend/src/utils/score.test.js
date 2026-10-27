import { describe, expect, it } from 'vitest';
import { calcularScore, fatorVelocidade, pesoDaDificuldade } from './score.js';

const r = (correta, dificuldade = 'media', tempo = 0) => ({
  correta,
  tempo_resposta_ms: tempo,
  questoes: { dificuldade, tempo_limite_seg: 60 },
});

describe('fatorVelocidade', () => {
  it('instantâneo = 1, no limite = 0.8, acima do limite trava em 0.8', () => {
    expect(fatorVelocidade(0, 60)).toBe(1);
    expect(fatorVelocidade(60000, 60)).toBeCloseTo(0.8);
    expect(fatorVelocidade(120000, 60)).toBeCloseTo(0.8);
  });
  it('sem tempo registrado usa o piso', () => {
    expect(fatorVelocidade(null, 60)).toBe(0.8);
  });
});

describe('pesoDaDificuldade', () => {
  it('facil < media < dificil; desconhecida cai em média', () => {
    expect(pesoDaDificuldade('facil')).toBe(1);
    expect(pesoDaDificuldade('dificil')).toBe(3);
    expect(pesoDaDificuldade(undefined)).toBe(2);
  });
});

describe('calcularScore', () => {
  it('sem questões, 0', () => {
    expect(calcularScore([], 0)).toBe(0);
  });
  it('tudo certo e instantâneo = 100', () => {
    expect(calcularScore([r(true), r(true), r(true)], 3)).toBe(100);
  });
  it('tudo errado = 0', () => {
    expect(calcularScore([r(false), r(false)], 2)).toBe(0);
  });
  it('acertar a difícil vale mais que acertar a fácil', () => {
    const acertouDificil = calcularScore([r(true, 'dificil'), r(false, 'facil')], 2);
    const acertouFacil = calcularScore([r(false, 'dificil'), r(true, 'facil')], 2);
    expect(acertouDificil).toBeGreaterThan(acertouFacil);
  });
  it('responder rápido rende mais que no limite do timer', () => {
    const rapido = calcularScore([r(true, 'media', 1000)], 1);
    const lento = calcularScore([r(true, 'media', 60000)], 1);
    expect(rapido).toBeGreaterThan(lento);
  });
  it('questão sem resposta pesa no denominador', () => {
    expect(calcularScore([r(true)], 2)).toBeLessThan(calcularScore([r(true)], 1));
  });
  it('sequência de acertos pesa mais que acertos intercalados', () => {
    const seguidos = calcularScore([r(true), r(true), r(false), r(false)], 4);
    const intercalados = calcularScore([r(true), r(false), r(true), r(false)], 4);
    expect(seguidos).toBeGreaterThan(intercalados);
  });
});
