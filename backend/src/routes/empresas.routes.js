import { Router } from 'express';
import * as empresaService from '../services/empresaService.js';

export const empresasRoutes = Router();

empresasRoutes.get('/minha', async (req, res, next) => {
  try {
    res.json(await empresaService.minhaEmpresa(req.usuario));
  } catch (err) {
    next(err);
  }
});

// Onboarding: cria o espaço da empresa (quem cria vira dono)
empresasRoutes.post('/', async (req, res, next) => {
  try {
    res.status(201).json(await empresaService.criarEmpresa(req.usuario, req.body));
  } catch (err) {
    next(err);
  }
});

empresasRoutes.post('/entrar', async (req, res, next) => {
  try {
    res.status(201).json(await empresaService.entrarNaEmpresa(req.usuario, req.body?.codigo));
  } catch (err) {
    next(err);
  }
});
