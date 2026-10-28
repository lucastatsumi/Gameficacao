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

// IA: geração (manual ou a partir de documento), auditoria e revisão.
// Nada gerado entra em produção sem aprovação aqui.
adminRoutes.post('/ia/gerar', adminController.gerarQuestoesIa);
adminRoutes.post('/ia/documento', adminController.gerarDeDocumentoIa);
adminRoutes.post('/ia/auditar/:temaId', adminController.auditarTemaIa);
adminRoutes.get('/ia/rascunhos', adminController.listarRascunhosIa);
adminRoutes.post('/ia/rascunhos/:id/aprovar', adminController.aprovarRascunho);
adminRoutes.post('/ia/rascunhos/:id/descartar', adminController.descartarRascunho);
adminRoutes.get('/ia/custos', adminController.custosIa);

// Respostas abertas corrigidas por IA: o gestor revisa e sobrescreve
adminRoutes.get('/avaliacoes-abertas', adminController.listarAvaliacoesAbertas);
adminRoutes.put('/avaliacoes-abertas/:respostaId', adminController.revisarAvaliacaoAberta);

// Campanhas temáticas e torneios entre equipes
adminRoutes.get('/campanhas', adminController.listarCampanhas);
adminRoutes.post('/campanhas', adminController.criarCampanha);
adminRoutes.get('/campanhas/:campanhaId/ranking', adminController.rankingCampanha);
adminRoutes.get('/torneios', adminController.listarTorneios);
adminRoutes.post('/torneios', adminController.criarTorneio);

// Dashboard com evolução temporal (snapshots diários por equipe)
adminRoutes.get('/turmas/:turmaId/evolucao', adminController.evolucaoDaEquipe);

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
