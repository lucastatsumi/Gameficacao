import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';

// ---------- Administração (professor) ----------

export async function criarEvento(dados) {
  const evento = validarPayload(dados);

  const { data, error } = await db.from('eventos').insert(evento).select().single();
  if (error) throw error;
  return data;
}

export async function listarEventos() {
  const { data, error } = await db.from('eventos').select('*').order('inicio', { ascending: false });
  if (error) throw error;

  const agora = Date.now();
  return data.map((e) => ({
    ...e,
    status:
      agora < new Date(e.inicio).getTime()
        ? 'futuro'
        : agora > new Date(e.fim).getTime()
          ? 'encerrado'
          : 'ativo',
  }));
}

export async function removerEvento(id) {
  const { error } = await db.from('eventos').delete().eq('id', id);
  if (error) throw error;
}

function validarPayload(dados) {
  const { nome, fase_id = null, multiplicador_xp, inicio, fim } = dados ?? {};

  if (!nome?.trim()) throw new HttpError(400, 'O nome do evento é obrigatório');
  if (!(multiplicador_xp > 1)) {
    throw new HttpError(400, 'multiplicador_xp deve ser maior que 1');
  }
  if (!inicio || !fim || new Date(fim) <= new Date(inicio)) {
    throw new HttpError(400, 'O fim do evento deve ser depois do início');
  }

  return {
    nome: nome.trim(),
    fase_id: fase_id === '' || fase_id == null ? null : Number(fase_id),
    multiplicador_xp: Number(multiplicador_xp),
    inicio: new Date(inicio).toISOString(),
    fim: new Date(fim).toISOString(),
  };
}

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
