// Entrypoint serverless da Vercel. O app Express é uma função (req, res),
// então basta exportá-lo. As variáveis de ambiente são injetadas pela
// Vercel (Project Settings > Environment Variables) antes do cold start.
import { app } from '../src/app.js';

export default app;
