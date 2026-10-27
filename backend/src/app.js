import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { rotas } from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

export const app = express();

app.use(cors({ origin: env.frontendUrl }));
// Upload de documento (base64 de até 3 MB ≈ 4 MB de JSON): limite maior SÓ nesta
// rota; precisa vir antes do parser global, que usa o padrão de 100 kb.
app.use('/api/admin/ia/extrair-texto', express.json({ limit: '5mb' }));
app.use(express.json());

// Health check (usado pelo Railway para saber se a API está de pé)
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api', rotas);

app.use((_req, res) => res.status(404).json({ erro: 'Rota não encontrada' }));
app.use(errorHandler);
