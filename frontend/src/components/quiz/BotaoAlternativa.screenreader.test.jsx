import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { virtual } from '@guidepup/virtual-screen-reader';
import BotaoAlternativa from './BotaoAlternativa.jsx';

// Simulação de leitor de tela (não é NVDA/JAWS/VoiceOver real — ver aviso
// em docs/ROADMAP.md) que percorre a árvore de acessibilidade computada a
// partir das especificações W3C (ACCNAME/CORE-AAM/ARIA) e reproduz a
// sequência de frases que um leitor de tela real anunciaria. Mais próximo
// da experiência real do que o axe-core (que só verifica regras estáticas,
// nunca "lê" a página) — mas ainda uma simulação, não o software real.
const ALT = { id: 'a1', letra: 'A', texto: 'Pilha (LIFO)' };

describe('BotaoAlternativa — simulação de leitor de tela', () => {
  afterEach(async () => {
    await virtual.stop();
  });

  it('anuncia o botão com o texto da alternativa (sem feedback ainda)', async () => {
    render(<BotaoAlternativa alt={ALT} feedback={null} selecionada={null} aoClicar={() => {}} />);
    await virtual.start({ container: document.body });

    while ((await virtual.lastSpokenPhrase()) !== 'end of document') {
      await virtual.next();
    }

    const falas = await virtual.spokenPhraseLog();
    expect(falas.some((f) => f.includes('button'))).toBe(true);
    expect(falas.some((f) => f.includes('Pilha (LIFO)'))).toBe(true);
  });

  it('anuncia o botão como desabilitado quando desabilitado=true', async () => {
    render(
      <BotaoAlternativa alt={ALT} feedback={null} selecionada={null} desabilitado aoClicar={() => {}} />
    );
    await virtual.start({ container: document.body });

    while ((await virtual.lastSpokenPhrase()) !== 'end of document') {
      await virtual.next();
    }

    const falas = await virtual.spokenPhraseLog();
    expect(falas.some((f) => /dimmed|disabled/i.test(f))).toBe(true);
  });

  it('com feedback, a explicação também é anunciada (não é só visual)', async () => {
    const feedback = {
      alternativa_correta: { id: 'a1' },
      explicacoes: [{ id: 'a1', explicacao: 'Correto: pilha segue LIFO.' }],
    };
    render(
      <BotaoAlternativa alt={ALT} feedback={feedback} selecionada="a1" aoClicar={() => {}} />
    );
    await virtual.start({ container: document.body });

    while ((await virtual.lastSpokenPhrase()) !== 'end of document') {
      await virtual.next();
    }

    const falas = await virtual.spokenPhraseLog();
    expect(falas.some((f) => f.includes('Correto: pilha segue LIFO.'))).toBe(true);
  });
});
