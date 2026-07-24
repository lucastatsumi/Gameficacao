import { Router } from 'express';
import * as ligaService from '../services/ligaService.js';

export const ligasRoutes = Router();

// Classificação da divisão do jogador na semana corrente.
ligasRoutes.get('/', async (req, res, next) => {
  try {
    res.json(await ligaService.classificacaoDaLiga(req.usuario.id));
  } catch (err) {
    next(err);
  }
});
