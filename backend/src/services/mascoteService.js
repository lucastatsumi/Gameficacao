import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';

// Mascote da equipe (roadmap v2, 4.10): nudge social gentil que sinaliza
// queda de engajamento coletivo SEM expor ninguém individualmente — só o
// agregado (percentual de membros ativos na semana) vira humor/forma.
// Cálculo 100% derivado de `tentativas` por semana — sem tabela nova, sem
// snapshot, sem cron: cada chamada reconstitui o estado atual a partir do
// histórico bruto.

const DIA_MS = 24 * 60 * 60 * 1000;
const SEMANA_MS = 7 * DIA_MS;
const LIMIAR_SEMANA_ATIVA = 0.5; // >=50% dos membros ativos conta p/ a sequência de evolução
const MAX_SEMANAS_HISTORICO = 12; // teto de olhada pro passado — evolução "lendário" satura aqui

export async function mascoteDaTurma(userId, turmaId, agora = new Date()) {
  await exigirAcessoATurma(userId, turmaId);

  const membros = await membrosDaTurma(turmaId);
  if (!membros.length) {
    return { humor: 'dormindo', forma: 'filhote', percentual_ativos: 0, semanas_consecutivas: 0 };
  }

  const inicioSemanaAtual = inicioDaSemana(agora);
  const percentualAtual = await percentualAtivoNaSemana(membros, inicioSemanaAtual);

  let semanasConsecutivas = 0;
  for (let i = 0; i < MAX_SEMANAS_HISTORICO; i++) {
    const pct =
      i === 0
        ? percentualAtual
        : await percentualAtivoNaSemana(
            membros,
            new Date(inicioSemanaAtual.getTime() - i * SEMANA_MS)
          );
    if (pct < LIMIAR_SEMANA_ATIVA) break;
    semanasConsecutivas++;
  }

  return {
    humor: humorPorPercentual(percentualAtual),
    forma: formaPorSemanasConsecutivas(semanasConsecutivas),
    percentual_ativos: percentualAtual,
    semanas_consecutivas: semanasConsecutivas,
  };
}

// ---------------------------------------------------------------

function humorPorPercentual(pct) {
  if (pct >= 0.8) return 'radiante';
  if (pct >= 0.5) return 'feliz';
  if (pct >= 0.2) return 'neutro';
  return 'dormindo';
}

function formaPorSemanasConsecutivas(semanas) {
  if (semanas >= 8) return 'lendario';
  if (semanas >= 3) return 'adulto';
  return 'filhote';
}

// Segunda-feira 00:00 UTC da semana que contém `data` — mesma convenção
// (semana ISO, UTC) de utils/semana.js, mas devolvendo a data em vez do
// rótulo, já que aqui é preciso montar um intervalo [inicio, fim).
function inicioDaSemana(data) {
  const dia = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
  const diaDaSemana = (dia.getUTCDay() + 6) % 7; // segunda=0 ... domingo=6
  dia.setUTCDate(dia.getUTCDate() - diaDaSemana);
  return dia;
}

async function percentualAtivoNaSemana(membros, inicioSemana) {
  const fimSemana = new Date(inicioSemana.getTime() + SEMANA_MS);
  const { data, error } = await db
    .from('tentativas')
    .select('user_id')
    .in('user_id', membros)
    .gte('finalizada_em', inicioSemana.toISOString())
    .lt('finalizada_em', fimSemana.toISOString());
  if (error) throw error;

  const ativos = new Set((data ?? []).map((t) => t.user_id));
  return ativos.size / membros.length;
}

async function membrosDaTurma(turmaId) {
  const { data, error } = await db.from('matriculas').select('user_id').eq('turma_id', turmaId);
  if (error) throw error;
  return (data ?? []).map((m) => m.user_id);
}

// Mesmo padrão de raidService.exigirAcessoATurma: matriculado OU professor
// dono veem o mascote; qualquer outro usuário autenticado recebe 404 (não
// confirma nem nega a existência da turma para quem não pertence a ela).
async function exigirAcessoATurma(userId, turmaId) {
  const { data: matricula, error: erroMatricula } = await db
    .from('matriculas')
    .select('turma_id')
    .eq('turma_id', turmaId)
    .eq('user_id', userId)
    .maybeSingle();
  if (erroMatricula) throw erroMatricula;
  if (matricula) return;

  const { data: turma, error: erroTurma } = await db
    .from('turmas')
    .select('id')
    .eq('id', turmaId)
    .eq('professor_id', userId)
    .maybeSingle();
  if (erroTurma) throw erroTurma;
  if (!turma) throw new HttpError(404, 'Turma não encontrada entre as suas turmas');
}
