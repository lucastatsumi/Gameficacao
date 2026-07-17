import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import CartaoStat from './CartaoStat.jsx';

describe('CartaoStat', () => {
  it('mostra o rótulo e o valor', () => {
    render(<CartaoStat rotulo="XP total" valor={150} />);
    expect(screen.getByText('XP total')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('não tem violações de acessibilidade detectáveis automaticamente (axe-core)', async () => {
    const { container } = render(<CartaoStat rotulo="XP total" valor={150} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('aplica o estilo de destaque quando destaque=true', () => {
    render(<CartaoStat rotulo="XP ganho" valor="+10" destaque />);
    expect(screen.getByText('+10')).toHaveClass('text-indigo-300');
  });

  it('sem destaque, usa o estilo padrão', () => {
    render(<CartaoStat rotulo="Nível" valor={3} />);
    expect(screen.getByText('3')).toHaveClass('text-slate-100');
  });
});
