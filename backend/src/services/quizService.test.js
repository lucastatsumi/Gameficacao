import { describe, it, expect } from 'vitest';
import { xpDaResposta } from './quizService.js';

describe('xpDaResposta', () => {
  it('vale o XP cheio da questão quando não usou dica', () => {
    expect(xpDaResposta({ usou_dica: false, questoes: { xp_valor: 10 } })).toBe(10);
  });

  it('corta o XP pela metade (arredondado para baixo) quando usou dica', () => {
    expect(xpDaResposta({ usou_dica: true, questoes: { xp_valor: 10 } })).toBe(5);
    expect(xpDaResposta({ usou_dica: true, questoes: { xp_valor: 7 } })).toBe(3);
  });

  it('garante no mínimo 1 XP mesmo com dica em questão de baixo valor', () => {
    expect(xpDaResposta({ usou_dica: true, questoes: { xp_valor: 1 } })).toBe(1);
    expect(xpDaResposta({ usou_dica: true, questoes: { xp_valor: 0 } })).toBe(1);
  });

  it('trata questão ausente como 0 XP', () => {
    expect(xpDaResposta({ usou_dica: false, questoes: null })).toBe(0);
    expect(xpDaResposta({ usou_dica: true, questoes: undefined })).toBe(1); // mínimo garantido
  });
});
