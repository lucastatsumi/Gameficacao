import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { exigirTurmaDoProfessor } from './turmaService.js';

// Trilhas por equipe (roadmap H1). Regra: o colaborador vê a UNIÃO dos temas
// atribuídos às suas equipes; se nenhuma equipe tem atribuição, vê tudo.

// Lógica pura: null = sem restrição.
export function filtrarFasesPorTemas(fases, temasPermitidos) {
  if (!temasPermitidos) return fases;
  return fases.filter((f) => f.tema_id == null || temasPermitidos.has(f.tema_id));
}

export async function temasPermitidos(userId) {
  const { data, error } = await db
    .from('matriculas')
    .select('turmas ( turma_temas ( tema_id ) )')
    .eq('user_id', userId);
  if (error) throw error;

  const ids = new Set();
  for (const m of data ?? []) {
    for (const t of m.turmas?.turma_temas ?? []) ids.add(t.tema_id);
  }
  return ids.size ? ids : null;
}

export async function listarTemas() {
  const { data, error } = await db
    .from('temas')
    .select('id, nome, descricao')
    .eq('ativo', true)
    .order('nome');
  if (error) throw error;
  return data;
}

// Onboarding: o gestor cria um tema próprio (vazio) para montar sua trilha.
export async function criarTema(nome, descricao) {
  if (!nome?.trim()) throw new HttpError(400, 'Informe o nome do tema');
  const { data, error } = await db
    .from('temas')
    .insert({ nome: nome.trim(), descricao: descricao?.trim() || null })
    .select()
    .maybeSingle();
  if (error?.code === '23505') throw new HttpError(409, 'Já existe um tema com esse nome');
  if (error) throw error;
  return data;
}

export async function temasDaTurma(professorId, turmaId) {
  await exigirTurmaDoProfessor(professorId, turmaId);
  const { data, error } = await db.from('turma_temas').select('tema_id').eq('turma_id', turmaId);
  if (error) throw error;
  return data.map((t) => t.tema_id);
}

// Substitui as atribuições da turma (lista vazia = volta a ver tudo).
export async function definirTemasDaTurma(professorId, turmaId, temaIds) {
  await exigirTurmaDoProfessor(professorId, turmaId);
  if (!Array.isArray(temaIds) || temaIds.some((id) => !Number.isInteger(id))) {
    throw new HttpError(400, 'tema_ids deve ser uma lista de ids');
  }

  const { error: erroDel } = await db.from('turma_temas').delete().eq('turma_id', turmaId);
  if (erroDel) throw erroDel;
  if (temaIds.length) {
    const { error } = await db
      .from('turma_temas')
      .insert([...new Set(temaIds)].map((tema_id) => ({ turma_id: turmaId, tema_id })));
    if (error?.code === '23503') throw new HttpError(400, 'Tema inexistente');
    if (error) throw error;
  }
  return temaIds;
}
