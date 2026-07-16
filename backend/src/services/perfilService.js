import { db } from '../config/supabase.js';
import { xpParaNivel } from '../utils/nivel.js';
import { tituloPorNivel } from '../utils/titulo.js';
import { estoqueDoUsuario } from './poderService.js';

export async function obterPerfil(usuario) {
  const xpNivelAtual = xpParaNivel(usuario.nivel);
  const xpProximoNivel = xpParaNivel(usuario.nivel + 1);

  const [{ count: totalBadges }, poderes, classe] = await Promise.all([
    db.from('usuario_badges').select('*', { count: 'exact', head: true }).eq('user_id', usuario.id),
    estoqueDoUsuario(usuario.id),
    classeDoJogador(usuario.id),
  ]);

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    role: usuario.role,
    nivel: usuario.nivel,
    xp_total: usuario.xp_total,
    // Dados para a barra de progresso do nível
    xp_nivel_atual: xpNivelAtual,
    xp_proximo_nivel: xpProximoNivel,
    progresso_nivel_pct: Math.round(
      (100 * (usuario.xp_total - xpNivelAtual)) / (xpProximoNivel - xpNivelAtual)
    ),
    total_badges: totalBadges ?? 0,
    streak_dias: usuario.streak_dias ?? 0,
    poderes,
    // Progressão de personagem (RPG leve, cosmético — não afeta gameplay)
    titulo_nivel: tituloPorNivel(usuario.nivel),
    classe,
  };
}

// "Classe" temática = nome da fase de maior ordem já concluída
// (ex.: "Mestre de Árvores"). null se o aluno ainda não concluiu nenhuma.
async function classeDoJogador(userId) {
  const { data, error } = await db
    .from('progresso_fase')
    .select('fases ( nome, ordem )')
    .eq('user_id', userId)
    .eq('concluida', true);
  if (error) throw error;
  if (!data.length) return null;

  const maisAvancada = data.reduce((maior, atual) =>
    atual.fases.ordem > maior.fases.ordem ? atual : maior
  );
  return `Mestre de ${maisAvancada.fases.nome}`;
}

// Todas as badges do jogo, marcando as já conquistadas (para a estante de troféus)
export async function listarBadges(userId) {
  const [badgesRes, minhasRes] = await Promise.all([
    db.from('badges').select('id, nome, descricao, icone').order('id'),
    db.from('usuario_badges').select('badge_id, conquistado_em').eq('user_id', userId),
  ]);
  if (badgesRes.error) throw badgesRes.error;
  if (minhasRes.error) throw minhasRes.error;

  const conquistadas = new Map(minhasRes.data.map((b) => [b.badge_id, b.conquistado_em]));
  return badgesRes.data.map((badge) => ({
    ...badge,
    conquistada: conquistadas.has(badge.id),
    conquistado_em: conquistadas.get(badge.id) ?? null,
  }));
}

// Histórico de desempenho: tentativas finalizadas, mais recentes primeiro
export async function historicoDeTentativas(userId, limite = 50) {
  const { data, error } = await db
    .from('tentativas')
    .select('id, acertos, total_questoes, xp_ganho, aprovada, iniciada_em, finalizada_em, fases ( id, nome )')
    .eq('user_id', userId)
    .not('finalizada_em', 'is', null)
    .order('finalizada_em', { ascending: false })
    .limit(limite);
  if (error) throw error;

  return data.map((t) => ({
    id: t.id,
    fase: t.fases,
    acertos: t.acertos,
    total_questoes: t.total_questoes,
    xp_ganho: t.xp_ganho,
    aprovada: t.aprovada,
    finalizada_em: t.finalizada_em,
  }));
}
