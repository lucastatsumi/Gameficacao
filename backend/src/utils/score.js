// Score de avaliação (0–100) de uma tentativa — métrica do gestor, separada
// do XP (moeda de gamificação). Composição, calculada só no servidor:
//   90% precisão ponderada: cada questão vale o peso da dificuldade; acertar
//        rápido rende até 100% do peso, acertar no limite do timer, 80%;
//   10% sequência: maior série de acertos seguidos sobre o total.
// Questões sem resposta (puladas já são descontadas pelo chamador via
// `totalEfetivo`) entram no denominador com peso médio — não responder não
// pode render mais score do que errar.
const PESO_DIFICULDADE = { facil: 1, media: 2, dificil: 3 };
const PESO_MEDIO = PESO_DIFICULDADE.media;
const PISO_VELOCIDADE = 0.8;
const PESO_PRECISAO = 0.9;

export function pesoDaDificuldade(dificuldade) {
  return PESO_DIFICULDADE[dificuldade] ?? PESO_MEDIO;
}

// 1.0 quando respondeu instantaneamente, PISO_VELOCIDADE no limite do timer.
export function fatorVelocidade(tempoMs, limiteSeg) {
  if (tempoMs == null || !limiteSeg) return PISO_VELOCIDADE;
  const fracaoUsada = Math.min(Math.max(tempoMs / (limiteSeg * 1000), 0), 1);
  return 1 - (1 - PISO_VELOCIDADE) * fracaoUsada;
}

export function calcularScore(respostas, totalEfetivo) {
  const total = Math.max(totalEfetivo, respostas.length);
  if (total === 0) return 0;

  let pesoMaximo = 0;
  let pesoObtido = 0;
  let sequencia = 0;
  let maiorSequencia = 0;

  for (const r of respostas) {
    const peso = pesoDaDificuldade(r.questoes?.dificuldade);
    pesoMaximo += peso;
    if (r.correta) {
      pesoObtido += peso * fatorVelocidade(r.tempo_resposta_ms, r.questoes?.tempo_limite_seg);
      sequencia += 1;
      maiorSequencia = Math.max(maiorSequencia, sequencia);
    } else {
      sequencia = 0;
    }
  }
  pesoMaximo += (total - respostas.length) * PESO_MEDIO;

  const precisao = pesoObtido / pesoMaximo;
  const bonusSequencia = maiorSequencia / total;
  const score = 100 * (PESO_PRECISAO * precisao + (1 - PESO_PRECISAO) * bonusSequencia);
  return Math.round(Math.min(100, Math.max(0, score)));
}
