import { db } from '../config/supabase.js';

// Lógica pura: combina as fases com o progresso do aluno e decide quais estão
// desbloqueadas. Uma fase abre quando não tem requisito ou quando o requisito
// já foi concluído. Isolada da consulta ao banco para ser testável.
export function montarMapaFases(fases, progressos) {
  const progressoPorFase = new Map(progressos.map((p) => [p.fase_id, p]));
  const concluidas = new Set(progressos.filter((p) => p.concluida).map((p) => p.fase_id));

  return fases.map((fase) => ({
    id: fase.id,
    nome: fase.nome,
    descricao: fase.descricao,
    ordem: fase.ordem,
    desbloqueada: fase.fase_requisito_id == null || concluidas.has(fase.fase_requisito_id),
    progresso: progressoPorFase.get(fase.id) ?? null,
  }));
}

// Mapa de fases: cada fase vem com o progresso do aluno e se está desbloqueada
export async function listarFasesComProgresso(userId) {
  const [fasesRes, progressoRes] = await Promise.all([
    db.from('fases').select('*').order('ordem'),
    db.from('progresso_fase').select('*').eq('user_id', userId),
  ]);
  if (fasesRes.error) throw fasesRes.error;
  if (progressoRes.error) throw progressoRes.error;

  return montarMapaFases(fasesRes.data, progressoRes.data);
}
