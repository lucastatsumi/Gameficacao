import * as quizService from '../services/quizService.js';
import * as poderService from '../services/poderService.js';
import * as fichaService from '../services/fichaService.js';
import * as missaoService from '../services/missaoService.js';
import * as ligaService from '../services/ligaService.js';
import * as temporadaService from '../services/temporadaService.js';
import * as raidService from '../services/raidService.js';

export async function iniciar(req, res, next) {
  try {
    const quiz = await quizService.iniciarQuiz(req.usuario.id, req.body?.fase_id);
    res.status(201).json(quiz);
  } catch (err) {
    next(err);
  }
}

export async function iniciarCustom(req, res, next) {
  try {
    const quiz = await quizService.iniciarQuizCustom(req.usuario, req.body?.quiz_id);
    res.status(201).json(quiz);
  } catch (err) {
    next(err);
  }
}

export async function dica(req, res, next) {
  try {
    res.json(await quizService.obterDica(req.usuario.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function responder(req, res, next) {
  try {
    const feedback = await quizService.responderQuestao(req.usuario.id, req.body);
    res.json(feedback);
  } catch (err) {
    next(err);
  }
}

export async function responderSequencia(req, res, next) {
  try {
    const feedback = await quizService.responderSequencia(req.usuario.id, req.body);
    res.json(feedback);
  } catch (err) {
    next(err);
  }
}

export async function finalizar(req, res, next) {
  try {
    const resultado = await quizService.finalizarQuiz(req.usuario, req.body?.tentativa_id);

    // Recompensa de poderes: cada badge nova concede 1 uso de
    // "eliminar_alternativa"; um quiz 100% de acerto concede 1 "tempo_extra";
    // concluir uma fase pela primeira vez concede 1 "pular_questao" (ajuda
    // nas fases seguintes, que tendem a ser mais difíceis). Feito aqui (e
    // não dentro de finalizarQuiz) para não criar dependência circular
    // entre quizService e poderService.
    for (const _badge of resultado.badges_novas ?? []) {
      await poderService.concederPoder(req.usuario.id, 'eliminar_alternativa', 1);
    }
    if (resultado.acertos > 0 && resultado.acertos === resultado.total_questoes) {
      await poderService.concederPoder(req.usuario.id, 'tempo_extra', 1);
    }
    if (resultado.fase_concluida) {
      await poderService.concederPoder(req.usuario.id, 'pular_questao', 1);
    }
    // Marco de streak (a cada 5 dias seguidos jogando): sorteia 1 poder
    // qualquer como recompensa por persistência.
    if (resultado.streak_marco) {
      const poderes = poderService.PODERES_VALIDOS;
      const sorteado = poderes[Math.floor(Math.random() * poderes.length)];
      await poderService.concederPoder(req.usuario.id, sorteado, 1);
      resultado.poder_concedido = sorteado;
    }

    // Fichas (economia gastável): aprovado com XP novo rende fichas, com
    // teto diário — regras em fichaService.recompensarQuiz.
    resultado.fichas_ganhas = await fichaService.recompensarQuiz(
      req.usuario.id,
      resultado,
      req.body?.tentativa_id
    );

    // Missões do dia: aplica o resultado já corrigido ao progresso e paga
    // as que concluírem agora (fichas somadas ao total exibido).
    resultado.missoes_concluidas = await missaoService.registrarQuizNasMissoes(
      req.usuario.id,
      resultado,
      req.body?.tentativa_id
    );
    resultado.fichas_ganhas += resultado.missoes_concluidas.reduce(
      (soma, m) => soma + m.recompensa_fichas,
      0
    );

    // Missão da semana (roadmap 4.3): mesma ideia, mas acumulando acertos
    // na janela de 7 dias — concluir também pode conceder um cosmético
    // exclusivo, resolvido dentro do próprio missaoService.
    resultado.missoes_semanais_concluidas = await missaoService.registrarQuizNasMissoesSemanais(
      req.usuario.id,
      resultado
    );
    resultado.fichas_ganhas += resultado.missoes_semanais_concluidas.reduce(
      (soma, m) => soma + m.recompensa_fichas,
      0
    );

    // Liga semanal (roadmap 4.5): soma o XP desta tentativa ao acumulador
    // da semana — a mesma regra anti-farming de finalizarQuiz já decide
    // quanto xp_ganho vale aqui.
    await ligaService.concederXpSemana(req.usuario.id, resultado.xp_ganho);

    // Temporada (roadmap 4.6): mesmo xp_ganho alimenta os pontos da
    // temporada ativa (se houver) e resgata automaticamente os degraus
    // da trilha que o jogador acabou de cruzar.
    resultado.temporada_recompensas = await temporadaService.concederPontosTemporada(
      req.usuario.id,
      resultado.xp_ganho
    );

    // Raid boss de equipe (roadmap 4.7): self-sufficient — consulta a
    // própria tentativa (acertos + dificuldade) em vez de reusar
    // resultado.xp_ganho, já que o dano depende da dificuldade de cada
    // questão, não do XP. No-op se o jogador não está em turma com raid
    // ativo.
    resultado.raid = await raidService.aplicarDano(req.usuario.id, req.body?.tentativa_id);

    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function usarPoder(req, res, next) {
  try {
    res.json(await poderService.usarPoder(req.usuario.id, req.body));
  } catch (err) {
    next(err);
  }
}
