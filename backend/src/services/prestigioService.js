import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { verificarBadges } from './badgeService.js';
import { exigirTemaVisivel } from './temaService.js';

// Prestígio — Nova Jornada+ (roadmap 4.11): quem concluiu a trilha de um
// tema pode reiniciá-la com modificadores (sem questões fáceis, timer
// −25%) e ganha uma estrela permanente por ciclo. Só o progresso dos
// módulos reinicia: score e competências vêm de `respostas` e continuam
// valendo (gamificação ≠ avaliação).

export const FATOR_TEMPO_PRESTIGIO = 0.75;

async function cicloAtual(userId, temaId) {
  const { data, error } = await db
    .from('prestigios')
    .select('ciclo, iniciado_em')
    .eq('user_id', userId)
    .eq('tema_id', temaId)
    .order('ciclo', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Modificadores aplicados por quizController ao iniciar um módulo
export async function modificadoresDaFase(userId, faseId) {
  const { data: fase, error } = await db
    .from('fases')
    .select('tema_id')
    .eq('id', faseId)
    .maybeSingle();
  if (error) throw error;
  if (!fase?.tema_id) return {};

  const atual = await cicloAtual(userId, fase.tema_id);
  if (!atual) return {};
  return { ciclo: atual.ciclo, fatorTempo: FATOR_TEMPO_PRESTIGIO, semFaceis: true };
}

export async function prestigiar(usuario, temaId) {
  await exigirTemaVisivel(usuario, temaId);

  const { data: fases, error } = await db.from('fases').select('id').eq('tema_id', temaId);
  if (error) throw error;
  const faseIds = fases.map((f) => f.id);
  if (!faseIds.length) throw new HttpError(400, 'Este tema ainda não tem módulos');

  const { data: progresso, error: erroProgresso } = await db
    .from('progresso_fase')
    .select('fase_id, concluida')
    .eq('user_id', usuario.id)
    .in('fase_id', faseIds);
  if (erroProgresso) throw erroProgresso;
  const concluidas = progresso.filter((p) => p.concluida).length;
  if (concluidas < faseIds.length) {
    throw new HttpError(403, 'Conclua todos os módulos do tema antes de começar uma Nova Jornada');
  }

  const anterior = await cicloAtual(usuario.id, temaId);
  const ciclo = (anterior?.ciclo ?? 0) + 1;
  const { error: erroInsert } = await db
    .from('prestigios')
    .insert({ user_id: usuario.id, tema_id: Number(temaId), ciclo });
  if (erroInsert?.code === '23505') throw new HttpError(409, 'Nova Jornada já iniciada');
  if (erroInsert) throw erroInsert;

  // Reinicia só o cache de progresso dos módulos do tema
  const { error: erroReset } = await db
    .from('progresso_fase')
    .delete()
    .eq('user_id', usuario.id)
    .in('fase_id', faseIds);
  if (erroReset) throw erroReset;

  const { count, error: erroTotal } = await db
    .from('prestigios')
    .select('ciclo', { count: 'exact', head: true })
    .eq('user_id', usuario.id);
  if (erroTotal) throw erroTotal;
  const badgesNovas = await verificarBadges(usuario.id, { ciclosPrestigio: count ?? ciclo });

  return {
    tema_id: Number(temaId),
    ciclo,
    modificadores: { sem_faceis: true, fator_tempo: FATOR_TEMPO_PRESTIGIO },
    badges_novas: badgesNovas,
  };
}

// Estrelas de prestígio por tema (perfil e mapa)
export async function meusPrestigios(userId) {
  const { data, error } = await db
    .from('prestigios')
    .select('tema_id, ciclo, iniciado_em')
    .eq('user_id', userId);
  if (error) throw error;

  const porTema = new Map();
  for (const p of data) {
    const atual = porTema.get(p.tema_id);
    if (!atual || p.ciclo > atual.ciclo) porTema.set(p.tema_id, p);
  }
  return {
    estrelas: data.length,
    por_tema: [...porTema.values()].map((p) => ({
      tema_id: p.tema_id,
      ciclo: p.ciclo,
      desde: p.iniciado_em,
    })),
  };
}
