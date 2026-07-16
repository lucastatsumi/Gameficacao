import { db } from '../config/supabase.js';

// Motor de badges: recebe o contexto do quiz recém-finalizado e verifica
// todas as condições ainda não conquistadas. Retorna as badges novas.
//
// contexto: { xpTotal, aprovada, faseOrdem, quizPerfeito, tempoMedioMs }
export async function verificarBadges(userId, contexto) {
  const [badgesRes, conquistadasRes] = await Promise.all([
    db.from('badges').select('*'),
    db.from('usuario_badges').select('badge_id').eq('user_id', userId),
  ]);
  if (badgesRes.error) throw badgesRes.error;
  if (conquistadasRes.error) throw conquistadasRes.error;

  const jaConquistadas = new Set(conquistadasRes.data.map((b) => b.badge_id));
  const pendentes = badgesRes.data.filter((b) => !jaConquistadas.has(b.id));
  if (!pendentes.length) return [];

  // Sequência de acertos só é consultada se alguma badge pendente precisar dela
  const precisaSequencia = pendentes.some((b) => b.tipo_condicao === 'sequencia_acertos');
  const sequenciaAtual = precisaSequencia ? await sequenciaDeAcertos(userId) : 0;

  const novas = pendentes.filter((badge) =>
    condicaoAtendida(badge, { ...contexto, sequenciaAtual }),
  );
  if (!novas.length) return [];

  const { error } = await db
    .from('usuario_badges')
    .insert(novas.map((b) => ({ user_id: userId, badge_id: b.id })));
  if (error) throw error;

  return novas.map(({ id, nome, descricao, icone }) => ({ id, nome, descricao, icone }));
}

export function condicaoAtendida(badge, ctx) {
  const p = badge.parametro ?? {};
  switch (badge.tipo_condicao) {
    case 'xp_acumulado':
      return ctx.xpTotal >= (p.xp ?? Infinity);
    case 'fase_concluida':
      return ctx.aprovada && ctx.faseOrdem === p.fase_ordem;
    case 'quiz_perfeito':
      return ctx.quizPerfeito;
    case 'velocidade':
      return (
        ctx.aprovada && ctx.tempoMedioMs != null && ctx.tempoMedioMs <= (p.tempo_medio_ms ?? 0)
      );
    case 'sequencia_acertos':
      return ctx.sequenciaAtual >= (p.acertos ?? Infinity);
    default:
      return false;
  }
}

// Conta acertos consecutivos do usuário, do mais recente para trás
async function sequenciaDeAcertos(userId, limite = 50) {
  const { data, error } = await db
    .from('respostas')
    .select('correta, respondida_em, tentativas!inner ( user_id )')
    .eq('tentativas.user_id', userId)
    .order('respondida_em', { ascending: false })
    .limit(limite);
  if (error) throw error;

  let sequencia = 0;
  for (const resposta of data) {
    if (!resposta.correta) break;
    sequencia++;
  }
  return sequencia;
}
