import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { traducoes, IDIOMAS_DISPONIVEIS } from '../i18n/translations.js';

const STORAGE_KEY = 'dataquest_idioma';
const I18nContext = createContext(null);

function idiomaInicial() {
  const salvo = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY);
  return IDIOMAS_DISPONIVEIS.includes(salvo) ? salvo : 'pt';
}

export function I18nProvider({ children }) {
  const [idioma, setIdiomaState] = useState(idiomaInicial);

  const setIdioma = useCallback((novo) => {
    if (!IDIOMAS_DISPONIVEIS.includes(novo)) return;
    setIdiomaState(novo);
    localStorage.setItem(STORAGE_KEY, novo);
  }, []);

  const t = useCallback(
    (chave) => traducoes[idioma]?.[chave] ?? traducoes.pt[chave] ?? chave,
    [idioma]
  );

  const valor = useMemo(() => ({ idioma, setIdioma, t }), [idioma, setIdioma, t]);

  return <I18nContext.Provider value={valor}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n precisa estar dentro de <I18nProvider>');
  return ctx;
}
