// Combo de acertos consecutivos dentro da MESMA tentativa: o 1º acerto
// vale ×1.0, o 2º seguido ×1.1, o 3º ×1.25 e do 4º em diante ×1.5 (teto).
// Errar (ou tempo esgotado) zera a sequência. O bônus é a diferença entre
// o XP com multiplicadores e o XP base — assim ele compõe com evento/
// streak sem mudar as regras existentes.
const MULTIPLICADORES = [1, 1.1, 1.25, 1.5];

export function aplicarCombo(respostas, xpDaResposta) {
  let sequencia = 0;
  let comboMax = 0;
  let xpBase = 0;
  let xpComCombo = 0;

  for (const r of respostas) {
    if (!r.correta) {
      sequencia = 0;
      continue;
    }
    sequencia += 1;
    comboMax = Math.max(comboMax, sequencia);
    const mult = MULTIPLICADORES[Math.min(sequencia - 1, MULTIPLICADORES.length - 1)];
    const xp = xpDaResposta(r);
    xpBase += xp;
    xpComCombo += xp * mult;
  }

  return { xpBase, bonusCombo: Math.round(xpComCombo - xpBase), comboMax };
}
