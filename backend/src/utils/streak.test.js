import { describe, expect, it } from 'vitest';
import { diaAnterior, proximoStreak } from './streak.js';

describe('diaAnterior', () => {
  it('volta um dia dentro do mesmo mês', () => {
    expect(diaAnterior('2026-07-16')).toBe('2026-07-15');
  });

  it('atravessa virada de mês', () => {
    expect(diaAnterior('2026-08-01')).toBe('2026-07-31');
  });

  it('atravessa virada de ano', () => {
    expect(diaAnterior('2026-01-01')).toBe('2025-12-31');
  });
});

describe('proximoStreak', () => {
  it('primeira atividade (sem streak salvo) começa em 1', () => {
    expect(proximoStreak({ streakAtual: 0, ultimoDia: null, hoje: '2026-07-16' })).toBe(1);
  });

  it('segunda atividade no MESMO dia mantém o streak', () => {
    expect(proximoStreak({ streakAtual: 4, ultimoDia: '2026-07-16', hoje: '2026-07-16' })).toBe(4);
  });

  it('atividade no dia seguinte incrementa', () => {
    expect(proximoStreak({ streakAtual: 4, ultimoDia: '2026-07-15', hoje: '2026-07-16' })).toBe(5);
  });

  it('atividade após um dia pulado reinicia em 1', () => {
    expect(proximoStreak({ streakAtual: 10, ultimoDia: '2026-07-10', hoje: '2026-07-16' })).toBe(1);
  });
});
