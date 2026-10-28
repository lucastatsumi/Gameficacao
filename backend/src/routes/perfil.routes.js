import { Router } from 'express';
import * as perfilController from '../controllers/perfilController.js';

export const perfilRoutes = Router();

perfilRoutes.get('/', perfilController.perfil);
perfilRoutes.get('/badges', perfilController.badges);
perfilRoutes.get('/historico', perfilController.historico);
perfilRoutes.get('/revisao', perfilController.revisao);
perfilRoutes.get('/pendente', perfilController.pendente);
perfilRoutes.get('/missoes', perfilController.missoes);
perfilRoutes.get('/missoes/semana', perfilController.missoesSemana);
// Horizonte 3: avaliação (separada da gamificação)
perfilRoutes.get('/competencias', perfilController.competencias);
perfilRoutes.get('/proficiencia', perfilController.proficiencia);
perfilRoutes.get('/certificado/:temaId', perfilController.certificado);
// Horizonte 4: cartas, prestígio, campanhas e torneios
perfilRoutes.get('/cartas', perfilController.cartas);
perfilRoutes.get('/prestigio', perfilController.prestigios);
perfilRoutes.post('/prestigio/:temaId', perfilController.prestigiar);
perfilRoutes.get('/campanhas', perfilController.campanhas);
perfilRoutes.get('/campanhas/:campanhaId/ranking', perfilController.rankingCampanha);
perfilRoutes.get('/torneios', perfilController.torneios);
