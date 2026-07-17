import * as desafioService from '../services/desafioService.js';

export async function criar(req, res, next) {
  try {
    const desafio = await desafioService.criarDesafio(req.usuario.id, req.body?.fase_id);
    res.status(201).json(desafio);
  } catch (err) {
    next(err);
  }
}

export async function obter(req, res, next) {
  try {
    res.json(await desafioService.obterDesafio(req.params.id));
  } catch (err) {
    next(err);
  }
}
