import { db } from '../config/supabase.js';

// Cartas colecionáveis de conhecimento (roadmap v2, 4.9): colecionismo que
// É revisão de conteúdo. O roadmap original amarra a carta a "competência"
// (tag), mas isso ainda não existe no schema (é Horizonte 1) — ADAPTADO
// para usar `fases` como unidade de maestria: uma carta por fase.
//
// Revelação só entra via verificarCartaFase, chamado como hook por
// quizController.finalizar (mesmo padrão de raidService.aplicarDano) —
// self-sufficient: consulta a própria tentativa por id em vez de receber o
// resultado já calculado, então não precisa mexer em quizService.

export const QUESTOES_MINIMAS = 10;
export const PRECISAO_MINIMA_PCT = 80;

// Hook chamado pelo controller após finalizarQuiz, ao lado de
// raidService.aplicarDano — self-sufficient: reconsulta a tentativa pelo
// id para saber a fase (`fase_id`). Tentativas de quiz custom ou desafio
// diário têm `fase_id` null (constraint `tentativa_origem`, ver
// database/25_desafio_diario.sql) — essas nunca revelam carta, é no-op.
// Se o jogador já tem a carta daquela fase, também é no-op. Caso
// contrário, agrega TODAS as tentativas finalizadas do jogador naquela
// fase (não só a atual) e revela a carta quando o total acumulado bate os
// dois limiares (>= 10 questões respondidas, >= 80% de acerto agregado).
export async function verificarCartaFase(userId, tentativaId) {
  if (!tentativaId) return null;

  const { data: tentativa, error: erroTentativa } = await db
    .from('tentativas')
    .select('fase_id')
    .eq('id', tentativaId)
    .maybeSingle();
  if (erroTentativa) throw erroTentativa;
  if (!tentativa?.fase_id) return null;

  const faseId = tentativa.fase_id;

  const { data: cartaExistente, error: erroCarta } = await db
    .from('cartas_do_jogador')
    .select('user_id')
    .eq('user_id', userId)
    .eq('fase_id', faseId)
    .maybeSingle();
  if (erroCarta) throw erroCarta;
  if (cartaExistente) return null;

  const { data: tentativasDaFase, error: erroAgregado } = await db
    .from('tentativas')
    .select('acertos, total_questoes')
    .eq('user_id', userId)
    .eq('fase_id', faseId)
    .not('finalizada_em', 'is', null);
  if (erroAgregado) throw erroAgregado;

  const totalQuestoes = (tentativasDaFase ?? []).reduce((soma, t) => soma + t.total_questoes, 0);
  const totalAcertos = (tentativasDaFase ?? []).reduce((soma, t) => soma + t.acertos, 0);
  const precisaoPct = totalQuestoes > 0 ? (totalAcertos / totalQuestoes) * 100 : 0;

  if (totalQuestoes < QUESTOES_MINIMAS || precisaoPct < PRECISAO_MINIMA_PCT) return null;

  // A chave primária (user_id, fase_id) É a trava de concorrência: se duas
  // requisições concorrentes chegarem ao limiar ao mesmo tempo, só uma
  // insere — 23505 na outra vira no-op (mesma ideia de raidService,
  // temporadaService, missaoService).
  const { error: erroInsert } = await db
    .from('cartas_do_jogador')
    .insert({ user_id: userId, fase_id: faseId });
  if (erroInsert) {
    if (erroInsert.code === '23505') return null;
    throw erroInsert;
  }

  const { data: fase, error: erroFase } = await db.from('fases').select('nome').eq('id', faseId).single();
  if (erroFase) throw erroFase;

  return { fase_id: faseId, fase_nome: fase.nome };
}

// Álbum de cartas do jogador: uma entrada por fase existente (ordenada por
// `ordem`, mesma ordem do mapa de fases), marcando quais já foram
// conquistadas.
export async function listarCartas(userId) {
  const [fasesRes, cartasRes] = await Promise.all([
    db.from('fases').select('id, nome, ordem').order('ordem'),
    db.from('cartas_do_jogador').select('fase_id, conquistada_em').eq('user_id', userId),
  ]);
  if (fasesRes.error) throw fasesRes.error;
  if (cartasRes.error) throw cartasRes.error;

  const conquistadaEm = new Map((cartasRes.data ?? []).map((c) => [c.fase_id, c.conquistada_em]));
  const cartas = (fasesRes.data ?? []).map((fase) => ({
    fase_id: fase.id,
    fase_nome: fase.nome,
    ordem: fase.ordem,
    conquistada: conquistadaEm.has(fase.id),
    conquistada_em: conquistadaEm.get(fase.id) ?? null,
  }));

  return {
    cartas,
    total: cartas.length,
    conquistadas: cartas.filter((c) => c.conquistada).length,
  };
}
