import { Router } from 'express';
import { exigirProfessor } from '../middlewares/auth.js';
import * as adminController from '../controllers/adminController.js';
import * as trilhaController from '../controllers/trilhaController.js';
import * as campanhaController from '../controllers/campanhaController.js';
import * as iaController from '../controllers/iaController.js';
import * as torneioController from '../controllers/torneioController.js';

export const adminRoutes = Router();

// Todas as rotas de admin exigem role = professor
adminRoutes.use(exigirProfessor);

// Turmas
adminRoutes.post('/turmas', adminController.criarTurma);
adminRoutes.get('/turmas', adminController.listarTurmas);
adminRoutes.get('/turmas/:turmaId/alunos', adminController.alunosDaTurma);
adminRoutes.get('/turmas/:turmaId/evolucao', adminController.evolucaoDaTurma);
adminRoutes.get('/turmas/:turmaId/relatorio.csv', adminController.exportarCsvTurma);

// Temas e trilhas por equipe
adminRoutes.get('/temas', trilhaController.listarTemas);
adminRoutes.post('/temas', trilhaController.criarTema);
adminRoutes.get('/turmas/:turmaId/temas', trilhaController.temasDaTurma);
adminRoutes.put('/turmas/:turmaId/temas', trilhaController.definirTemasDaTurma);

// Campanhas temáticas
adminRoutes.post('/campanhas', campanhaController.criar);
adminRoutes.get('/campanhas', campanhaController.listar);
adminRoutes.get('/campanhas/:id/ranking', campanhaController.ranking);

// Torneios entre equipes
adminRoutes.post('/torneios', torneioController.criar);
adminRoutes.get('/torneios', torneioController.listar);
adminRoutes.get('/torneios/:id/placar', torneioController.placar);
adminRoutes.post('/torneios/:id/encerrar', torneioController.encerrar);

// Questões geradas por IA (sempre rascunho até aprovação humana)
adminRoutes.post('/ia/gerar', iaController.gerar);
adminRoutes.get('/ia/rascunhos', iaController.listar);
adminRoutes.post('/ia/rascunhos/:id/aprovar', iaController.aprovar);
adminRoutes.delete('/ia/rascunhos/:id', iaController.descartar);
adminRoutes.post('/ia/extrair-texto', iaController.extrairTexto);
adminRoutes.post('/ia/auditar', iaController.auditar);
adminRoutes.get('/ia/sugestoes', iaController.sugestoes);
adminRoutes.patch('/ia/sugestoes/:id', iaController.resolverSugestao);

// Respostas abertas (revisão da nota dada pela IA)
adminRoutes.get('/respostas-abertas', iaController.respostasAbertas);
adminRoutes.patch('/respostas-abertas/:id', iaController.revisarResposta);

// Questões
adminRoutes.get('/questoes', adminController.listarQuestoes);
adminRoutes.post('/questoes', adminController.criarQuestao);
adminRoutes.put('/questoes/:id', adminController.atualizarQuestao);
adminRoutes.delete('/questoes/:id', adminController.desativarQuestao);

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
