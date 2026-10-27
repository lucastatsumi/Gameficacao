// Pontuação ponderada (Horizonte 3): nota 0–100 de uma tentativa. Lógica
// pura — quizService.finalizarQuiz só passa as respostas na ordem em que
// foram dadas.
//
// Cada questão pesa pela dificuldade. Uma resposta certa vale de 80% a
// 100% do seu peso:
//   0.80 base (acertou)
// + 0.10 × velocidade  (fração do tempo-limite que sobrou, 0..1)
// + 0.10 × sequência   (0 no 1º acerto seguido, 0.5 no 2º, 1 do 3º em diante)
// Errar, deixar o tempo esgotar ou não responder vale 0. Questões puladas
// com o poder "pular" ficam fora do denominador (mesma regra da aprovação).

export const PESO_DIFICULDADE = { facil: 1, media: 1.5, dificil: 2 };
const PESO_PADRAO = PESO_DIFICULDADE.media;

function pesoDe(dificuldade) {
  return PESO_DIFICULDADE[dificuldade] ?? PESO_PADRAO;
}

export function velocidade(tempoRespostaMs, tempoLimiteSeg) {
  if (tempoRespostaMs == null || !tempoLimiteSeg) return 0;
  const fracaoUsada = tempoRespostaMs / (tempoLimiteSeg * 1000);
  return Math.min(1, Math.max(0, 1 - fracaoUsada));
}

// respostas: [{ correta, tempo_resposta_ms, questoes: { dificuldade, tempo_limite_seg } }]
// naoRespondidas: questões sorteadas que ficaram sem resposta (contam 0,
// com peso médio — a dificuldade delas não chega até aqui).
export function calcularScore(respostas, naoRespondidas = 0) {
  let somaPesos = 0;
  let somaPontos = 0;
  let sequencia = 0;

  for (const r of respostas) {
    const peso = pesoDe(r.questoes?.dificuldade);
    somaPesos += peso;
    if (!r.correta) {
      sequencia = 0;
      continue;
    }
    sequencia += 1;
    const fatorSequencia = Math.min(1, (sequencia - 1) / 2);
    const fatorVelocidade = velocidade(r.tempo_resposta_ms, r.questoes?.tempo_limite_seg);
    somaPontos += peso * (0.8 + 0.1 * fatorVelocidade + 0.1 * fatorSequencia);
  }
  somaPesos += Math.max(0, naoRespondidas) * PESO_PADRAO;

  if (somaPesos === 0) return null;
  return Math.round((1000 * somaPontos) / somaPesos) / 10;
}
