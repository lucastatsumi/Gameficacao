import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';

// Prestígio (roadmap 4.11): quem concluiu a trilha de um tema pode
// reiniciá-la em modo difícil (quizService.iniciarQuiz passa a sortear só
// questões média/difícil enquanto houver ciclo > 0) e ganha uma estrela
// permanente por ciclo. Só o progresso de jogo reinicia.

export async function cicloAtual(userId, temaId) {
  const { data, error } = await db
    .from('prestigios')
    .select('ciclo')
    .eq('user_id', userId)
    .eq('tema_id', temaId)
    .order('ciclo', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0]?.ciclo ?? 0;
}

export async function statusDePrestigio(userId) {
  const [{ data: fases, error: e1 }, { data: progresso, error: e2 }, { data: ciclos, error: e3 }] =
    await Promise.all([
      db.from('fases').select('id, tema_id, temas ( nome )'),
      db.from('progresso_fase').select('fase_id, concluida').eq('user_id', userId),
      db.from('prestigios').select('tema_id, ciclo').eq('user_id', userId),
    ]);
  for (const e of [e1, e2, e3]) if (e) throw e;

  const concluidas = new Set(progresso.filter((p) => p.concluida).map((p) => p.fase_id));
  const temas = new Map();
  for (const f of fases.filter((f) => f.tema_id != null)) {
    const t = temas.get(f.tema_id) ?? { tema_id: f.tema_id, tema: f.temas?.nome ?? '', ids: [] };
    t.ids.push(f.id);
    temas.set(f.tema_id, t);
  }
  return [...temas.values()].map((t) => ({
    tema_id: t.tema_id,
    tema: t.tema,
    ciclo: Math.max(0, ...ciclos.filter((c) => c.tema_id === t.tema_id).map((c) => c.ciclo)),
    pode_prestigiar: t.ids.every((id) => concluidas.has(id)),
  }));
}

export async function prestigiar(userId, temaId) {
  const status = (await statusDePrestigio(userId)).find((s) => s.tema_id === Number(temaId));
  if (!status) throw new HttpError(404, 'Tema não encontrado');
  if (!status.pode_prestigiar) {
    throw new HttpError(403, 'Conclua todos os módulos do tema para prestigiar');
  }

  const ciclo = status.ciclo + 1;
  const { error } = await db
    .from('prestigios')
    .insert({ user_id: userId, tema_id: status.tema_id, ciclo });
  if (error) {
    if (error.code === '23505') throw new HttpError(409, 'Prestígio já realizado');
    throw error;
  }

  const { data: fases, error: erroFases } = await db
    .from('fases')
    .select('id')
    .eq('tema_id', status.tema_id);
  if (erroFases) throw erroFases;

  const { error: erroReset } = await db
    .from('progresso_fase')
    .update({ concluida: false })
    .eq('user_id', userId)
    .in('fase_id', fases.map((f) => f.id));
  if (erroReset) throw erroReset;

  return { tema_id: status.tema_id, tema: status.tema, ciclo };
}
