import { describe, expect, it } from 'vitest';
import { semanaAtual } from './semana.js';

describe('semanaAtual', () => {
  it('calcula a semana ISO de uma quarta-feira comum', () => {
    expect(semanaAtual(new Date('2026-07-22T12:00:00Z'))).toBe('2026-W30');
  });

  it('segunda e domingo da mesma semana caem na mesma semana ISO', () => {
    const segunda = semanaAtual(new Date('2026-07-20T00:00:00Z'));
    const domingo = semanaAtual(new Date('2026-07-26T23:59:59Z'));
    expect(segunda).toBe(domingo);
  });

  it('domingo pertence à semana que termina nele, não à seguinte', () => {
    const domingo = semanaAtual(new Date('2026-07-26T00:00:00Z'));
    const segundaSeguinte = semanaAtual(new Date('2026-07-27T00:00:00Z'));
    expect(domingo).not.toBe(segundaSeguinte);
  });

  it('vira o ano corretamente (ISO: 1º de janeiro pode ser da última semana do ano anterior)', () => {
    // 2027-01-01 é sexta-feira; a semana ISO começou em 2026-12-28
    expect(semanaAtual(new Date('2027-01-01T00:00:00Z'))).toBe('2026-W53');
  });
});
