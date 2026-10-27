// SSO corporativo (SAML) via Supabase Auth: o provedor é registrado por domínio
// no painel/CLI do Supabase; o app só descobre o domínio do e-mail e inicia o
// fluxo. Sem provedor cadastrado para o domínio, o Supabase devolve erro.
export function dominioDoEmail(email) {
  const m = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/.exec(String(email ?? '').trim().toLowerCase());
  return m ? m[1] : null;
}
