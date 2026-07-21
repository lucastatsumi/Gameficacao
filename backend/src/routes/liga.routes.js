import { Router } from 'express';
import * as ligaController from '../controllers/ligaController.js';

export const ligaRoutes = Router();

// Meu quadro da liga semanal: divisão atual + ranking de xp_semana da
// divisão (cria o registro da semana no primeiro acesso, se necessário).
ligaRoutes.get('/', ligaController.minhaLiga);
