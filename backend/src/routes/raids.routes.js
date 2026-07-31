import { Router } from 'express';
import { exigirProfessor } from '../middlewares/auth.js';
import * as raidController from '../controllers/raidController.js';

export const raidsRoutes = Router();

// Lançar exige ser o gestor (professor) dono da turma — validado de novo
// dentro de raidService.lancarRaid via exigirTurmaDoProfessor.
raidsRoutes.post('/:turmaId/lancar', exigirProfessor, raidController.lancar);
raidsRoutes.get('/:turmaId', raidController.atual);
