// Semana ISO-8601 (formato 'YYYY-Www'): usada pelas ligas semanais para
// identificar "a semana corrente" de forma que a comparação como STRING já
// ordena cronologicamente (inclusive na virada de ano) — sem isso, o
// fechamento lazy da liga precisaria de lógica extra só para comparar
// semanas.

function semanaIso(data) {
  // Normaliza para meia-noite UTC do dia e desloca até a quinta-feira da
  // mesma semana ISO (semana começa na segunda) — algoritmo padrão de
  // "nearest Thursday" para achar o ano ISO correto perto da virada.
  const d = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
  const diaSemanaIso = (d.getUTCDay() + 6) % 7; // 0 = segunda ... 6 = domingo
  d.setUTCDate(d.getUTCDate() - diaSemanaIso + 3);

  const primeiraQuinta = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const numeroSemana = 1 + Math.round((d - primeiraQuinta) / (7 * 86400000));

  return `${d.getUTCFullYear()}-W${String(numeroSemana).padStart(2, '0')}`;
}

export function semanaIsoDeHoje(agora = new Date()) {
  return semanaIso(agora);
}

export function semanaIsoAnterior(agora = new Date()) {
  const seteDiasAtras = new Date(agora.getTime() - 7 * 86400000);
  return semanaIso(seteDiasAtras);
}
