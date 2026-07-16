import { describe, it, expect } from 'vitest';
import { validarCamposQuiz } from './quizCustomService.js';

function payloadValido(overrides = {}) {
  return { titulo: 'Meu Quiz', questao_ids: [1, 2, 3], ...overrides };
}

describe('validarCamposQuiz', () => {
  it('aceita o mínimo válido e aplica defaults', () => {
    const q = validarCamposQuiz(payloadValido());
    expect(q.titulo).toBe('Meu Quiz');
    expect(q.descricao).toBe(null);
    expect(q.tempo_limite_seg).toBe(null);
    expect(q.sons).toBe(true);
    expect(q.permitir_dicas).toBe(true);
    expect(q.questao_ids).toEqual([1, 2, 3]);
  });

  it('faz trim do título e normaliza descrição vazia para null', () => {
    const q = validarCamposQuiz(payloadValido({ titulo: '  Quiz  ', descricao: '   ' }));
    expect(q.titulo).toBe('Quiz');
    expect(q.descricao).toBe(null);
  });

  it('trata sons e permitir_dicas como opt-out (só false desliga)', () => {
    expect(validarCamposQuiz(payloadValido({ sons: false })).sons).toBe(false);
    expect(validarCamposQuiz(payloadValido({ sons: undefined })).sons).toBe(true);
    expect(validarCamposQuiz(payloadValido({ permitir_dicas: false })).permitir_dicas).toBe(false);
  });

  it('exige título', () => {
    expect(() => validarCamposQuiz(payloadValido({ titulo: '   ' }))).toThrow(/título/);
  });

  it('aceita tempo_limite_seg null (usa o tempo de cada questão)', () => {
    expect(validarCamposQuiz(payloadValido({ tempo_limite_seg: null })).tempo_limite_seg).toBe(null);
  });

  it('rejeita tempo_limite_seg inválido quando informado', () => {
    expect(() => validarCamposQuiz(payloadValido({ tempo_limite_seg: 9 }))).toThrow(/tempo_limite_seg/);
    expect(() => validarCamposQuiz(payloadValido({ tempo_limite_seg: 15.5 }))).toThrow(/tempo_limite_seg/);
  });

  it('exige de 1 a 20 questões', () => {
    expect(() => validarCamposQuiz(payloadValido({ questao_ids: [] }))).toThrow(/1 a 20/);
    const vinteEUm = Array.from({ length: 21 }, (_, i) => i + 1);
    expect(() => validarCamposQuiz(payloadValido({ questao_ids: vinteEUm }))).toThrow(/1 a 20/);
  });

  it('aceita exatamente 20 questões (limite superior)', () => {
    const vinte = Array.from({ length: 20 }, (_, i) => i + 1);
    expect(validarCamposQuiz(payloadValido({ questao_ids: vinte })).questao_ids).toHaveLength(20);
  });

  it('rejeita questões repetidas', () => {
    expect(() => validarCamposQuiz(payloadValido({ questao_ids: [1, 2, 2] }))).toThrow(/repetidas/);
  });

  it('anexa status 400 aos erros', () => {
    try {
      validarCamposQuiz(payloadValido({ titulo: '' }));
      throw new Error('deveria ter lançado');
    } catch (e) {
      expect(e.status).toBe(400);
    }
  });
});
