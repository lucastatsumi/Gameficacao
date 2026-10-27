import { describe, expect, it } from 'vitest';
import { competenciaDominada, nivelDeProficiencia } from './proficiencia.js';

describe('competenciaDominada', () => {
  it('exige volume mínimo e 80% de acerto', () => {
    expect(competenciaDominada({ total: 4, acertos: 4 })).toBe(false);
    expect(competenciaDominada({ total: 5, acertos: 4 })).toBe(true);
    expect(competenciaDominada({ total: 10, acertos: 7 })).toBe(false);
  });
});

describe('nivelDeProficiencia', () => {
  it('Referência exige trilha concluída, score ≥ 85 e cobertura total', () => {
    expect(nivelDeProficiencia({ scoreMedio: 90, coberturaPct: 100, trilhaConcluida: true })).toBe(
      'Referência',
    );
    expect(nivelDeProficiencia({ scoreMedio: 90, coberturaPct: 100, trilhaConcluida: false })).toBe(
      'Proficiente',
    );
  });

  it('Praticante com score razoável ou boa cobertura; Iniciante sem nada', () => {
    expect(nivelDeProficiencia({ scoreMedio: 55, coberturaPct: 10 })).toBe('Praticante');
    expect(nivelDeProficiencia({ scoreMedio: null, coberturaPct: 60 })).toBe('Praticante');
    expect(nivelDeProficiencia({ scoreMedio: null, coberturaPct: 0 })).toBe('Iniciante');
  });
});
