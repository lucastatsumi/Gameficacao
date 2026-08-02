import { db } from '../config/supabase.js';
import { exigirAcessoATurma } from './turmaService.js';
import { semanaIso } from '../utils/semana.js';

// Mascote da equipe (roadmap 4.10): nudge social gentil — o humor semanal
// reflete o % de membros que finalizaram ao menos um quiz na semana, sem
// NUNCA expor quem individualmente esteve ativo ou não (só o agregado).
// Sem tabela nova: tudo é derivado de `matriculas`/`tentativas` agrupadas
// por semana ISO (mesmo rótulo 'YYYY-Www' de utils/semana.js usado por
// ligas/kudos/missões semanais). Puro read/aggregation — ao contrário de
// raid/liga/temporada, não precisa de hook de escrita no quizController.

const DIA_MS = 24 * 60 * 60 * 1000;
const JANELA_DIAS = 90; // suficiente para cobrir o teto de 26 semanas do streak
const LIMITE_SEMANAS_STREAK = 26; // ~6 meses — trava de segurança contra loop sem fim

export async function mascoteDaTurma(userId, turmaId, agora = new Date()) {
  await exigirAcessoATurma(userId, turmaId);

  const membros = await membrosDaTurma(turmaId);
  if (!membros.length) {
    return { humor: 'neutro', percentual_ativos: 0, forma: 'filhote', semanas_consecutivas: 0 };
  }

  const ativosPorSemana = await ativosPorSemanaDaTurma(membros, agora);

  const semanaAtual = semanaIso(agora);
  const percentualAtivos = calcularPercentual(ativosPorSemana.get(semanaAtual), membros.length);
  const humor = humorPorPercentual(percentualAtivos);

  const semanasConsecutivas = contarSemanasConsecutivas(ativosPorSemana, membros.length, agora);
  const forma = formaPorSemanas(semanasConsecutivas);

  return { humor, percentual_ativos: percentualAtivos, forma, semanas_consecutivas: semanasConsecutivas };
}

// ---------------------------------------------------------------

async function membrosDaTurma(turmaId) {
  const { data, error } = await db.from('matriculas').select('user_id').eq('turma_id', turmaId);
  if (error) throw error;
  return (data ?? []).map((m) => m.user_id);
}

// Devolve um Map<semanaIso, Set<user_id>> com quem finalizou ao menos uma
// tentativa naquela semana — o Set nunca sai desta função (só a CONTAGEM é
// exposta pelas funções acima), preservando o invariante de privacidade.
async function ativosPorSemanaDaTurma(membros, agora) {
  const desde = new Date(agora.getTime() - JANELA_DIAS * DIA_MS).toISOString();

  const { data, error } = await db
    .from('tentativas')
    .select('user_id, finalizada_em')
    .in('user_id', membros)
    .not('finalizada_em', 'is', null)
    .gte('finalizada_em', desde);
  if (error) throw error;

  const porSemana = new Map();
  for (const linha of data ?? []) {
    const semana = semanaIso(new Date(linha.finalizada_em));
    if (!porSemana.has(semana)) porSemana.set(semana, new Set());
    porSemana.get(semana).add(linha.user_id);
  }
  return porSemana;
}

function calcularPercentual(ativos, totalMembros) {
  if (!ativos || !ativos.size || !totalMembros) return 0;
  return Math.round((ativos.size / totalMembros) * 100);
}

function humorPorPercentual(percentual) {
  if (percentual >= 80) return 'radiante';
  if (percentual >= 50) return 'feliz';
  if (percentual >= 20) return 'neutro';
  return 'dormindo';
}

function formaPorSemanas(semanas) {
  if (semanas >= 12) return 'lendario';
  if (semanas >= 4) return 'adulto';
  return 'filhote';
}

// Conta, a partir da semana ANTERIOR à atual (a atual ainda está em
// andamento, então não entra no streak), quantas semanas consecutivas para
// trás tiveram percentual >= 20% (i.e., não "dormindo"). Para no primeiro
// buraco (semana dormente ou sem nenhum registro) ou no teto de segurança.
function contarSemanasConsecutivas(ativosPorSemana, totalMembros, agora) {
  let streak = 0;
  for (let i = 1; i <= LIMITE_SEMANAS_STREAK; i++) {
    const dataDaSemana = new Date(agora.getTime() - i * 7 * DIA_MS);
    const percentual = calcularPercentual(ativosPorSemana.get(semanaIso(dataDaSemana)), totalMembros);
    if (percentual < 20) break;
    streak++;
  }
  return streak;
}
