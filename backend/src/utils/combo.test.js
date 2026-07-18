import { describe, expect, it } from 'vitest';
import { aplicarCombo } from './combo.js';

const xpFixo = (r) => r.xp;

describe('aplicarCombo', () => {
  it('sem respostas, tudo zero', () => {
    expect(aplicarCombo([], xpFixo)).toEqual({ xpBase: 0, bonusCombo: 0, comboMax: 0 });
  });

  it('um acerto isolado não gera bônus (×1.0)', () => {
    const r = aplicarCombo([{ correta: true, xp: 10 }], xpFixo);
    expect(r).toEqual({ xpBase: 10, bonusCombo: 0, comboMax: 1 });
  });

  it('sequência de 4+ escala ×1.0/×1.1/×1.25/×1.5 e trava no teto', () => {
    const respostas = Array.from({ length: 5 }, () => ({ correta: true, xp: 10 }));
    const r = aplicarCombo(respostas, xpFixo);
    // 10 + 11 + 12.5 + 15 + 15 = 63.5 -> bônus = round(63.5 - 50) = 14
    expect(r.xpBase).toBe(50);
    expect(r.bonusCombo).toBe(14);
    expect(r.comboMax).toBe(5);
  });

  it('errar no meio zera a sequência', () => {
    const respostas = [
      { correta: true, xp: 10 },
      { correta: true, xp: 10 }, // ×1.1
      { correta: false, xp: 10 },
      { correta: true, xp: 10 }, // volta a ×1.0
      { correta: true, xp: 10 }, // ×1.1
    ];
    const r = aplicarCombo(respostas, xpFixo);
    // 10 + 11 + 0 + 10 + 11 = 42 -> bônus = 2
    expect(r.xpBase).toBe(40);
    expect(r.bonusCombo).toBe(2);
    expect(r.comboMax).toBe(2);
  });

  it('usa a função de XP injetada (dica corta o XP antes do multiplicador)', () => {
    const respostas = [
      { correta: true, xp: 10, usou_dica: true },
      { correta: true, xp: 10, usou_dica: false },
    ];
    const comDica = (r) => (r.usou_dica ? 5 : r.xp);
    const r = aplicarCombo(respostas, comDica);
    // 5 + 11 = 16 -> bônus = 1
    expect(r.xpBase).toBe(15);
    expect(r.bonusCombo).toBe(1);
  });
});
