import { Router } from 'express';
import * as quizController from '../controllers/quizController.js';

export const quizRoutes = Router();

quizRoutes.post('/iniciar', quizController.iniciar);
quizRoutes.post('/iniciar-custom', quizController.iniciarCustom);
quizRoutes.post('/dica', quizController.dica);
quizRoutes.post('/responder', quizController.responder);
quizRoutes.post('/finalizar', quizController.finalizar);
quizRoutes.post('/poder', quizController.usarPoder);
