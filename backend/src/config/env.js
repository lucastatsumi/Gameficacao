import 'dotenv/config';

const obrigatorias = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY'];
const ausentes = obrigatorias.filter((nome) => !process.env[nome]);
if (ausentes.length) {
  throw new Error(
    `Variáveis de ambiente ausentes: ${ausentes.join(', ')}. ` +
    'Copie backend/.env.example para backend/.env e preencha os valores.'
  );
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
};
