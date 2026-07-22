import { describe, expect, it } from 'vitest';
import { semanaIso } from './semana.js';

describe('semanaIso', () => {
  it('mesma semana (segunda a domingo) devolve a mesma string', () => {
    const segunda = semanaIso(new Date('2026-07-20T00:00:00Z'));
    const quarta = semanaIso(new Date('2026-07-22T12:00:00Z'));
    const domingo = semanaIso(new Date('2026-07-26T23:59:59Z'));
    expect(segunda).toBe('2026-W30');
    expect(quarta).toBe(segunda);
    expect(domingo).toBe(segunda);
  });

  it('semana seguinte muda a string', () => {
    expect(semanaIso(new Date('2026-07-27T00:00:00Z'))).toBe('2026-W31');
  });

  it('virada de ano respeita a regra ISO (quinta-feira decide o ano da semana)', () => {
    // 2025-12-31 é quarta-feira: pertence à semana 1 de 2026 (a quinta
    // seguinte, 1º de janeiro, cai em 2026).
    expect(semanaIso(new Date('2025-12-31T12:00:00Z'))).toBe('2026-W01');
    expect(semanaIso(new Date('2026-01-01T12:00:00Z'))).toBe('2026-W01');
  });
});
