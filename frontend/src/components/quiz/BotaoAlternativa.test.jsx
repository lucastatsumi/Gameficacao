import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BotaoAlternativa from './BotaoAlternativa.jsx';

const ALT_A = { id: 'a1', letra: 'A', texto: 'Pilha (LIFO)' };
const ALT_B = { id: 'a2', letra: 'B', texto: 'Fila (FIFO)' };

describe('BotaoAlternativa', () => {
  it('chama aoClicar quando clicado, sem feedback ainda', () => {
    const aoClicar = vi.fn();
    render(<BotaoAlternativa alt={ALT_A} feedback={null} selecionada={null} aoClicar={aoClicar} />);

    fireEvent.click(screen.getByText('Pilha (LIFO)'));
    expect(aoClicar).toHaveBeenCalledTimes(1);
  });

  it('fica desabilitado quando desabilitado=true', () => {
    render(<BotaoAlternativa alt={ALT_A} feedback={null} selecionada={null} desabilitado aoClicar={() => {}} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('com feedback, mostra a explicação da alternativa escolhida', () => {
    const feedback = {
      alternativa_correta: { id: 'a2' },
      explicacoes: [
        { id: 'a1', explicacao: 'Pilha não é FIFO.' },
        { id: 'a2', explicacao: 'Fila segue ordem de chegada.' },
      ],
    };
    render(
      <BotaoAlternativa alt={ALT_A} feedback={feedback} selecionada="a1" aoClicar={() => {}} />
    );
    expect(screen.getByText('Pilha não é FIFO.')).toBeInTheDocument();
  });

  it('com feedback, não mostra explicação de alternativa não escolhida e não correta', () => {
    const feedback = {
      alternativa_correta: { id: 'a2' },
      explicacoes: [
        { id: 'a1', explicacao: 'Não deveria aparecer.' },
        { id: 'a2', explicacao: 'Certa.' },
      ],
    };
    render(
      <BotaoAlternativa alt={ALT_A} feedback={feedback} selecionada="algum-outro-id" aoClicar={() => {}} />
    );
    expect(screen.queryByText('Não deveria aparecer.')).not.toBeInTheDocument();
  });
});
