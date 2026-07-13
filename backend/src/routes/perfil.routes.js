import { Router } from 'express';
import * as perfilController from '../controllers/perfilController.js';

export const perfilRoutes = Router();

perfilRoutes.get('/', perfilController.perfil);
perfilRoutes.get('/badges', perfilController.badges);
perfilRoutes.get('/historico', perfilController.historico);
