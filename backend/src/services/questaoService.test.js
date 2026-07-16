import { describe, it, expect } from 'vitest';
import { validarPayload } from './questaoService.js';

// Payload mínimo válido — cada teste parte daqui e muda um campo por vez
function payloadValido(overrides = {}) {
  return {
    fase_id: 1,
    enunciado: 'Qual a complexidade de acesso em um array?',
    alternativas: [
      { letra: 'A', texto: 'O(1)', correta: true, explicacao: 'Acesso direto por índice.' },
      { letra: 'B', texto: 'O(n)', correta: false, explicacao: 'Seria busca linear.' },
      { letra: 'C', texto: 'O(log n)', correta: false, explicacao: 'Seria busca binária.' },
      { letra: 'D', texto: 'O(n²)', correta: false, explicacao: 'Seria laço aninhado.' },
    ],
    ...overrides,
  };
}

describe('validarPayload', () => {
  it('aceita um payload válido e aplica os defaults', () => {
    const q = validarPayload(payloadValido());
    expect(q.linguagem).toBe('javascript');
    expect(q.dificuldade).toBe('media');
    expect(q.tempo_limite_seg).toBe(60);
    expect(q.xp_valor).toBe(10);
    expect(q.dica).toBe(null);
    expect(q.alternativas).toHaveLength(4);
  });

  it('faz trim de enunciado e textos e normaliza dica vazia para null', () => {
    const q = validarPayload(payloadValido({ enunciado: '  Pergunta  ', dica: '   ' }));
    expect(q.enunciado).toBe('Pergunta');
    expect(q.dica).toBe(null);
  });

  it('normaliza correta para booleano estrito', () => {
    const alternativas = payloadValido().alternativas.map((a) => ({ ...a }));
    alternativas[0].correta = 'sim'; // truthy mas não === true
    alternativas[1].correta = true;
    const q = validarPayload(payloadValido({ alternativas }));
    expect(q.alternativas[0].correta).toBe(false);
    expect(q.alternativas[1].correta).toBe(true);
  });

  it('exige fase_id', () => {
    expect(() => validarPayload(payloadValido({ fase_id: undefined }))).toThrow(/fase_id/);
  });

  it('exige enunciado não vazio', () => {
    expect(() => validarPayload(payloadValido({ enunciado: '   ' }))).toThrow(/enunciado/);
  });

  it('rejeita dificuldade fora da lista', () => {
    expect(() => validarPayload(payloadValido({ dificuldade: 'impossivel' }))).toThrow(/Dificuldade/);
  });

  it('exige tempo_limite_seg inteiro >= 10', () => {
    expect(() => validarPayload(payloadValido({ tempo_limite_seg: 9 }))).toThrow(/tempo_limite_seg/);
    expect(() => validarPayload(payloadValido({ tempo_limite_seg: 30.5 }))).toThrow(/tempo_limite_seg/);
  });

  it('exige xp_valor inteiro >= 1', () => {
    expect(() => validarPayload(payloadValido({ xp_valor: 0 }))).toThrow(/xp_valor/);
  });

  it('exige exatamente 4 alternativas', () => {
    const tres = payloadValido().alternativas.slice(0, 3);
    expect(() => validarPayload(payloadValido({ alternativas: tres }))).toThrow(/4 alternativas/);
  });

  it('exige as letras A, B, C e D', () => {
    const alternativas = payloadValido().alternativas.map((a) => ({ ...a }));
    alternativas[3].letra = 'E';
    expect(() => validarPayload(payloadValido({ alternativas }))).toThrow(/A, B, C e D/);
  });

  it('exige exatamente uma alternativa correta', () => {
    const nenhuma = payloadValido().alternativas.map((a) => ({ ...a, correta: false }));
    expect(() => validarPayload(payloadValido({ alternativas: nenhuma }))).toThrow(/uma alternativa/);

    const duas = payloadValido().alternativas.map((a) => ({ ...a }));
    duas[1].correta = true; // agora A e B corretas
    expect(() => validarPayload(payloadValido({ alternativas: duas }))).toThrow(/uma alternativa/);
  });

  it('exige texto e explicação em toda alternativa', () => {
    const semTexto = payloadValido().alternativas.map((a) => ({ ...a }));
    semTexto[2].texto = '  ';
    expect(() => validarPayload(payloadValido({ alternativas: semTexto }))).toThrow(/texto/);

    const semExplicacao = payloadValido().alternativas.map((a) => ({ ...a }));
    semExplicacao[2].explicacao = '';
    expect(() => validarPayload(payloadValido({ alternativas: semExplicacao }))).toThrow(/explica/);
  });

  it('anexa status 400 aos erros de validação', () => {
    try {
      validarPayload(payloadValido({ fase_id: undefined }));
      throw new Error('deveria ter lançado');
    } catch (e) {
      expect(e.status).toBe(400);
    }
  });
});
