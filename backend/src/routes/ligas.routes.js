import { Router } from 'express';
import * as ligaService from '../services/ligaService.js';

export const ligasRoutes = Router();

ligasRoutes.get('/', async (req, res, next) => {
  try {
    res.json(await ligaService.ligaAtual(req.usuario.id, undefined, req.usuario.empresa_id));
  } catch (err) {
    next(err);
  }
});
