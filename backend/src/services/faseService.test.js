import { describe, it, expect } from 'vitest';
import { montarMapaFases } from './faseService.js';

function fase(id, ordem, fase_requisito_id = null) {
  return { id, nome: `Fase ${ordem}`, descricao: `Descrição ${ordem}`, ordem, fase_requisito_id };
}

describe('montarMapaFases', () => {
  it('a primeira fase (sem requisito) nasce desbloqueada', () => {
    const mapa = montarMapaFases([fase(1, 1)], []);
    expect(mapa[0].desbloqueada).toBe(true);
    expect(mapa[0].progresso).toBe(null);
  });

  it('fase com requisito fica bloqueada enquanto o requisito não for concluído', () => {
    const fases = [fase(1, 1), fase(2, 2, 1)];
    const mapa = montarMapaFases(fases, [{ fase_id: 1, concluida: false }]);
    expect(mapa.find((f) => f.id === 2).desbloqueada).toBe(false);
  });

  it('fase com requisito desbloqueia quando o requisito é concluído', () => {
    const fases = [fase(1, 1), fase(2, 2, 1)];
    const mapa = montarMapaFases(fases, [{ fase_id: 1, concluida: true }]);
    expect(mapa.find((f) => f.id === 2).desbloqueada).toBe(true);
  });

  it('progresso existente é anexado à fase correspondente', () => {
    const progresso = { fase_id: 1, concluida: true, estrelas: 3 };
    const mapa = montarMapaFases([fase(1, 1)], [progresso]);
    expect(mapa[0].progresso).toEqual(progresso);
  });

  it('preserva os campos públicos da fase e ignora colunas extras', () => {
    const mapa = montarMapaFases([{ ...fase(1, 1), coluna_interna: 'x' }], []);
    expect(mapa[0]).toEqual({
      id: 1,
      nome: 'Fase 1',
      descricao: 'Descrição 1',
      ordem: 1,
      desbloqueada: true,
      progresso: null,
    });
  });

  it('sem progresso nenhum, só as fases sem requisito abrem', () => {
    const fases = [fase(1, 1), fase(2, 2, 1), fase(3, 3, 2)];
    const mapa = montarMapaFases(fases, []);
    expect(mapa.map((f) => f.desbloqueada)).toEqual([true, false, false]);
  });
});
