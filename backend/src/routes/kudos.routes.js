import { Router } from 'express';
import * as kudosController from '../controllers/kudosController.js';

export const kudosRoutes = Router();

kudosRoutes.get('/', kudosController.resumo);
kudosRoutes.post('/', kudosController.dar);
