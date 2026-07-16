import * as quizCustomService from '../services/quizCustomService.js';

// Quizzes criados pelos usuários: qualquer autenticado lista, cria e joga.

export async function listar(req, res, next) {
  try {
    res.json(await quizCustomService.listarQuizzes(req.usuario.id));
  } catch (err) {
    next(err);
  }
}

export async function banco(req, res, next) {
  try {
    res.json(await quizCustomService.bancoDeQuestoes());
  } catch (err) {
    next(err);
  }
}

export async function criar(req, res, next) {
  try {
    res.status(201).json(await quizCustomService.criarQuiz(req.usuario.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function atualizar(req, res, next) {
  try {
    res.json(await quizCustomService.atualizarQuiz(req.usuario.id, req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function alternarAtivo(req, res, next) {
  try {
    res.json(await quizCustomService.alternarAtivo(req.usuario.id, req.params.id, req.body?.ativo));
  } catch (err) {
    next(err);
  }
}
