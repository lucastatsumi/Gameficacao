import * as rankingService from '../services/rankingService.js';

function limiteDe(req) {
  const limite = Number(req.query.limite ?? 50);
  return Number.isInteger(limite) && limite > 0 ? Math.min(limite, 100) : 50;
}

export async function global(req, res, next) {
  try {
    res.json(await rankingService.rankingGlobal(req.usuario.id, limiteDe(req)));
  } catch (err) {
    next(err);
  }
}

export async function porTurma(req, res, next) {
  try {
    res.json(await rankingService.rankingPorTurma(req.usuario, req.params.turmaId, limiteDe(req)));
  } catch (err) {
    next(err);
  }
}

export async function porFase(req, res, next) {
  try {
    res.json(await rankingService.rankingPorFase(req.usuario.id, Number(req.params.faseId), limiteDe(req)));
  } catch (err) {
    next(err);
  }
}
