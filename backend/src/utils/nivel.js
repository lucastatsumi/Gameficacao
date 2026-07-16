// Curva de progressão quadrática (espelha as funções SQL de 02_views.sql):
// nível 2 = 100 XP, nível 3 = 400 XP, nível 4 = 900 XP...

export function nivelPorXp(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function xpParaNivel(nivel) {
  return (nivel - 1) ** 2 * 100;
}

// Percentual (0–100, arredondado) de avanço dentro do nível atual — alimenta a
// barra de XP do perfil. Mede o quanto do XP já foi conquistado entre o piso do
// nível atual e o piso do próximo.
export function progressoNivelPct(xpTotal, nivel) {
  const xpNivelAtual = xpParaNivel(nivel);
  const xpProximoNivel = xpParaNivel(nivel + 1);
  return Math.round((100 * (xpTotal - xpNivelAtual)) / (xpProximoNivel - xpNivelAtual));
}
