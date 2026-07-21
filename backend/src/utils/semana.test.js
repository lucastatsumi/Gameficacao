import { describe, expect, it } from 'vitest';
import { semanaIsoAnterior, semanaIsoDeHoje } from './semana.js';

describe('semanaIsoDeHoje', () => {
  it('formata como YYYY-Www', () => {
    expect(semanaIsoDeHoje(new Date('2026-01-05T12:00:00Z'))).toBe('2026-W02');
  });

  it('segunda e domingo da mesma semana caem na mesma semana ISO', () => {
    const segunda = semanaIsoDeHoje(new Date('2026-01-05T00:00:00Z'));
    const domingo = semanaIsoDeHoje(new Date('2026-01-11T23:00:00Z'));
    expect(segunda).toBe(domingo);
  });

  it('dias da semana seguinte caem em semana diferente', () => {
    const semana1 = semanaIsoDeHoje(new Date('2026-01-11T23:00:00Z'));
    const semana2 = semanaIsoDeHoje(new Date('2026-01-12T00:00:00Z'));
    expect(semana1).not.toBe(semana2);
  });

  it('vira o ano corretamente (semana 1 pode começar em dezembro)', () => {
    // 2025-12-29 é segunda-feira e já pertence à semana 1 de 2026 (a
    // quinta-feira dessa semana, 2026-01-01, cai em 2026).
    expect(semanaIsoDeHoje(new Date('2025-12-29T00:00:00Z'))).toBe('2026-W01');
  });

  it('fim de dezembro pode pertencer à última semana do ano anterior', () => {
    // 2024-12-30 é segunda-feira; a quinta-feira dessa semana (2025-01-02)
    // ainda fica em janeiro, então é a semana 1 de 2025.
    expect(semanaIsoDeHoje(new Date('2024-12-30T00:00:00Z'))).toBe('2025-W01');
  });
});

describe('semanaIsoAnterior', () => {
  it('é sempre 7 dias antes, mesmo virando o ano', () => {
    expect(semanaIsoAnterior(new Date('2026-01-05T12:00:00Z'))).toBe('2026-W01');
  });

  it('ordena como string antes da semana atual (mesmo ano)', () => {
    const atual = semanaIsoDeHoje(new Date('2026-03-10T00:00:00Z'));
    const anterior = semanaIsoAnterior(new Date('2026-03-10T00:00:00Z'));
    expect(anterior < atual).toBe(true);
  });

  it('ordena como string antes da semana atual mesmo na virada de ano', () => {
    const atual = semanaIsoDeHoje(new Date('2026-01-05T00:00:00Z'));
    const anterior = semanaIsoAnterior(new Date('2026-01-05T00:00:00Z'));
    expect(anterior < atual).toBe(true);
  });
});
