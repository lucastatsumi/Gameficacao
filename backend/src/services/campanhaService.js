import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { doTenant, mesmoTenant } from '../utils/empresa.js';
import { verificarBadges } from './badgeService.js';
import { criarEvento } from './eventoService.js';

// Campanha temática ("Outubro da Segurança"): empacota numa ação só do
// gestor um evento de XP multiplicado, uma badge exclusiva, uma meta do
// período (quizzes aprovados) e um ranking próprio. Tudo derivado de
// `tentativas` dentro de [inicio, fim] — nada de cron.

function validar(dados) {
  const { nome, descricao = null, tema_id = null, inicio, fim, meta_quizzes = 5, multiplicador_xp = 1.5 } =
    dados ?? {};
  if (!nome?.trim()) throw new HttpError(400, 'Informe o nome da campanha');
  if (!inicio || !fim || new Date(fim) <= new Date(inicio)) {
    throw new HttpError(400, 'O fim da campanha deve ser depois do início');
  }
  if (!Number.isInteger(Number(meta_quizzes)) || Number(meta_quizzes) < 1) {
    throw new HttpError(400, 'meta_quizzes deve ser um inteiro >= 1');
  }
  if (!(Number(multiplicador_xp) > 1)) throw new HttpError(400, 'multiplicador_xp deve ser maior que 1');
  return {
    nome: nome.trim(),
    descricao: descricao?.trim() || null,
    tema_id: tema_id === '' || tema_id == null ? null : Number(tema_id),
    inicio: new Date(inicio).toISOString(),
    fim: new Date(fim).toISOString(),
    meta_quizzes: Number(meta_quizzes),
    multiplicador_xp: Number(multiplicador_xp),
  };
}

export async function criarCampanha(gestor, dados) {
  const c = validar(dados);
  const empresaId = gestor.empresa_id ?? null;

  const { data: campanha, error } = await db
    .from('campanhas')
    .insert({
      empresa_id: empresaId,
      nome: c.nome,
      descricao: c.descricao,
      tema_id: c.tema_id,
      inicio: c.inicio,
      fim: c.fim,
      meta_quizzes: c.meta_quizzes,
      criada_por: gestor.id,
    })
    .select()
    .single();
  if (error) throw error;

  const evento = await criarEvento(
    { nome: `Campanha: ${c.nome}`, multiplicador_xp: c.multiplicador_xp, inicio: c.inicio, fim: c.fim },
    empresaId
  );

  // Nome de badge é único no banco: o id da campanha desambigua
  const { data: badge, error: erroBadge } = await db
    .from('badges')
    .insert({
      nome: `${c.nome} (#${campanha.id})`,
      descricao: `Cumpra a meta da campanha ${c.nome}: ${c.meta_quizzes} quizzes aprovados no período.`,
      icone: '🎯',
      tipo_condicao: 'campanha',
      parametro: { campanha_id: campanha.id },
    })
    .select('id')
    .single();
  if (erroBadge) throw erroBadge;

  const { data: final, error: erroUpdate } = await db
    .from('campanhas')
    .update({ evento_id: evento.id, badge_id: badge.id })
    .eq('id', campanha.id)
    .select()
    .single();
  if (erroUpdate) throw erroUpdate;
  return final;
}

export async function listarCampanhas(usuario, { ativas = false } = {}) {
  let query = doTenant(db.from('campanhas').select('*'), usuario.empresa_id).order('inicio', {
    ascending: false,
  });
  if (ativas) {
    const agora = new Date().toISOString();
    query = query.lte('inicio', agora).gte('fim', agora);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Tentativas finalizadas no período da campanha (no tema dela, se houver)
async function tentativasDoPeriodo(campanha, { userId = null, empresaId = null } = {}) {
  let query = db
    .from('tentativas')
    .select('user_id, xp_ganho, aprovada, fases ( tema_id ), profiles!inner ( nome, role, empresa_id )')
    .gte('finalizada_em', campanha.inicio)
    .lte('finalizada_em', campanha.fim);
  query = userId ? query.eq('user_id', userId) : doTenant(query, empresaId, 'profiles.empresa_id');
  const { data, error } = await query;
  if (error) throw error;
  return campanha.tema_id ? data.filter((t) => t.fases?.tema_id === campanha.tema_id) : data;
}

export async function campanhasDoJogador(usuario) {
  const campanhas = await listarCampanhas(usuario, { ativas: true });
  return Promise.all(
    campanhas.map(async (c) => {
      const tentativas = await tentativasDoPeriodo(c, { userId: usuario.id });
      const aprovadas = tentativas.filter((t) => t.aprovada).length;
      return {
        id: c.id,
        nome: c.nome,
        descricao: c.descricao,
        tema_id: c.tema_id,
        fim: c.fim,
        meta_quizzes: c.meta_quizzes,
        aprovadas,
        cumprida: aprovadas >= c.meta_quizzes,
      };
    })
  );
}

// Hook após finalizarQuiz: concede a badge das campanhas cuja meta foi
// cumprida (verificarBadges ignora as já conquistadas).
export async function registrarNaCampanha(usuario) {
  const campanhas = await campanhasDoJogador(usuario);
  const cumpridas = campanhas.filter((c) => c.cumprida).map((c) => c.id);
  if (!cumpridas.length) return [];
  return verificarBadges(usuario.id, { campanhasCumpridas: cumpridas });
}

export async function rankingDaCampanha(usuario, campanhaId, limite = 20) {
  const { data: campanha, error } = await db
    .from('campanhas')
    .select('*')
    .eq('id', campanhaId)
    .maybeSingle();
  if (error) throw error;
  if (!campanha || !mesmoTenant(campanha.empresa_id, usuario.empresa_id)) {
    throw new HttpError(404, 'Campanha não encontrada');
  }

  const tentativas = await tentativasDoPeriodo(campanha, { empresaId: usuario.empresa_id ?? null });
  const porUsuario = new Map();
  for (const t of tentativas) {
    if (t.profiles?.role !== 'aluno') continue;
    const atual = porUsuario.get(t.user_id) ?? { id: t.user_id, nome: t.profiles.nome, xp: 0, aprovadas: 0 };
    atual.xp += t.xp_ganho;
    if (t.aprovada) atual.aprovadas += 1;
    porUsuario.set(t.user_id, atual);
  }
  const ranking = [...porUsuario.values()]
    .sort((a, b) => b.xp - a.xp || b.aprovadas - a.aprovadas)
    .slice(0, limite)
    .map((linha, i) => ({ posicao: i + 1, ...linha, voce: linha.id === usuario.id }));
  return { campanha: { id: campanha.id, nome: campanha.nome, inicio: campanha.inicio, fim: campanha.fim }, ranking };
}
