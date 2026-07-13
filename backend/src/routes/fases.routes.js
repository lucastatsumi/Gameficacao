import { Router } from 'express';
import * as fasesController from '../controllers/fasesController.js';

export const fasesRoutes = Router();

fasesRoutes.get('/', fasesController.listar);
