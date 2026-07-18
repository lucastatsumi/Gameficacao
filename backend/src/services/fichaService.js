import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';

// Economia de fichas (roadmap v2, 4.1): ledger append-only em
// `transacoes_fichas` — o saldo é SEMPRE derivado da soma das transações,
// nunca um campo editável. Débito é uma transação negativa.

export const FICHAS_QUIZ_APROVADO = 10;
export const FICHAS_QUIZ_PERFEITO = 5; // adicional ao de aprovado
export const TETO_DIARIO_QUIZ = 50; // máximo de fichas/dia vindas de quiz

export async function saldoDeFichas(userId) {
  const { data, error } = await db
    .from('transacoes_fichas')
    .select('quantidade')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).reduce((soma, t) => soma + t.quantidade, 0);
}

export async function extratoDeFichas(userId, limite = 20) {
  const { data, error } = await db
    .from('transacoes_fichas')
    .select('quantidade, motivo, criada_em')
    .eq('user_id', userId)
    .order('criada_em', { ascending: false })
    .limit(limite);
  if (error) throw error;
  return data ?? [];
}

export async function concederFichas(userId, quantidade, motivo, referencia = null) {
  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    throw new HttpError(400, 'Quantidade de fichas a conceder deve ser um inteiro positivo');
  }
  const { error } = await db
    .from('transacoes_fichas')
    .insert({ user_id: userId, quantidade, motivo, referencia });
  if (error) throw error;
}

// Débito com verificação de saldo — usado pela loja. Não há saldo
// negativo: a compra falha se as fichas não bastam.
export async function debitarFichas(userId, quantidade, motivo, referencia = null) {
  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    throw new HttpError(400, 'Quantidade de fichas a debitar deve ser um inteiro positivo');
  }
  const saldo = await saldoDeFichas(userId);
  if (saldo < quantidade) throw new HttpError(402, 'Fichas insuficientes');

  const { error } = await db
    .from('transacoes_fichas')
    .insert({ user_id: userId, quantidade: -quantidade, motivo, referencia });
  if (error) throw error;
  return saldo - quantidade;
}

// Fichas ganhas por quiz no dia (UTC) — para o teto diário anti-farming.
async function fichasDeQuizHoje(userId) {
  const inicioDoDia = `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;
  const { data, error } = await db
    .from('transacoes_fichas')
    .select('quantidade')
    .eq('user_id', userId)
    .in('motivo', ['quiz_aprovado', 'quiz_perfeito'])
    .gte('criada_em', inicioDoDia);
  if (error) throw error;
  return (data ?? []).reduce((soma, t) => soma + t.quantidade, 0);
}

// Recompensa de fichas ao finalizar um quiz. Regras (roadmap 4.1):
// - só recompensa tentativa que rendeu XP novo (xp_ganho > 0) — herda a
//   regra anti-farming: repetir a fase sem superar o recorde não paga;
// - aprovado = 10 fichas; perfeito (100%) = +5;
// - teto diário de 50 fichas vindas de quiz.
// Retorna o total concedido (0 se nada) para o controller exibir.
export async function recompensarQuiz(userId, resultado, tentativaId) {
  if (!resultado.aprovada || resultado.xp_ganho <= 0) return 0;

  let fichas = FICHAS_QUIZ_APROVADO;
  const perfeito =
    resultado.total_questoes > 0 && resultado.acertos === resultado.total_questoes;

  const jaHoje = await fichasDeQuizHoje(userId);
  const restanteDoTeto = Math.max(0, TETO_DIARIO_QUIZ - jaHoje);
  if (restanteDoTeto === 0) return 0;

  const aprovadoConcedido = Math.min(fichas, restanteDoTeto);
  await concederFichas(userId, aprovadoConcedido, 'quiz_aprovado', tentativaId);

  let perfeitoConcedido = 0;
  if (perfeito && restanteDoTeto - aprovadoConcedido > 0) {
    perfeitoConcedido = Math.min(FICHAS_QUIZ_PERFEITO, restanteDoTeto - aprovadoConcedido);
    await concederFichas(userId, perfeitoConcedido, 'quiz_perfeito', tentativaId);
  }

  return aprovadoConcedido + perfeitoConcedido;
}
