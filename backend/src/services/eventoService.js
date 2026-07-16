import { db } from '../config/supabase.js';

// Evento temporário com maior multiplicador de XP ativo agora para a fase
// (eventos com fase_id null valem para qualquer fase). Retorna null se
// nenhum evento estiver no período [inicio, fim] neste momento.
export async function eventoAtivoParaFase(faseId) {
  const agora = new Date().toISOString();
  const { data, error } = await db.from('eventos').select('*').lte('inicio', agora).gte('fim', agora);
  if (error) throw error;

  const candidatos = data.filter((e) => e.fase_id == null || e.fase_id === faseId);
  if (!candidatos.length) return null;

  return candidatos.reduce((maior, atual) =>
    atual.multiplicador_xp > maior.multiplicador_xp ? atual : maior
  );
}
