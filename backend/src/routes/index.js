import { Router } from 'express';
import { autenticar } from '../middlewares/auth.js';
import { fasesRoutes } from './fases.routes.js';
import { quizRoutes } from './quiz.routes.js';
import { quizzesRoutes } from './quizzes.routes.js';
import { rankingRoutes } from './ranking.routes.js';
import { turmasRoutes } from './turmas.routes.js';
import { perfilRoutes } from './perfil.routes.js';
import { adminRoutes } from './admin.routes.js';
import { desafiosRoutes } from './desafios.routes.js';

export const rotas = Router();

// Toda a API exige usuário autenticado (o cadastro/login é feito
// diretamente com o Supabase Auth pelo frontend)
rotas.use(autenticar);

rotas.use('/fases', fasesRoutes);
rotas.use('/quiz', quizRoutes);
rotas.use('/quizzes', quizzesRoutes);
rotas.use('/ranking', rankingRoutes);
rotas.use('/turmas', turmasRoutes);
rotas.use('/perfil', perfilRoutes);
rotas.use('/admin', adminRoutes);
rotas.use('/desafios', desafiosRoutes);
