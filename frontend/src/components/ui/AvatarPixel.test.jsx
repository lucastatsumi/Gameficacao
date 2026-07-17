import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AvatarPixel from './AvatarPixel.jsx';

describe('AvatarPixel', () => {
  it('rotula o avatar com o nível recebido', () => {
    render(<AvatarPixel nivel={4} />);
    expect(screen.getByRole('img', { name: /nível 4/i })).toBeInTheDocument();
  });

  it('nível 1 (Aprendiz) não desenha bandana, ombreiras nem coroa', () => {
    const { container } = render(<AvatarPixel nivel={1} />);
    expect(container.querySelectorAll('polygon')).toHaveLength(0);
  });

  it('nível 10+ (Lenda) desenha a coroa (3 picos)', () => {
    const { container } = render(<AvatarPixel nivel={12} />);
    expect(container.querySelectorAll('polygon')).toHaveLength(3);
  });

  it('nível 6 (Especialista) tem ombreiras mas ainda não tem coroa', () => {
    const { container } = render(<AvatarPixel nivel={6} />);
    expect(container.querySelectorAll('polygon')).toHaveLength(0);
    // 2 ombreiras + as duas rects de olho + rects do rosto: só valida que
    // pelo menos as ombreiras (retângulos fora da grade 0-8) existem
    const rects = [...container.querySelectorAll('rect')];
    const temOmbreira = rects.some((r) => Number(r.getAttribute('x')) < 0);
    expect(temOmbreira).toBe(true);
  });
});
