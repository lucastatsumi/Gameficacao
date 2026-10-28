import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { mesmoTenant } from '../utils/empresa.js';

// Horizonte 1 (database/35_temas_competencias.sql): temas são a unidade
// que a empresa escolhe treinar; fases viram módulos de um tema.

// Lógica pura: dados os temas ativos, os temas do catálogo ativados pela
// empresa e as atribuições das equipes do usuário, decide quais temas ele
// enxerga.
//  * tema próprio da empresa → visível; tema do catálogo → só se a empresa
//    o ativou. Sem empresa (espaço legado): todo o catálogo.
//  * colaborador em equipe(s) com trilha atribuída → só os temas
//    atribuídos (trilhas por equipe). Equipe sem atribuição não restringe.
export function filtrarTemasVisiveis({ temas, empresaId, ativadosCatalogo, atribuidosEquipes }) {
  const ativados = new Set(ativadosCatalogo);
  let visiveis = temas.filter((t) =>
    empresaId
      ? t.empresa_id === empresaId || (t.empresa_id == null && ativados.has(t.id))
      : t.empresa_id == null,
  );
  if (atribuidosEquipes?.length) {
    const atribuidos = new Set(atribuidosEquipes);
    visiveis = visiveis.filter((t) => atribuidos.has(t.id));
  }
  return visiveis;
}

export async function temasVisiveis(usuario) {
  const empresaId = usuario.empresa_id ?? null;

  const { data: temas, error } = await db
    .from('temas')
    .select('id, nome, descricao, icone, empresa_id')
    .eq('ativo', true)
    .order('id');
  if (error) throw error;

  let ativadosCatalogo = [];
  if (empresaId) {
    const { data, error: erroAtivados } = await db
      .from('empresa_temas')
      .select('tema_id')
      .eq('empresa_id', empresaId);
    if (erroAtivados) throw erroAtivados;
    ativadosCatalogo = data.map((r) => r.tema_id);
  }

  // Gestor enxerga todos os temas da empresa; a restrição por equipe vale
  // só para quem joga.
  let atribuidosEquipes = [];
  if (usuario.role !== 'professor') {
    const { data: matriculas, error: erroMatriculas } = await db
      .from('matriculas')
      .select('turma_id')
      .eq('user_id', usuario.id);
    if (erroMatriculas) throw erroMatriculas;
    if (matriculas.length) {
      const { data: atribuicoes, error: erroAtribuicoes } = await db
        .from('turma_temas')
        .select('tema_id')
        .in(
          'turma_id',
          matriculas.map((m) => m.turma_id),
        );
      if (erroAtribuicoes) throw erroAtribuicoes;
      atribuidosEquipes = atribuicoes.map((a) => a.tema_id);
    }
  }

  return filtrarTemasVisiveis({ temas, empresaId, ativadosCatalogo, atribuidosEquipes });
}

// Temas da EMPRESA inteira (sem a restrição de trilha por equipe) — base
// de tudo que precisa ser igual para todos da empresa, como o desafio
// diário.
export async function idsTemasDaEmpresa(empresaId) {
  return idsTemasVisiveis({ id: null, role: 'professor', empresa_id: empresaId ?? null });
}

export async function idsTemasVisiveis(usuario) {
  return (await temasVisiveis(usuario)).map((t) => t.id);
}

export async function exigirTemaVisivel(usuario, temaId) {
  const ids = await idsTemasVisiveis(usuario);
  if (!ids.includes(Number(temaId))) throw new HttpError(404, 'Tema não encontrado');
}

// Temas do usuário com o resumo de progresso (módulos concluídos/total)
// para a tela de escolha de trilha.
export async function listarTemas(usuario) {
  const temas = await temasVisiveis(usuario);
  if (!temas.length) return [];

  const [fasesRes, progressoRes] = await Promise.all([
    db
      .from('fases')
      .select('id, tema_id')
      .in(
        'tema_id',
        temas.map((t) => t.id),
      ),
    db.from('progresso_fase').select('fase_id, concluida').eq('user_id', usuario.id),
  ]);
  if (fasesRes.error) throw fasesRes.error;
  if (progressoRes.error) throw progressoRes.error;

  const concluidas = new Set(progressoRes.data.filter((p) => p.concluida).map((p) => p.fase_id));
  return temas.map((t) => {
    const modulos = fasesRes.data.filter((f) => f.tema_id === t.id);
    return {
      id: t.id,
      nome: t.nome,
      descricao: t.descricao,
      icone: t.icone,
      proprio: t.empresa_id != null,
      total_modulos: modulos.length,
      modulos_concluidos: modulos.filter((f) => concluidas.has(f.id)).length,
    };
  });
}

// Catálogo global (para o onboarding da empresa escolher o que ativar)
export async function catalogo() {
  const { data, error } = await db
    .from('temas')
    .select('id, nome, descricao, icone')
    .is('empresa_id', null)
    .eq('ativo', true)
    .order('id');
  if (error) throw error;
  return data;
}

// ---------- Gestor ----------

// Só edita conteúdo do PRÓPRIO tenant: gestor de empresa edita os temas
// da empresa; o gestor legado (sem empresa) edita o catálogo global.
export async function exigirTemaEditavel(usuario, temaId) {
  const { data, error } = await db
    .from('temas')
    .select('id, empresa_id')
    .eq('id', temaId)
    .maybeSingle();
  if (error) throw error;
  if (!data || !mesmoTenant(data.empresa_id, usuario.empresa_id)) {
    throw new HttpError(404, 'Tema não encontrado entre os temas editáveis da sua empresa');
  }
  return data;
}

export async function exigirFaseEditavel(usuario, faseId) {
  const { data, error } = await db
    .from('fases')
    .select('id, tema_id')
    .eq('id', faseId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'Módulo não encontrado');
  await exigirTemaEditavel(usuario, data.tema_id);
  return data;
}

export async function criarTema(usuario, dados) {
  const { nome, descricao = null, icone = 'map-pin' } = dados ?? {};
  if (!nome?.trim()) throw new HttpError(400, 'Informe o nome do tema');

  const { data, error } = await db
    .from('temas')
    .insert({
      nome: nome.trim(),
      descricao: descricao?.trim() || null,
      icone,
      empresa_id: usuario.empresa_id ?? null,
      criado_por: usuario.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Novo módulo no fim da trilha do tema: exige o anterior concluído.
// fases.ordem é única no banco inteiro (badges referenciam fase_ordem),
// então o módulo novo usa o próximo número livre global.
export async function criarModulo(usuario, temaId, dados) {
  await exigirTemaEditavel(usuario, temaId);
  const { nome, descricao = null } = dados ?? {};
  if (!nome?.trim()) throw new HttpError(400, 'Informe o nome do módulo');

  const [ultimoGlobal, ultimoDoTema] = await Promise.all([
    db.from('fases').select('ordem').order('ordem', { ascending: false }).limit(1).maybeSingle(),
    db
      .from('fases')
      .select('id')
      .eq('tema_id', temaId)
      .order('ordem', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (ultimoGlobal.error) throw ultimoGlobal.error;
  if (ultimoDoTema.error) throw ultimoDoTema.error;

  const { data, error } = await db
    .from('fases')
    .insert({
      nome: nome.trim(),
      descricao: descricao?.trim() || null,
      ordem: (ultimoGlobal.data?.ordem ?? 0) + 1,
      fase_requisito_id: ultimoDoTema.data?.id ?? null,
      tema_id: Number(temaId),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Temas que o gestor pode atribuir/editar, com módulos e competências
export async function temasDoGestor(usuario) {
  const temas = await temasVisiveis(usuario);
  if (!temas.length) return [];
  const ids = temas.map((t) => t.id);

  const [fasesRes, compRes] = await Promise.all([
    db.from('fases').select('id, nome, ordem, tema_id').in('tema_id', ids).order('ordem'),
    db
      .from('competencias')
      .select('id, nome, descricao, resumo, tema_id')
      .in('tema_id', ids)
      .order('id'),
  ]);
  if (fasesRes.error) throw fasesRes.error;
  if (compRes.error) throw compRes.error;

  return temas.map((t) => ({
    ...t,
    editavel: mesmoTenant(t.empresa_id, usuario.empresa_id),
    modulos: fasesRes.data.filter((f) => f.tema_id === t.id),
    competencias: compRes.data.filter((c) => c.tema_id === t.id),
  }));
}

export async function criarCompetencia(usuario, temaId, dados) {
  await exigirTemaEditavel(usuario, temaId);
  const { nome, descricao = null, resumo = '' } = dados ?? {};
  if (!nome?.trim()) throw new HttpError(400, 'Informe o nome da competência');

  const { data, error } = await db
    .from('competencias')
    .insert({
      tema_id: Number(temaId),
      nome: nome.trim(),
      descricao: descricao?.trim() || null,
      resumo: resumo.trim(),
    })
    .select()
    .single();
  if (error?.code === '23505')
    throw new HttpError(409, 'Já existe uma competência com esse nome no tema');
  if (error) throw error;
  return data;
}

// Trilhas por equipe: substitui o conjunto de temas atribuídos à turma.
// Lista vazia = equipe volta a ver todos os temas da empresa.
export async function definirTemasDaTurma(usuario, turmaId, temaIds) {
  if (!Array.isArray(temaIds)) throw new HttpError(400, 'tema_ids deve ser uma lista');

  const { data: turma, error } = await db
    .from('turmas')
    .select('id')
    .eq('id', turmaId)
    .eq('professor_id', usuario.id)
    .maybeSingle();
  if (error) throw error;
  if (!turma) throw new HttpError(404, 'Equipe não encontrada entre as suas equipes');

  const visiveis = new Set(await idsTemasVisiveis(usuario));
  const ids = [...new Set(temaIds.map(Number))];
  if (ids.some((id) => !visiveis.has(id))) {
    throw new HttpError(400, 'Só é possível atribuir temas ativos na sua empresa');
  }

  const { error: erroDelete } = await db.from('turma_temas').delete().eq('turma_id', turmaId);
  if (erroDelete) throw erroDelete;
  if (ids.length) {
    const { error: erroInsert } = await db
      .from('turma_temas')
      .insert(ids.map((tema_id) => ({ turma_id: turmaId, tema_id })));
    if (erroInsert) throw erroInsert;
  }
  return { turma_id: turmaId, tema_ids: ids };
}

export async function temasDaTurma(usuario, turmaId) {
  const { data: turma, error } = await db
    .from('turmas')
    .select('id')
    .eq('id', turmaId)
    .eq('professor_id', usuario.id)
    .maybeSingle();
  if (error) throw error;
  if (!turma) throw new HttpError(404, 'Equipe não encontrada entre as suas equipes');

  const { data, error: erroLista } = await db
    .from('turma_temas')
    .select('tema_id')
    .eq('turma_id', turmaId);
  if (erroLista) throw erroLista;
  return data.map((r) => r.tema_id);
}
