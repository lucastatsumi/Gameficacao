import { Router } from 'express';
import { exigirDono } from '../middlewares/auth.js';
import * as empresaController from '../controllers/empresaController.js';

export const empresasRoutes = Router();

empresasRoutes.post('/', empresaController.criar);
empresasRoutes.post('/entrar', empresaController.entrar);
empresasRoutes.get('/minha', empresaController.minha);
empresasRoutes.get('/membros', exigirDono, empresaController.membros);
empresasRoutes.patch('/membros/:id/papel', exigirDono, empresaController.definirPapel);
