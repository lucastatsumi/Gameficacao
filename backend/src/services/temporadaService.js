import { db } from '../config/supabase.js';
import { doTenant, mesmoTenant } from '../utils/empresa.js';
import { HttpError } from '../utils/httpError.js';
import { concederFichas } from './fichaService.js';

// Temporadas (roadmap v2, 4.6): arco de longo prazo por PONTOS DE
// TEMPORADA (= XP ganho no período, mesmo padrão de xp_semana em
// ligas_semana — ver concederXpSemana). A trilha de recompensas é fixa
// por temporada; cruzar um marco de pontos resgata automaticamente
// (fichas ou cosmético exclusivo). Pontos só somam dentro de
// [inicio, fim], então o placar de uma temporada encerrada já é hall
// da fama consultável — congela sozinho, sem cron externo (mesma ideia
// de eventoAtivoParaFase).

export async function criarTemporada(dados, empresaId = null) {
  const temporada = validarPayload(dados);
  const { data, error } = await db
    .from('temporadas')
    .insert({ ...temporada, empresa_id: empresaId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listarTemporadas(agora = new Date(), empresaId = null) {
  const { data, error } = await doTenant(db.from('temporadas').select('*'), empresaId).order(
    'inicio',
    { ascending: false },
  );
  if (error) throw error;
  return (data ?? []).map((temporada) => comStatus(temporada, agora));
}

export async function temporadaAtiva(agora = new Date(), empresaId = null) {
  const iso = agora.toISOString();
  const { data, error } = await doTenant(db.from('temporadas').select('*'), empresaId)
    .lte('inicio', iso)
    .gte('fim', iso)
    .order('inicio', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Define (substitui) a trilha de recompensas de uma temporada. Cada
// degrau 'cosmetico' referencia um item que já precisa existir em
// itens_catalogo (criado como exclusivo desta temporada antes de montar
// a trilha).
export async function definirTrilha(temporadaId, degraus, empresaId = null) {
  if (!Array.isArray(degraus) || !degraus.length) {
    throw new HttpError(400, 'A trilha precisa de ao menos um degrau');
  }
  const linhas = degraus.map((degrau, indice) => validarDegrau(temporadaId, degrau, indice));

  // Só a temporada do próprio tenant (validação antes, para não ir ao
  // banco com payload inválido)
  const { data: temporada, error: erroTemporada } = await db
    .from('temporadas')
    .select('id, empresa_id')
    .eq('id', temporadaId)
    .maybeSingle();
  if (erroTemporada) throw erroTemporada;
  if (!temporada || !mesmoTenant(temporada.empresa_id, empresaId)) {
    throw new HttpError(404, 'Temporada não encontrada');
  }

  const { error: erroDelete } = await db
    .from('temporada_recompensas')
    .delete()
    .eq('temporada_id', temporadaId);
  if (erroDelete) throw erroDelete;

  const { data, error } = await db.from('temporada_recompensas').insert(linhas).select();
  if (error) throw error;
  return data;
}

// Hook chamado pelo controller após finalizarQuiz, ao lado de
// ligaService.concederXpSemana — mesmo xp_ganho já filtrado pela regra
// anti-farming de quizService. Silencioso se não há temporada ativa.
// Retorna os degraus concedidos agora (para o controller expor ao
// jogador, tipo poderService.concederPoder no streak).
export async function concederPontosTemporada(
  userId,
  xpGanho,
  agora = new Date(),
  empresaId = null,
) {
  if (!xpGanho || xpGanho <= 0) return [];

  const temporada = await temporadaAtiva(agora, empresaId);
  if (!temporada) return [];

  const linha = await buscarOuCriarLinha(temporada.id, userId);
  const pontos = linha.pontos + xpGanho;

  const { error } = await db
    .from('temporada_pontos')
    .update({ pontos })
    .eq('temporada_id', temporada.id)
    .eq('user_id', userId);
  if (error) throw error;

  return resgatarElegiveis(temporada.id, userId, pontos);
}

// Progresso do jogador na temporada ativa: pontos acumulados + trilha
// inteira com o que já foi resgatado, para a UI desenhar o passe.
export async function progressoDoJogador(userId, agora = new Date(), empresaId = null) {
  const temporada = await temporadaAtiva(agora, empresaId);
  if (!temporada) return null;

  const [
    { data: linha, error: erroLinha },
    { data: degraus, error: erroDegraus },
    { data: resgatados, error: erroResgatados },
  ] = await Promise.all([
    db
      .from('temporada_pontos')
      .select('pontos')
      .eq('temporada_id', temporada.id)
      .eq('user_id', userId)
      .maybeSingle(),
    db.from('temporada_recompensas').select('*').eq('temporada_id', temporada.id).order('posicao'),
    db.from('temporada_resgates').select('recompensa_id').eq('user_id', userId),
  ]);
  if (erroLinha) throw erroLinha;
  if (erroDegraus) throw erroDegraus;
  if (erroResgatados) throw erroResgatados;

  const resgatadosIds = new Set((resgatados ?? []).map((r) => r.recompensa_id));
  const pontos = linha?.pontos ?? 0;

  return {
    ...comStatus(temporada, agora),
    pontos,
    trilha: (degraus ?? []).map((degrau) => ({
      ...degrau,
      resgatada: resgatadosIds.has(degrau.id),
    })),
  };
}

// Hall da fama: ranking por pontos desc de qualquer temporada (ativa ou
// encerrada) — como pontos só somam dentro do período, o placar de uma
// temporada encerrada já está congelado.
export async function hallDaFama(temporadaId, empresaId = null) {
  const { data, error } = await doTenant(
    db.from('ranking_temporada').select('id, nome, pontos, posicao'),
    empresaId,
  )
    .eq('temporada_id', temporadaId)
    .order('posicao');
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------

async function buscarOuCriarLinha(temporadaId, userId) {
  const { data, error } = await db
    .from('temporada_pontos')
    .select('temporada_id, user_id, pontos')
    .eq('temporada_id', temporadaId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;

  const { error: erroUpsert } = await db
    .from('temporada_pontos')
    .upsert(
      { temporada_id: temporadaId, user_id: userId, pontos: 0 },
      { onConflict: 'temporada_id,user_id', ignoreDuplicates: true },
    );
  if (erroUpsert) throw erroUpsert;

  return { temporada_id: temporadaId, user_id: userId, pontos: 0 };
}

// Resgata todo degrau cujo pontos_necessarios já foi atingido e ainda
// não foi concedido. O insert em temporada_resgates É a trava: se outra
// requisição concorrente já resgatou o mesmo degrau, falha com 23505 e
// pulamos (mesma ideia de ligas_fechamentos).
async function resgatarElegiveis(temporadaId, userId, pontos) {
  const { data: degraus, error } = await db
    .from('temporada_recompensas')
    .select('*')
    .eq('temporada_id', temporadaId)
    .lte('pontos_necessarios', pontos)
    .order('posicao');
  if (error) throw error;
  if (!degraus?.length) return [];

  const { data: jaResgatados, error: erroResgatados } = await db
    .from('temporada_resgates')
    .select('recompensa_id')
    .eq('user_id', userId)
    .in(
      'recompensa_id',
      degraus.map((d) => d.id),
    );
  if (erroResgatados) throw erroResgatados;
  const resgatadosIds = new Set((jaResgatados ?? []).map((r) => r.recompensa_id));

  const concedidos = [];
  for (const degrau of degraus.filter((d) => !resgatadosIds.has(d.id))) {
    const { error: erroInsert } = await db
      .from('temporada_resgates')
      .insert({ user_id: userId, recompensa_id: degrau.id });
    if (erroInsert) {
      if (erroInsert.code === '23505') continue; // resgatado por outra requisição concorrente
      throw erroInsert;
    }

    if (degrau.tipo === 'fichas') {
      await concederFichas(userId, degrau.fichas, 'temporada_recompensa', String(degrau.id));
    } else {
      const { error: erroItem } = await db
        .from('itens_do_jogador')
        .insert({ user_id: userId, item_id: degrau.item_catalogo_id });
      if (erroItem) throw erroItem;
    }
    concedidos.push(degrau);
  }
  return concedidos;
}

function comStatus(temporada, agora = new Date()) {
  const agoraMs = agora.getTime();
  return {
    ...temporada,
    status:
      agoraMs < new Date(temporada.inicio).getTime()
        ? 'futura'
        : agoraMs > new Date(temporada.fim).getTime()
          ? 'encerrada'
          : 'ativa',
  };
}

function validarPayload(dados) {
  const { nome, tema = null, inicio, fim } = dados ?? {};

  if (!nome?.trim()) throw new HttpError(400, 'O nome da temporada é obrigatório');
  if (!inicio || !fim || new Date(fim) <= new Date(inicio)) {
    throw new HttpError(400, 'O fim da temporada deve ser depois do início');
  }

  return {
    nome: nome.trim(),
    tema: tema?.trim?.() || null,
    inicio: new Date(inicio).toISOString(),
    fim: new Date(fim).toISOString(),
  };
}

function validarDegrau(temporadaId, degrau, indice) {
  const posicao = degrau?.posicao ?? indice + 1;
  const pontosNecessarios = Number(degrau?.pontos_necessarios);
  if (!(pontosNecessarios > 0)) {
    throw new HttpError(
      400,
      `Degrau ${posicao}: pontos_necessarios deve ser um número maior que 0`,
    );
  }

  if (degrau?.tipo === 'fichas') {
    const fichas = Number(degrau.fichas);
    if (!(fichas > 0))
      throw new HttpError(400, `Degrau ${posicao}: fichas deve ser um número maior que 0`);
    return {
      temporada_id: temporadaId,
      posicao,
      pontos_necessarios: pontosNecessarios,
      tipo: 'fichas',
      fichas,
      item_catalogo_id: null,
    };
  }

  if (degrau?.tipo === 'cosmetico') {
    if (!degrau.item_catalogo_id) {
      throw new HttpError(400, `Degrau ${posicao}: item_catalogo_id é obrigatório`);
    }
    return {
      temporada_id: temporadaId,
      posicao,
      pontos_necessarios: pontosNecessarios,
      tipo: 'cosmetico',
      fichas: null,
      item_catalogo_id: Number(degrau.item_catalogo_id),
    };
  }

  throw new HttpError(400, `Degrau ${posicao}: tipo deve ser "fichas" ou "cosmetico"`);
}
