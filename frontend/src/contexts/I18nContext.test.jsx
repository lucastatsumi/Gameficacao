import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider, useI18n } from './I18nContext.jsx';

function Sonda() {
  const { idioma, setIdioma, t } = useI18n();
  return (
    <div>
      <p data-testid="idioma">{idioma}</p>
      <p data-testid="texto">{t('nav.mapa')}</p>
      <button onClick={() => setIdioma('en')}>en</button>
      <button onClick={() => setIdioma('idioma-invalido')}>invalido</button>
    </div>
  );
}

describe('I18nContext', () => {
  beforeEach(() => localStorage.clear());

  it('começa em português por padrão', () => {
    render(
      <I18nProvider>
        <Sonda />
      </I18nProvider>
    );
    expect(screen.getByTestId('idioma')).toHaveTextContent('pt');
    expect(screen.getByTestId('texto')).toHaveTextContent('Mapa');
  });

  it('troca de idioma e persiste no localStorage', () => {
    render(
      <I18nProvider>
        <Sonda />
      </I18nProvider>
    );
    act(() => screen.getByText('en').click());
    expect(screen.getByTestId('idioma')).toHaveTextContent('en');
    expect(screen.getByTestId('texto')).toHaveTextContent('Map');
    expect(localStorage.getItem('dataquest_idioma')).toBe('en');
  });

  it('ignora idioma inválido (mantém o atual)', () => {
    render(
      <I18nProvider>
        <Sonda />
      </I18nProvider>
    );
    act(() => screen.getByText('invalido').click());
    expect(screen.getByTestId('idioma')).toHaveTextContent('pt');
  });

  it('chave desconhecida devolve a própria chave (nunca quebra a UI)', () => {
    function ChaveDesconhecida() {
      const { t } = useI18n();
      return <p data-testid="x">{t('chave.que.nao.existe')}</p>;
    }
    render(
      <I18nProvider>
        <ChaveDesconhecida />
      </I18nProvider>
    );
    expect(screen.getByTestId('x')).toHaveTextContent('chave.que.nao.existe');
  });
});
