import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { semanaIso } from '../utils/semana.js';
import { exigirTurmaDoProfessor } from './turmaService.js';

// Dashboard de evolução temporal (roadmap H5). `tentativas` é append-only
// (nunca reescrita), então a série semanal é derivável do histórico sem
// tabela de snapshot: cada semana ISO fechada dá sempre o mesmo número.

const DIA_MS = 24 * 60 * 60 * 1000;
const MAX_SEMANAS = 26;

// Lógica pura: devolve uma linha por semana pedida (inclusive as vazias,
// para o gráfico não "pular" semanas), da mais antiga para a mais recente.
export function agruparPorSemana(tentativas, semanas) {
  const mapa = new Map(
    semanas.map((s) => [s, { semana: s, tentativas: 0, xp_total: 0, soma_score: 0, com_score: 0, ativos: new Set() }])
  );
  for (const t of tentativas) {
    const linha = mapa.get(semanaIso(new Date(t.finalizada_em)));
    if (!linha) continue;
    linha.tentativas += 1;
    linha.xp_total += t.xp_ganho ?? 0;
    linha.ativos.add(t.user_id);
    if (t.score != null) {
      linha.soma_score += t.score;
      linha.com_score += 1;
    }
  }
  return semanas.map((s) => {
    const l = mapa.get(s);
    return {
      semana: s,
      tentativas: l.tentativas,
      xp_total: l.xp_total,
      colaboradores_ativos: l.ativos.size,
      score_medio: l.com_score ? Math.round(l.soma_score / l.com_score) : null,
    };
  });
}

export function ultimasSemanas(quantidade, agora = new Date()) {
  const rotulos = [];
  for (let i = quantidade - 1; i >= 0; i--) {
    rotulos.push(semanaIso(new Date(agora.getTime() - i * 7 * DIA_MS)));
  }
  return rotulos;
}

export async function evolucaoDaTurma(gestorId, turmaId, semanas = 8, agora = new Date()) {
  const n = Number(semanas);
  if (!Number.isInteger(n) || n < 1 || n > MAX_SEMANAS) {
    throw new HttpError(400, `semanas deve ser entre 1 e ${MAX_SEMANAS}`);
  }
  await exigirTurmaDoProfessor(gestorId, turmaId);

  const { data: membros, error: e1 } = await db
    .from('matriculas')
    .select('user_id')
    .eq('turma_id', turmaId);
  if (e1) throw e1;
  const ids = membros.map((m) => m.user_id);

  let tentativas = [];
  if (ids.length) {
    const desde = new Date(agora.getTime() - n * 7 * DIA_MS).toISOString();
    const { data, error } = await db
      .from('tentativas')
      .select('user_id, xp_ganho, score, finalizada_em')
      .in('user_id', ids)
      .not('finalizada_em', 'is', null)
      .gte('finalizada_em', desde);
    if (error) throw error;
    tentativas = data;
  }
  return { membros: ids.length, serie: agruparPorSemana(tentativas, ultimasSemanas(n, agora)) };
}
