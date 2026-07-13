import { Router } from 'express';
import * as rankingController from '../controllers/rankingController.js';

export const rankingRoutes = Router();

rankingRoutes.get('/global', rankingController.global);
rankingRoutes.get('/turma/:turmaId', rankingController.porTurma);
rankingRoutes.get('/fase/:faseId', rankingController.porFase);
