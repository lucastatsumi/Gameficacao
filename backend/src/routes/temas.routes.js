import { Router } from 'express';
import * as temaService from '../services/temaService.js';

export const temasRoutes = Router();

// Temas visíveis para o usuário (empresa + trilha da equipe), com resumo
// de progresso
temasRoutes.get('/', async (req, res, next) => {
  try {
    res.json(await temaService.listarTemas(req.usuario));
  } catch (err) {
    next(err);
  }
});

// Catálogo global — usado no onboarding para escolher os temas da empresa
temasRoutes.get('/catalogo', async (_req, res, next) => {
  try {
    res.json(await temaService.catalogo());
  } catch (err) {
    next(err);
  }
});
