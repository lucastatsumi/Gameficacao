import { timingSafeEqual } from 'node:crypto';
import { HttpError } from '../utils/httpError.js';

// Protege as rotas de cron. A Vercel envia `Authorization: Bearer $CRON_SECRET`.
// Sem CRON_SECRET configurado a rota fica FECHADA (503) — nunca aberta.
export function cronAutorizado(req, _res, next) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return next(new HttpError(503, 'CRON_SECRET não configurado'));

  const recebido = Buffer.from(req.headers.authorization ?? '');
  const esperado = Buffer.from(`Bearer ${segredo}`);
  const igual = recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
  if (!igual) return next(new HttpError(401, 'Não autorizado'));
  next();
}
