import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { gerarCodigoAcesso } from '../utils/random.js';

// ---------- Aluno ----------

export async function entrarNaTurma(userId, codigoAcesso) {
  if (!codigoAcesso?.trim()) throw new HttpError(400, 'Informe o código da turma');

  const { data: turma, error } = await db
    .from('turmas')
    .select('id, nome')
    .eq('codigo_acesso', codigoAcesso.trim().toUpperCase())
    .maybeSingle();
  if (error) throw error;
  if (!turma) throw new HttpError(404, 'Turma não encontrada — confira o código');

  const { error: erroMatricula } = await db
    .from('matriculas')
    .insert({ user_id: userId, turma_id: turma.id });
  if (erroMatricula?.code === '23505') {
    throw new HttpError(409, 'Você já está matriculado nesta turma');
  }
  if (erroMatricula) throw erroMatricula;

  return turma;
}

export async function minhasTurmas(userId) {
  const { data, error } = await db
    .from('matriculas')
    .select('matriculado_em, turmas ( id, nome, codigo_acesso )')
    .eq('user_id', userId);
  if (error) throw error;

  return data.map((m) => ({ ...m.turmas, matriculado_em: m.matriculado_em }));
}

// ---------- Professor ----------

export async function criarTurma(professorId, nome) {
  if (!nome?.trim()) throw new HttpError(400, 'Informe o nome da turma');

  // Código é único: em caso de colisão (raro), sorteia outro
  for (let i = 0; i < 5; i++) {
    const { data, error } = await db
      .from('turmas')
      .insert({ nome: nome.trim(), professor_id: professorId, codigo_acesso: gerarCodigoAcesso() })
      .select()
      .maybeSingle();
    if (!error) return data;
    if (error.code !== '23505') throw error;
  }
  throw new HttpError(500, 'Não foi possível gerar um código de turma único');
}

export async function turmasDoProfessor(professorId) {
  const { data, error } = await db
    .from('turmas')
    .select('id, nome, codigo_acesso, created_at, matriculas ( count )')
    .eq('professor_id', professorId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return data.map(({ matriculas, ...turma }) => ({
    ...turma,
    total_alunos: matriculas?.[0]?.count ?? 0,
  }));
}

export async function exigirTurmaDoProfessor(professorId, turmaId) {
  const { data, error } = await db
    .from('turmas')
    .select('id, nome')
    .eq('id', turmaId)
    .eq('professor_id', professorId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'Turma não encontrada entre as suas turmas');
  return data;
}

export async function alunosDaTurma(professorId, turmaId) {
  await exigirTurmaDoProfessor(professorId, turmaId);

  const { data, error } = await db
    .from('desempenho_alunos')
    .select('*')
    .eq('turma_id', turmaId)
    .order('xp_total', { ascending: false });
  if (error) throw error;
  return data;
}
