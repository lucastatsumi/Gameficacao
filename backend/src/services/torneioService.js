import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { concederFichas } from './fichaService.js';

export const FICHAS_PODIO = [30, 15, 10]; // 1º, 2º, 3º lugar — por membro

// Lógica pura: ordena por XP médio por membro (empate: mais membros ativos
// primeiro não é critério — desempata pelo nome para ser determinístico).
export function calcularPlacar(equipes) {
  return equipes
    .map((e) => ({
      ...e,
      media_xp: e.membros ? Math.round((e.xp_total / e.membros) * 10) / 10 : 0,
    }))
    .sort((a, b) => b.media_xp - a.media_xp || a.nome.localeCompare(b.nome))
    .map((e, i) => ({ ...e, posicao: i + 1 }));
}

export async function criarTorneio(gestorId, { nome, inicio, fim, turma_ids }) {
  if (!nome?.trim()) throw new HttpError(400, 'Informe o nome do torneio');
  const ini = new Date(inicio);
  const f = new Date(fim);
  if (Number.isNaN(ini.getTime()) || Number.isNaN(f.getTime()) || f <= ini) {
    throw new HttpError(400, 'Período inválido: o fim deve ser depois do início');
  }
  if (!Array.isArray(turma_ids) || turma_ids.length < 2) {
    throw new HttpError(400, 'Escolha ao menos 2 equipes');
  }

  const { data: minhas, error: erroTurmas } = await db
    .from('turmas')
    .select('id')
    .eq('professor_id', gestorId)
    .in('id', turma_ids);
  if (erroTurmas) throw erroTurmas;
  if (minhas.length !== new Set(turma_ids).size) {
    throw new HttpError(404, 'Alguma equipe não pertence a você');
  }

  const { data: torneio, error } = await db
    .from('torneios')
    .insert({ gestor_id: gestorId, nome: nome.trim(), inicio: ini.toISOString(), fim: f.toISOString() })
    .select()
    .single();
  if (error) throw error;

  const { error: erroEq } = await db
    .from('torneio_equipes')
    .insert([...new Set(turma_ids)].map((turma_id) => ({ torneio_id: torneio.id, turma_id })));
  if (erroEq) {
    await db.from('torneios').delete().eq('id', torneio.id); // compensação
    throw erroEq;
  }
  return torneio;
}

async function buscarTorneio(torneioId) {
  const { data, error } = await db
    .from('torneios')
    .select('*, torneio_equipes ( turma_id, turmas ( id, nome, matriculas ( user_id ) ) )')
    .eq('id', torneioId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'Torneio não encontrado');
  return data;
}

export async function placarDoTorneio(torneioId) {
  const torneio = await buscarTorneio(torneioId);
  const equipes = torneio.torneio_equipes.map((te) => ({
    turma_id: te.turmas.id,
    nome: te.turmas.nome,
    membros_ids: te.turmas.matriculas.map((m) => m.user_id),
  }));
  const todos = [...new Set(equipes.flatMap((e) => e.membros_ids))];

  let tentativas = [];
  if (todos.length) {
    const { data, error } = await db
      .from('tentativas')
      .select('user_id, xp_ganho')
      .in('user_id', todos)
      .gte('finalizada_em', torneio.inicio)
      .lte('finalizada_em', torneio.fim);
    if (error) throw error;
    tentativas = data;
  }

  const placar = calcularPlacar(
    equipes.map((e) => ({
      turma_id: e.turma_id,
      nome: e.nome,
      membros: e.membros_ids.length,
      membros_ids: e.membros_ids,
      xp_total: tentativas
        .filter((t) => e.membros_ids.includes(t.user_id))
        .reduce((s, t) => s + t.xp_ganho, 0),
    }))
  );
  return { torneio, placar };
}

// Encerra e paga o pódio. A transição ativo→encerrado é condicional no
// banco: só quem a efetivar paga (evita pagamento duplo em chamadas
// concorrentes).
export async function encerrarTorneio(gestorId, torneioId, agora = new Date()) {
  const { torneio, placar } = await placarDoTorneio(torneioId);
  if (torneio.gestor_id !== gestorId) throw new HttpError(404, 'Torneio não encontrado');
  if (new Date(torneio.fim) > agora) throw new HttpError(409, 'O torneio ainda está em andamento');

  const { data: atualizado, error } = await db
    .from('torneios')
    .update({ status: 'encerrado' })
    .eq('id', torneioId)
    .eq('status', 'ativo')
    .select('id');
  if (error) throw error;
  if (!atualizado?.length) throw new HttpError(409, 'Torneio já encerrado');

  const tituloId = await idDoTituloCampeao();
  for (const equipe of placar.slice(0, FICHAS_PODIO.length)) {
    if (equipe.xp_total === 0) continue; // ninguém jogou: sem prêmio
    for (const userId of equipe.membros_ids) {
      await concederFichas(userId, FICHAS_PODIO[equipe.posicao - 1], 'torneio_podio', torneioId);
      if (equipe.posicao === 1 && tituloId) {
        const { error: erroItem } = await db
          .from('itens_do_jogador')
          .insert({ user_id: userId, item_id: tituloId });
        if (erroItem && erroItem.code !== '23505') throw erroItem; // já tinha o título
      }
    }
  }
  return placar.map(({ membros_ids: _ids, ...resto }) => resto);
}

async function idDoTituloCampeao() {
  const { data, error } = await db
    .from('itens_catalogo')
    .select('id')
    .eq('chave', 'titulo_campeao_torneio')
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null; // migração 44 ausente: segue só com as fichas
}

export async function listarTorneios(gestorId) {
  const { data, error } = await db
    .from('torneios')
    .select('id, nome, inicio, fim, status')
    .eq('gestor_id', gestorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
