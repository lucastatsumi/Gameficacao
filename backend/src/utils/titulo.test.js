import { describe, expect, it } from 'vitest';
import { tituloPorNivel } from './titulo.js';

describe('tituloPorNivel', () => {
  it.each([
    [1, 'Aprendiz'],
    [2, 'Aprendiz'],
    [3, 'Aventureiro'],
    [5, 'Aventureiro'],
    [6, 'Especialista'],
    [9, 'Especialista'],
    [10, 'Lenda'],
    [999, 'Lenda'],
  ])('nível %i vira "%s"', (nivel, esperado) => {
    expect(tituloPorNivel(nivel)).toBe(esperado);
  });
});
