import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { gerarCodigoAcesso } from '../utils/random.js';

// Onboarding da empresa (Horizonte 1) + papéis granulares (Horizonte 5).
// Ver database/36_empresas_multitenancy.sql. Papel e role andam juntos:
// dono/gestor => role 'professor' (acesso ao painel), colaborador => 'aluno'.

const PAPEIS_ATRIBUIVEIS = ['gestor', 'colaborador'];

export function roleDoPapel(papel) {
  return papel === 'colaborador' ? 'aluno' : 'professor';
}

async function exigirSemEmpresa(usuario) {
  if (usuario.empresa_id) throw new HttpError(409, 'Você já faz parte de uma empresa');
}

async function temasDoCatalogoValidos(temaIds) {
  if (!Array.isArray(temaIds) || !temaIds.length) {
    throw new HttpError(400, 'Escolha pelo menos um tema do catálogo');
  }
  const ids = [...new Set(temaIds.map(Number))];
  const { data, error } = await db
    .from('temas')
    .select('id')
    .in('id', ids)
    .is('empresa_id', null)
    .eq('ativo', true);
  if (error) throw error;
  if (data.length !== ids.length)
    throw new HttpError(400, 'Algum tema escolhido não está no catálogo');
  return ids;
}

// Cria o espaço da empresa: quem cria vira dono (e gestor no painel) e já
// escolhe os temas do catálogo que a empresa vai treinar.
export async function criarEmpresa(usuario, dados) {
  await exigirSemEmpresa(usuario);
  const { nome, tema_ids } = dados ?? {};
  if (!nome?.trim()) throw new HttpError(400, 'Informe o nome da empresa');
  const temaIds = await temasDoCatalogoValidos(tema_ids);

  let empresa = null;
  // Código é único: em caso de colisão (raro), sorteia outro
  for (let i = 0; i < 5 && !empresa; i++) {
    const { data, error } = await db
      .from('empresas')
      .insert({ nome: nome.trim(), dono_id: usuario.id, codigo_convite: gerarCodigoAcesso(8) })
      .select()
      .maybeSingle();
    if (error && error.code !== '23505') throw error;
    empresa = data;
  }
  if (!empresa) throw new HttpError(500, 'Não foi possível gerar um código de convite único');

  const { error: erroTemas } = await db
    .from('empresa_temas')
    .insert(temaIds.map((tema_id) => ({ empresa_id: empresa.id, tema_id })));
  if (erroTemas) {
    await db.from('empresas').delete().eq('id', empresa.id); // compensação
    throw erroTemas;
  }

  const { error: erroPerfil } = await db
    .from('profiles')
    .update({ empresa_id: empresa.id, papel: 'dono', role: 'professor' })
    .eq('id', usuario.id);
  if (erroPerfil) throw erroPerfil;

  return { ...empresa, tema_ids: temaIds };
}

export async function entrarNaEmpresa(usuario, codigo) {
  await exigirSemEmpresa(usuario);
  if (!codigo?.trim()) throw new HttpError(400, 'Informe o código de convite');

  const { data: empresa, error } = await db
    .from('empresas')
    .select('id, nome')
    .eq('codigo_convite', codigo.trim().toUpperCase())
    .maybeSingle();
  if (error) throw error;
  if (!empresa) throw new HttpError(404, 'Empresa não encontrada — confira o código');

  // Gestor legado que entra numa empresa passa a ser colaborador dela; o
  // dono promove depois, se for o caso.
  const { error: erroPerfil } = await db
    .from('profiles')
    .update({ empresa_id: empresa.id, papel: 'colaborador', role: 'aluno' })
    .eq('id', usuario.id);
  if (erroPerfil) throw erroPerfil;

  return empresa;
}

export async function minhaEmpresa(usuario) {
  if (!usuario.empresa_id) return null;

  const { data: empresa, error } = await db
    .from('empresas')
    .select('id, nome, codigo_convite, dono_id, created_at')
    .eq('id', usuario.empresa_id)
    .maybeSingle();
  if (error) throw error;
  if (!empresa) return null;

  const { data: temas, error: erroTemas } = await db
    .from('empresa_temas')
    .select('tema_id')
    .eq('empresa_id', empresa.id);
  if (erroTemas) throw erroTemas;

  // Código de convite só para quem pode convidar
  const podeConvidar = usuario.papel === 'dono' || usuario.papel === 'gestor';
  return {
    id: empresa.id,
    nome: empresa.nome,
    codigo_convite: podeConvidar ? empresa.codigo_convite : null,
    meu_papel: usuario.papel,
    tema_ids: temas.map((t) => t.tema_id),
  };
}

function exigirDono(usuario) {
  if (!usuario.empresa_id || usuario.papel !== 'dono') {
    throw new HttpError(403, 'Apenas o dono da empresa pode fazer isso');
  }
}

export async function membros(usuario) {
  exigirDono(usuario);
  const { data, error } = await db
    .from('profiles')
    .select('id, nome, email, papel, nivel, xp_total')
    .eq('empresa_id', usuario.empresa_id)
    .order('nome');
  if (error) throw error;
  return data;
}

export async function definirPapel(usuario, membroId, papel) {
  exigirDono(usuario);
  if (!PAPEIS_ATRIBUIVEIS.includes(papel)) {
    throw new HttpError(400, `papel deve ser: ${PAPEIS_ATRIBUIVEIS.join(', ')}`);
  }
  if (membroId === usuario.id) throw new HttpError(400, 'O dono não pode alterar o próprio papel');

  const { data, error } = await db
    .from('profiles')
    .update({ papel, role: roleDoPapel(papel) })
    .eq('id', membroId)
    .eq('empresa_id', usuario.empresa_id)
    .select('id, nome, papel')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'Membro não encontrado na sua empresa');
  return data;
}

// Substitui os temas do catálogo ativados pela empresa
export async function definirTemasAtivos(usuario, temaIds) {
  exigirDono(usuario);
  const ids = await temasDoCatalogoValidos(temaIds);

  const { error: erroDelete } = await db
    .from('empresa_temas')
    .delete()
    .eq('empresa_id', usuario.empresa_id);
  if (erroDelete) throw erroDelete;
  const { error } = await db
    .from('empresa_temas')
    .insert(ids.map((tema_id) => ({ empresa_id: usuario.empresa_id, tema_id })));
  if (error) throw error;
  return { tema_ids: ids };
}
