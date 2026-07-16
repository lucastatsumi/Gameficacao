import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';

// CRUD de questões do professor. Visão completa: inclui correta/explicacao.

export async function listarQuestoes(faseId) {
  let query = db
    .from('questoes')
    .select('*, alternativas ( id, letra, texto, correta, explicacao )')
    .order('created_at', { ascending: false });
  if (faseId) query = query.eq('fase_id', faseId);

  const { data, error } = await query;
  if (error) throw error;

  return data.map((q) => ({
    ...q,
    alternativas: [...q.alternativas].sort((a, b) => a.letra.localeCompare(b.letra)),
  }));
}

export async function criarQuestao(professorId, dados) {
  const questao = validarPayload(dados);

  const { data: criada, error } = await db
    .from('questoes')
    .insert({
      fase_id: questao.fase_id,
      enunciado: questao.enunciado,
      codigo_snippet: questao.codigo_snippet,
      linguagem: questao.linguagem,
      dificuldade: questao.dificuldade,
      tempo_limite_seg: questao.tempo_limite_seg,
      xp_valor: questao.xp_valor,
      dica: questao.dica,
      formato: questao.formato,
      criada_por: professorId,
    })
    .select()
    .single();
  if (error) throw error;

  const { error: erroAlt } = await db
    .from('alternativas')
    .insert(questao.alternativas.map((a) => ({ ...a, questao_id: criada.id })));
  if (erroAlt) {
    // Compensação: não deixa questão órfã sem alternativas
    await db.from('questoes').delete().eq('id', criada.id);
    throw erroAlt;
  }

  return { ...criada, alternativas: questao.alternativas };
}

export async function atualizarQuestao(questaoId, dados) {
  const { data: existente, error: erroBusca } = await db
    .from('questoes')
    .select('id, formato, alternativas ( id, letra )')
    .eq('id', questaoId)
    .maybeSingle();
  if (erroBusca) throw erroBusca;
  if (!existente) throw new HttpError(404, 'Questão não encontrada');

  // O formato (padrão x batalha_complexidade) não pode mudar na edição:
  // as alternativas já criadas (e possivelmente já respondidas por algum
  // aluno) têm um número fixo de letras que não muda depois. Ignora
  // qualquer "formato" vindo do payload e usa sempre o já salvo.
  const questao = validarPayload({ ...dados, formato: existente.formato });

  const { error } = await db
    .from('questoes')
    .update({
      fase_id: questao.fase_id,
      enunciado: questao.enunciado,
      codigo_snippet: questao.codigo_snippet,
      linguagem: questao.linguagem,
      dificuldade: questao.dificuldade,
      tempo_limite_seg: questao.tempo_limite_seg,
      xp_valor: questao.xp_valor,
      dica: questao.dica,
    })
    .eq('id', questaoId);
  if (error) throw error;

  // Alternativas são ATUALIZADAS pela letra (nunca deletadas): respostas
  // antigas referenciam esses ids e o histórico não pode quebrar.
  // Passo 1: zera todas as corretas para não violar o índice único parcial.
  const { error: erroReset } = await db
    .from('alternativas')
    .update({ correta: false })
    .eq('questao_id', questaoId);
  if (erroReset) throw erroReset;

  for (const alt of questao.alternativas) {
    const alvo = existente.alternativas.find((a) => a.letra === alt.letra);
    if (!alvo) throw new HttpError(400, `Alternativa ${alt.letra} não existe nesta questão`);
    const { error: erroAlt } = await db
      .from('alternativas')
      .update({ texto: alt.texto, explicacao: alt.explicacao, correta: alt.correta })
      .eq('id', alvo.id);
    if (erroAlt) throw erroAlt;
  }

  return { id: questaoId, ...questao };
}

// Soft-delete: a questão sai dos quizzes mas o histórico de respostas permanece
export async function desativarQuestao(questaoId) {
  const { data, error } = await db
    .from('questoes')
    .update({ ativa: false })
    .eq('id', questaoId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'Questão não encontrada');
}

// ---------------------------------------------------------------

const DIFICULDADES = ['facil', 'media', 'dificil'];

// Cada formato de questão exige um conjunto fixo de letras de alternativa.
// 'padrao': múltipla escolha A-D. 'batalha_complexidade': duelo A-B (ver
// database/11_batalha_complexidade.sql e o roadmap de engajamento).
const LETRAS_POR_FORMATO = {
  padrao: ['A', 'B', 'C', 'D'],
  batalha_complexidade: ['A', 'B'],
};

function validarPayload(dados) {
  const {
    fase_id,
    enunciado,
    codigo_snippet = null,
    linguagem = 'javascript',
    dificuldade = 'media',
    tempo_limite_seg = 60,
    xp_valor = 10,
    dica = null,
    formato = 'padrao',
    alternativas,
  } = dados ?? {};

  if (!fase_id) throw new HttpError(400, 'fase_id é obrigatório');
  if (!enunciado?.trim()) throw new HttpError(400, 'O enunciado é obrigatório');
  if (!DIFICULDADES.includes(dificuldade)) {
    throw new HttpError(400, `Dificuldade deve ser: ${DIFICULDADES.join(', ')}`);
  }
  if (!Number.isInteger(tempo_limite_seg) || tempo_limite_seg < 10) {
    throw new HttpError(400, 'tempo_limite_seg deve ser um inteiro >= 10');
  }
  if (!Number.isInteger(xp_valor) || xp_valor < 1) {
    throw new HttpError(400, 'xp_valor deve ser um inteiro >= 1');
  }
  const letrasEsperadas = LETRAS_POR_FORMATO[formato];
  if (!letrasEsperadas) {
    throw new HttpError(400, `formato deve ser um de: ${Object.keys(LETRAS_POR_FORMATO).join(', ')}`);
  }
  if (!Array.isArray(alternativas) || alternativas.length !== letrasEsperadas.length) {
    throw new HttpError(
      400,
      `Questões no formato "${formato}" devem ter exatamente ${letrasEsperadas.length} alternativas`
    );
  }

  const letras = alternativas.map((a) => a.letra).sort();
  if (letras.join('') !== [...letrasEsperadas].sort().join('')) {
    throw new HttpError(400, `As alternativas devem ter as letras ${letrasEsperadas.join(', ')}`);
  }
  if (alternativas.filter((a) => a.correta === true).length !== 1) {
    throw new HttpError(400, 'Exatamente uma alternativa deve ser a correta');
  }
  for (const alt of alternativas) {
    if (!alt.texto?.trim()) throw new HttpError(400, `Alternativa ${alt.letra}: texto obrigatório`);
    if (!alt.explicacao?.trim()) {
      throw new HttpError(400, `Alternativa ${alt.letra}: explicação obrigatória (é o feedback pedagógico)`);
    }
  }

  return {
    fase_id,
    enunciado: enunciado.trim(),
    codigo_snippet,
    linguagem,
    dificuldade,
    tempo_limite_seg,
    xp_valor,
    dica: dica?.trim() || null,
    formato,
    alternativas: alternativas.map((a) => ({
      letra: a.letra,
      texto: a.texto.trim(),
      correta: a.correta === true,
      explicacao: a.explicacao.trim(),
    })),
  };
}
