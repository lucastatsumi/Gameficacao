import { db } from '../config/supabase.js';
import { dataDeHoje } from '../utils/streak.js';
import { exigirTurmaDoProfessor } from './turmaService.js';

// Dashboard com evolução temporal (Horizonte 5): agregado do momento não
// mostra tendência, então guardamos 1 snapshot por dia e equipe. O
// snapshot é tirado de forma lazy no primeiro acesso do dia (sem cron) e
// é ACUMULADO até o dia — a série mostra a equipe melhorando (ou não).

export const DIAS_EVOLUCAO = 90;

async function membrosDaTurma(turmaId) {
  const { data, error } = await db.from('matriculas').select('user_id').eq('turma_id', turmaId);
  if (error) throw error;
  return data.map((m) => m.user_id);
}

export async function tirarSnapshot(turmaId, dia = dataDeHoje()) {
  const { data: existente, error: erroExistente } = await db
    .from('snapshots_equipe')
    .select('dia')
    .eq('turma_id', turmaId)
    .eq('dia', dia)
    .maybeSingle();
  if (erroExistente) throw erroExistente;
  if (existente) return false;

  const membros = await membrosDaTurma(turmaId);
  let scoreMedio = null;
  let tentativas = 0;
  let competencias = [];
  if (membros.length) {
    const [scoresRes, desempenhoRes] = await Promise.all([
      db.from('tentativas').select('score').in('user_id', membros).not('score', 'is', null),
      db
        .from('desempenho_competencias')
        .select('competencia_id, total, acertos')
        .in('user_id', membros),
    ]);
    if (scoresRes.error) throw scoresRes.error;
    if (desempenhoRes.error) throw desempenhoRes.error;
    tentativas = scoresRes.data.length;
    scoreMedio = tentativas
      ? Math.round((10 * scoresRes.data.reduce((s, t) => s + Number(t.score), 0)) / tentativas) / 10
      : null;

    const porCompetencia = new Map();
    for (const d of desempenhoRes.data) {
      const atual = porCompetencia.get(d.competencia_id) ?? { total: 0, acertos: 0 };
      atual.total += d.total;
      atual.acertos += d.acertos;
      porCompetencia.set(d.competencia_id, atual);
    }
    competencias = [...porCompetencia.entries()].map(([competencia_id, v]) => ({
      dia,
      turma_id: turmaId,
      competencia_id,
      ...v,
    }));
  }

  // ignoreDuplicates: duas requisições no mesmo instante não quebram
  const { error } = await db
    .from('snapshots_equipe')
    .upsert(
      { dia, turma_id: turmaId, score_medio: scoreMedio, tentativas, membros: membros.length },
      { onConflict: 'dia,turma_id', ignoreDuplicates: true }
    );
  if (error) throw error;
  if (competencias.length) {
    const { error: erroComp } = await db
      .from('snapshots_competencias')
      .upsert(competencias, { onConflict: 'dia,turma_id,competencia_id', ignoreDuplicates: true });
    if (erroComp) throw erroComp;
  }
  return true;
}

export async function evolucaoDaEquipe(gestor, turmaId, agora = new Date()) {
  const turma = await exigirTurmaDoProfessor(gestor.id, turmaId);
  await tirarSnapshot(turmaId, dataDeHoje(agora));

  const desde = new Date(agora.getTime() - DIAS_EVOLUCAO * 86400000).toISOString().slice(0, 10);
  const [serieRes, compRes] = await Promise.all([
    db
      .from('snapshots_equipe')
      .select('dia, score_medio, tentativas, membros')
      .eq('turma_id', turmaId)
      .gte('dia', desde)
      .order('dia'),
    db
      .from('snapshots_competencias')
      .select('dia, competencia_id, total, acertos, competencias ( nome )')
      .eq('turma_id', turmaId)
      .gte('dia', desde)
      .order('dia'),
  ]);
  if (serieRes.error) throw serieRes.error;
  if (compRes.error) throw compRes.error;

  const porCompetencia = new Map();
  for (const c of compRes.data) {
    const linha = porCompetencia.get(c.competencia_id) ?? {
      competencia_id: c.competencia_id,
      nome: c.competencias?.nome ?? `#${c.competencia_id}`,
      pontos: [],
    };
    linha.pontos.push({ dia: c.dia, pct: c.total ? Math.round((1000 * c.acertos) / c.total) / 10 : null });
    porCompetencia.set(c.competencia_id, linha);
  }

  return {
    turma,
    score: serieRes.data.map((s) => ({
      dia: s.dia,
      score_medio: s.score_medio == null ? null : Number(s.score_medio),
      tentativas: s.tentativas,
    })),
    competencias: [...porCompetencia.values()],
  };
}
