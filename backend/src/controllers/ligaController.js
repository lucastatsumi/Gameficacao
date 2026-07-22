import * as ligaService from '../services/ligaService.js';

export async function status(req, res, next) {
  try {
    res.json(await ligaService.statusDaLiga(req.usuario.id));
  } catch (err) {
    next(err);
  }
}
