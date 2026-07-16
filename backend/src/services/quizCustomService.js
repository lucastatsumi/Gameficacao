import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';

const MAX_QUESTOES = 20;

// Quizzes são abertos: qualquer usuário autenticado cria e joga.
// O criador é o único que pode editar/desativar o próprio quiz.

export async function criarQuiz(criadorId, dados) {
  const quiz = await validarPayload(dados);

  const { data: criado, error } = await db
    .from('quizzes_custom')
    .insert({
      criador_id: criadorId,
      titulo: quiz.titulo,
      descricao: quiz.descricao,
      tempo_limite_seg: quiz.tempo_limite_seg,
      sons: quiz.sons,
      permitir_dicas: quiz.permitir_dicas,
      vidas: quiz.vidas,
    })
    .select()
    .single();
  if (error) throw error;

  const { error: erroItens } = await db.from('quiz_custom_questoes').insert(
    quiz.questao_ids.map((questaoId, i) => ({
      quiz_id: criado.id,
      questao_id: questaoId,
      ordem: i,
    }))
  );
  if (erroItens) {
    // Compensação: não deixa quiz órfão sem questões
    await db.from('quizzes_custom').delete().eq('id', criado.id);
    throw erroItens;
  }

  return { ...criado, total_questoes: quiz.questao_ids.length };
}

// Todos os quizzes ativos (de qualquer criador) + os inativos do próprio usuário
export async function listarQuizzes(userId) {
  const { data, error } = await db
    .from('quizzes_custom')
    .select(
      'id, criador_id, titulo, descricao, tempo_limite_seg, sons, permitir_dicas, vidas, ativo, created_at, profiles ( nome ), quiz_custom_questoes ( count )'
    )
    .order('created_at', { ascending: false });
  if (error) throw error;

  return data
    .filter((q) => q.ativo || q.criador_id === userId)
    .map(({ quiz_custom_questoes, profiles, criador_id, ...quiz }) => ({
      ...quiz,
      criador: profiles?.nome ?? 'Desconhecido',
      meu: criador_id === userId,
      total_questoes: quiz_custom_questoes?.[0]?.count ?? 0,
    }));
}

// Banco de questões para o montador de quiz: SEM correta/explicacao/dica —
// qualquer usuário pode ver, então o gabarito não pode vazar aqui.
export async function bancoDeQuestoes() {
  const { data, error } = await db
    .from('questoes')
    .select('id, enunciado, fase_id, dificuldade, xp_valor, dica')
    .eq('ativa', true)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return data.map(({ dica, ...q }) => ({ ...q, tem_dica: Boolean(dica?.trim()) }));
}

export async function atualizarQuiz(userId, quizId, dados) {
  const existente = await exigirQuizDoCriador(userId, quizId);
  const quiz = await validarPayload(dados);

  const { error } = await db
    .from('quizzes_custom')
    .update({
      titulo: quiz.titulo,
      descricao: quiz.descricao,
      tempo_limite_seg: quiz.tempo_limite_seg,
      sons: quiz.sons,
      permitir_dicas: quiz.permitir_dicas,
      vidas: quiz.vidas,
    })
    .eq('id', existente.id);
  if (error) throw error;

  // Recompõe a lista de questões (tentativas antigas não quebram:
  // respostas referenciam questões diretamente)
  const { error: erroLimpa } = await db
    .from('quiz_custom_questoes')
    .delete()
    .eq('quiz_id', existente.id);
  if (erroLimpa) throw erroLimpa;

  const { error: erroItens } = await db.from('quiz_custom_questoes').insert(
    quiz.questao_ids.map((questaoId, i) => ({
      quiz_id: existente.id,
      questao_id: questaoId,
      ordem: i,
    }))
  );
  if (erroItens) throw erroItens;

  return { id: existente.id, ...quiz, total_questoes: quiz.questao_ids.length };
}

export async function alternarAtivo(userId, quizId, ativo) {
  const existente = await exigirQuizDoCriador(userId, quizId);
  const { error } = await db
    .from('quizzes_custom')
    .update({ ativo: Boolean(ativo) })
    .eq('id', existente.id);
  if (error) throw error;
  return { id: existente.id, ativo: Boolean(ativo) };
}

// ---------- Auxiliares ----------

async function validarPayload(dados) {
  const {
    titulo,
    descricao = null,
    tempo_limite_seg = null,
    sons = true,
    permitir_dicas = true,
    vidas = null,
    questao_ids,
  } = dados ?? {};

  if (!titulo?.trim()) throw new HttpError(400, 'O título do quiz é obrigatório');
  if (tempo_limite_seg != null && (!Number.isInteger(tempo_limite_seg) || tempo_limite_seg < 10)) {
    throw new HttpError(400, 'tempo_limite_seg deve ser null (tempo de cada questão) ou inteiro >= 10');
  }
  if (vidas != null && (!Number.isInteger(vidas) || vidas < 1)) {
    throw new HttpError(400, 'vidas deve ser null (sem limite) ou um inteiro >= 1');
  }
  if (!Array.isArray(questao_ids) || questao_ids.length < 1 || questao_ids.length > MAX_QUESTOES) {
    throw new HttpError(400, `Selecione de 1 a ${MAX_QUESTOES} questões`);
  }
  if (new Set(questao_ids).size !== questao_ids.length) {
    throw new HttpError(400, 'Há questões repetidas na lista');
  }

  const { data: existentes, error } = await db
    .from('questoes')
    .select('id')
    .in('id', questao_ids)
    .eq('ativa', true);
  if (error) throw error;
  if (existentes.length !== questao_ids.length) {
    throw new HttpError(400, 'Alguma questão selecionada não existe ou está desativada');
  }

  return {
    titulo: titulo.trim(),
    descricao: descricao?.trim() || null,
    tempo_limite_seg,
    sons: sons !== false,
    permitir_dicas: permitir_dicas !== false,
    vidas,
    questao_ids,
  };
}

async function exigirQuizDoCriador(userId, quizId) {
  const { data, error } = await db
    .from('quizzes_custom')
    .select('id')
    .eq('id', quizId)
    .eq('criador_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'Quiz não encontrado entre os seus quizzes');
  return data;
}
