import { Router } from 'express';
import * as quizzesController from '../controllers/quizzesController.js';

export const quizzesRoutes = Router();

quizzesRoutes.get('/', quizzesController.listar);
quizzesRoutes.get('/banco', quizzesController.banco);
quizzesRoutes.post('/', quizzesController.criar);
quizzesRoutes.put('/:id', quizzesController.atualizar);
quizzesRoutes.patch('/:id/ativo', quizzesController.alternarAtivo);
