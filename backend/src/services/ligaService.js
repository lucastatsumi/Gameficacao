import { db } from '../config/supabase.js';
import { semanaIsoAnterior, semanaIsoDeHoje } from '../utils/semana.js';
import { concederFichas } from './fichaService.js';

// Ligas semanais (roadmap v2, 4.5): compete por XP GANHO NA SEMANA (não
// total), dentro de uma divisão — o ranking global por xp_total premia
// veteranos para sempre, aqui todo mundo zera junto na virada da semana.

export const DIVISOES = ['bronze', 'prata', 'ouro', 'diamante'];

// Só promove/rebaixa se a divisão tiver gente o bastante pra "top/bottom
// 20%" significar algo — abaixo disso, todo mundo mantém a divisão.
const TAMANHO_MINIMO_PARA_MOVIMENTO = 5;
const PROPORCAO_MOVIMENTO = 0.2;

const FICHAS_BASE_POR_DIVISAO = { bronze: 5, prata: 8, ouro: 12, diamante: 20 };

function fichasDoFechamento(divisaoAnterior, resultado) {
  const base = FICHAS_BASE_POR_DIVISAO[divisaoAnterior] ?? FICHAS_BASE_POR_DIVISAO.bronze;
  if (resultado === 'promovido') return Math.round(base * 1.5);
  if (resultado === 'rebaixado') return Math.round(base * 0.5);
  return base;
}

// Minha posição na liga da semana corrente: cria o registro da semana se
// for o primeiro acesso (processando o fechamento da semana anterior, se
// houver) e devolve o quadro da divisão atual.
export async function minhaLiga(userId, agora = new Date()) {
  const semana = semanaIsoDeHoje(agora);
  const semanaAnt = semanaIsoAnterior(agora);
  const registro = await obterOuCriarRegistro(userId, semana, semanaAnt);

  const { data: doGrupo, error } = await db
    .from('ligas_semana')
    .select('user_id, xp_semana, profiles ( nome )')
    .eq('semana', semana)
    .eq('divisao', registro.divisao)
    .order('xp_semana', { ascending: false })
    .limit(50);
  if (error) throw error;

  return {
    semana,
    divisao: registro.divisao,
    xp_semana: registro.xp_semana,
    ranking: doGrupo.map((linha, i) => ({
      posicao: i + 1,
      nome: linha.profiles?.nome ?? '—',
      xp_semana: linha.xp_semana,
      voce: linha.user_id === userId,
    })),
  };
}

// Hook chamado pelo controller após finalizarQuiz: soma o xp ganho no
// acumulador da semana corrente. Cria o registro lazily (mesma lógica de
// minhaLiga) se essa for a primeira atividade do jogador na semana.
export async function registrarXpNaLiga(userId, xpGanho, agora = new Date()) {
  if (!Number.isInteger(xpGanho) || xpGanho <= 0) return;

  const semana = semanaIsoDeHoje(agora);
  const semanaAnt = semanaIsoAnterior(agora);
  const registro = await obterOuCriarRegistro(userId, semana, semanaAnt);

  const { error } = await db
    .from('ligas_semana')
    .update({ xp_semana: registro.xp_semana + xpGanho })
    .eq('user_id', userId)
    .eq('semana', semana);
  if (error) throw error;
}

async function obterOuCriarRegistro(userId, semana, semanaAnt) {
  const { data: existente, error } = await db
    .from('ligas_semana')
    .select('*')
    .eq('user_id', userId)
    .eq('semana', semana)
    .maybeSingle();
  if (error) throw error;
  if (existente) return existente;

  const divisao = await divisaoInicial(userId, semana, semanaAnt);

  // upsert com ignoreDuplicates: se duas requisições concorrentes caírem
  // aqui juntas (ex. duas abas abrindo o mapa ao mesmo tempo), só uma
  // grava — a outra relê embaixo o registro que a primeira criou.
  const { data: criado, error: erroInsert } = await db
    .from('ligas_semana')
    .upsert(
      { user_id: userId, semana, divisao, xp_semana: 0 },
      { onConflict: 'user_id,semana', ignoreDuplicates: true },
    )
    .select()
    .maybeSingle();
  if (erroInsert) throw erroInsert;
  if (criado) return criado;

  const { data: relido, error: erroReleitura } = await db
    .from('ligas_semana')
    .select('*')
    .eq('user_id', userId)
    .eq('semana', semana)
    .single();
  if (erroReleitura) throw erroReleitura;
  return relido;
}

// Divisão com que o jogador estreia na semana nova:
// - nunca jogou antes -> bronze (sem fechamento a processar);
// - jogou a semana passada -> processa promoção/rebaixamento a partir do
//   ranking (já congelado) daquela semana;
// - pulou uma ou mais semanas -> retoma na mesma divisão de antes, sem
//   processar nada (não há "semana anterior" pra tirar ranking).
async function divisaoInicial(userId, semanaAtual, semanaAnt) {
  const anterior = await registroMaisRecenteAntes(userId, semanaAtual);
  if (!anterior) return 'bronze';
  if (anterior.semana !== semanaAnt) return anterior.divisao;

  const { data: grupo, error } = await db
    .from('ligas_semana')
    .select('user_id, xp_semana')
    .eq('semana', semanaAnt)
    .eq('divisao', anterior.divisao)
    .order('xp_semana', { ascending: false });
  if (error) throw error;

  const { divisao, resultado } = calcularMovimento(anterior.divisao, grupo, userId);
  await concederFichas(
    userId,
    fichasDoFechamento(anterior.divisao, resultado),
    'liga_semanal',
    semanaAnt,
  );
  return divisao;
}

function calcularMovimento(divisaoAtual, grupoOrdenado, userId) {
  const total = grupoOrdenado.length;
  const indiceAtual = DIVISOES.indexOf(divisaoAtual);

  if (total < TAMANHO_MINIMO_PARA_MOVIMENTO) {
    return { divisao: divisaoAtual, resultado: 'manteve' };
  }

  const posicao = grupoOrdenado.findIndex((r) => r.user_id === userId);
  const corte = Math.max(1, Math.floor(total * PROPORCAO_MOVIMENTO));

  if (posicao !== -1 && posicao < corte && indiceAtual < DIVISOES.length - 1) {
    return { divisao: DIVISOES[indiceAtual + 1], resultado: 'promovido' };
  }
  if (posicao !== -1 && posicao >= total - corte && indiceAtual > 0) {
    return { divisao: DIVISOES[indiceAtual - 1], resultado: 'rebaixado' };
  }
  return { divisao: divisaoAtual, resultado: 'manteve' };
}

async function registroMaisRecenteAntes(userId, semanaAtual) {
  const { data, error } = await db
    .from('ligas_semana')
    .select('*')
    .eq('user_id', userId)
    .lt('semana', semanaAtual)
    .order('semana', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
