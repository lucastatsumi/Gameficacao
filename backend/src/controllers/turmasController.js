import * as turmaService from '../services/turmaService.js';

export async function entrar(req, res, next) {
  try {
    const turma = await turmaService.entrarNaTurma(req.usuario.id, req.body?.codigo_acesso);
    res.status(201).json(turma);
  } catch (err) {
    next(err);
  }
}

export async function minhas(req, res, next) {
  try {
    res.json(await turmaService.minhasTurmas(req.usuario.id));
  } catch (err) {
    next(err);
  }
}
