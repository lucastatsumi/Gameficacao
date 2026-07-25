// Semana ISO (segunda a domingo) usada pelas ligas semanais (roadmap 4.5).
// O rótulo 'YYYY-Www' é calculado por aritmética de data em UTC; nunca
// fazemos o caminho inverso (parse do rótulo de volta em data), então não
// há ambiguidade de fuso — sempre partimos de um objeto Date de referência.

const DIA_MS = 24 * 60 * 60 * 1000;

export function semanaIso(data = new Date()) {
  const dia = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
  const diaDaSemana = (dia.getUTCDay() + 6) % 7; // segunda=0 ... domingo=6
  dia.setUTCDate(dia.getUTCDate() - diaDaSemana + 3); // quinta-feira desta semana ISO

  const anoIso = dia.getUTCFullYear();
  const dia4DeJaneiro = new Date(Date.UTC(anoIso, 0, 4));
  const diaDaSemana4 = (dia4DeJaneiro.getUTCDay() + 6) % 7;
  const segundaDaSemana1 = new Date(dia4DeJaneiro.getTime() - diaDaSemana4 * DIA_MS);

  const numeroSemana = Math.round((dia.getTime() - segundaDaSemana1.getTime()) / (7 * DIA_MS)) + 1;
  return `${anoIso}-W${String(numeroSemana).padStart(2, '0')}`;
}

// Rótulo da semana anterior — sempre por aritmética sobre a data de
// referência (7 dias antes), nunca parseando o rótulo de volta em data.
export function semanaAnteriorA(data = new Date()) {
  return semanaIso(new Date(data.getTime() - 7 * DIA_MS));
}
