import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { doTenant, mesmoTenant } from '../utils/empresa.js';
import { concederFichas } from './fichaService.js';

// Torneio entre equipes: numa janela de tempo, as vitórias nos desafios
// assíncronos (desafio_resultados.venceu) dos membros de cada equipe
// viram o placar da equipe. Encerrado o período, o primeiro acesso paga
// as fichas aos membros da equipe campeã — `premiado_em` é a trava
// (update condicional), então duas requisições simultâneas não pagam duas
// vezes (mesma ideia do fechamento lazy das ligas).

export async function criarTorneio(gestor, dados) {
  const { nome, inicio, fim, fichas_premio = 50 } = dados ?? {};
  if (!nome?.trim()) throw new HttpError(400, 'Informe o nome do torneio');
  if (!inicio || !fim || new Date(fim) <= new Date(inicio)) {
    throw new HttpError(400, 'O fim do torneio deve ser depois do início');
  }
  if (!Number.isInteger(Number(fichas_premio)) || Number(fichas_premio) < 1) {
    throw new HttpError(400, 'fichas_premio deve ser um inteiro >= 1');
  }
  const { data, error } = await db
    .from('torneios')
    .insert({
      empresa_id: gestor.empresa_id ?? null,
      nome: nome.trim(),
      inicio: new Date(inicio).toISOString(),
      fim: new Date(fim).toISOString(),
      fichas_premio: Number(fichas_premio),
      criado_por: gestor.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Lógica pura: vitórias por equipe a partir das vitórias por usuário e
// das matrículas. Quem está em mais de uma equipe pontua para todas.
export function montarPlacar(vitoriasPorUsuario, matriculas, turmas) {
  const placar = new Map(turmas.map((t) => [t.id, { turma_id: t.id, nome: t.nome, vitorias: 0, membros: 0 }]));
  for (const m of matriculas) {
    const linha = placar.get(m.turma_id);
    if (!linha) continue;
    linha.membros += 1;
    linha.vitorias += vitoriasPorUsuario.get(m.user_id) ?? 0;
  }
  return [...placar.values()]
    .sort((a, b) => b.vitorias - a.vitorias || a.nome.localeCompare(b.nome))
    .map((linha, i) => ({ posicao: i + 1, ...linha }));
}

async function placarDoTorneio(torneio) {
  const { data: turmas, error } = await doTenant(
    db.from('turmas').select('id, nome'),
    torneio.empresa_id
  );
  if (error) throw error;
  if (!turmas.length) return { placar: [], matriculas: [] };

  const { data: matriculas, error: erroMatriculas } = await db
    .from('matriculas')
    .select('user_id, turma_id')
    .in(
      'turma_id',
      turmas.map((t) => t.id)
    );
  if (erroMatriculas) throw erroMatriculas;

  const { data: vitorias, error: erroVitorias } = await db
    .from('desafio_resultados')
    .select('user_id')
    .eq('venceu', true)
    .gte('registrado_em', torneio.inicio)
    .lte('registrado_em', torneio.fim)
    .in('user_id', [...new Set(matriculas.map((m) => m.user_id))]);
  if (erroVitorias) throw erroVitorias;

  const porUsuario = new Map();
  for (const v of vitorias) porUsuario.set(v.user_id, (porUsuario.get(v.user_id) ?? 0) + 1);
  return { placar: montarPlacar(porUsuario, matriculas, turmas), matriculas };
}

// Pagamento do pódio (lazy): só a requisição que conseguir marcar
// premiado_em paga.
async function premiarSeEncerrado(torneio, placar, matriculas, agora = new Date()) {
  if (torneio.premiado_em || agora <= new Date(torneio.fim)) return torneio;
  const campea = placar[0];
  const { data: travado, error } = await db
    .from('torneios')
    .update({ premiado_em: agora.toISOString(), equipe_campea: campea?.vitorias ? campea.turma_id : null })
    .eq('id', torneio.id)
    .is('premiado_em', null)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!travado) return torneio; // outra requisição já premiou

  if (campea?.vitorias) {
    const membros = matriculas.filter((m) => m.turma_id === campea.turma_id).map((m) => m.user_id);
    for (const userId of membros) {
      await concederFichas(userId, torneio.fichas_premio, 'torneio_campeao', String(torneio.id));
    }
  }
  return travado;
}

export async function torneiosDoTenant(usuario, agora = new Date()) {
  const { data, error } = await doTenant(db.from('torneios').select('*'), usuario.empresa_id)
    .order('inicio', { ascending: false })
    .limit(10);
  if (error) throw error;

  return Promise.all(
    data.map(async (torneio) => {
      const { placar, matriculas } = await placarDoTorneio(torneio);
      const atualizado = await premiarSeEncerrado(torneio, placar, matriculas, agora);
      const status =
        agora < new Date(torneio.inicio) ? 'futuro' : agora > new Date(torneio.fim) ? 'encerrado' : 'ativo';
      return { ...atualizado, status, placar };
    })
  );
}

export async function exigirTorneioDoTenant(usuario, torneioId) {
  const { data, error } = await db.from('torneios').select('*').eq('id', torneioId).maybeSingle();
  if (error) throw error;
  if (!data || !mesmoTenant(data.empresa_id, usuario.empresa_id)) {
    throw new HttpError(404, 'Torneio não encontrado');
  }
  return data;
}
