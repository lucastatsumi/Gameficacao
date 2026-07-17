// "Classe" temática (RPG leve, cosmético) derivada da fase de maior ordem
// já concluída pelo aluno. Centralizado aqui para o Perfil e o Ranking
// formatarem exatamente do mesmo jeito.
export function classeDaFase(faseNome) {
  return faseNome ? `Mestre de ${faseNome}` : null;
}
