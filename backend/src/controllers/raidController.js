import * as raidService from '../services/raidService.js';

export async function lancar(req, res, next) {
  try {
    const raid = await raidService.lancarRaid(req.usuario.id, req.params.turmaId);
    res.status(201).json(raid);
  } catch (err) {
    next(err);
  }
}

export async function atual(req, res, next) {
  try {
    res.json(await raidService.raidAtivo(req.usuario.id, req.params.turmaId));
  } catch (err) {
    next(err);
  }
}
