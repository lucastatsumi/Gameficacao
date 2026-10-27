import { Router } from 'express';
import * as avaliacaoController from '../controllers/avaliacaoController.js';
import * as prestigioController from '../controllers/prestigioController.js';

export const avaliacaoRoutes = Router();

avaliacaoRoutes.get('/proficiencia', avaliacaoController.proficiencia);
avaliacaoRoutes.get('/competencias', avaliacaoController.competencias);
avaliacaoRoutes.get('/certificado/:temaId', avaliacaoController.certificado);
avaliacaoRoutes.get('/prestigio', prestigioController.status);
avaliacaoRoutes.post('/prestigio/:temaId', prestigioController.prestigiar);
avaliacaoRoutes.get('/cartas', avaliacaoController.album);
