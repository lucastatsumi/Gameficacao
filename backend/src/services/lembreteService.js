import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { dataDeHoje } from '../utils/streak.js';

// Lembrete por e-mail (provedor: Resend). Quem está há DIAS_SEM_JOGAR ou mais
// sem finalizar um quiz recebe um lembrete, no máximo 1 a cada
// INTERVALO_DIAS, só se não tiver feito opt-out. Sem RESEND_API_KEY nada é
// enviado (503). O envio é disparado por uma rota de cron, nunca por usuário.

export const DIAS_SEM_JOGAR = 3;
export const INTERVALO_DIAS = 7;
export const MAX_POR_EXECUCAO = 100; // protege cota do provedor e o tempo da função
const DIA_MS = 24 * 60 * 60 * 1000;
const API_RESEND = 'https://api.resend.com/emails';

// Lógica pura. `streak_ultimo_dia` nulo = nunca jogou: não incomoda quem nem
// começou. Datas 'YYYY-MM-DD' (mesma convenção do streak).
export function selecionarDestinatarios(perfis, agora = new Date()) {
  const limiteInatividade = dataDeHoje(new Date(agora.getTime() - DIAS_SEM_JOGAR * DIA_MS));
  const limiteLembrete = agora.getTime() - INTERVALO_DIAS * DIA_MS;

  return perfis
    .filter((p) => p.email && p.lembretes_email !== false)
    .filter((p) => p.streak_ultimo_dia && p.streak_ultimo_dia <= limiteInatividade)
    .filter((p) => !p.ultimo_lembrete_em || new Date(p.ultimo_lembrete_em).getTime() <= limiteLembrete)
    .slice(0, MAX_POR_EXECUCAO);
}

const escapar = (t) =>
  String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function montarEmail(perfil, urlApp) {
  const nome = escapar(perfil.nome ?? 'colaborador');
  const streak = perfil.streak_dias > 1 ? ` Sua sequência de ${perfil.streak_dias} dias está em risco.` : '';
  return {
    assunto: 'Seu treinamento está te esperando',
    html: `<p>Olá, ${nome}!</p><p>Faz alguns dias que você não joga.${streak} Volte para um quiz rápido e mantenha o ritmo.</p><p><a href="${escapar(urlApp)}">Abrir o TeamQuest</a></p><p style="font-size:12px;color:#666">Não quer mais receber? Desative os lembretes no seu perfil.</p>`,
  };
}

async function enviarEmail({ para, assunto, html }) {
  const resposta = await fetch(API_RESEND, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ from: process.env.EMAIL_REMETENTE, to: [para], subject: assunto, html }),
  });
  if (!resposta.ok) throw new Error(`Resend respondeu ${resposta.status}`);
}

export async function enviarLembretes(agora = new Date()) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_REMETENTE) {
    throw new HttpError(503, 'Lembretes por e-mail não configurados (RESEND_API_KEY / EMAIL_REMETENTE)');
  }

  const { data, error } = await db
    .from('profiles')
    .select('id, nome, email, streak_dias, streak_ultimo_dia, lembretes_email, ultimo_lembrete_em')
    .eq('role', 'aluno')
    .eq('lembretes_email', true);
  if (error) throw error;

  const urlApp = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  let enviados = 0;
  let falhas = 0;
  for (const perfil of selecionarDestinatarios(data, agora)) {
    try {
      const { assunto, html } = montarEmail(perfil, urlApp);
      await enviarEmail({ para: perfil.email, assunto, html });
      // Marca SÓ depois de enviar: falha de envio tenta de novo na próxima execução.
      const { error: erroMarca } = await db
        .from('profiles')
        .update({ ultimo_lembrete_em: agora.toISOString() })
        .eq('id', perfil.id);
      if (erroMarca) throw erroMarca;
      enviados += 1;
    } catch {
      falhas += 1; // um destinatário com problema não derruba os demais
    }
  }
  return { enviados, falhas };
}

// Opt-out / opt-in pelo próprio usuário.
export async function definirLembretes(userId, ativo) {
  if (typeof ativo !== 'boolean') throw new HttpError(400, 'ativo deve ser true ou false');
  const { error } = await db.from('profiles').update({ lembretes_email: ativo }).eq('id', userId);
  if (error) throw error;
  return { lembretes_email: ativo };
}
