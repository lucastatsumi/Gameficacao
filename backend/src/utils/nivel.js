// Curva de progressão quadrática (espelha as funções SQL de 02_views.sql):
// nível 2 = 100 XP, nível 3 = 400 XP, nível 4 = 900 XP...

export function nivelPorXp(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function xpParaNivel(nivel) {
  return (nivel - 1) ** 2 * 100;
}
