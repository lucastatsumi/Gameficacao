import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { dominioDoEmail } from '../lib/sso.js';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const carregarPerfil = useCallback(async () => {
    try {
      setPerfil(await api.get('/perfil'));
    } catch {
      setPerfil(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session);
      if (!data.session) setCarregando(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSessao(novaSessao);
      if (!novaSessao) setPerfil(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sessao) return;
    carregarPerfil().finally(() => setCarregando(false));
  }, [sessao, carregarPerfil]);

  async function login(email, senha) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) throw new Error(traduzirErroAuth(error.message));
  }

  // SSO corporativo: redireciona ao provedor (SAML) registrado para o domínio.
  async function loginSso(email) {
    const domain = dominioDoEmail(email);
    if (!domain) throw new Error('Informe seu e-mail corporativo');
    const { data, error } = await supabase.auth.signInWithSSO({
      domain,
      options: { redirectTo: window.location.origin },
    });
    if (error) throw new Error(traduzirErroAuth(error.message));
    window.location.assign(data.url);
  }

  async function cadastrar(nome, email, senha) {
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } }, // o trigger handle_new_user usa este metadata
    });
    if (error) throw new Error(traduzirErroAuth(error.message));
  }

  async function sair() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        sessao,
        perfil,
        carregando,
        login,
        loginSso,
        cadastrar,
        sair,
        recarregarPerfil: carregarPerfil,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}

function traduzirErroAuth(mensagem) {
  const mapa = {
    'Invalid login credentials': 'E-mail ou senha incorretos',
    'No SSO provider assigned for this domain':
      'Sua empresa ainda não configurou o login corporativo (SSO)',
    'User already registered': 'Este e-mail já está cadastrado',
    'Password should be at least 6 characters.': 'A senha deve ter pelo menos 6 caracteres',
    'Email not confirmed': 'Confirme seu e-mail antes de entrar',
  };
  return mapa[mensagem] ?? mensagem;
}
