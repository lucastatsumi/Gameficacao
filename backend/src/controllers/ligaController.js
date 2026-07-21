import * as ligaService from '../services/ligaService.js';

export async function minhaLiga(req, res, next) {
  try {
    res.json(await ligaService.minhaLiga(req.usuario.id));
  } catch (err) {
    next(err);
  }
}
