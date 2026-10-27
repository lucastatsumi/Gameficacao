import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { classificarProficiencia } from '../utils/proficiencia.js';

// Avaliação (roadmap H3): proficiência por tema, matriz de competências e
// dados do certificado. Tudo derivado de tentativas/respostas já gravadas —
// o score vem de `tentativas.score`, calculado no servidor ao finalizar.

const media = (nums) =>
  nums.length ? Math.round(nums.reduce((s, n) => s + n, 0) / nums.length) : null;

async function fasesComTema() {
  const { data, error } = await db.from('fases').select('id, tema_id, temas ( id, nome )');
  if (error) throw error;
  return data.filter((f) => f.tema_id != null);
}

async function dadosDoUsuario(userId) {
  const [progresso, tentativas] = await Promise.all([
    db.from('progresso_fase').select('fase_id, concluida').eq('user_id', userId),
    db
      .from('tentativas')
      .select('fase_id, score')
      .eq('user_id', userId)
      .not('finalizada_em', 'is', null)
      .not('score', 'is', null),
  ]);
  if (progresso.error) throw progresso.error;
  if (tentativas.error) throw tentativas.error;

  const concluidas = new Set(progresso.data.filter((p) => p.concluida).map((p) => p.fase_id));
  // melhor score por fase (refazer para melhorar é legítimo)
  const melhorPorFase = new Map();
  for (const t of tentativas.data) {
    if (t.fase_id == null) continue;
    melhorPorFase.set(t.fase_id, Math.max(melhorPorFase.get(t.fase_id) ?? 0, t.score));
  }
  return { concluidas, melhorPorFase };
}

function agruparPorTema(fases) {
  const temas = new Map();
  for (const f of fases) {
    if (!temas.has(f.tema_id)) {
      temas.set(f.tema_id, { tema_id: f.tema_id, tema: f.temas?.nome ?? '', fases: [] });
    }
    temas.get(f.tema_id).fases.push(f.id);
  }
  return [...temas.values()];
}

export async function proficienciaDoUsuario(userId) {
  const [fases, dados] = await Promise.all([fasesComTema(), dadosDoUsuario(userId)]);
  return agruparPorTema(fases).map((t) => {
    const concluidas = t.fases.filter((id) => dados.concluidas.has(id)).length;
    const cobertura = concluidas / t.fases.length;
    const scores = t.fases
      .filter((id) => dados.melhorPorFase.has(id))
      .map((id) => dados.melhorPorFase.get(id));
    const scoreMedio = media(scores);
    return {
      tema_id: t.tema_id,
      tema: t.tema,
      modulos_total: t.fases.length,
      modulos_concluidos: concluidas,
      score_medio: scoreMedio,
      proficiencia: classificarProficiencia(scoreMedio, cobertura),
    };
  });
}

// Desempenho por tag de competência (taxa de acerto) do usuário.
export async function matrizDeCompetencias(userId) {
  const { data, error } = await db
    .from('respostas')
    .select('correta, questoes ( competencias ), tentativas!inner ( user_id )')
    .eq('tentativas.user_id', userId);
  if (error) throw error;
  return agregarCompetencias(data);
}

export function agregarCompetencias(respostas) {
  const mapa = new Map();
  for (const r of respostas) {
    for (const tag of r.questoes?.competencias ?? []) {
      const atual = mapa.get(tag) ?? { competencia: tag, respondidas: 0, acertos: 0 };
      atual.respondidas += 1;
      if (r.correta) atual.acertos += 1;
      mapa.set(tag, atual);
    }
  }
  return [...mapa.values()]
    .map((c) => ({ ...c, taxa_acerto: Math.round((c.acertos / c.respondidas) * 100) }))
    .sort((a, b) => a.taxa_acerto - b.taxa_acerto); // maiores gaps primeiro
}

// Certificado: só quando TODOS os módulos do tema estão concluídos.
export async function certificadoDoTema(usuario, temaId) {
  const prof = (await proficienciaDoUsuario(usuario.id)).find((p) => p.tema_id === Number(temaId));
  if (!prof) throw new HttpError(404, 'Tema não encontrado');
  if (prof.modulos_concluidos < prof.modulos_total) {
    throw new HttpError(403, 'Conclua todos os módulos do tema para emitir o certificado');
  }
  return {
    nome: usuario.nome,
    tema: prof.tema,
    score_medio: prof.score_medio,
    proficiencia: prof.proficiencia,
    emitido_em: new Date().toISOString(),
  };
}
