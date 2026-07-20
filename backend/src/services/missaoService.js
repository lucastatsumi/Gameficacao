import { db } from '../config/supabase.js';
import { dataDeHoje } from '../utils/streak.js';
import { criarPrng, embaralharComSeed } from '../utils/seed.js';
import { concederFichas } from './fichaService.js';

// Missões diárias (roadmap v2, 4.3): 3 por jogador por dia, sorteio
// determinístico por user_id + data (re-consultar nunca troca as missões).
// Progresso é atualizado SÓ aqui, a partir do resultado já corrigido de
// finalizarQuiz — o cliente nunca reporta progresso.

const MISSOES_POR_DIA = 3;

export async function missoesDoDia(userId) {
  const dia = dataDeHoje();

  const atribuidas = await buscarAtribuidas(userId, dia);
  if (atribuidas.length) return atribuidas;

  // Primeiro acesso do dia: sorteia e grava. O upsert com ignoreDuplicates
  // torna a atribuição idempotente se duas requisições correrem juntas —
  // e o sorteio ser determinístico garante que ambas sorteiam AS MESMAS.
  const { data: catalogo, error } = await db.from('missoes_catalogo').select('*');
  if (error) throw error;

  const prng = criarPrng(`${userId}:${dia}`);
  const sorteadas = embaralharComSeed(catalogo ?? [], prng).slice(0, MISSOES_POR_DIA);

  const { error: erroInsert } = await db
    .from('missoes_do_dia')
    .upsert(
      sorteadas.map((m) => ({ user_id: userId, missao_id: m.id, dia })),
      { onConflict: 'user_id,missao_id,dia', ignoreDuplicates: true }
    );
  if (erroInsert) throw erroInsert;

  return buscarAtribuidas(userId, dia);
}

// Hook chamado pelo controller após finalizarQuiz: aplica o resultado do
// quiz ao progresso das missões do dia e paga as que concluírem AGORA.
// Devolve as recém-concluídas para a tela de resultado celebrar.
export async function registrarQuizNasMissoes(userId, resultado, tentativaId) {
  const missoes = await missoesDoDia(userId);
  const pendentes = missoes.filter((m) => !m.concluida);
  if (!pendentes.length) return [];

  // "usar_poder" precisa saber se ESTA tentativa usou algum poder — só
  // consulta se a missão está entre as pendentes do dia.
  let usouPoder = false;
  if (pendentes.some((m) => m.tipo === 'usar_poder')) {
    const { data: poderes, error } = await db
      .from('poderes_usados')
      .select('id')
      .eq('tentativa_id', tentativaId)
      .limit(1);
    if (error) throw error;
    usouPoder = Boolean(poderes?.length);
  }

  const concluidasAgora = [];
  for (const missao of pendentes) {
    const delta = deltaDaMissao(missao.tipo, resultado, usouPoder);
    if (delta <= 0) continue;

    const progresso = Math.min(missao.progresso + delta, missao.parametro);
    const concluida = progresso >= missao.parametro;

    const { error } = await db
      .from('missoes_do_dia')
      .update({ progresso, concluida })
      .eq('user_id', userId)
      .eq('missao_id', missao.missao_id)
      .eq('dia', missao.dia);
    if (error) throw error;

    if (concluida) {
      await concederFichas(userId, missao.recompensa_fichas, 'missao', missao.chave);
      concluidasAgora.push({
        chave: missao.chave,
        descricao: missao.descricao,
        recompensa_fichas: missao.recompensa_fichas,
      });
    }
  }
  return concluidasAgora;
}

function deltaDaMissao(tipo, resultado, usouPoder) {
  switch (tipo) {
    case 'acertos_dia':
      return resultado.acertos;
    case 'aprovar_quiz':
      return resultado.aprovada ? 1 : 0;
    case 'quiz_sem_dica':
      return resultado.aprovada && resultado.sem_dica ? 1 : 0;
    case 'usar_poder':
      return usouPoder ? 1 : 0;
    default:
      return 0;
  }
}

async function buscarAtribuidas(userId, dia) {
  const { data, error } = await db
    .from('missoes_do_dia')
    .select('missao_id, dia, progresso, concluida, missoes_catalogo ( chave, tipo, descricao, parametro, recompensa_fichas )')
    .eq('user_id', userId)
    .eq('dia', dia);
  if (error) throw error;

  return (data ?? []).map((m) => ({
    missao_id: m.missao_id,
    dia: m.dia,
    progresso: m.progresso,
    concluida: m.concluida,
    chave: m.missoes_catalogo.chave,
    tipo: m.missoes_catalogo.tipo,
    descricao: m.missoes_catalogo.descricao,
    parametro: m.missoes_catalogo.parametro,
    recompensa_fichas: m.missoes_catalogo.recompensa_fichas,
  }));
}
