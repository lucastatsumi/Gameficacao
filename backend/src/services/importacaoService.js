import { db } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';

// Importação de colaboradores por CSV (alternativa genérica à integração com
// HRIS, que depende do sistema de cada cliente). Colunas: nome, email, equipe
// (a equipe é opcional e deve ser o NOME de uma turma do próprio gestor).
// Cada pessoa recebe um convite por e-mail do Supabase Auth; ao criar o
// usuário o trigger handle_new_user cria o perfil, e aqui o associamos à
// empresa do gestor e à equipe.

export const MAX_LINHAS = 200;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Lógica pura: CSV com aspas, delimitador `,` ou `;` (detectado no cabeçalho).
export function parseCsv(texto) {
  const bruto = String(texto ?? '');
  const limpo = bruto.charCodeAt(0) === 0xfeff ? bruto.slice(1) : bruto; // remove BOM do Excel
  const primeira = limpo.split(/\r?\n/, 1)[0] ?? '';
  const sep = (primeira.match(/;/g) ?? []).length > (primeira.match(/,/g) ?? []).length ? ';' : ',';

  const linhas = [];
  let campo = '';
  let linha = [];
  let aspas = false;
  for (let i = 0; i < limpo.length; i++) {
    const c = limpo[i];
    if (aspas) {
      if (c === '"' && limpo[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) {
      linha.push(campo);
      campo = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && limpo[i + 1] === '\n') i++;
      linha.push(campo);
      campo = '';
      if (linha.some((x) => x.trim())) linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  linha.push(campo);
  if (linha.some((x) => x.trim())) linhas.push(linha);
  return linhas.map((l) => l.map((x) => x.trim()));
}

// Lógica pura: valida o cabeçalho e as linhas; devolve itens prontos e erros.
export function validarLinhas(matriz) {
  if (matriz.length < 2) throw new HttpError(400, 'O CSV precisa de cabeçalho e ao menos uma linha');
  const cab = matriz[0].map((c) =>
    c.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  );
  const iNome = cab.indexOf('nome');
  const iEmail = cab.indexOf('email');
  const iEquipe = cab.indexOf('equipe');
  if (iNome === -1 || iEmail === -1) {
    throw new HttpError(400, 'O cabeçalho deve ter as colunas "nome" e "email" (e opcionalmente "equipe")');
  }
  const dados = matriz.slice(1);
  if (dados.length > MAX_LINHAS) throw new HttpError(400, `No máximo ${MAX_LINHAS} linhas por importação`);

  const itens = [];
  const erros = [];
  const vistos = new Set();
  dados.forEach((l, i) => {
    const numero = i + 2; // linha no arquivo (1 = cabeçalho)
    const nome = l[iNome] ?? '';
    const email = (l[iEmail] ?? '').toLowerCase();
    const equipe = iEquipe === -1 ? '' : (l[iEquipe] ?? '');
    if (!nome) return erros.push({ linha: numero, email, erro: 'nome vazio' });
    if (!EMAIL.test(email)) return erros.push({ linha: numero, email, erro: 'e-mail inválido' });
    if (vistos.has(email)) return erros.push({ linha: numero, email, erro: 'e-mail repetido no arquivo' });
    vistos.add(email);
    itens.push({ linha: numero, nome, email, equipe });
  });
  return { itens, erros };
}

export async function importarColaboradores(gestor, csv) {
  if (!gestor.empresa_id) throw new HttpError(400, 'Crie ou entre numa empresa antes de importar colaboradores');
  const { itens, erros } = validarLinhas(parseCsv(csv));

  // Equipes do gestor, por nome (case-insensitive).
  const { data: turmas, error } = await db
    .from('turmas')
    .select('id, nome')
    .eq('professor_id', gestor.id);
  if (error) throw error;
  const turmaPorNome = new Map(turmas.map((t) => [t.nome.toLowerCase(), t.id]));

  const convidados = [];
  const resultadoErros = [...erros];
  for (const item of itens) {
    let turmaId = null;
    if (item.equipe) {
      turmaId = turmaPorNome.get(item.equipe.toLowerCase());
      if (!turmaId) {
        resultadoErros.push({ linha: item.linha, email: item.email, erro: `equipe "${item.equipe}" não encontrada` });
        continue;
      }
    }
    try {
      const { data, error: erroConvite } = await db.auth.admin.inviteUserByEmail(item.email, {
        data: { nome: item.nome },
      });
      if (erroConvite) throw erroConvite;
      const userId = data.user.id;

      const { error: erroPerfil } = await db
        .from('profiles')
        .update({ empresa_id: gestor.empresa_id, papel: 'colaborador' })
        .eq('id', userId);
      if (erroPerfil) throw erroPerfil;

      if (turmaId) {
        const { error: erroMat } = await db.from('matriculas').insert({ user_id: userId, turma_id: turmaId });
        if (erroMat && erroMat.code !== '23505') throw erroMat;
      }
      convidados.push({ linha: item.linha, email: item.email });
    } catch (e) {
      // Um e-mail com problema (ex.: já cadastrado) não derruba os demais.
      resultadoErros.push({ linha: item.linha, email: item.email, erro: e.message ?? 'falha ao convidar' });
    }
  }
  return {
    convidados: convidados.length,
    falhas: resultadoErros.length,
    erros: resultadoErros.sort((a, b) => a.linha - b.linha),
  };
}
