import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { rotas } from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

export const app = express();

app.use(cors({ origin: env.frontendUrl }));
app.use(express.json());

// Health check (usado pelo Railway para saber se a API está de pé)
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api', rotas);

app.use((_req, res) => res.status(404).json({ erro: 'Rota não encontrada' }));
app.use(errorHandler);
