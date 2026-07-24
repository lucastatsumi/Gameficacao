import { db } from '../config/supabase.js';
import { semanaIsoDe } from '../utils/semana.js';
import { concederFichas } from './fichaService.js';

// Ligas semanais (roadmap v2, 4.5): competição justa entre pares de nível
// parecido — diferente do ranking global (XP total, sempre favorece
// veteranos), aqui o que conta é XP GANHO NA SEMANA dentro da divisão do
// jogador. Toda segunda todo mundo zera dentro da própria divisão.
//
// Fechamento é LAZY (sem cron externo, que este ambiente não garante): o
// primeiro acesso — de QUALQUER jogador da divisão — depois da virada da
// semana dispara fecharSemanaDaDivisao para TODA a divisão de uma vez
// (não só quem acessou), processando promoção/rebaixamento e pagando
// fichas por posição antes de zerar para a nova semana.

export const DIVISOES = ['bronze', 'prata', 'ouro', 'diamante'];

const FRACAO_PROMOCAO = 0.2;
const FRACAO_REBAIXAMENTO = 0.8;
const FICHAS_LIGA_BASE = 5;
const FICHAS_LIGA_TOPO = 20;

// Recompensa escalonada pela posição final: 1º lugar da divisão leva
// FICHAS_LIGA_TOPO, último (que ainda pontuou) leva FICHAS_LIGA_BASE — os
// do meio interpolam linearmente. Quem não pontuou nada na semana (não
// jogou) não recebe fichas.
export function calcularFichasPorPosicao(posicao, total) {
  if (total <= 0) return 0;
  if (total === 1) return FICHAS_LIGA_TOPO;
  const fracaoDoTopo = (total - posicao) / (total - 1); // 1 no 1º lugar, 0 no último
  return Math.round(FICHAS_LIGA_BASE + fracaoDoTopo * (FICHAS_LIGA_TOPO - FICHAS_LIGA_BASE));
}

async function buscarOuCriarLinha(userId, semanaAtual) {
  const { data, error } = await db.from('ligas_semana').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (data) return data;

  const { data: criada, error: erroInsert } = await db
    .from('ligas_semana')
    .insert({ user_id: userId, divisao: 'bronze', xp_semana: 0, semana: semanaAtual })
    .select()
    .single();
  if (erroInsert) throw erroInsert;
  return criada;
}

// Garante que a linha do jogador está na semana ISO corrente, fechando a
// semana anterior da divisão (dele e de todo mundo que ainda estava presa
// nela) antes de devolver o estado atualizado.
async function garantirSemanaAtual(userId) {
  const semanaAtual = semanaIsoDe();
  let linha = await buscarOuCriarLinha(userId, semanaAtual);

  if (linha.semana !== semanaAtual) {
    await fecharSemanaDaDivisao(linha.divisao, linha.semana, semanaAtual);
    const { data, error } = await db.from('ligas_semana').select('*').eq('user_id', userId).single();
    if (error) throw error;
    linha = data;
  }

  return linha;
}

// Processa o fim de semana de UMA divisão: rankeia por xp_semana, promove
// o top 20%, rebaixa o bottom 20% (divisões extremas não sobem/descem
// além de Diamante/Bronze), paga fichas por posição a quem pontuou, e
// zera todo mundo pra semana nova. Filtra por `semana = semanaFechada` ao
// ler E ao gravar — se outra requisição já fechou a divisão (linhas já
// migraram pra semanaNova), a leitura vem vazia e a função é um no-op:
// evita fechar a mesma semana duas vezes.
export async function fecharSemanaDaDivisao(divisao, semanaFechada, semanaNova) {
  const { data: membros, error } = await db
    .from('ligas_semana')
    .select('user_id, xp_semana')
    .eq('divisao', divisao)
    .eq('semana', semanaFechada);
  if (error) throw error;
  if (!membros?.length) return;

  const ordenados = [...membros].sort((a, b) => b.xp_semana - a.xp_semana);
  const total = ordenados.length;
  const corteFinalPromocao = Math.floor(total * FRACAO_PROMOCAO);
  const corteInicialRebaixamento = Math.ceil(total * FRACAO_REBAIXAMENTO);
  const indiceDivisao = DIVISOES.indexOf(divisao);

  for (let i = 0; i < total; i++) {
    const membro = ordenados[i];
    let novaDivisao = divisao;
    if (i < corteFinalPromocao && indiceDivisao < DIVISOES.length - 1) {
      novaDivisao = DIVISOES[indiceDivisao + 1];
    } else if (i >= corteInicialRebaixamento && indiceDivisao > 0) {
      novaDivisao = DIVISOES[indiceDivisao - 1];
    }

    if (membro.xp_semana > 0) {
      const fichas = calcularFichasPorPosicao(i + 1, total);
      if (fichas > 0) await concederFichas(membro.user_id, fichas, 'liga_semanal', semanaFechada);
    }

    const { error: erroUpdate } = await db
      .from('ligas_semana')
      .update({ divisao: novaDivisao, xp_semana: 0, semana: semanaNova })
      .eq('user_id', membro.user_id)
      .eq('semana', semanaFechada);
    if (erroUpdate) throw erroUpdate;
  }
}

// Hook chamado pelo controller após finalizarQuiz: soma o XP ganho nesta
// tentativa ao acumulado da semana corrente do jogador (processando a
// virada de semana antes, se for o caso). XP zero/negativo (reprovou, ou
// repetiu sem superar o recorde) não altera nada — mesma regra
// anti-farming que já vale pra fichas e missões.
export async function registrarXpNaLiga(userId, xpGanho) {
  const linha = await garantirSemanaAtual(userId);
  if (!xpGanho || xpGanho <= 0) return linha;

  const { data, error } = await db
    .from('ligas_semana')
    .update({ xp_semana: linha.xp_semana + xpGanho })
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Classificação da divisão do jogador para a tela de ligas.
export async function classificacaoDaLiga(userId) {
  const minha = await garantirSemanaAtual(userId);

  const { data: membros, error } = await db
    .from('ligas_semana')
    .select('user_id, xp_semana, profiles ( nome )')
    .eq('divisao', minha.divisao)
    .eq('semana', minha.semana)
    .order('xp_semana', { ascending: false });
  if (error) throw error;

  const ranking = (membros ?? []).map((m, i) => ({
    posicao: i + 1,
    nome: m.profiles?.nome ?? '—',
    xp_semana: m.xp_semana,
    voce: m.user_id === userId,
  }));

  return {
    divisao: minha.divisao,
    divisoes: DIVISOES,
    semana: minha.semana,
    xp_semana: minha.xp_semana,
    ranking,
  };
}
