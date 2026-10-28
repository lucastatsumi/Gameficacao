import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { idsTemasVisiveis } from './temaService.js';

// Lógica pura: combina as fases com o progresso do aluno e decide quais estão
// desbloqueadas. Uma fase abre quando não tem requisito ou quando o requisito
// já foi concluído. Isolada da consulta ao banco para ser testável.
export function montarMapaFases(fases, progressos) {
  const progressoPorFase = new Map(progressos.map((p) => [p.fase_id, p]));
  const concluidas = new Set(progressos.filter((p) => p.concluida).map((p) => p.fase_id));

  return fases.map((fase) => ({
    id: fase.id,
    nome: fase.nome,
    descricao: fase.descricao,
    ordem: fase.ordem,
    tema_id: fase.tema_id ?? null,
    desbloqueada: fase.fase_requisito_id == null || concluidas.has(fase.fase_requisito_id),
    progresso: progressoPorFase.get(fase.id) ?? null,
  }));
}

// Mapa de fases: cada módulo vem com o progresso do colaborador e se está
// desbloqueado. Só módulos de temas visíveis para ele (empresa + trilha da
// equipe); com temaId, só os módulos daquele tema.
export async function listarFasesComProgresso(usuario, temaId = null) {
  const visiveis = await idsTemasVisiveis(usuario);
  if (temaId != null && !visiveis.includes(Number(temaId))) {
    throw new HttpError(404, 'Tema não encontrado');
  }
  const temas = temaId != null ? [Number(temaId)] : visiveis;

  const [fasesRes, progressoRes] = await Promise.all([
    db.from('fases').select('*').in('tema_id', temas).order('ordem'),
    db.from('progresso_fase').select('*').eq('user_id', usuario.id),
  ]);
  if (fasesRes.error) throw fasesRes.error;
  if (progressoRes.error) throw progressoRes.error;

  return montarMapaFases(fasesRes.data, progressoRes.data);
}

// Trava de acesso para iniciar/desafiar um módulo: o tema dele precisa
// estar visível para o usuário. 404 (não confirma a existência do módulo).
export async function exigirFaseVisivel(usuario, faseId) {
  const { data: fase, error } = await db
    .from('fases')
    .select('id, tema_id')
    .eq('id', faseId)
    .maybeSingle();
  if (error) throw error;
  if (!fase) throw new HttpError(404, 'Fase não encontrada');
  if (!(await idsTemasVisiveis(usuario)).includes(fase.tema_id)) {
    throw new HttpError(404, 'Fase não encontrada');
  }
}
