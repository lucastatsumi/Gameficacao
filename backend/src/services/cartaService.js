import { db } from '../config/supabase.js';
import { matrizDeCompetencias } from './avaliacaoService.js';

// Cartas colecionáveis (roadmap 4.9): dominar uma competência revela a
// carta. A checagem roda no fim do quiz (quizController), no mesmo ponto
// das demais recompensas.
export const MIN_RESPOSTAS = 10;
export const MIN_TAXA = 80;

export async function verificarCartas(userId) {
  const [matriz, { data: catalogo, error: e1 }, { data: tem, error: e2 }] = await Promise.all([
    matrizDeCompetencias(userId),
    db.from('cartas_catalogo').select('competencia, resumo'),
    db.from('cartas_do_jogador').select('competencia').eq('user_id', userId),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;

  const jaTem = new Set(tem.map((c) => c.competencia));
  const dominadas = new Set(
    matriz
      .filter((c) => c.respondidas >= MIN_RESPOSTAS && c.taxa_acerto >= MIN_TAXA)
      .map((c) => c.competencia)
  );
  const novas = catalogo.filter((c) => dominadas.has(c.competencia) && !jaTem.has(c.competencia));
  if (!novas.length) return [];

  const { error } = await db
    .from('cartas_do_jogador')
    .upsert(novas.map((c) => ({ user_id: userId, competencia: c.competencia })), {
      onConflict: 'user_id,competencia',
      ignoreDuplicates: true,
    });
  if (error) throw error;
  return novas;
}

// Álbum: todas as cartas do catálogo; o resumo só vai para as conquistadas.
export async function album(userId) {
  const [{ data: catalogo, error: e1 }, { data: tem, error: e2 }] = await Promise.all([
    db.from('cartas_catalogo').select('competencia, resumo'),
    db.from('cartas_do_jogador').select('competencia').eq('user_id', userId),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  const jaTem = new Set(tem.map((c) => c.competencia));
  return catalogo.map((c) =>
    jaTem.has(c.competencia)
      ? { competencia: c.competencia, conquistada: true, resumo: c.resumo }
      : { competencia: c.competencia, conquistada: false }
  );
}
