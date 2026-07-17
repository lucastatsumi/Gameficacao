import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useI18n } from '../contexts/I18nContext.jsx';
import Alerta from '../components/ui/Alerta.jsx';
import PixelIcon from '../components/ui/PixelIcon.jsx';

import heroTrilha from '../assets/img/hero-trilha.svg';
import pixelGamepad from '../assets/img/pixel-gamepad.svg';
import pixelTrofeu from '../assets/img/pixel-trofeu.svg';
import pixelEstrela from '../assets/img/pixel-estrela.svg';
import pixelNuvem from '../assets/img/pixel-nuvem.svg';

const inputCls =
  'w-full border-2 border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500';

export default function Login() {
  const { sessao, login, cadastrar } = useAuth();
  const { t } = useI18n();
  const [modo, setModo] = useState('login'); // 'login' | 'cadastro'
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (sessao) return <Navigate to="/" replace />;

  async function aoEnviar(e) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    setEnviando(true);
    try {
      if (modo === 'cadastro') {
        if (!nome.trim()) throw new Error(t('login.nomeObrigatorio'));
        await cadastrar(nome.trim(), email, senha);
        setAviso(t('login.contaCriada'));
        setModo('login');
      } else {
        await login(email, senha);
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fundo-grade scanlines relative min-h-screen overflow-hidden">
      {/* brilhos de fundo */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />

      {/* cenário pixel flutuante */}
      <img
        src={pixelNuvem}
        alt=""
        aria-hidden
        className="anim-flutuar-lento pointer-events-none absolute left-[4%] top-[10%] w-24 opacity-40 sm:w-32"
      />
      <img
        src={pixelNuvem}
        alt=""
        aria-hidden
        className="anim-flutuar pointer-events-none absolute right-[6%] top-[22%] w-16 opacity-30 sm:w-24"
      />
      <img
        src={pixelTrofeu}
        alt=""
        aria-hidden
        className="anim-flutuar pointer-events-none absolute right-[9%] top-[7%] w-10 sm:w-14"
      />
      <img
        src={pixelEstrela}
        alt=""
        aria-hidden
        className="anim-flutuar-rapido pointer-events-none absolute bottom-[12%] left-[8%] w-8 sm:w-10"
      />
      <img
        src={pixelEstrela}
        alt=""
        aria-hidden
        className="anim-flutuar-lento pointer-events-none absolute right-[14%] bottom-[18%] w-6 opacity-70 sm:w-8"
      />
      <PixelIcon
        nome="heart"
        className="anim-flutuar pointer-events-none absolute left-[14%] top-[30%] h-8 w-8 text-red-400/70"
      />
      <PixelIcon
        nome="zap"
        className="anim-flutuar-rapido pointer-events-none absolute right-[4%] bottom-[38%] h-8 w-8 text-amber-300/70"
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-10 px-4 py-10 lg:flex-row lg:gap-16">
        {/* ---------- coluna da marca ---------- */}
        <div className="max-w-lg text-center lg:text-left">
          <div className="flex items-center justify-center gap-4 lg:justify-start">
            <img
              src={pixelGamepad}
              alt="Controle de videogame pixel-art"
              className="w-16 sm:w-20"
            />
            <h1 className="font-pixel text-xl leading-relaxed text-indigo-300 sm:text-2xl">
              DataQuest
            </h1>
          </div>

          <p className="mt-4 text-lg text-slate-300">{t('login.subtitulo')}</p>

          <img
            src={heroTrilha}
            alt="Trilha de fases pixel-art: fases concluídas, fase atual e fase bloqueada"
            className="pixelado mx-auto mt-6 w-full max-w-md lg:mx-0"
          />

          <ul className="mt-6 grid gap-3 text-left text-sm text-slate-400 sm:grid-cols-3">
            <li className="card-pixel flex items-center gap-2 border-2 border-slate-800 bg-slate-900/60 px-3 py-2">
              <PixelIcon nome="map-pin" className="h-5 w-5 shrink-0 text-indigo-400" />
              {t('login.feature1')}
            </li>
            <li className="card-pixel flex items-center gap-2 border-2 border-slate-800 bg-slate-900/60 px-3 py-2">
              <PixelIcon nome="clock" className="h-5 w-5 shrink-0 text-amber-300" />
              {t('login.feature2')}
            </li>
            <li className="card-pixel flex items-center gap-2 border-2 border-slate-800 bg-slate-900/60 px-3 py-2">
              <PixelIcon nome="trophy" className="h-5 w-5 shrink-0 text-yellow-400" />
              {t('login.feature3')}
            </li>
          </ul>
        </div>

        {/* ---------- coluna do formulário ---------- */}
        <div className="w-full max-w-md">
          <div className="card-pixel border-2 border-indigo-900 bg-slate-900/80 p-6 backdrop-blur">
            <div className="mb-6 grid grid-cols-2 gap-1 bg-slate-800 p-1">
              {[
                ['login', t('login.entrar')],
                ['cadastro', t('login.criarConta')],
              ].map(([valor, rotulo]) => (
                <button
                  key={valor}
                  onClick={() => {
                    setModo(valor);
                    setErro(null);
                  }}
                  className={`py-2 text-sm font-medium transition-colors ${
                    modo === valor
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {rotulo}
                </button>
              ))}
            </div>

            <form onSubmit={aoEnviar} className="space-y-4">
              {modo === 'cadastro' && (
                <input
                  className={inputCls}
                  placeholder={t('login.nome')}
                  aria-label={t('login.nome')}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  autoComplete="name"
                />
              )}
              <input
                className={inputCls}
                type="email"
                placeholder={t('login.email')}
                aria-label={t('login.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <input
                className={inputCls}
                type="password"
                placeholder={t('login.senha')}
                aria-label={t('login.senha')}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={6}
              />

              <Alerta>{erro}</Alerta>
              <Alerta tipo="sucesso">{aviso}</Alerta>

              <button
                type="submit"
                disabled={enviando}
                className="btn-pixel flex w-full items-center justify-center gap-2 bg-indigo-600 py-3 font-pixel text-[11px] text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
              >
                <PixelIcon nome={modo === 'login' ? 'play' : 'star'} className="h-4 w-4" />
                {enviando ? t('login.aguarde') : modo === 'login' ? t('login.pressStart') : t('login.newGame')}
              </button>
            </form>
          </div>

          <p className="anim-piscar mt-4 text-center font-pixel text-[9px] text-slate-500">
            {t('login.insertCoin')}
          </p>

          <p className="mt-3 text-center text-xs text-slate-600">
            Ícones:{' '}
            <a
              href="https://pixelarticons.com"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-slate-400"
            >
              Pixelarticons
            </a>{' '}
            (MIT) · Fonte: Press Start 2P (OFL)
          </p>
        </div>
      </div>
    </div>
  );
}
