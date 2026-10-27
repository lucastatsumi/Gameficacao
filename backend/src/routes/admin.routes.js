import { Router } from 'express';
import { exigirProfessor } from '../middlewares/auth.js';
import * as adminController from '../controllers/adminController.js';

export const adminRoutes = Router();

// Todas as rotas de admin exigem role = professor
adminRoutes.use(exigirProfessor);

// Turmas
adminRoutes.post('/turmas', adminController.criarTurma);
adminRoutes.get('/turmas', adminController.listarTurmas);
adminRoutes.get('/turmas/:turmaId/alunos', adminController.alunosDaTurma);
adminRoutes.get('/turmas/:turmaId/relatorio.csv', adminController.exportarCsvTurma);
adminRoutes.get('/turmas/:turmaId/competencias', adminController.matrizDaEquipe);

// Questões
adminRoutes.get('/questoes', adminController.listarQuestoes);
adminRoutes.post('/questoes', adminController.criarQuestao);
adminRoutes.put('/questoes/:id', adminController.atualizarQuestao);
adminRoutes.delete('/questoes/:id', adminController.desativarQuestao);

// Temas, módulos e competências
adminRoutes.get('/temas', adminController.listarTemas);
adminRoutes.post('/temas', adminController.criarTema);
adminRoutes.post('/temas/:temaId/modulos', adminController.criarModulo);
adminRoutes.post('/temas/:temaId/competencias', adminController.criarCompetencia);
adminRoutes.get('/turmas/:turmaId/temas', adminController.temasDaTurma);
adminRoutes.put('/turmas/:turmaId/temas', adminController.definirTemasDaTurma);

// Empresa (dono): membros, papéis e temas do catálogo ativos
adminRoutes.get('/empresa/membros', adminController.membros);
adminRoutes.put('/empresa/membros/:userId/papel', adminController.definirPapel);
adminRoutes.put('/empresa/temas', adminController.definirTemasAtivos);

// Relatórios
adminRoutes.get('/relatorio/questoes', adminController.relatorioQuestoes);
adminRoutes.get('/relatorio/fases', adminController.relatorioFases);

// Eventos temporários
adminRoutes.get('/eventos', adminController.listarEventos);
adminRoutes.post('/eventos', adminController.criarEvento);
adminRoutes.delete('/eventos/:id', adminController.removerEvento);

// Temporadas
adminRoutes.get('/temporadas', adminController.listarTemporadas);
adminRoutes.post('/temporadas', adminController.criarTemporada);
adminRoutes.put('/temporadas/:temporadaId/trilha', adminController.definirTrilhaTemporada);
