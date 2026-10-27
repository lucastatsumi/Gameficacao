import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';

// ---------- Administração (professor) ----------

// empresaId null = evento global (legado); senão, visível só à empresa.
export async function criarEvento(dados, empresaId = null) {
  const evento = validarPayload(dados);

  const { data, error } = await db
    .from('eventos')
    .insert({ ...evento, ...(empresaId ? { empresa_id: empresaId } : {}) })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listarEventos(empresaId = null) {
  let consulta = db.from('eventos').select('*').order('inicio', { ascending: false });
  if (empresaId) consulta = consulta.or(`empresa_id.is.null,empresa_id.eq.${empresaId}`);
  const { data, error } = await consulta;
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

export async function removerEvento(id, empresaId = null) {
  // só remove eventos da própria empresa (os globais não são de ninguém)
  let consulta = db.from('eventos').delete().eq('id', id);
  if (empresaId) consulta = consulta.eq('empresa_id', empresaId);
  const { error } = await consulta;
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
export async function eventoAtivoParaFase(faseId, empresaId = null) {
  const agora = new Date().toISOString();
  let consulta = db.from('eventos').select('*').lte('inicio', agora).gte('fim', agora);
  if (empresaId) consulta = consulta.or(`empresa_id.is.null,empresa_id.eq.${empresaId}`);
  const { data, error } = await consulta;
  if (error) throw error;

  const candidatos = data.filter((e) => e.fase_id == null || e.fase_id === faseId);
  if (!candidatos.length) return null;

  return candidatos.reduce((maior, atual) =>
    atual.multiplicador_xp > maior.multiplicador_xp ? atual : maior
  );
}
