import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDb, ok } from '../test/dbMock.js';

vi.mock('../config/supabase.js', () => ({ db: { from: vi.fn() } }));

const { db } = await import('../config/supabase.js');
const { selecionarDestinatarios, montarEmail, enviarLembretes, definirLembretes } = await import(
  './lembreteService.js'
);

function configurarDb(filas) {
  const mock = makeDb(filas);
  db.from.mockImplementation(mock.from);
  return mock;
}

const AGORA = new Date('2026-10-20T12:00:00Z');
const base = { email: 'a@x.com', lembretes_email: true, ultimo_lembrete_em: null };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESEND_API_KEY = 're_teste';
  process.env.EMAIL_REMETENTE = 'TeamQuest <ola@exemplo.com>';
});
afterEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_REMETENTE;
});

describe('selecionarDestinatarios', () => {
  it('só quem está há 3+ dias sem jogar', () => {
    const r = selecionarDestinatarios(
      [
        { ...base, id: 'recente', streak_ultimo_dia: '2026-10-19' },
        { ...base, id: 'limite', streak_ultimo_dia: '2026-10-17' },
        { ...base, id: 'antigo', streak_ultimo_dia: '2026-09-01' },
      ],
      AGORA
    );
    expect(r.map((p) => p.id)).toEqual(['limite', 'antigo']);
  });

  it('ignora quem nunca jogou, fez opt-out ou não tem e-mail', () => {
    const r = selecionarDestinatarios(
      [
        { ...base, id: 'nunca', streak_ultimo_dia: null },
        { ...base, id: 'optout', streak_ultimo_dia: '2026-09-01', lembretes_email: false },
        { ...base, id: 'sem-email', streak_ultimo_dia: '2026-09-01', email: null },
      ],
      AGORA
    );
    expect(r).toEqual([]);
  });

  it('respeita o intervalo de 7 dias entre lembretes', () => {
    const r = selecionarDestinatarios(
      [
        { ...base, id: 'ontem', streak_ultimo_dia: '2026-09-01', ultimo_lembrete_em: '2026-10-19T12:00:00Z' },
        { ...base, id: 'faz-8', streak_ultimo_dia: '2026-09-01', ultimo_lembrete_em: '2026-10-12T00:00:00Z' },
      ],
      AGORA
    );
    expect(r.map((p) => p.id)).toEqual(['faz-8']);
  });
});

describe('montarEmail', () => {
  it('escapa HTML do nome (sem injeção)', () => {
    const { html } = montarEmail({ nome: '<script>x</script>', streak_dias: 0 }, 'https://app');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
  it('menciona a sequência em risco só quando há streak', () => {
    expect(montarEmail({ nome: 'A', streak_dias: 5 }, 'u').html).toContain('5 dias');
    expect(montarEmail({ nome: 'A', streak_dias: 1 }, 'u').html).not.toContain('sequência');
  });
});

describe('enviarLembretes', () => {
  const perfil = (id) => ({ ...base, id, nome: id, email: `${id}@x.com`, streak_dias: 2, streak_ultimo_dia: '2026-09-01' });

  it('503 sem chave do provedor, sem consultar o banco', async () => {
    delete process.env.RESEND_API_KEY;
    await expect(enviarLembretes(AGORA)).rejects.toMatchObject({ status: 503 });
    expect(db.from).not.toHaveBeenCalled();
  });

  it('envia pela API do Resend e marca ultimo_lembrete_em só após o envio', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const mock = configurarDb({ profiles: [ok([perfil('u1')]), ok(null)] });

    const r = await enviarLembretes(AGORA);

    expect(r).toEqual({ enviados: 1, falhas: 0 });
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.authorization).toBe('Bearer re_teste');
    expect(JSON.parse(init.body)).toMatchObject({ to: ['u1@x.com'], from: 'TeamQuest <ola@exemplo.com>' });
    expect(mock.chainsPara('profiles')[1].update).toHaveBeenCalledWith({
      ultimo_lembrete_em: AGORA.toISOString(),
    });
  });

  it('falha de envio não marca o usuário nem derruba os outros', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    const mock = configurarDb({ profiles: [ok([perfil('u1'), perfil('u2')]), ok(null)] });

    const r = await enviarLembretes(AGORA);

    expect(r).toEqual({ enviados: 1, falhas: 1 });
    expect(mock.chainsPara('profiles')).toHaveLength(2); // lista + 1 marcação (u2)
    expect(mock.chainsPara('profiles')[1].eq).toHaveBeenCalledWith('id', 'u2');
  });
});

describe('definirLembretes', () => {
  it('exige booleano (400) e grava a preferência', async () => {
    await expect(definirLembretes('u1', 'sim')).rejects.toMatchObject({ status: 400 });
    const mock = configurarDb({ profiles: [ok(null)] });
    expect(await definirLembretes('u1', false)).toEqual({ lembretes_email: false });
    expect(mock.chainsPara('profiles')[0].update).toHaveBeenCalledWith({ lembretes_email: false });
  });
});
