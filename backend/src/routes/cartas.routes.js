import { Router } from 'express';
import * as cartaController from '../controllers/cartaController.js';

export const cartasRoutes = Router();

cartasRoutes.get('/', cartaController.listar);
