// Semana ISO 8601 ('YYYY-Www'): usada pela liga semanal (roadmap 4.5) para
// bucketizar o XP ganho por semana. A liga não depende de cron externo — o
// serviço detecta a virada quando a string da semana muda no primeiro
// acesso do jogador e fecha a semana anterior ali mesmo (fechamento lazy).

export function semanaIso(agora = new Date()) {
  const dia = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate()));
  const diaDaSemana = dia.getUTCDay() || 7; // domingo (0) vira 7 — segunda=1 ... domingo=7
  dia.setUTCDate(dia.getUTCDate() + 4 - diaDaSemana); // quinta-feira da mesma semana ISO

  const anoIso = dia.getUTCFullYear();
  const inicioDoAno = new Date(Date.UTC(anoIso, 0, 1));
  const numeroDaSemana = Math.ceil(((dia - inicioDoAno) / 86400000 + 1) / 7);

  return `${anoIso}-W${String(numeroDaSemana).padStart(2, '0')}`;
}
