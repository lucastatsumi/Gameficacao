import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { embaralhar } from '../utils/random.js';
import { buscarTentativa, exigirQuestaoNoQuiz } from './quizService.js';

const SEGUNDOS_EXTRA = 15;
export const PODERES_VALIDOS = ['eliminar_alternativa', 'tempo_extra'];

// Estoque de poderes do usuário, sempre com as duas chaves presentes
// (0 para quem nunca ganhou nenhum).
export async function estoqueDoUsuario(userId) {
  const { data, error } = await db
    .from('usuario_poderes')
    .select('poder, quantidade')
    .eq('user_id', userId);
  if (error) throw error;

  const estoque = Object.fromEntries(PODERES_VALIDOS.map((p) => [p, 0]));
  for (const linha of data) estoque[linha.poder] = linha.quantidade;
  return estoque;
}

// Soma `quantidade` ao estoque do poder (lê o valor atual e faz upsert —
// não há incremento atômico simples via supabase-js sem uma function SQL).
export async function concederPoder(userId, poder, quantidade = 1) {
  const { data: existente, error: erroBusca } = await db
    .from('usuario_poderes')
    .select('quantidade')
    .eq('user_id', userId)
    .eq('poder', poder)
    .maybeSingle();
  if (erroBusca) throw erroBusca;

  const { error } = await db
    .from('usuario_poderes')
    .upsert(
      { user_id: userId, poder, quantidade: (existente?.quantidade ?? 0) + quantidade },
      { onConflict: 'user_id,poder' }
    );
  if (error) throw error;
}

// ---------------------------------------------------------------
// POST /quiz/poder — gasta 1 unidade do poder e aplica o efeito NO
// SERVIDOR. O cliente só recebe o resultado (alternativa a esconder ou
// segundos extra), nunca decide o efeito sozinho.
// ---------------------------------------------------------------
export async function usarPoder(userId, dados) {
  const { tentativa_id, questao_id, poder } = dados ?? {};
  if (!tentativa_id || !questao_id) {
    throw new HttpError(400, 'tentativa_id e questao_id são obrigatórios');
  }
  if (!PODERES_VALIDOS.includes(poder)) {
    throw new HttpError(400, `poder deve ser um de: ${PODERES_VALIDOS.join(', ')}`);
  }

  const tentativa = await buscarTentativa(userId, tentativa_id);
  if (tentativa.finalizada_em) throw new HttpError(409, 'Esta tentativa já foi finalizada');

  const { data: questao, error: erroQuestao } = await db
    .from('questoes')
    .select('id, fase_id, alternativas ( id, correta )')
    .eq('id', questao_id)
    .maybeSingle();
  if (erroQuestao) throw erroQuestao;
  if (!questao) throw new HttpError(400, 'Questão não encontrada');

  if (tentativa.quiz_custom_id) {
    await exigirQuestaoNoQuiz(tentativa.quiz_custom_id, questao_id);
  } else if (questao.fase_id !== tentativa.fase_id) {
    throw new HttpError(400, 'Questão não pertence a esta tentativa');
  }

  const { data: existente, error: erroEstoque } = await db
    .from('usuario_poderes')
    .select('quantidade')
    .eq('user_id', userId)
    .eq('poder', poder)
    .maybeSingle();
  if (erroEstoque) throw erroEstoque;
  if (!existente?.quantidade) {
    throw new HttpError(400, 'Você não tem esse poder disponível');
  }

  const segundosExtra = poder === 'tempo_extra' ? SEGUNDOS_EXTRA : null;

  const { error: erroUso } = await db
    .from('poderes_usados')
    .insert({ tentativa_id, questao_id, poder, segundos_extra: segundosExtra });
  if (erroUso?.code === '23505') {
    throw new HttpError(409, 'Este poder já foi usado nesta questão');
  }
  if (erroUso) throw erroUso;

  const { error: erroDebito } = await db
    .from('usuario_poderes')
    .update({ quantidade: existente.quantidade - 1 })
    .eq('user_id', userId)
    .eq('poder', poder);
  if (erroDebito) throw erroDebito;

  if (poder === 'tempo_extra') {
    return { poder, segundos_extra: SEGUNDOS_EXTRA };
  }

  // eliminar_alternativa: sorteia UMA alternativa errada para o cliente
  // esconder. Nunca revela qual é a certa.
  const erradas = questao.alternativas.filter((a) => !a.correta);
  const removida = embaralhar(erradas)[0];
  if (!removida) throw new HttpError(409, 'Esta questão não tem alternativa errada para eliminar');

  return { poder, alternativa_removida_id: removida.id };
}
