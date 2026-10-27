import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';
import { gerarCodigoAcesso } from '../utils/random.js';

// Empresas e papéis (roadmap H5). Hierarquia: dono > gestor > colaborador.
// `profiles.role` (professor/aluno) é mantido em sincronia: dono e gestor
// são 'professor'; colaborador é 'aluno'.

export const PAPEIS = ['dono', 'gestor', 'colaborador'];

export function roleDoPapel(papel) {
  return papel === 'colaborador' ? 'aluno' : 'professor';
}

// Onboarding: quem cria a empresa vira dono.
export async function criarEmpresa(usuario, nome) {
  if (!nome?.trim()) throw new HttpError(400, 'Informe o nome da empresa');
  if (usuario.papel === 'dono') throw new HttpError(409, 'Você já é dono de uma empresa');

  let empresa = null;
  for (let i = 0; i < 5 && !empresa; i++) {
    const { data, error } = await db
      .from('empresas')
      .insert({ nome: nome.trim(), codigo_convite: gerarCodigoAcesso() })
      .select()
      .maybeSingle();
    if (!error) empresa = data;
    else if (error.code !== '23505') throw error;
  }
  if (!empresa) throw new HttpError(500, 'Não foi possível gerar um código de convite único');

  const { error } = await db
    .from('profiles')
    .update({ empresa_id: empresa.id, papel: 'dono', role: 'professor' })
    .eq('id', usuario.id);
  if (error) throw error;
  return empresa;
}

// Colaborador entra numa empresa existente pelo código de convite.
export async function entrarNaEmpresa(usuario, codigo) {
  if (!codigo?.trim()) throw new HttpError(400, 'Informe o código de convite');
  if (usuario.papel === 'dono' || usuario.papel === 'gestor') {
    throw new HttpError(409, 'Gestores e donos não trocam de empresa por convite');
  }

  const { data: empresa, error } = await db
    .from('empresas')
    .select('id, nome')
    .eq('codigo_convite', codigo.trim().toUpperCase())
    .maybeSingle();
  if (error) throw error;
  if (!empresa) throw new HttpError(404, 'Empresa não encontrada — confira o código');

  const { error: erroUp } = await db
    .from('profiles')
    .update({ empresa_id: empresa.id, papel: 'colaborador' })
    .eq('id', usuario.id);
  if (erroUp) throw erroUp;
  return empresa;
}

export async function minhaEmpresa(usuario) {
  if (!usuario.empresa_id) return null;
  const { data, error } = await db
    .from('empresas')
    .select('id, nome, codigo_convite')
    .eq('id', usuario.empresa_id)
    .maybeSingle();
  if (error) throw error;
  // O código de convite só é revelado a quem pode convidar.
  if (data && usuario.papel === 'colaborador') delete data.codigo_convite;
  return data;
}

export async function listarMembros(dono) {
  const { data, error } = await db
    .from('profiles')
    .select('id, nome, email, papel')
    .eq('empresa_id', dono.empresa_id)
    .order('nome');
  if (error) throw error;
  return data;
}

// Só o dono promove/rebaixa, e só dentro da própria empresa. Não pode criar
// outro dono nem mexer em si mesmo (a empresa nunca fica sem dono).
export async function definirPapel(dono, membroId, papel) {
  if (!['gestor', 'colaborador'].includes(papel)) {
    throw new HttpError(400, 'papel deve ser gestor ou colaborador');
  }
  if (membroId === dono.id) throw new HttpError(400, 'O dono não pode alterar o próprio papel');

  const { data, error } = await db
    .from('profiles')
    .update({ papel, role: roleDoPapel(papel) })
    .eq('id', membroId)
    .eq('empresa_id', dono.empresa_id)
    .neq('papel', 'dono')
    .select('id');
  if (error) throw error;
  if (!data?.length) throw new HttpError(404, 'Membro não encontrado na sua empresa');
}
