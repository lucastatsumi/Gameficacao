import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';

// Rankings vêm das views SQL (RANK() OVER) — nada é recalculado aqui.
// Cada resposta inclui a posição do próprio usuário, mesmo fora do top N.

export async function rankingGlobal(userId, limite = 50) {
  const { data, error } = await db
    .from('ranking_global')
    .select('*')
    .order('posicao')
    .limit(limite);
  if (error) throw error;

  return { ranking: data, minha_posicao: await posicaoDoUsuario('ranking_global', userId, data) };
}

export async function rankingPorTurma(usuario, turmaId, limite = 50) {
  // Aluno só vê ranking de turma em que está matriculado; professor, das suas turmas
  const autorizado =
    usuario.role === 'professor'
      ? await professorDaTurma(usuario.id, turmaId)
      : await matriculado(usuario.id, turmaId);
  if (!autorizado) throw new HttpError(403, 'Você não participa desta turma');

  const { data, error } = await db
    .from('ranking_turma')
    .select('*')
    .eq('turma_id', turmaId)
    .order('posicao')
    .limit(limite);
  if (error) throw error;

  const minha = data.find((r) => r.id === usuario.id) ?? null;
  return { ranking: data, minha_posicao: minha };
}

export async function rankingPorFase(userId, faseId, limite = 50) {
  const { data, error } = await db
    .from('ranking_fase')
    .select('*')
    .eq('fase_id', faseId)
    .order('posicao')
    .limit(limite);
  if (error) throw error;

  const minha = data.find((r) => r.id === userId) ?? null;
  return { ranking: data, minha_posicao: minha };
}

async function posicaoDoUsuario(view, userId, jaCarregados) {
  const noTopo = jaCarregados.find((r) => r.id === userId);
  if (noTopo) return noTopo;
  const { data } = await db.from(view).select('*').eq('id', userId).maybeSingle();
  return data ?? null;
}

async function matriculado(userId, turmaId) {
  const { data } = await db
    .from('matriculas')
    .select('user_id')
    .eq('user_id', userId)
    .eq('turma_id', turmaId)
    .maybeSingle();
  return Boolean(data);
}

async function professorDaTurma(professorId, turmaId) {
  const { data } = await db
    .from('turmas')
    .select('id')
    .eq('id', turmaId)
    .eq('professor_id', professorId)
    .maybeSingle();
  return Boolean(data);
}
