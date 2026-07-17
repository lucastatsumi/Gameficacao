import { embaralhar } from './random.js';

// Pesos-alvo por dificuldade conforme a taxa de acerto recente do aluno
// NA FASE. Sem histórico ainda (taxa null), usa a distribuição "média" —
// mesmo comportamento de antes desta feature (mix equilibrado).
const PESOS_POR_FAIXA = {
  baixa: { facil: 0.6, media: 0.3, dificil: 0.1 }, // taxa < 40%: reforça o básico
  media: { facil: 0.3, media: 0.5, dificil: 0.2 }, // 40% <= taxa < 80%
  alta: { facil: 0.1, media: 0.3, dificil: 0.6 }, // taxa >= 80%: mais desafio
};

export function faixaDeDesempenho(taxaAcertoPct) {
  if (taxaAcertoPct == null) return 'media';
  if (taxaAcertoPct < 40) return 'baixa';
  if (taxaAcertoPct >= 80) return 'alta';
  return 'media';
}

// Seleciona `quantidade` questões do pool, ponderando por dificuldade
// conforme a taxa de acerto recente — sem nunca repetir uma questão nem
// devolver menos que o pedido (completa com sobras se uma dificuldade não
// tiver questões suficientes). `embaralharFn` é injetável só para teste.
export function selecionarAdaptativo(questoes, taxaAcertoPct, quantidade, embaralharFn = embaralhar) {
  if (quantidade >= questoes.length) return embaralharFn(questoes);

  const faixa = faixaDeDesempenho(taxaAcertoPct);
  const pesos = PESOS_POR_FAIXA[faixa];

  const porDificuldade = { facil: [], media: [], dificil: [] };
  const sobras = [];
  for (const q of questoes) {
    if (porDificuldade[q.dificuldade]) porDificuldade[q.dificuldade].push(q);
    else sobras.push(q); // dificuldade ausente/desconhecida: entra como sobra
  }
  for (const dif of Object.keys(porDificuldade)) {
    porDificuldade[dif] = embaralharFn(porDificuldade[dif]);
  }

  const selecionadas = [];
  for (const dif of ['facil', 'media', 'dificil']) {
    const disponiveis = porDificuldade[dif] ?? [];
    const alvo = Math.round(quantidade * (pesos[dif] ?? 0));
    selecionadas.push(...disponiveis.slice(0, alvo));
    sobras.push(...disponiveis.slice(alvo));
  }

  const faltam = quantidade - selecionadas.length;
  if (faltam > 0) selecionadas.push(...embaralharFn(sobras).slice(0, faltam));
  else if (faltam < 0) selecionadas.length = quantidade; // arredondamento passou do alvo

  return embaralharFn(selecionadas);
}
