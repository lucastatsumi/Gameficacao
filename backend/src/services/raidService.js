import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { exigirTurmaDoProfessor } from './turmaService.js';
import { concederFichas } from './fichaService.js';

// Raid boss de equipe (roadmap v2, 4.7): transforma treinamento individual
// em objetivo coletivo — o gestor lança um chefe com HP COMPARTILHADO pela
// turma inteira (reusa `turmas`/`matriculas`, a "equipe" que já existe no
// código, sem nova multi-tenancy). Cada acerto de QUALQUER matriculado
// causa dano; derrotar o boss credita fichas para TODOS os membros, mesmo
// quem contribuiu pouco — punir individualmente minaria o objetivo
// coletivo (ver roadmap 4.7).
//
// Dano é aplicado só via aplicarDano, chamado como hook por
// quizController.finalizar (mesmo padrão de ligaService.concederXpSemana /
// temporadaService.concederPontosTemporada) — nunca por chamada direta.

export const HP_POR_MEMBRO = 40;
export const DURACAO_DIAS = 7;
export const JANELA_ENFURECE_HORAS = 24;
export const MULTIPLICADOR_ENFUREC = 2;
export const PESO_DIFICULDADE = { facil: 1, media: 2, dificil: 4 };
export const FICHAS_RECOMPENSA_DERROTA = 20;

// Lança um raid novo para a turma. Só o professor dono da turma pode
// (exigirTurmaDoProfessor lança 404 se não for dono — mesma trava usada em
// alunosDaTurma). O índice único parcial `raids_turma_ativo_unico` é quem
// garante "no máximo um raid ativo por turma" sob concorrência; 23505 vira
// um erro amigável em vez de vazar o código do banco.
export async function lancarRaid(professorId, turmaId, agora = new Date()) {
  await exigirTurmaDoProfessor(professorId, turmaId);

  const membros = await membrosDaTurma(turmaId);
  if (!membros.length) {
    throw new HttpError(400, 'A turma ainda não tem alunos matriculados — não é possível lançar um raid');
  }

  const hpTotal = membros.length * HP_POR_MEMBRO;
  const fim = new Date(agora.getTime() + DURACAO_DIAS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await db
    .from('raids')
    .insert({
      turma_id: turmaId,
      hp_total: hpTotal,
      hp_atual: hpTotal,
      fim,
      status: 'ativo',
      criado_por: professorId,
    })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') throw new HttpError(409, 'Esta turma já tem um raid ativo');
    throw error;
  }
  return data;
}

// Raid ativo da turma (ou null) + placar de contribuição (dano somado por
// jogador, desc) — visível só para quem está na turma (matriculado ou o
// professor dono); qualquer outro usuário autenticado recebe 404, mesmo
// padrão de exigirTurmaDoProfessor (não confirma nem nega a turma existir
// para quem não pertence a ela).
export async function raidAtivo(userId, turmaId) {
  await exigirAcessoATurma(userId, turmaId);

  const raid = await buscarRaidAtivoDaTurma(turmaId);
  if (!raid) return null;

  return { ...raid, placar: await placarDoRaid(raid.id) };
}

// Hook chamado pelo controller após finalizarQuiz, ao lado de
// concederXpSemana/concederPontosTemporada — self-sufficient: consulta a
// própria tentativa em vez de receber o resultado já calculado, então não
// precisa mexer em quizService. Sem-op se o jogador não está em turma
// nenhuma ou nenhuma das turmas tem raid ativo.
export async function aplicarDano(userId, tentativaId, agora = new Date()) {
  if (!tentativaId) return null;

  const turmaIds = await turmasDoUsuario(userId);
  if (!turmaIds.length) return null;

  const raid = await buscarRaidAtivoEntreTurmas(turmaIds);
  if (!raid) return null;

  const dano = await calcularDano(tentativaId, raid, agora);
  if (dano <= 0) return null;

  const hpNovo = Math.max(0, raid.hp_atual - dano);
  const { error: erroHp } = await db.from('raids').update({ hp_atual: hpNovo }).eq('id', raid.id);
  if (erroHp) throw erroHp;

  const { error: erroContribuicao } = await db
    .from('raid_contribuicoes')
    .insert({ raid_id: raid.id, user_id: userId, dano, tentativa_id: tentativaId });
  if (erroContribuicao) throw erroContribuicao;

  const raidDerrotado = hpNovo === 0 ? await tentarDerrotarRaid(raid.id, raid.turma_id) : false;

  return { dano_causado: dano, raid_derrotado: raidDerrotado, raid_id: raid.id };
}

// ---------------------------------------------------------------

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

async function membrosDaTurma(turmaId) {
  const { data, error } = await db.from('matriculas').select('user_id').eq('turma_id', turmaId);
  if (error) throw error;
  return (data ?? []).map((m) => m.user_id);
}

async function turmasDoUsuario(userId) {
  const { data, error } = await db.from('matriculas').select('turma_id').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((m) => m.turma_id);
}

async function buscarRaidAtivoDaTurma(turmaId) {
  const { data, error } = await db
    .from('raids')
    .select('*')
    .eq('turma_id', turmaId)
    .eq('status', 'ativo')
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Um jogador pode, em tese, estar em mais de uma turma — mas na prática do
// produto (matrícula por código de acesso) é sempre uma só. Pega o
// primeiro raid ativo entre as turmas do jogador em vez de aplicar dano em
// vários raids simultâneos, o que manteria o retorno simples (um raid por
// tentativa) e evita ambiguidade sobre "qual raid mostrar" no resultado.
async function buscarRaidAtivoEntreTurmas(turmaIds) {
  const { data, error } = await db
    .from('raids')
    .select('*')
    .in('turma_id', turmaIds)
    .eq('status', 'ativo')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Dano = soma do peso de dificuldade de cada resposta CORRETA da
// tentativa. Nas últimas JANELA_ENFURECE_HORAS antes do fim, o boss
// "enfurece": dano dobrado.
async function calcularDano(tentativaId, raid, agora) {
  const { data, error } = await db
    .from('respostas')
    .select('correta, questoes ( dificuldade )')
    .eq('tentativa_id', tentativaId);
  if (error) throw error;

  const base = (data ?? [])
    .filter((r) => r.correta)
    .reduce((soma, r) => soma + (PESO_DIFICULDADE[r.questoes?.dificuldade] ?? 0), 0);

  const msAteFim = new Date(raid.fim).getTime() - agora.getTime();
  const enfurecido = msAteFim <= JANELA_ENFURECE_HORAS * 60 * 60 * 1000;

  return enfurecido ? base * MULTIPLICADOR_ENFUREC : base;
}

// Transição hp_atual=0 -> status='derrotado'. O UPDATE com
// .eq('status', 'ativo') na cláusula WHERE É a trava: só a requisição que
// efetivamente flipar a linha (data não vazio) concede a recompensa —
// mesma ideia de ligas_fechamentos/temporada_resgates usando um insert
// como lock, só que aqui é um update condicional (a linha já existe).
async function tentarDerrotarRaid(raidId, turmaId) {
  const { data, error } = await db
    .from('raids')
    .update({ status: 'derrotado' })
    .eq('id', raidId)
    .eq('status', 'ativo')
    .select('id');
  if (error) throw error;
  if (!data?.length) return false; // outra requisição concorrente já derrotou

  const membros = await membrosDaTurma(turmaId);
  for (const membroId of membros) {
    await concederFichas(membroId, FICHAS_RECOMPENSA_DERROTA, 'raid_derrotado', raidId);
  }
  return true;
}

async function placarDoRaid(raidId) {
  const { data, error } = await db
    .from('raid_contribuicoes')
    .select('user_id, dano, profiles ( nome )')
    .eq('raid_id', raidId);
  if (error) throw error;

  const porUsuario = new Map();
  for (const contribuicao of data ?? []) {
    const linha = porUsuario.get(contribuicao.user_id) ?? {
      user_id: contribuicao.user_id,
      nome: contribuicao.profiles?.nome ?? null,
      dano_total: 0,
    };
    linha.dano_total += contribuicao.dano;
    porUsuario.set(contribuicao.user_id, linha);
  }
  return [...porUsuario.values()].sort((a, b) => b.dano_total - a.dano_total);
}
