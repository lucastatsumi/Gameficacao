import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../services/api.js', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({ perfil: { id: 'user-1', nome: 'Ana' } }),
}));

const { api } = await import('../services/api.js');
const Ranking = (await import('./Ranking.jsx')).default;

function renderRanking() {
  return render(
    <MemoryRouter>
      <Ranking />
    </MemoryRouter>
  );
}

describe('Ranking — aba Liga (roadmap 4.5)', () => {
  it('ao trocar para a aba Liga, busca /liga e mostra divisão, xp da semana e ranking', async () => {
    api.get.mockImplementation((caminho) => {
      if (caminho === '/turmas') return Promise.resolve([]);
      if (caminho === '/fases') return Promise.resolve([]);
      if (caminho === '/liga') {
        return Promise.resolve({
          semana: '2026-W30',
          divisao: 'ouro',
          xp_semana: 35,
          posicao: 2,
          total_na_divisao: 3,
          ranking: [
            { posicao: 1, user_id: 'user-2', nome: 'Bea', xp_semana: 50 },
            { posicao: 2, user_id: 'user-1', nome: 'Ana', xp_semana: 35 },
            { posicao: 3, user_id: 'user-3', nome: 'Cid', xp_semana: 10 },
          ],
        });
      }
      return Promise.resolve(null);
    });

    renderRanking();

    await userEvent.click(screen.getByRole('button', { name: /Liga/i }));

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/liga'));

    expect(await screen.findByText('Ouro')).toBeInTheDocument();
    expect(screen.getAllByText('35').length).toBeGreaterThan(0);
    expect(screen.getByText('2º de 3')).toBeInTheDocument();
    expect(screen.getByText('Bea')).toBeInTheDocument();
    expect(screen.getByText('(você)')).toBeInTheDocument();
  });

  it('mostra o erro se /liga falhar', async () => {
    api.get.mockImplementation((caminho) => {
      if (caminho === '/turmas' || caminho === '/fases') return Promise.resolve([]);
      if (caminho === '/liga') return Promise.reject(new Error('Erro ao carregar a liga'));
      return Promise.resolve(null);
    });

    renderRanking();
    await userEvent.click(screen.getByRole('button', { name: /Liga/i }));

    expect(await screen.findByText('Erro ao carregar a liga')).toBeInTheDocument();
  });
});
