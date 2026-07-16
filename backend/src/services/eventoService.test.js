import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { eventoAtivoParaFase, criarEvento, listarEventos, removerEvento } = await import(
  './eventoService.js'
);

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

beforeEach(() => vi.clearAllMocks());

describe('eventoAtivoParaFase', () => {
  it('retorna null quando não há eventos', async () => {
    configurarDb({ eventos: [ok([])] });
    expect(await eventoAtivoParaFase(1)).toBeNull();
  });

  it('ignora evento de outra fase específica', async () => {
    configurarDb({
      eventos: [ok([{ id: 1, fase_id: 2, multiplicador_xp: 2 }])],
    });
    expect(await eventoAtivoParaFase(1)).toBeNull();
  });

  it('aplica evento com fase_id null a qualquer fase', async () => {
    configurarDb({
      eventos: [ok([{ id: 1, fase_id: null, multiplicador_xp: 1.5 }])],
    });
    const evento = await eventoAtivoParaFase(5);
    expect(evento.multiplicador_xp).toBe(1.5);
  });

  it('com múltiplos eventos aplicáveis, escolhe o maior multiplicador', async () => {
    configurarDb({
      eventos: [
        ok([
          { id: 1, fase_id: null, multiplicador_xp: 1.5 },
          { id: 2, fase_id: 3, multiplicador_xp: 3 },
          { id: 3, fase_id: 3, multiplicador_xp: 2 },
        ]),
      ],
    });
    const evento = await eventoAtivoParaFase(3);
    expect(evento.id).toBe(2);
    expect(evento.multiplicador_xp).toBe(3);
  });
});

describe('criarEvento — validação', () => {
  it('rejeita nome vazio', async () => {
    await expect(
      criarEvento({ nome: '  ', multiplicador_xp: 2, inicio: '2026-01-01', fim: '2026-01-08' })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejeita multiplicador <= 1', async () => {
    await expect(
      criarEvento({ nome: 'Evento', multiplicador_xp: 1, inicio: '2026-01-01', fim: '2026-01-08' })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejeita fim antes ou igual ao início', async () => {
    await expect(
      criarEvento({ nome: 'Evento', multiplicador_xp: 2, inicio: '2026-01-08', fim: '2026-01-01' })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('cria com fase_id null quando não informado (vale pra qualquer fase)', async () => {
    const mock = configurarDb({ eventos: [ok({ id: 1, nome: 'Evento', fase_id: null }) ] });
    await criarEvento({ nome: 'Evento', multiplicador_xp: 2, inicio: '2026-01-01', fim: '2026-01-08' });

    const insertChain = mock.chainsPara('eventos')[0];
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Evento', fase_id: null, multiplicador_xp: 2 })
    );
  });
});

describe('listarEventos', () => {
  it('classifica status por futuro/ativo/encerrado comparando com agora', async () => {
    const agora = new Date();
    const ontem = new Date(agora.getTime() - 86_400_000).toISOString();
    const amanha = new Date(agora.getTime() + 86_400_000).toISOString();
    const depoisDeAmanha = new Date(agora.getTime() + 2 * 86_400_000).toISOString();

    configurarDb({
      eventos: [
        ok([
          { id: 1, nome: 'Passado', inicio: ontem, fim: ontem },
          { id: 2, nome: 'Presente', inicio: ontem, fim: amanha },
          { id: 3, nome: 'Futuro', inicio: amanha, fim: depoisDeAmanha },
        ]),
      ],
    });

    const eventos = await listarEventos();
    expect(eventos.find((e) => e.id === 1).status).toBe('encerrado');
    expect(eventos.find((e) => e.id === 2).status).toBe('ativo');
    expect(eventos.find((e) => e.id === 3).status).toBe('futuro');
  });
});

describe('removerEvento', () => {
  it('deleta pelo id', async () => {
    const mock = configurarDb({ eventos: [ok(null)] });
    await removerEvento(5);

    const deleteChain = mock.chainsPara('eventos')[0];
    expect(deleteChain.delete).toHaveBeenCalled();
    expect(deleteChain.eq).toHaveBeenCalledWith('id', 5);
  });
});
