import { Router } from 'express';
import * as desafioDiarioService from '../services/desafioDiarioService.js';

export const desafioDiarioRoutes = Router();

// Status do dia: se já jogou + top 10 do ranking do dia
desafioDiarioRoutes.get('/', async (req, res, next) => {
  try {
    res.json(await desafioDiarioService.statusDoDia(req.usuario.id));
  } catch (err) {
    next(err);
  }
});

// Abre a tentativa do dia (payload no mesmo formato de /quiz/iniciar —
// a resposta/finalização seguem pelos endpoints normais de /quiz)
desafioDiarioRoutes.post('/iniciar', async (req, res, next) => {
  try {
    res.status(201).json(await desafioDiarioService.iniciarDesafioDiario(req.usuario.id));
  } catch (err) {
    next(err);
  }
});
