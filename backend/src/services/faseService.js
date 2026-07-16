import { db } from '../config/supabase.js';

// Mapa de fases: cada fase vem com o progresso do aluno e se está desbloqueada
export async function listarFasesComProgresso(userId) {
  const [fasesRes, progressoRes] = await Promise.all([
    db.from('fases').select('*').order('ordem'),
    db.from('progresso_fase').select('*').eq('user_id', userId),
  ]);
  if (fasesRes.error) throw fasesRes.error;
  if (progressoRes.error) throw progressoRes.error;

  const progressoPorFase = new Map(progressoRes.data.map((p) => [p.fase_id, p]));
  const concluidas = new Set(progressoRes.data.filter((p) => p.concluida).map((p) => p.fase_id));

  return fasesRes.data.map((fase) => ({
    id: fase.id,
    nome: fase.nome,
    descricao: fase.descricao,
    ordem: fase.ordem,
    desbloqueada: fase.fase_requisito_id == null || concluidas.has(fase.fase_requisito_id),
    progresso: progressoPorFase.get(fase.id) ?? null,
  }));
}
