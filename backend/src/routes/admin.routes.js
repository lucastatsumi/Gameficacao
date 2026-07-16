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

// Questões
adminRoutes.get('/questoes', adminController.listarQuestoes);
adminRoutes.post('/questoes', adminController.criarQuestao);
adminRoutes.put('/questoes/:id', adminController.atualizarQuestao);
adminRoutes.delete('/questoes/:id', adminController.desativarQuestao);

// Relatórios
adminRoutes.get('/relatorio/questoes', adminController.relatorioQuestoes);

// Eventos temporários
adminRoutes.get('/eventos', adminController.listarEventos);
adminRoutes.post('/eventos', adminController.criarEvento);
adminRoutes.delete('/eventos/:id', adminController.removerEvento);
