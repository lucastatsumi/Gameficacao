import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useI18n } from '../contexts/I18nContext.jsx';
import BarraXp from './ui/BarraXp.jsx';
import PixelIcon from './ui/PixelIcon.jsx';
import pixelGamepad from '../assets/img/pixel-gamepad.svg';

function LinkNav({ para, icone, children }) {
  return (
    <NavLink
      to={para}
      // O rótulo some no mobile (hidden sm:inline) e o ícone é aria-hidden;
      // sem aria-label o link ficaria sem nome acessível em telas pequenas.
      aria-label={children}
      className={({ isActive }) =>
        `flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'border-indigo-400 bg-indigo-500/10 text-indigo-300'
            : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        }`
      }
    >
      <PixelIcon nome={icone} className="h-4 w-4" />
      <span className="hidden sm:inline">{children}</span>
    </NavLink>
  );
}

export default function Layout() {
  const { perfil, sair } = useAuth();
  const { idioma, setIdioma, t } = useI18n();
  const navegar = useNavigate();

  async function aoSair() {
    await sair();
    navegar('/login');
  }

  return (
    <div className="min-h-screen">
      {/* Link de salto para quem navega por teclado/leitor de tela: fica oculto
          até receber foco, evitando tabular por toda a navegação. */}
      <a
        href="#conteudo"
        className="sr-only z-20 bg-indigo-600 px-4 py-2 font-medium text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-3"
      >
        Pular para o conteúdo
      </a>
      <header className="sticky top-0 z-10 border-b-2 border-indigo-950 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2">
            <img src={pixelGamepad} alt="" aria-hidden className="w-9" />
            <span className="font-pixel text-xs text-indigo-300">DataQuest</span>
          </NavLink>

          <nav className="flex">
            <LinkNav para="/" icone="map-pin">
              {t('nav.mapa')}
            </LinkNav>
            <LinkNav para="/quizzes" icone="gamepad">
              {t('nav.quizzes')}
            </LinkNav>
            <LinkNav para="/ranking" icone="trophy">
              {t('nav.ranking')}
            </LinkNav>
            <LinkNav para="/perfil" icone="user">
              {t('nav.perfil')}
            </LinkNav>
            {perfil?.role === 'professor' && (
              <LinkNav para="/admin" icone="briefcase">
                {t('nav.admin')}
              </LinkNav>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {perfil && (
              <div className="hidden items-center gap-2 sm:flex">
                <span className="border border-indigo-500/40 bg-indigo-500/20 px-2.5 py-1 font-pixel text-[10px] text-indigo-300">
                  {t('nav.nivel')}
                  {perfil.nivel}
                </span>
                <BarraXp perfil={perfil} compacta />
                <span className="flex items-center gap-1 text-xs text-amber-300">
                  <PixelIcon nome="coins" className="h-4 w-4" />
                  {perfil.xp_total}
                </span>
              </div>
            )}
            <button
              onClick={() => setIdioma(idioma === 'pt' ? 'en' : 'pt')}
              title={idioma === 'pt' ? 'Switch to English' : 'Mudar para Português'}
              className="px-2 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              {idioma === 'pt' ? 'EN' : 'PT'}
            </button>
            <button
              onClick={aoSair}
              title={t('nav.sair')}
              aria-label={t('nav.sair')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <PixelIcon nome="logout" className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.sair')}</span>
            </button>
          </div>
        </div>
      </header>

      <main id="conteudo" className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
