import { db } from '../config/supabase.js';
import { dataDeHoje } from '../utils/streak.js';
import { semanaIso } from '../utils/semana.js';
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

// Missão semanal (roadmap v2, 4.3): mesma ideia das diárias, mas com
// janela de 7 dias — `semana` é o rótulo ISO de utils/semana.js (mesmo
// usado por ligas/kudos), então a virada acontece exatamente na mesma
// segunda-feira das ligas. Todo catálogo com periodo='semana' é
// atribuído (hoje só existe 1); não há sorteio porque não há o que
// escolher entre uma opção só, mas o upsert idempotente segue o mesmo
// padrão de concorrência das diárias.
export async function missoesDaSemana(userId, agora = new Date()) {
  const semana = semanaIso(agora);

  const atribuidas = await buscarAtribuidasSemana(userId, semana);
  if (atribuidas.length) return atribuidas;

  const { data: catalogo, error } = await db
    .from('missoes_catalogo')
    .select('*')
    .eq('periodo', 'semana');
  if (error) throw error;
  if (!catalogo?.length) return [];

  const { error: erroInsert } = await db
    .from('missoes_da_semana')
    .upsert(
      catalogo.map((m) => ({ user_id: userId, missao_id: m.id, semana })),
      { onConflict: 'user_id,missao_id,semana', ignoreDuplicates: true }
    );
  if (erroInsert) throw erroInsert;

  return buscarAtribuidasSemana(userId, semana);
}

// Hook chamado pelo kudosService após dar kudos: avança a missão diária
// "dar_kudos" (roadmap 4.12) do MESMO jeito que registrarQuizNasMissoes
// avança as demais — server-side, sem o cliente reportar progresso.
// Devolve a missão concluída agora (ou null, se não havia nenhuma pendente).
export async function registrarKudosNaMissao(userId) {
  const missoes = await missoesDoDia(userId);
  const alvo = missoes.find((m) => m.tipo === 'dar_kudos' && !m.concluida);
  if (!alvo) return null;

  const progresso = Math.min(alvo.progresso + 1, alvo.parametro);
  const concluida = progresso >= alvo.parametro;

  const { error } = await db
    .from('missoes_do_dia')
    .update({ progresso, concluida })
    .eq('user_id', userId)
    .eq('missao_id', alvo.missao_id)
    .eq('dia', alvo.dia);
  if (error) throw error;

  if (!concluida) return null;

  await concederFichas(userId, alvo.recompensa_fichas, 'missao', alvo.chave);
  return { chave: alvo.chave, descricao: alvo.descricao, recompensa_fichas: alvo.recompensa_fichas };
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

// Hook chamado pelo controller após finalizarQuiz, ao lado de
// registrarQuizNasMissoes: mesma mecânica, mas acumulando na semana
// inteira. Concluir paga fichas E concede o cosmético exclusivo (se a
// missão tiver um) — o insert em itens_do_jogador ignora conflito porque
// o jogador pode completar a mesma missão semanal de novo em semanas
// futuras, mas o cosmético já é dele (compra única, mesma PK de lojaService).
export async function registrarQuizNasMissoesSemanais(userId, resultado, agora = new Date()) {
  const missoes = await missoesDaSemana(userId, agora);
  const pendentes = missoes.filter((m) => !m.concluida);
  if (!pendentes.length) return [];

  const concluidasAgora = [];
  for (const missao of pendentes) {
    const delta = deltaDaMissao(missao.tipo, resultado, false);
    if (delta <= 0) continue;

    const progresso = Math.min(missao.progresso + delta, missao.parametro);
    const concluida = progresso >= missao.parametro;

    const { error } = await db
      .from('missoes_da_semana')
      .update({ progresso, concluida })
      .eq('user_id', userId)
      .eq('missao_id', missao.missao_id)
      .eq('semana', missao.semana);
    if (error) throw error;

    if (concluida) {
      await concederFichas(userId, missao.recompensa_fichas, 'missao_semanal', missao.chave);
      if (missao.item_recompensa_id) {
        const { error: erroItem } = await db
          .from('itens_do_jogador')
          .insert({ user_id: userId, item_id: missao.item_recompensa_id });
        if (erroItem && erroItem.code !== '23505') throw erroItem; // 23505 = já tinha o item
      }
      concluidasAgora.push({
        chave: missao.chave,
        descricao: missao.descricao,
        recompensa_fichas: missao.recompensa_fichas,
        item_concedido: Boolean(missao.item_recompensa_id),
      });
    }
  }
  return concluidasAgora;
}

function deltaDaMissao(tipo, resultado, usouPoder) {
  switch (tipo) {
    case 'acertos_dia':
    case 'acertos_semana':
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

async function buscarAtribuidasSemana(userId, semana) {
  const { data, error } = await db
    .from('missoes_da_semana')
    .select(
      'missao_id, semana, progresso, concluida, missoes_catalogo ( chave, tipo, descricao, parametro, recompensa_fichas, item_recompensa_id )'
    )
    .eq('user_id', userId)
    .eq('semana', semana);
  if (error) throw error;

  return (data ?? []).map((m) => ({
    missao_id: m.missao_id,
    semana: m.semana,
    progresso: m.progresso,
    concluida: m.concluida,
    chave: m.missoes_catalogo.chave,
    tipo: m.missoes_catalogo.tipo,
    descricao: m.missoes_catalogo.descricao,
    parametro: m.missoes_catalogo.parametro,
    recompensa_fichas: m.missoes_catalogo.recompensa_fichas,
    item_recompensa_id: m.missoes_catalogo.item_recompensa_id,
  }));
}
