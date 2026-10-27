import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { criarEvento } from './eventoService.js';

// Campanha temática (roadmap H4): evento + badge exclusiva + ranking da
// janela, criados juntos pelo gestor. A badge é concedida a quem concluir
// `min_quizzes` quizzes APROVADOS dentro da janela.

export async function criarCampanha(gestorId, dados) {
  const { nome, inicio, fim, multiplicador_xp = 2, min_quizzes = 5, icone = 'trophy' } = dados ?? {};
  if (!nome?.trim()) throw new HttpError(400, 'O nome da campanha é obrigatório');
  if (!Number.isInteger(min_quizzes) || min_quizzes < 1) {
    throw new HttpError(400, 'min_quizzes deve ser um inteiro >= 1');
  }

  const evento = await criarEvento({ nome, multiplicador_xp, inicio, fim }); // valida o período

  const { data: badge, error: erroBadge } = await db
    .from('badges')
    .insert({
      nome: `Campanha: ${nome.trim()}`,
      descricao: `Concluiu ${min_quizzes} quizzes aprovados durante a campanha "${nome.trim()}".`,
      icone,
      tipo_condicao: 'campanha',
      parametro: { min_quizzes },
    })
    .select()
    .single();
  if (erroBadge) {
    await db.from('eventos').delete().eq('id', evento.id);
    if (erroBadge.code === '23505') throw new HttpError(409, 'Já existe uma campanha com esse nome');
    throw erroBadge;
  }

  const { data: campanha, error } = await db
    .from('campanhas')
    .insert({
      gestor_id: gestorId,
      nome: nome.trim(),
      evento_id: evento.id,
      badge_id: badge.id,
      inicio: evento.inicio,
      fim: evento.fim,
      min_quizzes,
    })
    .select()
    .single();
  if (error) {
    await db.from('badges').delete().eq('id', badge.id);
    await db.from('eventos').delete().eq('id', evento.id);
    throw error;
  }
  return campanha;
}

export async function listarCampanhas() {
  const { data, error } = await db
    .from('campanhas')
    .select('id, nome, inicio, fim, min_quizzes')
    .order('inicio', { ascending: false });
  if (error) throw error;
  return data;
}

// Chamado no fim de cada quiz (quizController). Concede a badge das
// campanhas ativas cuja meta o usuário acabou de bater.
export async function verificarCampanhas(userId, agora = new Date()) {
  const iso = agora.toISOString();
  const { data: ativas, error } = await db
    .from('campanhas')
    .select('id, nome, inicio, fim, min_quizzes, badge_id, badges ( id, nome, descricao, icone )')
    .lte('inicio', iso)
    .gte('fim', iso);
  if (error) throw error;
  if (!ativas.length) return [];

  const { data: minhas, error: e2 } = await db
    .from('usuario_badges')
    .select('badge_id')
    .eq('user_id', userId)
    .in('badge_id', ativas.map((c) => c.badge_id));
  if (e2) throw e2;
  const jaTem = new Set(minhas.map((b) => b.badge_id));

  const concedidas = [];
  for (const c of ativas.filter((c) => !jaTem.has(c.badge_id))) {
    const { data: aprovadas, error: e3 } = await db
      .from('tentativas')
      .select('id')
      .eq('user_id', userId)
      .eq('aprovada', true)
      .gte('finalizada_em', c.inicio)
      .lte('finalizada_em', c.fim);
    if (e3) throw e3;
    if (aprovadas.length < c.min_quizzes) continue;

    const { error: e4 } = await db
      .from('usuario_badges')
      .insert({ user_id: userId, badge_id: c.badge_id });
    if (e4 && e4.code !== '23505') throw e4; // 23505: concedida em paralelo
    if (!e4) concedidas.push(c.badges);
  }
  return concedidas;
}

// Ranking próprio da campanha: XP ganho dentro da janela, top 10.
export async function rankingDaCampanha(campanhaId) {
  const { data: campanha, error } = await db
    .from('campanhas')
    .select('inicio, fim')
    .eq('id', campanhaId)
    .maybeSingle();
  if (error) throw error;
  if (!campanha) throw new HttpError(404, 'Campanha não encontrada');

  const { data, error: e2 } = await db
    .from('tentativas')
    .select('user_id, xp_ganho, profiles ( nome )')
    .not('finalizada_em', 'is', null)
    .gte('finalizada_em', campanha.inicio)
    .lte('finalizada_em', campanha.fim);
  if (e2) throw e2;

  const porUsuario = new Map();
  for (const t of data) {
    const atual = porUsuario.get(t.user_id) ?? { nome: t.profiles?.nome ?? 'Jogador', xp: 0 };
    atual.xp += t.xp_ganho;
    porUsuario.set(t.user_id, atual);
  }
  return [...porUsuario.values()]
    .filter((u) => u.xp > 0)
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 10)
    .map((u, i) => ({ posicao: i + 1, ...u }));
}
