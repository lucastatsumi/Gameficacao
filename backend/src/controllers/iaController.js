import * as iaService from '../services/iaService.js';

export async function gerar(req, res, next) {
  try {
    res.status(201).json(await iaService.gerarRascunhos(req.usuario.id, req.body ?? {}));
  } catch (err) {
    next(err);
  }
}

export async function listar(req, res, next) {
  try {
    res.json(await iaService.listarRascunhos(req.query.fase_id));
  } catch (err) {
    next(err);
  }
}

export async function aprovar(req, res, next) {
  try {
    res
      .status(201)
      .json(await iaService.aprovarRascunho(req.usuario.id, req.params.id, req.body?.edicoes));
  } catch (err) {
    next(err);
  }
}

export async function descartar(req, res, next) {
  try {
    await iaService.descartarRascunho(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
