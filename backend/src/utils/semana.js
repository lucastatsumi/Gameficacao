// Semana ISO-8601 (segunda a domingo, UTC): identificador estável tipo
// "2026-W30" usado pelas ligas semanais para saber quando a semana virou.

export function semanaAtual(agora = new Date()) {
  const d = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate()));
  const diaSemanaISO = d.getUTCDay() || 7; // segunda=1 ... domingo=7
  d.setUTCDate(d.getUTCDate() + 4 - diaSemanaISO); // quinta-feira da mesma semana ISO
  const anoISO = d.getUTCFullYear();
  const inicioAno = new Date(Date.UTC(anoISO, 0, 1));
  const numero = Math.ceil(((d - inicioAno) / 86400000 + 1) / 7);
  return `${anoISO}-W${String(numero).padStart(2, '0')}`;
}
