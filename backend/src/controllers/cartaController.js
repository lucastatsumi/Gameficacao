import * as cartaService from '../services/cartaService.js';

export async function listar(req, res, next) {
  try {
    res.json(await cartaService.listarCartas(req.usuario.id));
  } catch (err) {
    next(err);
  }
}
