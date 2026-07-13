import { supabase } from '../lib/supabase.js';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

async function tokenAtual() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token ?? null;
}

async function request(caminho, { method = 'GET', body } = {}) {
  const token = await tokenAtual();
  const resposta = await fetch(`${API_URL}${caminho}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (resposta.status === 204) return null;

  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new Error(dados?.erro ?? `Erro ${resposta.status} ao chamar a API`);
  }
  return dados;
}

export const api = {
  get: (caminho) => request(caminho),
  post: (caminho, body) => request(caminho, { method: 'POST', body }),
  put: (caminho, body) => request(caminho, { method: 'PUT', body }),
  patch: (caminho, body) => request(caminho, { method: 'PATCH', body }),
  delete: (caminho) => request(caminho, { method: 'DELETE' }),

  // Download autenticado (ex.: CSV do relatório da turma)
  async baixarArquivo(caminho, nomePadrao) {
    const token = await tokenAtual();
    const resposta = await fetch(`${API_URL}${caminho}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!resposta.ok) throw new Error('Não foi possível baixar o arquivo');

    const blob = await resposta.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download =
      resposta.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ?? nomePadrao;
    link.click();
    URL.revokeObjectURL(url);
  },
};
