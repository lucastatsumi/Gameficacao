import * as mascoteService from '../services/mascoteService.js';

export async function atual(req, res, next) {
  try {
    res.json(await mascoteService.mascoteDaTurma(req.usuario.id, req.params.turmaId));
  } catch (err) {
    next(err);
  }
}
