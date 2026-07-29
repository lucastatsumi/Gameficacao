import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroConexao, setErroConexao] = useState(false);

  const carregarPerfil = useCallback(async () => {
    try {
      setPerfil(await api.get('/perfil'));
    } catch {
      setPerfil(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSessao(data.session);
        if (!data.session) setCarregando(false);
      })
      .catch(() => {
        // Falha de rede/serviço (ex.: projeto Supabase indisponível) não pode
        // deixar a tela presa num spinner infinito — cai para "sem sessão".
        setErroConexao(true);
        setCarregando(false);
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
    const { error } = await tentarAuth(() =>
      supabase.auth.signInWithPassword({ email, password: senha }),
    );
    if (error) throw new Error(traduzirErroAuth(error.message));
  }

  async function cadastrar(nome, email, senha) {
    const { error } = await tentarAuth(() =>
      supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { nome } }, // o trigger handle_new_user usa este metadata
      }),
    );
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
        erroConexao,
        login,
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

// Envolve chamadas de auth do Supabase: uma falha de REDE (serviço fora do
// ar) lança um TypeError bruto, não o formato { error } do SDK — normaliza
// os dois formatos para que a UI sempre tenha uma mensagem amigável.
async function tentarAuth(chamada) {
  try {
    return await chamada();
  } catch {
    return { error: { message: 'Falha de conexão' } };
  }
}

function traduzirErroAuth(mensagem) {
  const mapa = {
    'Invalid login credentials': 'E-mail ou senha incorretos',
    'User already registered': 'Este e-mail já está cadastrado',
    'Password should be at least 6 characters.': 'A senha deve ter pelo menos 6 caracteres',
    'Email not confirmed': 'Confirme seu e-mail antes de entrar',
    'Falha de conexão': 'Não foi possível conectar ao serviço. Tente novamente em instantes.',
  };
  return mapa[mensagem] ?? mensagem;
}
