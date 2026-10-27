import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { criarQuestao, validarPayload } from './questaoService.js';

// Geração assistida de questões (roadmap H2). Regras inegociáveis:
//  - a chave de API fica só no backend (ANTHROPIC_API_KEY);
//  - o payload gerado passa pelo MESMO validarPayload das questões humanas;
//  - nada vai para `questoes` sem aprovação humana: gera RASCUNHO, e só
//    `aprovarRascunho` chama criarQuestao.

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODELO_PADRAO = 'claude-sonnet-5-5';
const MAX_QUESTOES = 10;

function montarPrompt({ tema, nivel, quantidade }) {
  return `Crie ${quantidade} questões de múltipla escolha sobre "${tema}", nível ${nivel}.
Responda APENAS com um array JSON (sem texto fora do JSON). Cada item:
{"enunciado": string, "dificuldade": "facil"|"media"|"dificil", "alternativas": [
  {"letra":"A","texto":string,"correta":boolean,"explicacao":string}, ... letras A,B,C,D ]}
Regras: exatamente 1 alternativa correta por questão; distratores plausíveis;
"explicacao" de CADA alternativa diz por que está certa ou errada; cenário
realista de ambiente corporativo; em português do Brasil.`;
}

// Extrai o array JSON mesmo se o modelo cercar com ```json.
export function extrairJson(texto) {
  const limpo = texto.replace(/```(?:json)?/g, '').trim();
  const ini = limpo.indexOf('[');
  const fim = limpo.lastIndexOf(']');
  if (ini === -1 || fim === -1) throw new HttpError(502, 'A IA não devolveu um JSON válido');
  try {
    return JSON.parse(limpo.slice(ini, fim + 1));
  } catch {
    throw new HttpError(502, 'A IA não devolveu um JSON válido');
  }
}

export async function chamarClaude(prompt) {
  const chave = process.env.ANTHROPIC_API_KEY;
  if (!chave) throw new HttpError(503, 'Geração por IA não configurada (ANTHROPIC_API_KEY ausente)');

  const resposta = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': chave,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? MODELO_PADRAO,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!resposta.ok) throw new HttpError(502, `Falha ao chamar a IA (${resposta.status})`);
  const json = await resposta.json();
  const texto = json.content?.find((c) => c.type === 'text')?.text ?? '';
  return { texto, uso: json.usage ?? {} };
}

export async function gerarRascunhos(professorId, { fase_id, tema, nivel = 'media', quantidade = 3 }) {
  if (!fase_id) throw new HttpError(400, 'fase_id é obrigatório');
  if (!tema?.trim()) throw new HttpError(400, 'Informe o tema');
  const qtd = Number(quantidade);
  if (!Number.isInteger(qtd) || qtd < 1 || qtd > MAX_QUESTOES) {
    throw new HttpError(400, `quantidade deve ser entre 1 e ${MAX_QUESTOES}`);
  }

  const { texto, uso } = await chamarClaude(montarPrompt({ tema: tema.trim(), nivel, quantidade: qtd }));

  const validas = [];
  let descartadas = 0;
  for (const bruto of extrairJson(texto)) {
    try {
      validas.push(validarPayload({ ...bruto, fase_id, formato: 'padrao' }));
    } catch {
      descartadas += 1; // payload fora do contrato: nunca chega nem a rascunho
    }
  }

  let rascunhos = [];
  if (validas.length) {
    const { data, error } = await db
      .from('rascunhos_questoes')
      .insert(
        validas.map((payload) => ({
          fase_id,
          payload,
          criado_por: professorId,
          tokens_entrada: uso.input_tokens ?? null,
          tokens_saida: uso.output_tokens ?? null,
        }))
      )
      .select();
    if (error) throw error;
    rascunhos = data;
  }
  return {
    rascunhos,
    descartadas,
    tokens_entrada: uso.input_tokens ?? 0,
    tokens_saida: uso.output_tokens ?? 0,
  };
}

export async function listarRascunhos(faseId) {
  let query = db
    .from('rascunhos_questoes')
    .select('*')
    .eq('status', 'pendente_revisao')
    .order('created_at', { ascending: false });
  if (faseId) query = query.eq('fase_id', faseId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function buscarPendente(id) {
  const { data, error } = await db
    .from('rascunhos_questoes')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'Rascunho não encontrado');
  if (data.status !== 'pendente_revisao') throw new HttpError(409, 'Rascunho já revisado');
  return data;
}

// `edicoes` permite ao gestor ajustar o texto antes de aprovar; o resultado
// é revalidado por criarQuestao.
export async function aprovarRascunho(professorId, id, edicoes = {}) {
  const rascunho = await buscarPendente(id);
  const questao = await criarQuestao(professorId, { ...rascunho.payload, ...edicoes });
  const { error } = await db
    .from('rascunhos_questoes')
    .update({ status: 'aprovado' })
    .eq('id', id);
  if (error) throw error;
  return questao;
}

export async function descartarRascunho(id) {
  await buscarPendente(id);
  const { error } = await db
    .from('rascunhos_questoes')
    .update({ status: 'descartado' })
    .eq('id', id);
  if (error) throw error;
}
