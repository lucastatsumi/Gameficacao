import { describe, expect, it } from 'vitest';
import { faixaDeDesempenho, selecionarAdaptativo } from './dificuldadeAdaptativa.js';

describe('faixaDeDesempenho', () => {
  it('sem histórico (null), usa a faixa média', () => {
    expect(faixaDeDesempenho(null)).toBe('media');
  });

  it('abaixo de 40% é baixa', () => {
    expect(faixaDeDesempenho(0)).toBe('baixa');
    expect(faixaDeDesempenho(39)).toBe('baixa');
  });

  it('40% é o limite inferior da faixa média', () => {
    expect(faixaDeDesempenho(40)).toBe('media');
  });

  it('79% ainda é média', () => {
    expect(faixaDeDesempenho(79)).toBe('media');
  });

  it('80% ou mais é alta', () => {
    expect(faixaDeDesempenho(80)).toBe('alta');
    expect(faixaDeDesempenho(100)).toBe('alta');
  });
});

// shuffle "burro" e determinístico só para tornar as asserções previsíveis —
// mantém a ordem recebida, sem embaralhar de verdade.
const semEmbaralhar = (arr) => [...arr];

function gerarQuestoes(dificuldade, quantidade, prefixo) {
  return Array.from({ length: quantidade }, (_, i) => ({ id: `${prefixo}${i}`, dificuldade }));
}

describe('selecionarAdaptativo', () => {
  it('quando quantidade >= pool, devolve o pool inteiro embaralhado', () => {
    const questoes = [...gerarQuestoes('facil', 2, 'f'), ...gerarQuestoes('media', 1, 'm')];
    const resultado = selecionarAdaptativo(questoes, 50, 10, semEmbaralhar);
    expect(resultado).toHaveLength(3);
    expect(resultado.map((q) => q.id).sort()).toEqual(['f0', 'f1', 'm0']);
  });

  it('desempenho baixo (taxa < 40%) prioriza questões fáceis', () => {
    const questoes = [
      ...gerarQuestoes('facil', 10, 'f'),
      ...gerarQuestoes('media', 10, 'm'),
      ...gerarQuestoes('dificil', 10, 'd'),
    ];
    const resultado = selecionarAdaptativo(questoes, 20, 10, semEmbaralhar);
    const porDificuldade = contarPorDificuldade(resultado);
    expect(resultado).toHaveLength(10);
    expect(porDificuldade.facil).toBe(6); // 60%
    expect(porDificuldade.media).toBe(3); // 30%
    expect(porDificuldade.dificil).toBe(1); // 10%
  });

  it('desempenho alto (taxa >= 80%) prioriza questões difíceis', () => {
    const questoes = [
      ...gerarQuestoes('facil', 10, 'f'),
      ...gerarQuestoes('media', 10, 'm'),
      ...gerarQuestoes('dificil', 10, 'd'),
    ];
    const resultado = selecionarAdaptativo(questoes, 90, 10, semEmbaralhar);
    const porDificuldade = contarPorDificuldade(resultado);
    expect(resultado).toHaveLength(10);
    expect(porDificuldade.facil).toBe(1); // 10%
    expect(porDificuldade.media).toBe(3); // 30%
    expect(porDificuldade.dificil).toBe(6); // 60%
  });

  it('sem histórico (null), usa distribuição média equilibrada', () => {
    const questoes = [
      ...gerarQuestoes('facil', 10, 'f'),
      ...gerarQuestoes('media', 10, 'm'),
      ...gerarQuestoes('dificil', 10, 'd'),
    ];
    const resultado = selecionarAdaptativo(questoes, null, 10, semEmbaralhar);
    const porDificuldade = contarPorDificuldade(resultado);
    expect(resultado).toHaveLength(10);
    expect(porDificuldade.facil).toBe(3); // 30%
    expect(porDificuldade.media).toBe(5); // 50%
    expect(porDificuldade.dificil).toBe(2); // 20%
  });

  it('nunca repete uma questão', () => {
    const questoes = [
      ...gerarQuestoes('facil', 10, 'f'),
      ...gerarQuestoes('media', 10, 'm'),
      ...gerarQuestoes('dificil', 10, 'd'),
    ];
    const resultado = selecionarAdaptativo(questoes, 20, 10, semEmbaralhar);
    const ids = resultado.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('completa com sobras quando uma dificuldade não tem questões suficientes', () => {
    // taxa alta pede 60% difícil, mas só há 1 questão difícil disponível
    const questoes = [...gerarQuestoes('facil', 5, 'f'), ...gerarQuestoes('media', 5, 'm'), { id: 'd0', dificuldade: 'dificil' }];
    const resultado = selecionarAdaptativo(questoes, 90, 10, semEmbaralhar);
    expect(resultado).toHaveLength(10);
    const porDificuldade = contarPorDificuldade(resultado);
    expect(porDificuldade.dificil).toBe(1); // só tinha 1 disponível
    expect(porDificuldade.facil + porDificuldade.media).toBe(9); // completou com as sobras
  });
});

function contarPorDificuldade(questoes) {
  return questoes.reduce((acc, q) => {
    acc[q.dificuldade] = (acc[q.dificuldade] ?? 0) + 1;
    return acc;
  }, { facil: 0, media: 0, dificil: 0 });
}
