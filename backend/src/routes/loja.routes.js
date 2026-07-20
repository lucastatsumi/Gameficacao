import { Router } from 'express';
import * as lojaService from '../services/lojaService.js';

export const lojaRoutes = Router();

lojaRoutes.get('/', async (req, res, next) => {
  try {
    res.json(await lojaService.listarCatalogo(req.usuario.id));
  } catch (err) {
    next(err);
  }
});

lojaRoutes.post('/comprar', async (req, res, next) => {
  try {
    res.json(await lojaService.comprarItem(req.usuario.id, req.body?.item_id));
  } catch (err) {
    next(err);
  }
});

lojaRoutes.post('/equipar', async (req, res, next) => {
  try {
    res.json(await lojaService.equiparItem(req.usuario.id, req.body ?? {}));
  } catch (err) {
    next(err);
  }
});
