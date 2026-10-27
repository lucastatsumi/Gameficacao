import { Router } from 'express';
import * as avaliacaoController from '../controllers/avaliacaoController.js';

export const avaliacaoRoutes = Router();

avaliacaoRoutes.get('/proficiencia', avaliacaoController.proficiencia);
avaliacaoRoutes.get('/competencias', avaliacaoController.competencias);
avaliacaoRoutes.get('/certificado/:temaId', avaliacaoController.certificado);
