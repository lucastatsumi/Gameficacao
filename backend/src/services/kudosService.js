import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { semanaIso } from '../utils/semana.js';
import { concederFichas } from './fichaService.js';
import { registrarKudosNaMissao } from './missaoService.js';

// Kudos entre colegas (roadmap v2, 4.12): a única mecânica movida por
// generosidade, não competição. 3 kudos por semana por jogador, cada um
// para um colega diferente (unique de_usuario+para_usuario+semana no
// banco). Receber kudos rende fichas pequenas; dar kudos conta para a
// missão diária "reconheça um colega".

export const KUDOS_POR_SEMANA = 3;
const FICHAS_POR_KUDOS = 3;
const TETO_SEMANAL_FICHAS_KUDOS = 15; // = 5 kudos recebidos rendendo fichas por semana

export async function resumoDeKudos(userId, agora = new Date()) {
  const semana = semanaIso(agora);

  const [dados, recebidos] = await Promise.all([
    contar('de_usuario', userId, semana),
    contar('para_usuario', userId, semana),
  ]);

  return {
    semana,
    dados,
    restantes: Math.max(0, KUDOS_POR_SEMANA - dados),
    recebidos,
  };
}

// Dá 1 kudos de `deId` para `paraId`. Regras anti-abuso:
// - no máximo 3 kudos dados por semana (por jogador);
// - no máximo 1 kudos por colega por semana (trava é o unique do banco);
// - recíproco no MESMO dia (o colega já te deu kudos hoje) não rende
//   fichas — evita o "eu te dou, você me dá de volta na hora";
// - teto semanal de fichas vindas de kudos recebidos, para o kudos
//   continuar sendo reconhecimento e não uma fonte extra de farming.
// empresaId (opcional): só dá kudos a colegas da mesma empresa.
export async function darKudos(deId, paraId, agora = new Date(), empresaId = null) {
  if (!paraId) throw new HttpError(400, 'para_usuario é obrigatório');
  if (paraId === deId) throw new HttpError(400, 'Você não pode dar kudos a si mesmo');

  const alvo = await buscarPerfil(paraId);
  if (!alvo || (empresaId && alvo.empresa_id !== empresaId)) {
    throw new HttpError(404, 'Jogador não encontrado'); // não revela usuários de outra empresa
  }

  const semana = semanaIso(agora);

  const dadosNaSemana = await contar('de_usuario', deId, semana);
  if (dadosNaSemana >= KUDOS_POR_SEMANA) {
    throw new HttpError(400, 'Você já usou seus 3 kudos desta semana');
  }

  const reciproco = await recebeuKudosHoje(deId, paraId, agora);
  let fichasConcedidas = false;
  if (!reciproco) {
    const fichasRecebidasNaSemana = await fichasDeKudosNaSemana(paraId, semana);
    fichasConcedidas = fichasRecebidasNaSemana < TETO_SEMANAL_FICHAS_KUDOS;
  }

  const { error } = await db
    .from('kudos')
    .insert({ de_usuario: deId, para_usuario: paraId, semana, fichas_concedidas: fichasConcedidas });
  if (error) {
    if (error.code === '23505') {
      throw new HttpError(400, 'Você já deu kudos a este colega nesta semana');
    }
    throw error;
  }

  if (fichasConcedidas) {
    await concederFichas(paraId, FICHAS_POR_KUDOS, 'kudos_recebido', deId);
  }
  await registrarKudosNaMissao(deId);

  return {
    fichas_concedidas: fichasConcedidas,
    restantes: KUDOS_POR_SEMANA - dadosNaSemana - 1,
  };
}

async function buscarPerfil(userId) {
  const { data, error } = await db
    .from('profiles')
    .select('id, empresa_id')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function contar(coluna, userId, semana) {
  const { data, error } = await db
    .from('kudos')
    .select('id')
    .eq(coluna, userId)
    .eq('semana', semana);
  if (error) throw error;
  return (data ?? []).length;
}

async function fichasDeKudosNaSemana(userId, semana) {
  const { data, error } = await db
    .from('kudos')
    .select('id')
    .eq('para_usuario', userId)
    .eq('semana', semana)
    .eq('fichas_concedidas', true);
  if (error) throw error;
  return (data ?? []).length * FICHAS_POR_KUDOS;
}

async function recebeuKudosHoje(deId, paraId, agora) {
  const inicioDoDia = `${agora.toISOString().slice(0, 10)}T00:00:00.000Z`;
  const { data, error } = await db
    .from('kudos')
    .select('id')
    .eq('de_usuario', paraId)
    .eq('para_usuario', deId)
    .gte('criado_em', inicioDoDia);
  if (error) throw error;
  return Boolean(data?.length);
}
