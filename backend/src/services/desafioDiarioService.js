import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { dataDeHoje } from '../utils/streak.js';
import { criarPrng, embaralharComSeed } from '../utils/seed.js';

// Desafio diário (roadmap v2, 4.8): mesmas questões para todo mundo no
// mesmo dia — sorteio determinístico semeado pela DATA sobre o banco de
// questões ativas (formatos de alternativa; reordenar_algoritmo fica de
// fora por ter fluxo de resposta próprio). 1 tentativa por jogador/dia,
// garantida por índice único no banco. Sem dicas nem poderes.

export const QUESTOES_DESAFIO = 5;

// Ids das questões do dia — derivado, nunca armazenado: qualquer processo
// chega ao mesmo resultado (ordena por id para normalizar antes do
// embaralhamento semeado).
export async function idsDoDesafio(dia) {
  const { data: questoes, error } = await db
    .from('questoes')
    .select('id')
    .eq('ativa', true)
    .in('formato', ['padrao', 'batalha_complexidade']);
  if (error) throw error;

  const ids = (questoes ?? []).map((q) => q.id).sort();
  const prng = criarPrng(`desafio:${dia}`);
  return embaralharComSeed(ids, prng).slice(0, QUESTOES_DESAFIO);
}

export async function iniciarDesafioDiario(userId) {
  const dia = dataDeHoje();

  const { data: existente, error: erroExistente } = await db
    .from('tentativas')
    .select('id, finalizada_em')
    .eq('user_id', userId)
    .eq('desafio_dia', dia)
    .maybeSingle();
  if (erroExistente) throw erroExistente;
  if (existente) {
    // Aberta ou finalizada, dá no mesmo: o dia já foi consumido (abrir e
    // abandonar também conta — senão daria para espiar e voltar depois).
    throw new HttpError(409, 'Você já jogou o desafio de hoje — volte amanhã!');
  }

  const ids = await idsDoDesafio(dia);
  if (!ids.length) throw new HttpError(404, 'Sem questões disponíveis para o desafio de hoje');

  const { data: questoes, error: erroQuestoes } = await db
    .from('questoes')
    .select(
      'id, enunciado, codigo_snippet, linguagem, dificuldade, tempo_limite_seg, xp_valor, formato, alternativas ( id, letra, texto )'
    )
    .in('id', ids);
  if (erroQuestoes) throw erroQuestoes;

  // Preserva a ordem sorteada do dia (a query .in() não garante ordem)
  const porId = new Map(questoes.map((q) => [q.id, q]));
  const ordenadas = ids
    .map((id) => porId.get(id))
    .filter(Boolean)
    .map((q) => ({
      ...q,
      tem_dica: false,
      alternativas: [...q.alternativas].sort((a, b) => a.letra.localeCompare(b.letra)),
      passos: null,
    }));

  const { data: tentativa, error: erroTentativa } = await db
    .from('tentativas')
    .insert({ user_id: userId, desafio_dia: dia, total_questoes: ordenadas.length })
    .select()
    .single();
  if (erroTentativa?.code === '23505') {
    throw new HttpError(409, 'Você já jogou o desafio de hoje — volte amanhã!');
  }
  if (erroTentativa) throw erroTentativa;

  return {
    tentativa_id: tentativa.id,
    desafio_diario: true,
    dia,
    fase: { id: null, nome: 'Desafio Diário' },
    questoes: ordenadas,
  };
}

// Status do dia para o card no mapa: se o jogador já jogou e o top do dia.
export async function statusDoDia(userId) {
  const dia = dataDeHoje();

  const { data: tentativas, error } = await db
    .from('tentativas')
    .select('user_id, acertos, total_questoes, finalizada_em, profiles ( nome )')
    .eq('desafio_dia', dia)
    .not('finalizada_em', 'is', null)
    .order('acertos', { ascending: false })
    .order('finalizada_em', { ascending: true })
    .limit(10);
  if (error) throw error;

  const ranking = (tentativas ?? []).map((t, i) => ({
    posicao: i + 1,
    nome: t.profiles?.nome ?? '—',
    acertos: t.acertos,
    total_questoes: t.total_questoes,
    voce: t.user_id === userId,
  }));

  const { data: minha, error: erroMinha } = await db
    .from('tentativas')
    .select('id, acertos, total_questoes, finalizada_em')
    .eq('user_id', userId)
    .eq('desafio_dia', dia)
    .maybeSingle();
  if (erroMinha) throw erroMinha;

  return {
    dia,
    ja_jogou: Boolean(minha),
    minha_pontuacao: minha?.finalizada_em
      ? { acertos: minha.acertos, total_questoes: minha.total_questoes }
      : null,
    ranking,
  };
}
