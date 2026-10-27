import * as faseService from '../services/faseService.js';

export async function listar(req, res, next) {
  try {
    const temaId = req.query.tema_id ? Number(req.query.tema_id) : null;
    const fases = await faseService.listarFasesComProgresso(req.usuario, temaId);
    res.json(fases);
  } catch (err) {
    next(err);
  }
}
