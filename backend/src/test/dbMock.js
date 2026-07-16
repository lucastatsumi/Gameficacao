import { vi } from 'vitest';

const CHAIN_METHODS = [
  'select',
  'eq',
  'neq',
  'in',
  'order',
  'limit',
  'insert',
  'update',
  'upsert',
  'delete',
  'is',
  'not',
];

// Constrói um "query builder" falso do supabase-js: todo método de filtro
// devolve o próprio objeto (encadeável), e ele é "thenable" — funciona
// tanto para `await db.from(...).select(...).eq(...)` (sem terminal) quanto
// para `.maybeSingle()`/`.single()` explícitos.
export function makeChain(result) {
  const chain = {};
  for (const metodo of CHAIN_METHODS) {
    chain[metodo] = vi.fn(() => chain);
  }
  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
  chain.single = vi.fn(() => Promise.resolve(result));
  chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  chain.catch = (reject) => Promise.resolve(result).catch(reject);
  return chain;
}

// Cria um mock de `db` cujo `.from(tabela)` devolve, EM ORDEM DE CHAMADA,
// os resultados enfileirados para aquela tabela. Ex.:
//   makeDb({ fases: [{ data: fase, error: null }], tentativas: [...] })
//
// Cada chain criado fica disponível via `chainsPara(tabela)` para inspecionar
// com o que os métodos (insert/update/eq...) foram chamados.
export function makeDb(filaPorTabela) {
  const filas = Object.fromEntries(
    Object.entries(filaPorTabela).map(([tabela, resultados]) => [tabela, [...resultados]])
  );
  const chainsCriados = {};
  const from = vi.fn((tabela) => {
    const fila = filas[tabela];
    if (!fila || !fila.length) {
      throw new Error(`db.from('${tabela}') chamado sem resultado stubado (fila vazia)`);
    }
    const chain = makeChain(fila.shift());
    (chainsCriados[tabela] ??= []).push(chain);
    return chain;
  });
  return { from, chainsPara: (tabela) => chainsCriados[tabela] ?? [] };
}

export const ok = (data) => ({ data, error: null });
export const fail = (error) => ({ data: null, error });
