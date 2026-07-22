import { Router } from 'express';
import * as ligaController from '../controllers/ligaController.js';

export const ligaRoutes = Router();

ligaRoutes.get('/', ligaController.status);
