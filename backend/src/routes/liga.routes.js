import { Router } from 'express';
import * as ligaService from '../services/ligaService.js';

export const ligaRoutes = Router();

// Estado da liga do jogador na semana atual + ranking da sua divisão.
ligaRoutes.get('/', async (req, res, next) => {
  try {
    res.json(await ligaService.rankingDaLiga(req.usuario.id));
  } catch (err) {
    next(err);
  }
});
