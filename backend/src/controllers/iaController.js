import * as iaService from '../services/iaService.js';
import * as auditoriaService from '../services/auditoriaService.js';

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

export async function auditar(req, res, next) {
  try {
    res.status(201).json(await auditoriaService.auditarFase(req.usuario.id, req.body?.fase_id));
  } catch (err) {
    next(err);
  }
}

export async function sugestoes(_req, res, next) {
  try {
    res.json(await auditoriaService.listarSugestoes());
  } catch (err) {
    next(err);
  }
}

export async function resolverSugestao(req, res, next) {
  try {
    await auditoriaService.resolverSugestao(req.params.id, req.body?.status);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
