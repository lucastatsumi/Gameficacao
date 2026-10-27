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

// Resultado do desafio (base do torneio entre equipes): quem aceitou o
// convite registra a tentativa que jogou. O servidor confere tudo — a
// tentativa é do próprio usuário, já finalizada, do mesmo módulo e
// começada DEPOIS do convite — e decide a vitória (bater os acertos do
// criador). Um resultado por pessoa por desafio.
export async function registrarResultado(usuario, desafioId, tentativaId) {
  if (!tentativaId) throw new HttpError(400, 'tentativa_id é obrigatório');

  const { data: desafio, error } = await db
    .from('desafios')
    .select('id, criador_id, fase_id, acertos_alvo, criado_em, profiles ( empresa_id )')
    .eq('id', desafioId)
    .maybeSingle();
  if (error) throw error;
  if (!desafio || (desafio.profiles?.empresa_id ?? null) !== (usuario.empresa_id ?? null)) {
    throw new HttpError(404, 'Desafio não encontrado');
  }
  if (desafio.criador_id === usuario.id) {
    throw new HttpError(400, 'Você não pode responder ao próprio desafio');
  }

  const { data: tentativa, error: erroTentativa } = await db
    .from('tentativas')
    .select('id, fase_id, acertos, iniciada_em, finalizada_em')
    .eq('id', tentativaId)
    .eq('user_id', usuario.id)
    .maybeSingle();
  if (erroTentativa) throw erroTentativa;
  if (
    !tentativa ||
    !tentativa.finalizada_em ||
    tentativa.fase_id !== desafio.fase_id ||
    new Date(tentativa.iniciada_em) < new Date(desafio.criado_em)
  ) {
    throw new HttpError(400, 'Esta tentativa não vale para o desafio');
  }

  const venceu = tentativa.acertos > desafio.acertos_alvo;
  const { error: erroInsert } = await db.from('desafio_resultados').insert({
    desafio_id: desafio.id,
    user_id: usuario.id,
    tentativa_id: tentativa.id,
    acertos: tentativa.acertos,
    venceu,
  });
  if (erroInsert?.code === '23505') throw new HttpError(409, 'Você já registrou este desafio');
  if (erroInsert) throw erroInsert;

  return { venceu, acertos: tentativa.acertos, acertos_alvo: desafio.acertos_alvo };
}
