import * as faseService from '../services/faseService.js';

export async function listar(req, res, next) {
  try {
    const fases = await faseService.listarFasesComProgresso(req.usuario.id);
    res.json(fases);
  } catch (err) {
    next(err);
  }
}
