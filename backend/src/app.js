import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { rotas } from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

export const app = express();

app.use(cors({ origin: env.frontendUrl }));
// 4 MB: comporta o PDF (base64) da geração de questões a partir de documento
// da empresa — o teto de corpo da função na Vercel é ~4,5 MB.
app.use(express.json({ limit: '4mb' }));

// Health check (usado pelo Railway para saber se a API está de pé)
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api', rotas);

app.use((_req, res) => res.status(404).json({ erro: 'Rota não encontrada' }));
app.use(errorHandler);
