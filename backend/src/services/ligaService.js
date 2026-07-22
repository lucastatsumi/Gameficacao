import { db } from '../config/supabase.js';
import { semanaIso } from '../utils/semana.js';
import { concederFichas } from './fichaService.js';

// Ligas semanais (roadmap v2, 4.5): ranking por divisão competindo pelo XP
// ganho NA SEMANA. Sem cron — o fechamento da semana anterior é LAZY,
// disparado no primeiro acesso do jogador (quiz ou tela de liga) depois
// que a semana virou. Como o cohort da semana fechada já não recebe XP
// novo (o balde atual é outro), o cálculo de promoção/rebaixamento é
// estável não importa a ordem em que cada jogador é processado.

export const DIVISOES = ['bronze', 'prata', 'ouro', 'diamante'];
const CORTE_PROMOCAO = 0.2;
const CORTE_REBAIXAMENTO = 0.2;
const FICHAS_TOPO = 20;
const FICHAS_MEIO = 10;
const FICHAS_FUNDO = 5;

async function garantirJogador(userId) {
  const { data, error } = await db
    .from('ligas_jogador')
    .select('user_id, divisao')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;

  const { error: erroInsert } = await db
    .from('ligas_jogador')
    .upsert({ user_id: userId, divisao: 'bronze' }, { onConflict: 'user_id', ignoreDuplicates: true });
  if (erroInsert) throw erroInsert;

  return { user_id: userId, divisao: 'bronze' };
}

async function buscarSemana(userId, semana) {
  const { data, error } = await db
    .from('ligas_semana')
    .select('user_id, semana, divisao, xp_semana, fechada')
    .eq('user_id', userId)
    .eq('semana', semana)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Fecha a última semana pendente do jogador (se houver): calcula a
// posição dele no cohort (mesma semana + divisão), decide promoção,
// manutenção ou rebaixamento, paga fichas conforme o terço e marca
// `fechada` — com update condicionado a `fechada = false` para não pagar
// duas vezes se duas requisições concorrentes tentarem fechar juntas.
async function fecharSemanaPendente(userId, semanaAtual) {
  const { data: pendente, error } = await db
    .from('ligas_semana')
    .select('user_id, semana, divisao, xp_semana')
    .eq('user_id', userId)
    .eq('fechada', false)
    .neq('semana', semanaAtual)
    .order('semana', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!pendente) return;

  const { data: cohort, error: erroCohort } = await db
    .from('ligas_semana')
    .select('user_id, xp_semana')
    .eq('semana', pendente.semana)
    .eq('divisao', pendente.divisao);
  if (erroCohort) throw erroCohort;

  const ordenado = [...(cohort ?? [])].sort(
    (a, b) => b.xp_semana - a.xp_semana || a.user_id.localeCompare(b.user_id)
  );
  const total = ordenado.length;
  const posicao = ordenado.findIndex((c) => c.user_id === userId);
  const corteTopo = Math.max(1, Math.ceil(total * CORTE_PROMOCAO));
  const corteFundo = Math.max(1, Math.ceil(total * CORTE_REBAIXAMENTO));
  const noTopo = posicao < corteTopo;
  const noFundo = !noTopo && posicao >= total - corteFundo;

  const idxAtual = DIVISOES.indexOf(pendente.divisao);
  let novaDivisao = pendente.divisao;
  let fichas = FICHAS_MEIO;
  if (noTopo) {
    novaDivisao = DIVISOES[Math.min(idxAtual + 1, DIVISOES.length - 1)];
    fichas = FICHAS_TOPO;
  } else if (noFundo) {
    novaDivisao = DIVISOES[Math.max(idxAtual - 1, 0)];
    fichas = FICHAS_FUNDO;
  }

  const { data: fechou, error: erroFechar } = await db
    .from('ligas_semana')
    .update({ fechada: true })
    .eq('user_id', userId)
    .eq('semana', pendente.semana)
    .eq('fechada', false)
    .select();
  if (erroFechar) throw erroFechar;
  if (!fechou?.length) return; // outra requisição já fechou essa semana

  const { error: erroDivisao } = await db
    .from('ligas_jogador')
    .update({ divisao: novaDivisao, atualizada_em: new Date().toISOString() })
    .eq('user_id', userId);
  if (erroDivisao) throw erroDivisao;

  await concederFichas(userId, fichas, 'liga_semana', pendente.semana);
}

// Garante o balde da semana atual do jogador, fechando a semana anterior
// (se pendente) antes de criar o novo balde na divisão já atualizada.
async function garantirSemanaAtual(userId) {
  const semana = semanaIso();
  const existente = await buscarSemana(userId, semana);
  if (existente) return existente;

  await garantirJogador(userId);
  await fecharSemanaPendente(userId, semana);
  const jogador = await garantirJogador(userId); // relê: a divisão pode ter mudado

  const { error } = await db
    .from('ligas_semana')
    .upsert(
      { user_id: userId, semana, divisao: jogador.divisao, xp_semana: 0 },
      { onConflict: 'user_id,semana', ignoreDuplicates: true }
    );
  if (error) throw error;

  return buscarSemana(userId, semana);
}

// Hook chamado pelo controller após finalizarQuiz: soma o XP da tentativa
// ao balde da semana. Sem teto próprio — herda o anti-farming do XP (só
// tentativa que supera o recorde da fase rende xp_ganho > 0).
export async function registrarXpNaLiga(userId, xpGanho) {
  if (!Number.isFinite(xpGanho) || xpGanho <= 0) return;

  const semana = semanaIso();
  const atual = await garantirSemanaAtual(userId);

  const { error } = await db
    .from('ligas_semana')
    .update({ xp_semana: atual.xp_semana + xpGanho })
    .eq('user_id', userId)
    .eq('semana', semana);
  if (error) throw error;
}

// Status da liga do jogador: divisão atual, XP da semana e o ranking da
// divisão (top N + a própria posição, mesmo fora do topo).
export async function statusDaLiga(userId, limite = 20) {
  const semana = semanaIso();
  const atual = await garantirSemanaAtual(userId);

  const { data: divisao, error } = await db
    .from('ligas_semana')
    .select('user_id, xp_semana, profiles ( nome )')
    .eq('semana', semana)
    .eq('divisao', atual.divisao)
    .order('xp_semana', { ascending: false });
  if (error) throw error;

  const ordenado = divisao ?? [];
  const minhaPosicao = ordenado.findIndex((r) => r.user_id === userId);

  return {
    semana,
    divisao: atual.divisao,
    xp_semana: atual.xp_semana,
    posicao: minhaPosicao + 1,
    total_na_divisao: ordenado.length,
    ranking: ordenado.slice(0, limite).map((r, i) => ({
      posicao: i + 1,
      user_id: r.user_id,
      nome: r.profiles?.nome ?? null,
      xp_semana: r.xp_semana,
    })),
  };
}
