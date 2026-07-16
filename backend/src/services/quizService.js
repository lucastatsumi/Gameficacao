import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { embaralhar } from '../utils/random.js';
import { nivelPorXp } from '../utils/nivel.js';
import { dataDeHoje, proximoStreak } from '../utils/streak.js';
import { verificarBadges } from './badgeService.js';
import { eventoAtivoParaFase } from './eventoService.js';

const QUESTOES_POR_QUIZ = 10;
const PCT_APROVACAO = 0.7; // acertar 70% conclui a fase / aprova o quiz
const TOLERANCIA_REDE_MS = 5000; // folga sobre o timer para latência de rede

// ---------------------------------------------------------------
// POST /quiz/iniciar — valida desbloqueio, sorteia questões e abre
// a tentativa. As alternativas vão SEM os campos correta/explicacao.
// ---------------------------------------------------------------
export async function iniciarQuiz(userId, faseId) {
  if (!faseId) throw new HttpError(400, 'fase_id é obrigatório');

  const { data: fase, error: erroFase } = await db
    .from('fases')
    .select('*')
    .eq('id', faseId)
    .maybeSingle();
  if (erroFase) throw erroFase;
  if (!fase) throw new HttpError(404, 'Fase não encontrada');

  if (fase.fase_requisito_id != null) {
    const { data: requisito } = await db
      .from('progresso_fase')
      .select('concluida')
      .eq('user_id', userId)
      .eq('fase_id', fase.fase_requisito_id)
      .maybeSingle();
    if (!requisito?.concluida) {
      throw new HttpError(403, 'Fase bloqueada: conclua a fase anterior primeiro');
    }
  }

  await abandonarTentativasAbertas(userId);

  const { data: questoes, error: erroQuestoes } = await db
    .from('questoes')
    .select(
      // NUNCA inclui `ordem_correta` (gabarito do formato reordenar_algoritmo)
      'id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor, formato, passos, alternativas ( id, letra, texto )'
    )
    .eq('fase_id', faseId)
    .eq('ativa', true);
  if (erroQuestoes) throw erroQuestoes;
  if (!questoes?.length) throw new HttpError(404, 'Esta fase ainda não possui questões');

  const sorteadas = embaralhar(questoes)
    .slice(0, QUESTOES_POR_QUIZ)
    .map((q) => ({
      ...q,
      tem_dica: false, // dicas são exclusivas dos quizzes customizados
      alternativas: [...q.alternativas].sort((a, b) => a.letra.localeCompare(b.letra)),
      // embaralha os passos a cada tentativa — senão a ordem cadastrada já
      // seria uma dica
      passos: q.passos ? embaralhar(q.passos) : null,
    }));

  const { data: tentativa, error: erroTentativa } = await db
    .from('tentativas')
    .insert({ user_id: userId, fase_id: faseId, total_questoes: sorteadas.length })
    .select()
    .single();
  if (erroTentativa) throw erroTentativa;

  return {
    tentativa_id: tentativa.id,
    fase: { id: fase.id, nome: fase.nome },
    questoes: sorteadas,
  };
}

// ---------------------------------------------------------------
// POST /quiz/iniciar-custom — abre tentativa de um quiz montado
// pelo professor. Aplica a configuração (tempo fixo, sons, dicas).
// ---------------------------------------------------------------
export async function iniciarQuizCustom(usuario, quizId) {
  if (!quizId) throw new HttpError(400, 'quiz_id é obrigatório');

  const quiz = await buscarQuizCustom(quizId);
  // Quizzes são abertos a todos; só o criador pode jogar um quiz desativado
  // (para testá-lo antes de reativar)
  if (!quiz.ativo && quiz.criador_id !== usuario.id) {
    throw new HttpError(403, 'Este quiz foi desativado pelo criador');
  }

  await abandonarTentativasAbertas(usuario.id);

  const { data: itens, error: erroItens } = await db
    .from('quiz_custom_questoes')
    .select(
      // NUNCA inclui `ordem_correta` (gabarito do formato reordenar_algoritmo)
      'ordem, questoes ( id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor, formato, passos, dica, ativa, alternativas ( id, letra, texto ) )'
    )
    .eq('quiz_id', quizId)
    .order('ordem');
  if (erroItens) throw erroItens;

  const questoes = itens
    .map((i) => i.questoes)
    .filter((q) => q?.ativa)
    .map(({ dica, ativa, ...q }) => ({
      ...q,
      // tempo fixo do quiz (se configurado) vence o tempo da questão
      tempo_limite_seg: quiz.tempo_limite_seg ?? q.tempo_limite_seg,
      // NUNCA enviar o texto da dica aqui: o aluno pede via /quiz/dica
      tem_dica: quiz.permitir_dicas && Boolean(dica?.trim()),
      alternativas: [...q.alternativas].sort((a, b) => a.letra.localeCompare(b.letra)),
      passos: q.passos ? embaralhar(q.passos) : null,
    }));
  if (!questoes.length) throw new HttpError(404, 'Este quiz não possui questões ativas');

  const { data: tentativa, error: erroTentativa } = await db
    .from('tentativas')
    .insert({ user_id: usuario.id, quiz_custom_id: quizId, total_questoes: questoes.length })
    .select()
    .single();
  if (erroTentativa) throw erroTentativa;

  return {
    tentativa_id: tentativa.id,
    quiz: {
      id: quiz.id,
      titulo: quiz.titulo,
      descricao: quiz.descricao,
      sons: quiz.sons,
      permitir_dicas: quiz.permitir_dicas,
    },
    questoes,
  };
}

// ---------------------------------------------------------------
// POST /quiz/dica — revela a dica de uma questão (quiz custom).
// Registrar em dicas_usadas garante que a penalidade de XP é
// aplicada pelo SERVIDOR, não pelo cliente.
// ---------------------------------------------------------------
export async function obterDica(userId, dados) {
  const { tentativa_id, questao_id } = dados ?? {};
  if (!tentativa_id || !questao_id) {
    throw new HttpError(400, 'tentativa_id e questao_id são obrigatórios');
  }

  const tentativa = await buscarTentativa(userId, tentativa_id);
  if (tentativa.finalizada_em) throw new HttpError(409, 'Esta tentativa já foi finalizada');
  if (!tentativa.quiz_custom_id) {
    throw new HttpError(400, 'Dicas só estão disponíveis em quizzes da turma');
  }

  const quiz = await buscarQuizCustom(tentativa.quiz_custom_id);
  if (!quiz.permitir_dicas) throw new HttpError(403, 'Este quiz não permite dicas');

  await exigirQuestaoNoQuiz(quiz.id, questao_id);

  const { data: questao, error: erroQuestao } = await db
    .from('questoes')
    .select('dica')
    .eq('id', questao_id)
    .maybeSingle();
  if (erroQuestao) throw erroQuestao;
  if (!questao?.dica?.trim()) throw new HttpError(404, 'Esta questão não tem dica cadastrada');

  const { error: erroInsert } = await db
    .from('dicas_usadas')
    .insert({ tentativa_id, questao_id });
  // 23505 = já pediu a dica antes nesta tentativa: só devolve de novo
  if (erroInsert && erroInsert.code !== '23505') throw erroInsert;

  return { dica: questao.dica, penalidade: 'O XP desta questão vale metade.' };
}

// ---------------------------------------------------------------
// POST /quiz/responder — corrige NO SERVIDOR e valida o timer
// comparando timestamps do próprio banco. Funciona para fases e
// para quizzes customizados.
// ---------------------------------------------------------------
export async function responderQuestao(userId, dados) {
  const { tentativa_id, questao_id, alternativa_id = null, tempo_resposta_ms } = dados ?? {};
  if (!tentativa_id || !questao_id) {
    throw new HttpError(400, 'tentativa_id e questao_id são obrigatórios');
  }

  const tentativa = await buscarTentativa(userId, tentativa_id);
  if (tentativa.finalizada_em) throw new HttpError(409, 'Esta tentativa já foi finalizada');

  const { data: questao, error: erroQuestao } = await db
    .from('questoes')
    .select('id, fase_id, tempo_limite_seg, alternativas ( id, letra, correta, explicacao )')
    .eq('id', questao_id)
    .maybeSingle();
  if (erroQuestao) throw erroQuestao;
  if (!questao) throw new HttpError(400, 'Questão não encontrada');

  // A questão precisa pertencer à origem da tentativa (fase ou quiz custom)
  let tempoLimiteSeg = questao.tempo_limite_seg;
  if (tentativa.quiz_custom_id) {
    await exigirQuestaoNoQuiz(tentativa.quiz_custom_id, questao_id);
    const quiz = await buscarQuizCustom(tentativa.quiz_custom_id);
    tempoLimiteSeg = quiz.tempo_limite_seg ?? questao.tempo_limite_seg;
  } else if (questao.fase_id !== tentativa.fase_id) {
    throw new HttpError(400, 'Questão não pertence a esta tentativa');
  }

  // Poder "tempo_extra" usado nesta questão (registrado pelo servidor em
  // /quiz/poder) soma ao limite antes de decidir se estourou o tempo.
  const { data: poderTempo } = await db
    .from('poderes_usados')
    .select('segundos_extra')
    .eq('tentativa_id', tentativa_id)
    .eq('questao_id', questao_id)
    .eq('poder', 'tempo_extra')
    .maybeSingle();
  if (poderTempo?.segundos_extra) tempoLimiteSeg += poderTempo.segundos_extra;

  // Timer no servidor: o tempo conta desde a resposta anterior
  // (ou desde o início da tentativa, na primeira questão)
  const { data: ultimaResposta } = await db
    .from('respostas')
    .select('respondida_em')
    .eq('tentativa_id', tentativa_id)
    .order('respondida_em', { ascending: false })
    .limit(1)
    .maybeSingle();

  const referencia = new Date(ultimaResposta?.respondida_em ?? tentativa.iniciada_em).getTime();
  const decorridoMs = Date.now() - referencia;
  const tempoEsgotado = decorridoMs > tempoLimiteSeg * 1000 + TOLERANCIA_REDE_MS;

  const escolhida = alternativa_id
    ? questao.alternativas.find((a) => a.id === alternativa_id)
    : null;
  if (alternativa_id && !escolhida) {
    throw new HttpError(400, 'Alternativa não pertence a esta questão');
  }

  const correta = !tempoEsgotado && Boolean(escolhida?.correta);

  // Dica usada? (registrada pelo servidor em /quiz/dica)
  const { data: dicaUsada } = await db
    .from('dicas_usadas')
    .select('questao_id')
    .eq('tentativa_id', tentativa_id)
    .eq('questao_id', questao_id)
    .maybeSingle();

  const { error: erroInsert } = await db.from('respostas').insert({
    tentativa_id,
    questao_id,
    alternativa_id: tempoEsgotado ? null : alternativa_id,
    correta,
    usou_dica: Boolean(dicaUsada),
    tempo_resposta_ms: Math.min(tempo_resposta_ms ?? decorridoMs, decorridoMs),
  });
  if (erroInsert?.code === '23505') {
    throw new HttpError(409, 'Esta questão já foi respondida nesta tentativa');
  }
  if (erroInsert) throw erroInsert;

  const alternativaCorreta = questao.alternativas.find((a) => a.correta);

  // Feedback explicativo — só é revelado DEPOIS que a resposta foi gravada
  return {
    correta,
    tempo_esgotado: tempoEsgotado,
    usou_dica: Boolean(dicaUsada),
    alternativa_correta: alternativaCorreta
      ? { id: alternativaCorreta.id, letra: alternativaCorreta.letra }
      : null,
    explicacoes: questao.alternativas
      .sort((a, b) => a.letra.localeCompare(b.letra))
      .map(({ id, letra, explicacao }) => ({ id, letra, explicacao })),
  };
}

// ---------------------------------------------------------------
// POST /quiz/responder-sequencia — corrige questões do minigame
// "reordenar algoritmo" (formato = 'reordenar_algoritmo'). Grava na
// MESMA tabela `respostas` que responderQuestao, então finalizarQuiz
// (XP, aprovação, badges, streak) funciona sem nenhuma alteração.
// ---------------------------------------------------------------
export async function responderSequencia(userId, dados) {
  const { tentativa_id, questao_id, ordem } = dados ?? {};
  if (!tentativa_id || !questao_id || !Array.isArray(ordem)) {
    throw new HttpError(400, 'tentativa_id, questao_id e ordem (array) são obrigatórios');
  }

  const tentativa = await buscarTentativa(userId, tentativa_id);
  if (tentativa.finalizada_em) throw new HttpError(409, 'Esta tentativa já foi finalizada');

  const { data: questao, error: erroQuestao } = await db
    .from('questoes')
    .select('id, fase_id, tempo_limite_seg, ordem_correta')
    .eq('id', questao_id)
    .maybeSingle();
  if (erroQuestao) throw erroQuestao;
  if (!questao) throw new HttpError(400, 'Questão não encontrada');

  let tempoLimiteSeg = questao.tempo_limite_seg;
  if (tentativa.quiz_custom_id) {
    await exigirQuestaoNoQuiz(tentativa.quiz_custom_id, questao_id);
    const quiz = await buscarQuizCustom(tentativa.quiz_custom_id);
    tempoLimiteSeg = quiz.tempo_limite_seg ?? questao.tempo_limite_seg;
  } else if (questao.fase_id !== tentativa.fase_id) {
    throw new HttpError(400, 'Questão não pertence a esta tentativa');
  }

  const { data: ultimaResposta } = await db
    .from('respostas')
    .select('respondida_em')
    .eq('tentativa_id', tentativa_id)
    .order('respondida_em', { ascending: false })
    .limit(1)
    .maybeSingle();

  const referencia = new Date(ultimaResposta?.respondida_em ?? tentativa.iniciada_em).getTime();
  const decorridoMs = Date.now() - referencia;
  const tempoEsgotado = decorridoMs > tempoLimiteSeg * 1000 + TOLERANCIA_REDE_MS;

  const ordemCorreta = questao.ordem_correta ?? [];
  const acertouOrdem =
    ordem.length === ordemCorreta.length && ordem.every((id, i) => id === ordemCorreta[i]);
  const correta = !tempoEsgotado && acertouOrdem;

  const { error: erroInsert } = await db.from('respostas').insert({
    tentativa_id,
    questao_id,
    alternativa_id: null, // este formato não usa alternativas
    correta,
    tempo_resposta_ms: decorridoMs,
  });
  if (erroInsert?.code === '23505') {
    throw new HttpError(409, 'Esta questão já foi respondida nesta tentativa');
  }
  if (erroInsert) throw erroInsert;

  return { correta, tempo_esgotado: tempoEsgotado, ordem_correta: ordemCorreta };
}

// ---------------------------------------------------------------
// POST /quiz/finalizar — consolida a tentativa: XP (com regra
// anti-farming e penalidade de dica), progresso, nível e badges.
// ---------------------------------------------------------------
export async function finalizarQuiz(usuario, tentativaId) {
  if (!tentativaId) throw new HttpError(400, 'tentativa_id é obrigatório');

  const tentativa = await buscarTentativa(usuario.id, tentativaId);
  if (tentativa.finalizada_em) throw new HttpError(409, 'Esta tentativa já foi finalizada');

  const ehCustom = Boolean(tentativa.quiz_custom_id);

  const { data: respostas, error: erroRespostas } = await db
    .from('respostas')
    .select('correta, usou_dica, tempo_resposta_ms, questoes ( xp_valor )')
    .eq('tentativa_id', tentativaId);
  if (erroRespostas) throw erroRespostas;

  const acertos = respostas.filter((r) => r.correta).length;
  const xpSemEvento = respostas
    .filter((r) => r.correta)
    .reduce((soma, r) => soma + xpDaResposta(r), 0);

  // Evento temporário (ex.: "semana das árvores"): multiplica o XP bruto
  // desta tentativa. Só se aplica ao modo campanha — quiz custom não tem
  // fase associada para casar com o evento.
  const evento = ehCustom ? null : await eventoAtivoParaFase(tentativa.fase_id);
  const multiplicadorEvento = evento?.multiplicador_xp ?? 1;
  const xpBruto = Math.round(xpSemEvento * multiplicadorEvento);

  const aprovada = acertos >= Math.ceil(tentativa.total_questoes * PCT_APROVACAO);

  // Anti-farming: repetir só rende o XP que EXCEDER o melhor desempenho
  // anterior na mesma origem (fase ou quiz custom).
  const melhorAnterior = await melhorXpBrutoAnterior(usuario.id, tentativa, tentativaId);
  const xpGanho = Math.max(0, xpBruto - melhorAnterior);

  const { error: erroTentativa } = await db
    .from('tentativas')
    .update({
      finalizada_em: new Date().toISOString(),
      acertos,
      xp_ganho: xpGanho,
      aprovada,
    })
    .eq('id', tentativaId);
  if (erroTentativa) throw erroTentativa;

  // Progresso/desbloqueio de fase só existe no modo campanha
  let progresso = { concluida: false };
  let fase = null;
  if (!ehCustom) {
    progresso = await atualizarProgressoFase(usuario.id, tentativa.fase_id, acertos, aprovada);
    const { data } = await db
      .from('fases')
      .select('ordem, nome')
      .eq('id', tentativa.fase_id)
      .single();
    fase = data;
  }

  const xpTotal = usuario.xp_total + xpGanho;
  const nivel = nivelPorXp(xpTotal);

  // Streak diário: qualquer quiz finalizado (campanha ou custom) conta como
  // atividade do dia. Calculado no servidor a partir do streak salvo.
  const hoje = dataDeHoje();
  const streakDias = proximoStreak({
    streakAtual: usuario.streak_dias,
    ultimoDia: usuario.streak_ultimo_dia,
    hoje,
  });

  const { error: erroPerfil } = await db
    .from('profiles')
    .update({ xp_total: xpTotal, nivel, streak_dias: streakDias, streak_ultimo_dia: hoje })
    .eq('id', usuario.id);
  if (erroPerfil) throw erroPerfil;

  // Tempo médio só vale se o quiz foi respondido por completo
  const temposValidos = respostas
    .map((r) => r.tempo_resposta_ms)
    .filter((t) => t != null);
  const tempoMedioMs =
    respostas.length === tentativa.total_questoes && temposValidos.length === respostas.length
      ? temposValidos.reduce((soma, t) => soma + t, 0) / temposValidos.length
      : null;

  const badgesNovas = await verificarBadges(usuario.id, {
    xpTotal,
    aprovada,
    faseOrdem: fase?.ordem ?? null,
    quizPerfeito: tentativa.total_questoes > 0 && acertos === tentativa.total_questoes,
    tempoMedioMs,
    streakAtual: streakDias,
  });

  let titulo = fase?.nome;
  if (ehCustom) {
    const quiz = await buscarQuizCustom(tentativa.quiz_custom_id);
    titulo = quiz.titulo;
  }

  return {
    fase: titulo,
    acertos,
    total_questoes: tentativa.total_questoes,
    aprovada,
    xp_bruto: xpBruto,
    xp_ganho: xpGanho,
    xp_total: xpTotal,
    nivel,
    subiu_nivel: nivel > usuario.nivel,
    fase_concluida: progresso.concluida,
    badges_novas: badgesNovas,
    streak_dias: streakDias,
    evento: evento && { nome: evento.nome, multiplicador_xp: evento.multiplicador_xp },
  };
}

// ---------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------

// Dica usada corta o XP da questão pela metade (mínimo 1)
function xpDaResposta(r) {
  const xp = r.questoes?.xp_valor ?? 0;
  return r.usou_dica ? Math.max(1, Math.floor(xp / 2)) : xp;
}

async function abandonarTentativasAbertas(userId) {
  await db
    .from('tentativas')
    .update({ finalizada_em: new Date().toISOString() })
    .eq('user_id', userId)
    .is('finalizada_em', null);
}

export async function buscarTentativa(userId, tentativaId) {
  const { data, error } = await db
    .from('tentativas')
    .select('*')
    .eq('id', tentativaId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'Tentativa não encontrada');
  return data;
}

async function buscarQuizCustom(quizId) {
  const { data, error } = await db
    .from('quizzes_custom')
    .select('*')
    .eq('id', quizId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'Quiz não encontrado');
  return data;
}

export async function exigirQuestaoNoQuiz(quizId, questaoId) {
  const { data, error } = await db
    .from('quiz_custom_questoes')
    .select('questao_id')
    .eq('quiz_id', quizId)
    .eq('questao_id', questaoId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(400, 'Questão não pertence a este quiz');
}

async function melhorXpBrutoAnterior(userId, tentativa, tentativaAtualId) {
  let query = db
    .from('respostas')
    .select(
      'tentativa_id, usou_dica, questoes ( xp_valor ), tentativas!inner ( user_id, fase_id, quiz_custom_id )'
    )
    .eq('correta', true)
    .eq('tentativas.user_id', userId)
    .neq('tentativa_id', tentativaAtualId);

  query = tentativa.quiz_custom_id
    ? query.eq('tentativas.quiz_custom_id', tentativa.quiz_custom_id)
    : query.eq('tentativas.fase_id', tentativa.fase_id);

  const { data, error } = await query;
  if (error) throw error;

  const xpPorTentativa = new Map();
  for (const r of data) {
    const atual = xpPorTentativa.get(r.tentativa_id) ?? 0;
    xpPorTentativa.set(r.tentativa_id, atual + xpDaResposta(r));
  }
  return xpPorTentativa.size ? Math.max(...xpPorTentativa.values()) : 0;
}

async function atualizarProgressoFase(userId, faseId, acertos, aprovada) {
  const { data: existente, error: erroBusca } = await db
    .from('progresso_fase')
    .select('*')
    .eq('user_id', userId)
    .eq('fase_id', faseId)
    .maybeSingle();
  if (erroBusca) throw erroBusca;

  const registro = {
    user_id: userId,
    fase_id: faseId,
    num_tentativas: (existente?.num_tentativas ?? 0) + 1,
    melhor_pontuacao: Math.max(existente?.melhor_pontuacao ?? 0, acertos),
    concluida: (existente?.concluida ?? false) || aprovada,
    concluida_em:
      existente?.concluida_em ?? (aprovada ? new Date().toISOString() : null),
  };

  const { data, error } = await db
    .from('progresso_fase')
    .upsert(registro, { onConflict: 'user_id,fase_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}
