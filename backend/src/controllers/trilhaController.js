import * as trilhaService from '../services/trilhaService.js';

export async function listarTemas(_req, res, next) {
  try {
    res.json(await trilhaService.listarTemas());
  } catch (err) {
    next(err);
  }
}

export async function criarTema(req, res, next) {
  try {
    res.status(201).json(await trilhaService.criarTema(req.body?.nome, req.body?.descricao));
  } catch (err) {
    next(err);
  }
}

export async function temasDaTurma(req, res, next) {
  try {
    res.json(await trilhaService.temasDaTurma(req.usuario.id, req.params.turmaId));
  } catch (err) {
    next(err);
  }
}

export async function definirTemasDaTurma(req, res, next) {
  try {
    res.json(
      await trilhaService.definirTemasDaTurma(req.usuario.id, req.params.turmaId, req.body?.tema_ids)
    );
  } catch (err) {
    next(err);
  }
}
