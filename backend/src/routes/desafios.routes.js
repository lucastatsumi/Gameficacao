import { Router } from 'express';
import * as desafioController from '../controllers/desafioController.js';

export const desafiosRoutes = Router();

desafiosRoutes.post('/', desafioController.criar);
desafiosRoutes.get('/:id', desafioController.obter);
