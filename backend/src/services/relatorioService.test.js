import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));
vi.mock('./turmaService.js', () => ({
  exigirTurmaDoProfessor: vi.fn(),
  alunosDaTurma: vi.fn(),
}));

const { db } = await import('../config/supabase.js');
const { exigirTurmaDoProfessor, alunosDaTurma } = await import('./turmaService.js');
const { desempenhoPorQuestao, csvDesempenhoTurma } = await import('./relatorioService.js');

describe('relatorioService.desempenhoPorQuestao', () => {
  beforeEach(() => vi.clearAllMocks());

  it('filtra por fase quando informado', async () => {
    db.from.mockImplementation(makeDb({ desempenho_questoes: [ok([{ questao_id: 'q1' }])] }).from);
    const dados = await desempenhoPorQuestao(3);
    expect(dados).toEqual([{ questao_id: 'q1' }]);
  });

  it('sem fase, traz todas', async () => {
    db.from.mockImplementation(makeDb({ desempenho_questoes: [ok([])] }).from);
    const dados = await desempenhoPorQuestao(null);
    expect(dados).toEqual([]);
  });
});

describe('relatorioService.csvDesempenhoTurma', () => {
  beforeEach(() => vi.clearAllMocks());

  it('gera CSV com BOM, separador ";" e nome de arquivo com slug', async () => {
    exigirTurmaDoProfessor.mockResolvedValue({ id: 'turma-1', nome: 'Turma Ção & Cia' });
    alunosDaTurma.mockResolvedValue([
      { nome: 'Ana', nivel: 3, xp_total: 450, fases_concluidas: 2, total_tentativas: 5, total_badges: 1 },
    ]);

    const { nomeArquivo, conteudo } = await csvDesempenhoTurma('prof-1', 'turma-1');

    expect(nomeArquivo).toBe('desempenho-turma-cao-cia.csv');
    expect(conteudo[0]).toBe('﻿'); // BOM
    expect(conteudo).toContain('Nome;Nível;XP Total;Fases Concluídas;Tentativas;Badges');
    expect(conteudo).toContain('Ana;3;450;2;5;1');
  });

  it('escapa valores com ";", aspas ou quebra de linha', async () => {
    exigirTurmaDoProfessor.mockResolvedValue({ id: 'turma-1', nome: 'Turma' });
    alunosDaTurma.mockResolvedValue([
      { nome: 'Ana; "A"', nivel: 1, xp_total: 0, fases_concluidas: 0, total_tentativas: 0, total_badges: 0 },
    ]);

    const { conteudo } = await csvDesempenhoTurma('prof-1', 'turma-1');
    expect(conteudo).toContain('"Ana; ""A"""');
  });
});
