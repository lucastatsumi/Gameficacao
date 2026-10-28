import { describe, expect, it } from 'vitest';
import { calcularScore, velocidade } from './pontuacao.js';

const r = (correta, dificuldade = 'media', tempo_resposta_ms = 60000, tempo_limite_seg = 60) => ({
  correta,
  tempo_resposta_ms,
  questoes: { dificuldade, tempo_limite_seg },
});

describe('velocidade', () => {
  it('fração do tempo que sobrou, limitada a 0..1', () => {
    expect(velocidade(15000, 60)).toBe(0.75);
    expect(velocidade(90000, 60)).toBe(0);
    expect(velocidade(null, 60)).toBe(0);
  });
});

describe('calcularScore', () => {
  it('sem respostas e sem questões pendentes não tem nota', () => {
    expect(calcularScore([])).toBeNull();
  });

  it('tudo errado vale 0', () => {
    expect(calcularScore([r(false), r(false)])).toBe(0);
  });

  it('um acerto isolado no limite do tempo vale 80% do peso', () => {
    expect(calcularScore([r(true)])).toBe(80);
  });

  it('acertos rápidos em sequência chegam perto de 100', () => {
    const respostas = [r(true, 'media', 0), r(true, 'media', 0), r(true, 'media', 0)];
    // 0.9 + 0.95 + 1.0 sobre 3
    expect(calcularScore(respostas)).toBe(95);
  });

  it('erro zera a sequência', () => {
    const comErro = calcularScore([r(true), r(true), r(false), r(true)]);
    const semErro = calcularScore([r(true), r(true), r(true), r(false)]);
    expect(comErro).toBeLessThan(semErro);
  });

  it('acertar a difícil pesa mais que acertar a fácil', () => {
    const acertouDificil = calcularScore([r(true, 'dificil'), r(false, 'facil')]);
    const acertouFacil = calcularScore([r(false, 'dificil'), r(true, 'facil')]);
    expect(acertouDificil).toBeGreaterThan(acertouFacil);
  });

  it('questão sorteada e não respondida conta como 0', () => {
    expect(calcularScore([r(true)], 1)).toBe(40);
  });
});
