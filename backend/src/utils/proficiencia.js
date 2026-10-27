// Escala de proficiência por tema (roadmap H3): versão "avaliativa" do
// título por nível. Combina score médio (0–100) e cobertura da trilha
// (fração 0–1 de módulos concluídos) — dominar poucos módulos não basta
// para subir de faixa.
export function classificarProficiencia(scoreMedio, cobertura) {
  if (scoreMedio == null || cobertura < 0.5) return 'iniciante';
  if (cobertura >= 1 && scoreMedio >= 90) return 'referencia';
  if (cobertura >= 1 && scoreMedio >= 75) return 'proficiente';
  if (scoreMedio >= 60) return 'praticante';
  return 'iniciante';
}
