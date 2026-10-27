import * as campanhaService from '../services/campanhaService.js';

export async function criar(req, res, next) {
  try {
    res.status(201).json(await campanhaService.criarCampanha(req.usuario.id, req.body, req.usuario.empresa_id));
  } catch (err) {
    next(err);
  }
}

export async function listar(req, res, next) {
  try {
    res.json(await campanhaService.listarCampanhas(req.usuario.empresa_id));
  } catch (err) {
    next(err);
  }
}

export async function ranking(req, res, next) {
  try {
    res.json(await campanhaService.rankingDaCampanha(req.params.id, req.usuario.empresa_id));
  } catch (err) {
    next(err);
  }
}
