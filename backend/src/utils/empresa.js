// Multi-tenancy (database/36_empresas_multitenancy.sql): `empresa_id` null
// é o espaço legado e se comporta como um tenant próprio — quem não tem
// empresa só enxerga quem também não tem. Toda query que cruza dados de
// usuários diferentes passa por aqui, porque o backend usa service_role
// (ignora RLS) e o isolamento é responsabilidade do Express.
export function doTenant(query, empresaId, coluna = 'empresa_id') {
  return empresaId ? query.eq(coluna, empresaId) : query.is(coluna, null);
}

// Mesma regra, para comparar registros já carregados em memória.
export function mesmoTenant(a, b) {
  return (a ?? null) === (b ?? null);
}
