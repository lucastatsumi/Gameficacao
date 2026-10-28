import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { buscarTentativa, exigirQuestaoNoQuiz } from './quizService.js';
import {
  LIMITE_RESPOSTA_ABERTA,
  NOTA_APROVACAO_ABERTA,
  corrigirRespostaAberta,
  iaConfigurada,
} from './iaService.js';

// Questão aberta corrigida por IA com rubrica (Horizonte 3). Segue o
// padrão de responderSequencia: endpoint próprio que grava na MESMA
// tabela `respostas`, então finalizarQuiz (XP, score, aprovação, badges)
// não muda. A avaliação é persistida uma única vez (PK resposta_id) e
// nunca recalculada; o gestor pode sobrescrever a nota.

const TOLERANCIA_REDE_MS = 5000;

export async function responderAberta(usuario, dados) {
  const { tentativa_id, questao_id, texto } = dados ?? {};
  if (!tentativa_id || !questao_id || typeof texto !== 'string') {
    throw new HttpError(400, 'tentativa_id, questao_id e texto são obrigatórios');
  }
  const resposta = texto.trim();
  if (resposta.length > LIMITE_RESPOSTA_ABERTA) {
    throw new HttpError(400, `A resposta pode ter até ${LIMITE_RESPOSTA_ABERTA} caracteres`);
  }

  const tentativa = await buscarTentativa(usuario.id, tentativa_id);
  if (tentativa.finalizada_em) throw new HttpError(409, 'Esta tentativa já foi finalizada');

  const { data: questao, error: erroQuestao } = await db
    .from('questoes')
    .select('id, fase_id, enunciado, tempo_limite_seg, formato, rubrica')
    .eq('id', questao_id)
    .maybeSingle();
  if (erroQuestao) throw erroQuestao;
  if (!questao || questao.formato !== 'resposta_aberta') {
    throw new HttpError(400, 'Questão aberta não encontrada');
  }

  let tempoLimiteSeg = questao.tempo_limite_seg;
  if (tentativa.quiz_custom_id) {
    await exigirQuestaoNoQuiz(tentativa.quiz_custom_id, questao_id);
    const { data: quiz } = await db
      .from('quizzes_custom')
      .select('tempo_limite_seg')
      .eq('id', tentativa.quiz_custom_id)
      .maybeSingle();
    tempoLimiteSeg = quiz?.tempo_limite_seg ?? questao.tempo_limite_seg;
  } else if (questao.fase_id !== tentativa.fase_id) {
    throw new HttpError(400, 'Questão não pertence a esta tentativa');
  }
  tempoLimiteSeg = Math.max(10, Math.ceil(tempoLimiteSeg * Number(tentativa.fator_tempo ?? 1)));

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

  // Correção ANTES de gravar: se a IA estiver fora do ar ou recusar, a
  // resposta fica registrada como pendente para o gestor corrigir à mão
  // (o colaborador não perde a questão nem trava o quiz).
  let avaliacao = null;
  if (!tempoEsgotado && resposta && iaConfigurada()) {
    try {
      avaliacao = await corrigirRespostaAberta(usuario, questao, resposta);
    } catch (err) {
      if (!(err instanceof HttpError)) throw err;
      avaliacao = null;
    }
  }

  const nota = tempoEsgotado || !resposta ? 0 : (avaliacao?.nota ?? null);
  const correta = nota != null && nota >= NOTA_APROVACAO_ABERTA;

  const { data: gravada, error: erroInsert } = await db
    .from('respostas')
    .insert({
      tentativa_id,
      questao_id,
      alternativa_id: null,
      correta,
      texto_resposta: resposta,
      tempo_resposta_ms: decorridoMs,
    })
    .select('id')
    .single();
  if (erroInsert?.code === '23505') {
    throw new HttpError(409, 'Esta questão já foi respondida nesta tentativa');
  }
  if (erroInsert) throw erroInsert;

  const registro = {
    resposta_id: gravada.id,
    status: nota == null ? 'pendente' : 'avaliada',
    nota_ia: avaliacao?.nota ?? (nota === 0 ? 0 : null),
    feedback: avaliacao?.feedback ?? [],
    justificativa: tempoEsgotado
      ? 'Tempo esgotado.'
      : !resposta
        ? 'Resposta em branco.'
        : (avaliacao?.justificativa ?? null),
    modelo: avaliacao?.modelo ?? null,
  };
  const { error: erroAvaliacao } = await db.from('avaliacoes_abertas').insert(registro);
  if (erroAvaliacao) throw erroAvaliacao;

  return {
    correta,
    tempo_esgotado: tempoEsgotado,
    nota,
    pendente: nota == null,
    feedback: registro.feedback,
    justificativa: registro.justificativa,
  };
}

// ---------- Gestor ----------

const SELECT_AVALIACAO =
  '*, respostas!inner ( id, texto_resposta, correta, respondida_em, questoes ( enunciado, rubrica ), tentativas!inner ( user_id, profiles!inner ( nome, empresa_id ) ) )';

function doTenantAvaliacao(query, empresaId) {
  const coluna = 'respostas.tentativas.profiles.empresa_id';
  return empresaId ? query.eq(coluna, empresaId) : query.is(coluna, null);
}

export async function listarAvaliacoes(usuario, { status = null } = {}) {
  let query = doTenantAvaliacao(db.from('avaliacoes_abertas').select(SELECT_AVALIACAO), usuario.empresa_id)
    .order('created_at', { ascending: false })
    .limit(100);
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;

  return data.map(({ respostas: r, ...a }) => ({
    ...a,
    nota_final: a.nota_gestor ?? a.nota_ia,
    colaborador: r.tentativas?.profiles?.nome ?? '—',
    enunciado: r.questoes?.enunciado ?? '',
    rubrica: r.questoes?.rubrica ?? null,
    texto_resposta: r.texto_resposta,
    respondida_em: r.respondida_em,
  }));
}

// Sobrescreve a nota (a da IA fica registrada ao lado, nunca apagada) e
// ajusta `respostas.correta` — matriz de competências e proficiência
// passam a usar a nota do gestor. XP/score da tentativa já finalizada
// não são recalculados (gamificação ≠ avaliação).
export async function revisarAvaliacao(usuario, respostaId, dados) {
  const nota = Number(dados?.nota);
  if (!Number.isInteger(nota) || nota < 0 || nota > 100) {
    throw new HttpError(400, 'nota deve ser um inteiro de 0 a 100');
  }

  const { data: existente, error } = await doTenantAvaliacao(
    db.from('avaliacoes_abertas').select('resposta_id, respostas!inner ( tentativas!inner ( profiles!inner ( empresa_id ) ) )'),
    usuario.empresa_id
  )
    .eq('resposta_id', respostaId)
    .maybeSingle();
  if (error) throw error;
  if (!existente) throw new HttpError(404, 'Avaliação não encontrada');

  const { error: erroUpdate } = await db
    .from('avaliacoes_abertas')
    .update({
      nota_gestor: nota,
      comentario_gestor: dados?.comentario?.trim() || null,
      revisada_por: usuario.id,
      revisada_em: new Date().toISOString(),
      status: 'avaliada',
    })
    .eq('resposta_id', respostaId);
  if (erroUpdate) throw erroUpdate;

  const { error: erroResposta } = await db
    .from('respostas')
    .update({ correta: nota >= NOTA_APROVACAO_ABERTA })
    .eq('id', respostaId);
  if (erroResposta) throw erroResposta;

  return { resposta_id: respostaId, nota_gestor: nota };
}
