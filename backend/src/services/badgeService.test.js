import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { verificarBadges } = await import('./badgeService.js');

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
}

const BADGE_XP = { id: 1, nome: 'Rico em XP', tipo_condicao: 'xp_acumulado', parametro: { xp: 100 } };
const BADGE_FASE1 = {
  id: 2,
  nome: 'Fase 1 concluída',
  tipo_condicao: 'fase_concluida',
  parametro: { fase_ordem: 1 },
};
const BADGE_PERFEITO = { id: 3, nome: 'Perfeccionista', tipo_condicao: 'quiz_perfeito', parametro: {} };
const BADGE_VELOZ = {
  id: 4,
  nome: 'Raio',
  tipo_condicao: 'velocidade',
  parametro: { tempo_medio_ms: 5000 },
};
const BADGE_SEQUENCIA = {
  id: 5,
  nome: 'Sequência de 3',
  tipo_condicao: 'sequencia_acertos',
  parametro: { acertos: 3 },
};
const BADGE_STREAK = {
  id: 6,
  nome: 'Em Chamas',
  tipo_condicao: 'streak_dias',
  parametro: { dias: 7 },
};

describe('verificarBadges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não repete badge já conquistada', async () => {
    configurarDb({
      badges: [ok([BADGE_XP])],
      usuario_badges: [ok([{ badge_id: 1 }])],
    });

    const novas = await verificarBadges('user-1', { xpTotal: 999 });
    expect(novas).toEqual([]);
    expect(db.from).not.toHaveBeenCalledWith('respostas');
  });

  it('concede badge de XP acumulado quando o limiar é atingido', async () => {
    // usuario_badges é lido (badges conquistadas) e depois escrito (insert das novas)
    configurarDb({
      badges: [ok([BADGE_XP])],
      usuario_badges: [ok([]), ok(null)],
    });

    const novas = await verificarBadges('user-1', { xpTotal: 150 });
    expect(novas).toHaveLength(1);
    expect(novas[0].nome).toBe('Rico em XP');
  });

  it('não concede badge de XP abaixo do limiar', async () => {
    configurarDb({
      badges: [ok([BADGE_XP])],
      usuario_badges: [ok([])],
    });

    const novas = await verificarBadges('user-1', { xpTotal: 50 });
    expect(novas).toEqual([]);
  });

  it('badge de fase só conta a fase certa e exige aprovação', async () => {
    configurarDb({
      badges: [ok([BADGE_FASE1])],
      usuario_badges: [ok([])],
    });
    const semAprovar = await verificarBadges('user-1', { aprovada: false, faseOrdem: 1 });
    expect(semAprovar).toEqual([]);

    configurarDb({
      badges: [ok([BADGE_FASE1])],
      usuario_badges: [ok([]), ok(null)],
    });
    const faseErrada = await verificarBadges('user-1', { aprovada: true, faseOrdem: 2 });
    expect(faseErrada).toEqual([]);

    configurarDb({
      badges: [ok([BADGE_FASE1])],
      usuario_badges: [ok([]), ok(null)],
    });
    const certo = await verificarBadges('user-1', { aprovada: true, faseOrdem: 1 });
    expect(certo).toHaveLength(1);
  });

  it('badge de quiz perfeito depende só da flag quizPerfeito', async () => {
    configurarDb({
      badges: [ok([BADGE_PERFEITO])],
      usuario_badges: [ok([]), ok(null)],
    });
    const novas = await verificarBadges('user-1', { quizPerfeito: true });
    expect(novas).toHaveLength(1);
  });

  it('badge de velocidade exige aprovação E tempo médio dentro do limite', async () => {
    configurarDb({
      badges: [ok([BADGE_VELOZ])],
      usuario_badges: [ok([])],
    });
    const lento = await verificarBadges('user-1', { aprovada: true, tempoMedioMs: 9000 });
    expect(lento).toEqual([]);

    configurarDb({
      badges: [ok([BADGE_VELOZ])],
      usuario_badges: [ok([]), ok(null)],
    });
    const rapido = await verificarBadges('user-1', { aprovada: true, tempoMedioMs: 4000 });
    expect(rapido).toHaveLength(1);
  });

  it('badge de sequência consulta o histórico de respostas só quando necessário', async () => {
    configurarDb({
      badges: [ok([BADGE_SEQUENCIA])],
      usuario_badges: [ok([]), ok(null)],
      respostas: [
        ok([
          { correta: true, respondida_em: '2026-01-03' },
          { correta: true, respondida_em: '2026-01-02' },
          { correta: true, respondida_em: '2026-01-01' },
          { correta: false, respondida_em: '2025-12-31' },
        ]),
      ],
    });

    const novas = await verificarBadges('user-1', {});
    expect(novas).toHaveLength(1);
    expect(db.from).toHaveBeenCalledWith('respostas');
  });

  it('interrompe a sequência no primeiro erro (mais recente primeiro)', async () => {
    configurarDb({
      badges: [ok([BADGE_SEQUENCIA])],
      usuario_badges: [ok([])],
      respostas: [
        ok([
          { correta: true, respondida_em: '2026-01-03' },
          { correta: false, respondida_em: '2026-01-02' },
          { correta: true, respondida_em: '2026-01-01' },
        ]),
      ],
    });

    const novas = await verificarBadges('user-1', {});
    expect(novas).toEqual([]);
  });

  it('badge de streak diário compara streakAtual com o limiar', async () => {
    configurarDb({
      badges: [ok([BADGE_STREAK])],
      usuario_badges: [ok([])],
    });
    const aindaNao = await verificarBadges('user-1', { streakAtual: 6 });
    expect(aindaNao).toEqual([]);

    configurarDb({
      badges: [ok([BADGE_STREAK])],
      usuario_badges: [ok([]), ok(null)],
    });
    const conquistou = await verificarBadges('user-1', { streakAtual: 7 });
    expect(conquistou).toHaveLength(1);
  });
});
