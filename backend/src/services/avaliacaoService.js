import { createHash } from 'node:crypto';
import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import {
  MIN_RESPOSTAS_COBERTURA,
  competenciaDominada,
  nivelDeProficiencia,
} from '../utils/proficiencia.js';
import { temasVisiveis } from './temaService.js';
import { exigirTurmaDoProfessor } from './turmaService.js';

// Horizonte 3: matriz de competências, escala de proficiência e
// certificado. Tudo derivado de respostas/tentativas — gamificação (XP,
// fichas, ligas) não entra em nenhum número daqui.

function pct(acertos, total) {
  return total ? Math.round((1000 * acertos) / total) / 10 : null;
}

async function competenciasDosTemas(temaIds) {
  if (!temaIds.length) return [];
  const { data, error } = await db
    .from('competencias')
    .select('id, nome, descricao, resumo, tema_id')
    .in('tema_id', temaIds)
    .order('id');
  if (error) throw error;
  return data;
}

async function desempenhoDe(userIds) {
  if (!userIds.length) return [];
  const { data, error } = await db
    .from('desempenho_competencias')
    .select('user_id, competencia_id, total, acertos')
    .in('user_id', userIds);
  if (error) throw error;
  return data;
}

// Matriz individual: uma linha por competência dos temas visíveis
export async function minhasCompetencias(usuario) {
  const temas = await temasVisiveis(usuario);
  const competencias = await competenciasDosTemas(temas.map((t) => t.id));
  const desempenho = await desempenhoDe([usuario.id]);
  const porCompetencia = new Map(desempenho.map((d) => [d.competencia_id, d]));
  const nomeTema = new Map(temas.map((t) => [t.id, t.nome]));

  return competencias.map((c) => {
    const d = porCompetencia.get(c.id) ?? { total: 0, acertos: 0 };
    return {
      id: c.id,
      nome: c.nome,
      tema_id: c.tema_id,
      tema: nomeTema.get(c.tema_id),
      total: d.total,
      acertos: d.acertos,
      pct: pct(d.acertos, d.total),
      dominada: competenciaDominada(d),
    };
  });
}

// Resumo por tema: score médio, cobertura de competências, trilha
// concluída e o nível de proficiência resultante.
export async function resumoPorTema(usuario, tema) {
  const [fasesRes, competencias, desempenho] = await Promise.all([
    db.from('fases').select('id').eq('tema_id', tema.id),
    competenciasDosTemas([tema.id]),
    desempenhoDe([usuario.id]),
  ]);
  if (fasesRes.error) throw fasesRes.error;
  const faseIds = fasesRes.data.map((f) => f.id);

  let concluidas = [];
  let scores = [];
  if (faseIds.length) {
    const [progressoRes, tentativasRes] = await Promise.all([
      db
        .from('progresso_fase')
        .select('fase_id, concluida, concluida_em')
        .eq('user_id', usuario.id)
        .in('fase_id', faseIds),
      db
        .from('tentativas')
        .select('score')
        .eq('user_id', usuario.id)
        .in('fase_id', faseIds)
        .not('score', 'is', null),
    ]);
    if (progressoRes.error) throw progressoRes.error;
    if (tentativasRes.error) throw tentativasRes.error;
    concluidas = progressoRes.data.filter((p) => p.concluida);
    scores = tentativasRes.data.map((t) => Number(t.score));
  }

  const porCompetencia = new Map(desempenho.map((d) => [d.competencia_id, d]));
  const cobertas = competencias.filter(
    (c) => (porCompetencia.get(c.id)?.total ?? 0) >= MIN_RESPOSTAS_COBERTURA
  ).length;
  const coberturaPct = competencias.length ? Math.round((100 * cobertas) / competencias.length) : 0;
  const scoreMedio = scores.length
    ? Math.round((10 * scores.reduce((a, b) => a + b, 0)) / scores.length) / 10
    : null;
  let trilhaConcluida = faseIds.length > 0 && concluidas.length === faseIds.length;
  let concluidoEm = trilhaConcluida
    ? concluidas.map((p) => p.concluida_em).filter(Boolean).sort().at(-1) ?? null
    : null;
  // Prestígio reinicia o progresso dos módulos, mas quem prestigiou já
  // concluiu a trilha antes: a conquista (e o certificado) continua valendo.
  if (!trilhaConcluida && faseIds.length) {
    const { data: primeiro, error: erroPrestigio } = await db
      .from('prestigios')
      .select('iniciado_em')
      .eq('user_id', usuario.id)
      .eq('tema_id', tema.id)
      .order('ciclo')
      .limit(1)
      .maybeSingle();
    if (erroPrestigio) throw erroPrestigio;
    if (primeiro) {
      trilhaConcluida = true;
      concluidoEm = primeiro.iniciado_em;
    }
  }

  return {
    tema_id: tema.id,
    tema: tema.nome,
    score_medio: scoreMedio,
    cobertura_pct: coberturaPct,
    modulos_concluidos: concluidas.length,
    total_modulos: faseIds.length,
    trilha_concluida: trilhaConcluida,
    concluido_em: concluidoEm,
    nivel: nivelDeProficiencia({ scoreMedio, coberturaPct, trilhaConcluida }),
  };
}

export async function proficiencia(usuario) {
  const temas = await temasVisiveis(usuario);
  return Promise.all(temas.map((t) => resumoPorTema(usuario, t)));
}

// Código de verificação estável do certificado (mesmo colaborador + tema +
// data de conclusão sempre geram o mesmo código).
export function codigoCertificado(userId, temaId, concluidoEm) {
  return createHash('sha256')
    .update(`${userId}:${temaId}:${concluidoEm}`)
    .digest('hex')
    .slice(0, 12)
    .toUpperCase();
}

export async function certificado(usuario, temaId) {
  const tema = (await temasVisiveis(usuario)).find((t) => t.id === Number(temaId));
  if (!tema) throw new HttpError(404, 'Tema não encontrado');

  const resumo = await resumoPorTema(usuario, tema);
  if (!resumo.trilha_concluida) {
    throw new HttpError(403, 'Conclua todos os módulos do tema para emitir o certificado');
  }

  let empresa = null;
  if (usuario.empresa_id) {
    const { data } = await db
      .from('empresas')
      .select('nome')
      .eq('id', usuario.empresa_id)
      .maybeSingle();
    empresa = data?.nome ?? null;
  }

  return {
    colaborador: usuario.nome,
    empresa,
    ...resumo,
    codigo: codigoCertificado(usuario.id, tema.id, resumo.concluido_em),
  };
}

// Matriz da equipe (gestor): % de acerto por competência para cada
// membro e o agregado da equipe — mostra gaps ("domina LGPD, patina em
// incidentes").
export async function matrizDaEquipe(gestor, turmaId) {
  const turma = await exigirTurmaDoProfessor(gestor.id, turmaId);

  const { data: matriculas, error } = await db
    .from('matriculas')
    .select('user_id, profiles ( nome )')
    .eq('turma_id', turmaId);
  if (error) throw error;

  const temas = await temasVisiveis(gestor);
  const competencias = await competenciasDosTemas(temas.map((t) => t.id));
  const desempenho = await desempenhoDe(matriculas.map((m) => m.user_id));
  const nomeTema = new Map(temas.map((t) => [t.id, t.nome]));

  const chave = (userId, compId) => `${userId}|${compId}`;
  const porMembro = new Map(desempenho.map((d) => [chave(d.user_id, d.competencia_id), d]));

  const equipe = competencias.map((c) => {
    const linhas = desempenho.filter((d) => d.competencia_id === c.id);
    const total = linhas.reduce((s, d) => s + d.total, 0);
    const acertos = linhas.reduce((s, d) => s + d.acertos, 0);
    return {
      id: c.id,
      nome: c.nome,
      tema: nomeTema.get(c.tema_id),
      total,
      acertos,
      pct: pct(acertos, total),
    };
  });

  return {
    turma,
    competencias: equipe,
    membros: matriculas.map((m) => ({
      user_id: m.user_id,
      nome: m.profiles?.nome ?? '—',
      por_competencia: Object.fromEntries(
        competencias.map((c) => {
          const d = porMembro.get(chave(m.user_id, c.id));
          return [c.id, d ? pct(d.acertos, d.total) : null];
        })
      ),
    })),
  };
}
