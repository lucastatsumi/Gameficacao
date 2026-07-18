import { db } from '../config/supabase.js';
import { xpParaNivel } from '../utils/nivel.js';
import { tituloPorNivel } from '../utils/titulo.js';
import { classeDaFase } from '../utils/classe.js';
import { estoqueDoUsuario } from './poderService.js';
import { saldoDeFichas } from './fichaService.js';

export async function obterPerfil(usuario) {
  const xpNivelAtual = xpParaNivel(usuario.nivel);
  const xpProximoNivel = xpParaNivel(usuario.nivel + 1);

  const [{ count: totalBadges }, poderes, classe, atributos, fichas] = await Promise.all([
    db.from('usuario_badges').select('*', { count: 'exact', head: true }).eq('user_id', usuario.id),
    estoqueDoUsuario(usuario.id),
    classeDoJogador(usuario.id),
    atributosDoJogador(usuario.id),
    saldoDeFichas(usuario.id),
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
    fichas,
    // Progressão de personagem (RPG leve, cosmético — não afeta gameplay)
    titulo_nivel: tituloPorNivel(usuario.nivel),
    classe,
    atributos,
  };
}

// Atributos derivados (cosméticos, calculados a partir de tentativas e
// respostas já existentes — sem nova tabela):
// - precisao_pct: % de respostas corretas no histórico inteiro
// - velocidade_media_ms: tempo médio de resposta
// - dias_ativos: nº de dias distintos (calendário UTC) em que respondeu algo
async function atributosDoJogador(userId) {
  const { data, error } = await db
    .from('respostas')
    .select('correta, tempo_resposta_ms, respondida_em, tentativas!inner ( user_id )')
    .eq('tentativas.user_id', userId);
  if (error) throw error;

  const total = data.length;
  const corretas = data.filter((r) => r.correta).length;
  const precisaoPct = total ? Math.round((100 * corretas) / total) : null;

  const tempos = data.map((r) => r.tempo_resposta_ms).filter((t) => t != null);
  const velocidadeMediaMs = tempos.length
    ? Math.round(tempos.reduce((soma, t) => soma + t, 0) / tempos.length)
    : null;

  const diasAtivos = new Set(data.map((r) => r.respondida_em?.slice(0, 10)).filter(Boolean)).size;

  return { precisao_pct: precisaoPct, velocidade_media_ms: velocidadeMediaMs, dias_ativos: diasAtivos };
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
  return classeDaFase(maisAvancada.fases.nome);
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

// Lembrete de retomada: a tentativa aberta (não finalizada) mais recente do
// aluno, se houver. Como `iniciarQuiz`/`iniciarQuizCustom` fecham qualquer
// tentativa aberta antes de abrir uma nova (`abandonarTentativasAbertas`),
// só existe NO MÁXIMO 1 tentativa aberta por vez — a que o aluno deixou pela
// metade ao sair do jogo sem finalizar. Retomar de fato reinicia a fase
// (não há como "continuar de onde parou" hoje); esse endpoint só existe pra
// avisar o aluno que ele tem algo pendente, incentivando a voltar.
export async function tentativaAbertaPendente(userId) {
  const { data, error } = await db
    .from('tentativas')
    .select('id, fase_id, quiz_custom_id, iniciada_em, fases ( nome ), quizzes_custom ( titulo )')
    .eq('user_id', userId)
    .is('finalizada_em', null)
    .order('iniciada_em', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    tentativa_id: data.id,
    titulo: data.fases?.nome ?? data.quizzes_custom?.titulo ?? 'Quiz',
    fase_id: data.fase_id,
    quiz_custom_id: data.quiz_custom_id,
    iniciada_em: data.iniciada_em,
  };
}

// Modo de revisão de erros: últimas respostas ERRADAS do aluno (qualquer
// tentativa, finalizada ou não), com a alternativa que ele escolheu (ou
// null se o tempo esgotou), a correta e a explicação — para reforço
// espaçado. Como é revisão pós-jogo, expor o gabarito aqui não fere a
// regra de "resposta correta só no servidor durante o quiz".
export async function errosRecentes(userId, limite = 20) {
  const { data, error } = await db
    .from('respostas')
    .select(
      'id, alternativa_id, respondida_em, tentativas!inner ( user_id ), questoes ( id, enunciado, codigo_snippet, dificuldade, alternativas ( id, letra, texto, correta, explicacao ) )'
    )
    .eq('correta', false)
    .eq('tentativas.user_id', userId)
    .order('respondida_em', { ascending: false })
    .limit(limite);
  if (error) throw error;

  return data
    .filter((r) => r.questoes) // defensivo: questão pode ter sido removida
    .map((r) => {
      const escolhida = r.questoes.alternativas.find((a) => a.id === r.alternativa_id) ?? null;
      const correta = r.questoes.alternativas.find((a) => a.correta) ?? null;
      return {
        resposta_id: r.id,
        respondida_em: r.respondida_em,
        questao: {
          id: r.questoes.id,
          enunciado: r.questoes.enunciado,
          codigo_snippet: r.questoes.codigo_snippet,
          dificuldade: r.questoes.dificuldade,
        },
        sua_alternativa: escolhida && { letra: escolhida.letra, texto: escolhida.texto },
        alternativa_correta: correta && {
          letra: correta.letra,
          texto: correta.texto,
          explicacao: correta.explicacao,
        },
      };
    });
}
