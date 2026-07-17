// Título cosmético por faixa de nível — puramente de exibição, não afeta
// gameplay. Progressão de personagem (RPG leve) do roadmap de engajamento.
const FAIXAS_NIVEL = [
  { min: 1, max: 2, titulo: 'Aprendiz' },
  { min: 3, max: 5, titulo: 'Aventureiro' },
  { min: 6, max: 9, titulo: 'Especialista' },
  { min: 10, max: Infinity, titulo: 'Lenda' },
];

export function tituloPorNivel(nivel) {
  const faixa = FAIXAS_NIVEL.find((f) => nivel >= f.min && nivel <= f.max);
  return (faixa ?? FAIXAS_NIVEL[0]).titulo;
}
