// Escala de proficiência por tema (Horizonte 3) — a versão AVALIATIVA do
// título por nível: deriva do score médio (utils/pontuacao.js) e da
// cobertura de competências, nunca do XP.

export const NIVEIS_PROFICIENCIA = ['Iniciante', 'Praticante', 'Proficiente', 'Referência'];

// Respostas mínimas numa competência para ela contar como "coberta"
export const MIN_RESPOSTAS_COBERTURA = 3;

// Competência dominada (também revela a carta colecionável, 4.9)
export const MAESTRIA_MIN_RESPOSTAS = 5;
export const MAESTRIA_MIN_PCT = 80;

export function competenciaDominada({ total, acertos }) {
  return total >= MAESTRIA_MIN_RESPOSTAS && (100 * acertos) / total >= MAESTRIA_MIN_PCT;
}

// scoreMedio: 0–100 ou null (sem tentativa avaliada); coberturaPct: 0–100;
// trilhaConcluida: todos os módulos do tema aprovados.
export function nivelDeProficiencia({ scoreMedio, coberturaPct, trilhaConcluida }) {
  const score = scoreMedio ?? 0;
  if (trilhaConcluida && score >= 85 && coberturaPct >= 100) return 'Referência';
  if (score >= 70 && coberturaPct >= 75) return 'Proficiente';
  if (score >= 50 || coberturaPct >= 50) return 'Praticante';
  return 'Iniciante';
}
