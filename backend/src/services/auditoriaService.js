import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { chamarClaude, extrairJson } from './iaService.js';

// Auditoria por IA (roadmap H2): a IA revisa as questões ativas de uma fase
// e abre SUGESTÕES. Ela nunca edita questões — a correção é humana.

const TIPOS = ['erro_tecnico', 'distrator_fraco', 'ambiguidade', 'outro'];
const MAX_QUESTOES = 20;

function montarPrompt(questoes) {
  const corpo = questoes
    .map((q) => {
      const alts = q.alternativas
        .map((a) => `${a.letra}) ${a.texto}${a.correta ? ' [CORRETA]' : ''}`)
        .join('\n');
      return `ID: ${q.id}\n${q.enunciado}\n${alts}`;
    })
    .join('\n\n---\n\n');
  return `Audite as questões abaixo procurando erro técnico, distratores fracos ou ambiguidade.
Responda APENAS com um array JSON (vazio se estiver tudo certo). Cada item:
{"questao_id": string (o ID dado), "tipo": "erro_tecnico"|"distrator_fraco"|"ambiguidade"|"outro", "descricao": string}

${corpo}`;
}

// Lógica pura: só aceita achados que apontam para questões realmente
// auditadas e com tipo/descrição válidos — a saída da IA não é confiável.
export function filtrarAchados(achados, idsAuditados) {
  if (!Array.isArray(achados)) return [];
  return achados
    .filter(
      (a) => idsAuditados.has(a?.questao_id) && TIPOS.includes(a.tipo) && a.descricao?.trim()
    )
    .map((a) => ({ questao_id: a.questao_id, tipo: a.tipo, descricao: a.descricao.trim() }));
}

export async function auditarFase(gestorId, faseId) {
  if (!faseId) throw new HttpError(400, 'fase_id é obrigatório');

  const { data: questoes, error } = await db
    .from('questoes')
    .select('id, enunciado, alternativas ( letra, texto, correta )')
    .eq('fase_id', faseId)
    .eq('ativa', true)
    .eq('formato', 'padrao')
    .limit(MAX_QUESTOES);
  if (error) throw error;
  if (!questoes.length) throw new HttpError(404, 'Nenhuma questão ativa para auditar nesta fase');

  const { texto, uso } = await chamarClaude(montarPrompt(questoes));
  const achados = filtrarAchados(extrairJson(texto), new Set(questoes.map((q) => q.id)));

  let sugestoes = [];
  if (achados.length) {
    const { data, error: erroIns } = await db
      .from('auditoria_sugestoes')
      .insert(achados.map((a) => ({ ...a, criado_por: gestorId })))
      .select();
    if (erroIns) throw erroIns;
    sugestoes = data;
  }
  return {
    auditadas: questoes.length,
    sugestoes,
    tokens_entrada: uso.input_tokens ?? 0,
    tokens_saida: uso.output_tokens ?? 0,
  };
}

export async function listarSugestoes() {
  const { data, error } = await db
    .from('auditoria_sugestoes')
    .select('*, questoes ( enunciado )')
    .eq('status', 'aberta')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function resolverSugestao(id, status) {
  if (!['resolvida', 'ignorada'].includes(status)) {
    throw new HttpError(400, 'status deve ser resolvida ou ignorada');
  }
  const { data, error } = await db
    .from('auditoria_sugestoes')
    .update({ status })
    .eq('id', id)
    .eq('status', 'aberta')
    .select('id');
  if (error) throw error;
  if (!data?.length) throw new HttpError(404, 'Sugestão aberta não encontrada');
}
