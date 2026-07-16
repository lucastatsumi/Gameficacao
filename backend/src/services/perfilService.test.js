import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { obterPerfil, historicoDeTentativas } = await import('./perfilService.js');

function configurarDb(filas) {
  db.from.mockImplementation(makeDb(filas).from);
}

beforeEach(() => vi.clearAllMocks());

describe('obterPerfil', () => {
  const usuarioBase = { id: 'user-1', nome: 'Ana', email: 'ana@x.com', role: 'aluno', xp_total: 150, nivel: 2 };

  it('sem nenhuma fase concluída, classe é null', async () => {
    configurarDb({
      usuario_badges: [ok(null)], // head:true -> só o count importa
      usuario_poderes: [ok([])],
      progresso_fase: [ok([])],
    });

    const perfil = await obterPerfil(usuarioBase);
    expect(perfil.classe).toBeNull();
    expect(perfil.titulo_nivel).toBe('Aprendiz');
  });

  it('classe é "Mestre de <fase>" da fase de maior ordem concluída', async () => {
    configurarDb({
      usuario_badges: [ok(null)],
      usuario_poderes: [ok([])],
      progresso_fase: [
        ok([
          { fases: { nome: 'Listas', ordem: 1 } },
          { fases: { nome: 'Árvores', ordem: 4 } },
          { fases: { nome: 'Pilhas', ordem: 2 } },
        ]),
      ],
    });

    const perfil = await obterPerfil({ ...usuarioBase, nivel: 7 });
    expect(perfil.classe).toBe('Mestre de Árvores');
    expect(perfil.titulo_nivel).toBe('Especialista');
  });

  it('inclui streak e poderes com defaults seguros', async () => {
    configurarDb({
      usuario_badges: [ok(null)],
      usuario_poderes: [ok([{ poder: 'tempo_extra', quantidade: 1 }])],
      progresso_fase: [ok([])],
    });

    const perfil = await obterPerfil(usuarioBase);
    expect(perfil.streak_dias).toBe(0);
    expect(perfil.poderes).toEqual({ eliminar_alternativa: 0, tempo_extra: 1 });
  });
});

describe('historicoDeTentativas', () => {
  it('só traz tentativas finalizadas, mais recentes primeiro (delegado à query)', async () => {
    configurarDb({
      tentativas: [
        ok([
          {
            id: 't1',
            acertos: 8,
            total_questoes: 10,
            xp_ganho: 80,
            aprovada: true,
            finalizada_em: '2026-01-02',
            fases: { id: 1, nome: 'Listas' },
          },
        ]),
      ],
    });

    const historico = await historicoDeTentativas('user-1');
    expect(historico).toEqual([
      {
        id: 't1',
        fase: { id: 1, nome: 'Listas' },
        acertos: 8,
        total_questoes: 10,
        xp_ganho: 80,
        aprovada: true,
        finalizada_em: '2026-01-02',
      },
    ]);
  });
});
