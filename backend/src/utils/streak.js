// Streak diário: dias consecutivos em que o aluno finalizou pelo menos um
// quiz. Datas são comparadas como string 'YYYY-MM-DD' (sem hora) — o streak
// conta "dias de calendário em UTC", não intervalos de 24h.

export function dataDeHoje(agora = new Date()) {
  return agora.toISOString().slice(0, 10);
}

export function diaAnterior(dataISO) {
  const d = new Date(`${dataISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Dado o streak salvo e o último dia contado, decide o streak de hoje:
// - mesmo dia de hoje  -> mantém (já contou essa atividade hoje)
// - dia imediatamente anterior -> incrementa
// - qualquer outro caso (primeira vez ou streak quebrado) -> reinicia em 1
export function proximoStreak({ streakAtual = 0, ultimoDia = null, hoje }) {
  if (ultimoDia === hoje) return streakAtual || 1;
  if (ultimoDia === diaAnterior(hoje)) return streakAtual + 1;
  return 1;
}
