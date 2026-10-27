import { describe, expect, it } from 'vitest';
import { classificarProficiencia } from './proficiencia.js';

describe('classificarProficiencia', () => {
  it('sem score ou cobertura baixa é iniciante', () => {
    expect(classificarProficiencia(null, 1)).toBe('iniciante');
    expect(classificarProficiencia(95, 0.4)).toBe('iniciante');
  });
  it('score baixo é iniciante mesmo com cobertura total', () => {
    expect(classificarProficiencia(50, 1)).toBe('iniciante');
  });
  it('praticante: score ≥60 com cobertura parcial', () => {
    expect(classificarProficiencia(80, 0.6)).toBe('praticante');
  });
  it('proficiente e referência exigem trilha completa', () => {
    expect(classificarProficiencia(80, 1)).toBe('proficiente');
    expect(classificarProficiencia(92, 1)).toBe('referencia');
    expect(classificarProficiencia(92, 0.9)).toBe('praticante');
  });
});
