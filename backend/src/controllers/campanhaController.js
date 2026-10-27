import * as campanhaService from '../services/campanhaService.js';

export async function criar(req, res, next) {
  try {
    res.status(201).json(await campanhaService.criarCampanha(req.usuario.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function listar(_req, res, next) {
  try {
    res.json(await campanhaService.listarCampanhas());
  } catch (err) {
    next(err);
  }
}

export async function ranking(req, res, next) {
  try {
    res.json(await campanhaService.rankingDaCampanha(req.params.id));
  } catch (err) {
    next(err);
  }
}
