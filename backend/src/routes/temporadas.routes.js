import { Router } from 'express';
import * as temporadaService from '../services/temporadaService.js';

export const temporadasRoutes = Router();

temporadasRoutes.get('/', async (req, res, next) => {
  try {
    res.json(
      await temporadaService.progressoDoJogador(req.usuario.id, new Date(), req.usuario.empresa_id),
    );
  } catch (err) {
    next(err);
  }
});

temporadasRoutes.get('/:temporadaId/hall-da-fama', async (req, res, next) => {
  try {
    res.json(await temporadaService.hallDaFama(req.params.temporadaId, req.usuario.empresa_id));
  } catch (err) {
    next(err);
  }
});
