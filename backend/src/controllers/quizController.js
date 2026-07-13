import * as quizService from '../services/quizService.js';

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

export async function finalizar(req, res, next) {
  try {
    const resultado = await quizService.finalizarQuiz(req.usuario, req.body?.tentativa_id);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}
