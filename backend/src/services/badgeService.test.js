import { describe, it, expect } from 'vitest';
import { condicaoAtendida } from './badgeService.js';

function badge(tipo_condicao, parametro = {}) {
  return { tipo_condicao, parametro };
}

describe('condicaoAtendida', () => {
  describe('xp_acumulado', () => {
    it('atende quando xpTotal alcança o alvo', () => {
      expect(condicaoAtendida(badge('xp_acumulado', { xp: 1000 }), { xpTotal: 1000 })).toBe(true);
      expect(condicaoAtendida(badge('xp_acumulado', { xp: 1000 }), { xpTotal: 1500 })).toBe(true);
    });

    it('não atende abaixo do alvo', () => {
      expect(condicaoAtendida(badge('xp_acumulado', { xp: 1000 }), { xpTotal: 999 })).toBe(false);
    });
  });

  describe('fase_concluida', () => {
    it('exige aprovação E a fase certa', () => {
      const b = badge('fase_concluida', { fase_ordem: 2 });
      expect(condicaoAtendida(b, { aprovada: true, faseOrdem: 2 })).toBe(true);
      expect(condicaoAtendida(b, { aprovada: false, faseOrdem: 2 })).toBe(false);
      expect(condicaoAtendida(b, { aprovada: true, faseOrdem: 3 })).toBe(false);
    });
  });

  describe('quiz_perfeito', () => {
    it('reflete o contexto diretamente', () => {
      const b = badge('quiz_perfeito');
      expect(condicaoAtendida(b, { quizPerfeito: true })).toBe(true);
      expect(condicaoAtendida(b, { quizPerfeito: false })).toBe(false);
    });
  });

  describe('velocidade', () => {
    it('exige aprovação, tempo definido e dentro do limite', () => {
      const b = badge('velocidade', { tempo_medio_ms: 15000 });
      expect(condicaoAtendida(b, { aprovada: true, tempoMedioMs: 10000 })).toBe(true);
      expect(condicaoAtendida(b, { aprovada: true, tempoMedioMs: 15000 })).toBe(true);
      expect(condicaoAtendida(b, { aprovada: true, tempoMedioMs: 20000 })).toBe(false);
      expect(condicaoAtendida(b, { aprovada: false, tempoMedioMs: 5000 })).toBe(false);
      expect(condicaoAtendida(b, { aprovada: true, tempoMedioMs: null })).toBe(false);
    });
  });

  describe('sequencia_acertos', () => {
    it('exige que a sequência atual alcance o alvo', () => {
      const b = badge('sequencia_acertos', { acertos: 10 });
      expect(condicaoAtendida(b, { sequenciaAtual: 10 })).toBe(true);
      expect(condicaoAtendida(b, { sequenciaAtual: 9 })).toBe(false);
    });
  });

  it('condição desconhecida nunca é atendida', () => {
    expect(condicaoAtendida(badge('tipo_inexistente'), { xpTotal: 999999 })).toBe(false);
  });
});
