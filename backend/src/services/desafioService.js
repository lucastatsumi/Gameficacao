import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';

// "Desafio assíncrono": recorte pequeno de multiplayer que não exige
// infra de tempo real. Um aluno desafia outro a bater a própria melhor
// pontuação numa fase; quem recebe o link só precisa estar logado (a app
// já exige isso em toda rota) para ver o desafio e jogar a fase.

export async function criarDesafio(userId, faseId) {
  if (!faseId) throw new HttpError(400, 'fase_id é obrigatório');

  const { data: progresso, error: erroProgresso } = await db
    .from('progresso_fase')
    .select('melhor_pontuacao')
    .eq('user_id', userId)
    .eq('fase_id', faseId)
    .maybeSingle();
  if (erroProgresso) throw erroProgresso;
  if (!progresso || progresso.melhor_pontuacao <= 0) {
    throw new HttpError(400, 'Jogue esta fase pelo menos uma vez antes de desafiar alguém');
  }

  const { data: criado, error } = await db
    .from('desafios')
    .insert({ criador_id: userId, fase_id: faseId, acertos_alvo: progresso.melhor_pontuacao })
    .select('id')
    .single();
  if (error) throw error;

  return { id: criado.id };
}

export async function obterDesafio(desafioId) {
  const { data, error } = await db
    .from('desafios')
    .select('id, acertos_alvo, criado_em, fases ( id, nome ), profiles ( nome )')
    .eq('id', desafioId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'Desafio não encontrado');

  return {
    id: data.id,
    fase: data.fases,
    criador_nome: data.profiles?.nome ?? 'Alguém',
    acertos_alvo: data.acertos_alvo,
    criado_em: data.criado_em,
  };
}
