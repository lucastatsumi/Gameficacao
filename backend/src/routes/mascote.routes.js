import { Router } from 'express';
import * as mascoteController from '../controllers/mascoteController.js';

export const mascoteRoutes = Router();

mascoteRoutes.get('/:turmaId', mascoteController.atual);
