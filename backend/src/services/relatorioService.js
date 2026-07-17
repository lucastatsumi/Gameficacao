import { db } from '../config/supabase.js';
import { alunosDaTurma, exigirTurmaDoProfessor } from './turmaService.js';

// Taxa de acerto e tempo médio por questão (view desempenho_questoes) —
// mostra ao professor os conceitos em que a turma mais erra.
export async function desempenhoPorQuestao(faseId) {
  let query = db
    .from('desempenho_questoes')
    .select('*')
    .order('taxa_acerto_pct', { ascending: true });
  if (faseId) query = query.eq('fase_id', faseId);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Visão agregada POR FASE (não por questão individual): taxa de aprovação
// e média de acerto de todas as tentativas finalizadas em cada fase —
// mostra ao professor em que ponto da trilha a turma mais trava.
export async function desempenhoPorFase() {
  const { data, error } = await db.from('desempenho_fases').select('*').order('ordem');
  if (error) throw error;
  return data;
}

// Exportação CSV do desempenho da turma (separador ';' e BOM p/ Excel pt-BR)
export async function csvDesempenhoTurma(professorId, turmaId) {
  const turma = await exigirTurmaDoProfessor(professorId, turmaId);
  const alunos = await alunosDaTurma(professorId, turmaId);

  const cabecalho = ['Nome', 'Nível', 'XP Total', 'Fases Concluídas', 'Tentativas', 'Badges'];
  const linhas = alunos.map((a) => [
    a.nome,
    a.nivel,
    a.xp_total,
    a.fases_concluidas,
    a.total_tentativas,
    a.total_badges,
  ]);

  const csv = [cabecalho, ...linhas]
    .map((colunas) => colunas.map(escaparCsv).join(';'))
    .join('\r\n');

  const BOM = String.fromCharCode(0xfeff);
  return { nomeArquivo: `desempenho-${slug(turma.nome)}.csv`, conteudo: BOM + csv };
}

function escaparCsv(valor) {
  const texto = String(valor ?? '');
  return /[;"\r\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

function slug(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
