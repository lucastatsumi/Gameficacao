import { describe, expect, it } from 'vitest';
import { semanaAnteriorA, semanaIso } from './semana.js';

function em(dataISO) {
  return new Date(`${dataISO}T12:00:00Z`);
}

describe('semanaIso', () => {
  it('quinta-feira de referência fica na semana 1 do próprio ano', () => {
    expect(semanaIso(em('2026-01-01'))).toBe('2026-W01');
  });

  it('domingo pertence à mesma semana ISO da quinta anterior', () => {
    expect(semanaIso(em('2026-01-04'))).toBe('2026-W01');
    expect(semanaIso(em('2026-01-05'))).toBe('2026-W02');
  });

  it('calcula a semana de uma data qualquer no meio do ano', () => {
    expect(semanaIso(em('2026-07-25'))).toBe('2026-W30');
  });

  it('31/12 pode pertencer à semana 1 do ano seguinte (vira o ano ISO)', () => {
    expect(semanaIso(em('2025-12-29'))).toBe('2026-W01');
  });

  it('1º de janeiro pode pertencer à última semana do ano anterior', () => {
    expect(semanaIso(em('2021-01-01'))).toBe('2020-W53');
    expect(semanaIso(em('2020-12-31'))).toBe('2020-W53');
  });
});

describe('semanaAnteriorA', () => {
  it('volta exatamente 7 dias antes de calcular o rótulo', () => {
    expect(semanaAnteriorA(em('2026-07-25'))).toBe('2026-W29');
  });

  it('atravessa a virada de ano corretamente', () => {
    expect(semanaAnteriorA(em('2026-01-01'))).toBe('2025-W52');
  });
});
