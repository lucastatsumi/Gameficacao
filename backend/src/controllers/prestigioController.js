import * as prestigioService from '../services/prestigioService.js';

export async function status(req, res, next) {
  try {
    res.json(await prestigioService.statusDePrestigio(req.usuario.id));
  } catch (err) {
    next(err);
  }
}

export async function prestigiar(req, res, next) {
  try {
    res.status(201).json(await prestigioService.prestigiar(req.usuario.id, req.params.temaId));
  } catch (err) {
    next(err);
  }
}
