import { db } from '../config/supabase.js';
import { doTenant } from '../utils/empresa.js';
import { semanaAnteriorA, semanaIso } from '../utils/semana.js';
import { concederFichas } from './fichaService.js';

// Ligas semanais (roadmap v2, 4.5): divisões Bronze < Prata < Ouro <
// Diamante competindo pelo XP ganho NA SEMANA (não o total) — o ranking
// global premia veteranos para sempre; aqui todo mundo começa a
// segunda-feira zerado dentro da própria divisão.
//
// Fechamento LAZY: o primeiro acesso de QUALQUER jogador após a virada da
// semana promove/rebaixa quem tinha linha na semana anterior e semeia a
// semana nova (sem cron externo). `ligas_fechamentos` é a trava que torna
// isso seguro sob concorrência — ver garantirFechamentoSemana.

export const DIVISOES = ['bronze', 'prata', 'ouro', 'diamante'];
const FATIA_PROMOCAO = 0.2;
const FICHAS_POR_FAIXA = { subiu: 25, manteve: 15, desceu: 5 };

export async function ligaAtual(userId, agora = new Date(), empresaId = null) {
  const semana = semanaIso(agora);
  await garantirFechamentoSemana(agora);

  const linha = (await buscarLinha(userId, semana)) ?? (await matricularNaLiga(userId, semana));

  return {
    semana,
    divisao: linha.divisao,
    xp_semana: linha.xp_semana,
    ranking: await classificacaoDaDivisao(semana, linha.divisao, empresaId),
  };
}

// Hook chamado pelo controller após finalizarQuiz: soma o xp_ganho da
// tentativa ao acumulador da semana. Não recalcula nada — o xp_ganho já
// veio filtrado pela regra anti-farming de quizService.
export async function concederXpSemana(userId, xpGanho, agora = new Date()) {
  if (!xpGanho || xpGanho <= 0) return;

  const semana = semanaIso(agora);
  await garantirFechamentoSemana(agora);

  const linha = (await buscarLinha(userId, semana)) ?? (await matricularNaLiga(userId, semana));

  const { error } = await db
    .from('ligas_semana')
    .update({ xp_semana: linha.xp_semana + xpGanho })
    .eq('user_id', userId)
    .eq('semana', semana);
  if (error) throw error;
}

async function classificacaoDaDivisao(semana, divisao, empresaId) {
  const { data, error } = await doTenant(
    db.from('ranking_liga').select('id, nome, xp_semana, posicao'),
    empresaId,
  )
    .eq('semana', semana)
    .eq('divisao', divisao)
    .order('posicao');
  if (error) throw error;
  return data ?? [];
}

async function buscarLinha(userId, semana) {
  const { data, error } = await db
    .from('ligas_semana')
    .select('user_id, semana, divisao, xp_semana')
    .eq('user_id', userId)
    .eq('semana', semana)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Jogador sem linha na semana anterior (nunca jogou ligas ou ficou fora)
// entra direto na divisão mais baixa. Upsert com ignoreDuplicates torna
// idempotente uma corrida entre requisições concorrentes do mesmo jogador.
async function matricularNaLiga(userId, semana, divisao = 'bronze') {
  const { error } = await db
    .from('ligas_semana')
    .upsert(
      { user_id: userId, semana, divisao, xp_semana: 0 },
      { onConflict: 'user_id,semana', ignoreDuplicates: true },
    );
  if (error) throw error;
  return (await buscarLinha(userId, semana)) ?? { user_id: userId, semana, divisao, xp_semana: 0 };
}

// Fechamento lazy da semana anterior: promove o top 20% de cada divisão,
// rebaixa o bottom 20%, credita fichas conforme a faixa e semeia a semana
// atual. O insert em `ligas_fechamentos` É a trava — se outra requisição já
// fechou esta transição, ele falha com 23505 e a função só retorna.
async function garantirFechamentoSemana(agora) {
  const semanaAtual = semanaIso(agora);
  const semanaAnterior = semanaAnteriorA(agora);

  const { error: erroTrava } = await db.from('ligas_fechamentos').insert({ semana: semanaAtual });
  if (erroTrava) {
    if (erroTrava.code === '23505') return; // já processado por outra requisição
    throw erroTrava;
  }

  const { data: linhasAnteriores, error } = await db
    .from('ligas_semana')
    .select('user_id, divisao, xp_semana, profiles ( empresa_id )')
    .eq('semana', semanaAnterior);
  if (error) throw error;
  if (!linhasAnteriores?.length) return;

  // Promoção/rebaixamento é calculado dentro de cada (divisão, empresa):
  // ninguém sobe ou desce comparado com gente de outra empresa.
  const grupos = new Map();
  for (const linha of linhasAnteriores) {
    if (!DIVISOES.includes(linha.divisao)) continue;
    const chave = `${linha.divisao}|${linha.profiles?.empresa_id ?? ''}`;
    if (!grupos.has(chave)) grupos.set(chave, { divisao: linha.divisao, jogadores: [] });
    grupos.get(chave).jogadores.push(linha);
  }

  const novasLinhas = [];
  for (const { divisao, jogadores: doGrupo } of grupos.values()) {
    const jogadores = [...doGrupo].sort((a, b) => b.xp_semana - a.xp_semana);
    const total = jogadores.length;
    const qtdFaixa = Math.max(1, Math.ceil(total * FATIA_PROMOCAO));

    for (const [i, jogador] of jogadores.entries()) {
      let faixa = 'manteve';
      // Divisão com 1 único jogador: não faz sentido promover OU rebaixar
      // sozinho contra ninguém — mantém.
      if (total > 1 && i < qtdFaixa) faixa = 'subiu';
      else if (total > 1 && i >= total - qtdFaixa) faixa = 'desceu';

      const novaDivisao = proximaDivisao(
        divisao,
        faixa === 'subiu' ? 1 : faixa === 'desceu' ? -1 : 0,
      );
      novasLinhas.push({
        user_id: jogador.user_id,
        semana: semanaAtual,
        divisao: novaDivisao,
        xp_semana: 0,
      });
      await concederFichas(jogador.user_id, FICHAS_POR_FAIXA[faixa], 'liga_semana', semanaAnterior);
    }
  }

  const { error: erroInsert } = await db
    .from('ligas_semana')
    .upsert(novasLinhas, { onConflict: 'user_id,semana', ignoreDuplicates: true });
  if (erroInsert) throw erroInsert;
}

function proximaDivisao(divisao, direcao) {
  const indiceAtual = DIVISOES.indexOf(divisao);
  const novoIndice = Math.min(DIVISOES.length - 1, Math.max(0, indiceAtual + direcao));
  return DIVISOES[novoIndice];
}
