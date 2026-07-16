import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { obterPerfil, historicoDeTentativas, errosRecentes } = await import('./perfilService.js');

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
    expect(perfil.poderes).toEqual({ eliminar_alternativa: 0, tempo_extra: 1, pular_questao: 0 });
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

describe('errosRecentes', () => {
  it('monta a alternativa escolhida e a correta a partir do id armazenado', async () => {
    configurarDb({
      respostas: [
        ok([
          {
            id: 'r1',
            alternativa_id: 'a-errada',
            respondida_em: '2026-01-03',
            questoes: {
              id: 'q1',
              enunciado: 'Qual estrutura...',
              codigo_snippet: null,
              dificuldade: 'media',
              alternativas: [
                { id: 'a-certa', letra: 'B', texto: 'Lista ligada', correta: true, explicacao: 'O(1) no início' },
                { id: 'a-errada', letra: 'A', texto: 'Array', correta: false, explicacao: 'O(n) no início' },
              ],
            },
          },
        ]),
      ],
    });

    const revisao = await errosRecentes('user-1');
    expect(revisao).toEqual([
      {
        resposta_id: 'r1',
        respondida_em: '2026-01-03',
        questao: { id: 'q1', enunciado: 'Qual estrutura...', codigo_snippet: null, dificuldade: 'media' },
        sua_alternativa: { letra: 'A', texto: 'Array' },
        alternativa_correta: { letra: 'B', texto: 'Lista ligada', explicacao: 'O(1) no início' },
      },
    ]);
  });

  it('sua_alternativa é null quando o tempo esgotou (alternativa_id null)', async () => {
    configurarDb({
      respostas: [
        ok([
          {
            id: 'r2',
            alternativa_id: null,
            respondida_em: '2026-01-03',
            questoes: {
              id: 'q2',
              enunciado: 'Enunciado',
              codigo_snippet: null,
              dificuldade: 'facil',
              alternativas: [
                { id: 'a1', letra: 'A', texto: 'x', correta: true, explicacao: 'exp' },
                { id: 'a2', letra: 'B', texto: 'y', correta: false, explicacao: 'exp2' },
              ],
            },
          },
        ]),
      ],
    });

    const revisao = await errosRecentes('user-1');
    expect(revisao[0].sua_alternativa).toBeNull();
    expect(revisao[0].alternativa_correta.letra).toBe('A');
  });

  it('ignora respostas cuja questão não existe mais (defensivo)', async () => {
    configurarDb({
      respostas: [ok([{ id: 'r3', alternativa_id: 'x', respondida_em: '2026-01-01', questoes: null }])],
    });

    const revisao = await errosRecentes('user-1');
    expect(revisao).toEqual([]);
  });
});
