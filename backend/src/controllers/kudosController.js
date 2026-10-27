import * as kudosService from '../services/kudosService.js';

export async function resumo(req, res, next) {
  try {
    res.json(await kudosService.resumoDeKudos(req.usuario.id));
  } catch (err) {
    next(err);
  }
}

export async function dar(req, res, next) {
  try {
    res.status(201).json(await kudosService.darKudos(
        req.usuario.id,
        req.body?.para_usuario,
        undefined,
        req.usuario.empresa_id
      ));
  } catch (err) {
    next(err);
  }
}
