// Semana ISO 8601 ('AAAA-Www', ex.: '2026-W30'): usada pelas ligas semanais
// para agrupar o XP ganho na semana, independente de fuso — tudo em UTC,
// mesmo critério de "dia de calendário" usado em utils/streak.js.

export function semanaIsoDe(agora = new Date()) {
  const dia = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate()));

  // Desloca para a quinta-feira da mesma semana ISO (semana começa na
  // segunda) — é o dia que sempre cai no ano correto da semana.
  const diaDaSemana = (dia.getUTCDay() + 6) % 7; // 0 = segunda
  dia.setUTCDate(dia.getUTCDate() - diaDaSemana + 3);

  const anoIso = dia.getUTCFullYear();
  const primeiraQuinta = new Date(Date.UTC(anoIso, 0, 4));
  const offsetPrimeiraQuinta = (primeiraQuinta.getUTCDay() + 6) % 7;
  primeiraQuinta.setUTCDate(primeiraQuinta.getUTCDate() - offsetPrimeiraQuinta + 3);

  const semana = 1 + Math.round((dia - primeiraQuinta) / (7 * 24 * 60 * 60 * 1000));
  return `${anoIso}-W${String(semana).padStart(2, '0')}`;
}
