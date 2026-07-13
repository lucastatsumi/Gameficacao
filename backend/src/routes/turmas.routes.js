import { Router } from 'express';
import * as turmasController from '../controllers/turmasController.js';

export const turmasRoutes = Router();

turmasRoutes.post('/entrar', turmasController.entrar);
turmasRoutes.get('/', turmasController.minhas);
