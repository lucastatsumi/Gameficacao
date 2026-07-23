import { db } from '../config/supabase.js';
import { semanaAtual } from '../utils/semana.js';
import { concederFichas } from './fichaService.js';

// Ligas semanais (roadmap v2, 4.5): ranking por XP GANHO NA SEMANA (não
// total) dentro de divisões — o ranking global do zero nunca alcança um
// veterano, aqui todo mundo começa a semana zerado dentro da sua divisão.
// Fechamento é LAZY: o primeiro acesso de UMA divisão após a virada da
// semana ISO (utils/semana.js) promove o top 20%, rebaixa o bottom 20% e
// paga fichas a todos pela posição, sem depender de cron externo.

export const DIVISOES = ['bronze', 'prata', 'ouro', 'diamante'];

export const FICHAS_PROMOVIDO = 15;
export const FICHAS_MEIO = 8;
export const FICHAS_REBAIXADO = 3;

// Garante a linha do jogador em dia para a semana atual, fechando a rodada
// anterior da divisão se ninguém mais tiver feito isso ainda.
export async function minhaLiga(userId) {
  const semana = semanaAtual();
  const linha = await buscarOuCriar(userId, semana);
  if (linha.semana === semana) return formatar(linha);

  await fecharSemana(linha.divisao, linha.semana, semana);
  return formatar(await buscarLinha(userId));
}

// Hook chamado pelo controller após finalizarQuiz: soma o xp_ganho (já
// filtrado pela anti-farming existente — só XP que superou o recorde
// conta) ao acumulado da semana da divisão atual do jogador.
export async function registrarXpNaLiga(userId, resultado) {
  const atual = await minhaLiga(userId);
  if (!resultado.xp_ganho || resultado.xp_ganho <= 0) return atual;

  const xpSemana = atual.xp_semana + resultado.xp_ganho;
  const { error } = await db
    .from('ligas_semana')
    .update({ xp_semana: xpSemana })
    .eq('user_id', userId)
    .eq('semana', atual.semana);
  if (error) throw error;

  return { ...atual, xp_semana: xpSemana };
}

// Ranking da divisão atual do jogador, para a tela mostrar quem está perto
// de subir ou cair.
export async function rankingDaLiga(userId, limite = 50) {
  const atual = await minhaLiga(userId);

  const { data, error } = await db
    .from('ligas_semana')
    .select('user_id, xp_semana, profiles ( nome )')
    .eq('divisao', atual.divisao)
    .order('xp_semana', { ascending: false })
    .limit(limite);
  if (error) throw error;

  const ranking = (data ?? []).map((linha, indice) => ({
    posicao: indice + 1,
    nome: linha.profiles?.nome ?? '—',
    xp_semana: linha.xp_semana,
    voce: linha.user_id === userId,
  }));

  return { ...atual, ranking };
}

async function buscarOuCriar(userId, semana) {
  const existente = await buscarLinha(userId);
  if (existente) return existente;

  const { data, error } = await db
    .from('ligas_semana')
    .insert({ user_id: userId, divisao: DIVISOES[0], xp_semana: 0, semana })
    .select()
    .single();
  // Corrida no primeiro acesso: outra requisição já criou a linha (PK) —
  // relê em vez de falhar.
  if (error?.code === '23505') return buscarLinha(userId);
  if (error) throw error;
  return data;
}

async function buscarLinha(userId) {
  const { data, error } = await db
    .from('ligas_semana')
    .select('user_id, divisao, xp_semana, semana')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Fecha a rodada anterior de UMA divisão: promove o top 20%, rebaixa o
// bottom 20%, paga fichas a todos pela posição e reseta xp_semana.
// Idempotente — se outra requisição já fechou (ninguém mais na divisão com
// a `semanaAntiga`), não faz nada.
async function fecharSemana(divisao, semanaAntiga, semanaNova) {
  const { data: membros, error } = await db
    .from('ligas_semana')
    .select('user_id, xp_semana')
    .eq('divisao', divisao)
    .eq('semana', semanaAntiga);
  if (error) throw error;
  if (!membros?.length) return;

  const ordenados = [...membros].sort((a, b) => b.xp_semana - a.xp_semana);
  const cortePromovido = Math.floor(ordenados.length * 0.2);
  const corteRebaixado = Math.ceil(ordenados.length * 0.8);
  const indiceDivisao = DIVISOES.indexOf(divisao);

  for (const [indice, membro] of ordenados.entries()) {
    let novaDivisao = divisao;
    let fichas = FICHAS_MEIO;
    if (indice < cortePromovido) {
      novaDivisao = DIVISOES[Math.min(indiceDivisao + 1, DIVISOES.length - 1)];
      fichas = FICHAS_PROMOVIDO;
    } else if (indice >= corteRebaixado) {
      novaDivisao = DIVISOES[Math.max(indiceDivisao - 1, 0)];
      fichas = FICHAS_REBAIXADO;
    }

    const { error: erroUpdate } = await db
      .from('ligas_semana')
      .update({ divisao: novaDivisao, xp_semana: 0, semana: semanaNova })
      .eq('user_id', membro.user_id)
      .eq('semana', semanaAntiga);
    if (erroUpdate) throw erroUpdate;

    await concederFichas(membro.user_id, fichas, 'liga_semana', divisao);
  }
}

function formatar(linha) {
  return { divisao: linha.divisao, xp_semana: linha.xp_semana, semana: linha.semana };
}
