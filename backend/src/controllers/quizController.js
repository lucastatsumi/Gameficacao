import * as quizService from '../services/quizService.js';
import * as poderService from '../services/poderService.js';

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
