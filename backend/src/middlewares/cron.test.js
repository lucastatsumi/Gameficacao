import { afterEach, describe, expect, it, vi } from 'vitest';
import { cronAutorizado } from './cron.js';

afterEach(() => {
  delete process.env.CRON_SECRET;
});

const chamar = (authorization) => {
  const next = vi.fn();
  cronAutorizado({ headers: authorization === undefined ? {} : { authorization } }, {}, next);
  return next.mock.calls[0][0];
};

describe('cronAutorizado', () => {
  it('fecha a rota (503) quando CRON_SECRET não está definido', () => {
    expect(chamar('Bearer qualquer')).toMatchObject({ status: 503 });
  });
  it('401 sem header ou com segredo errado (inclusive de tamanho diferente)', () => {
    process.env.CRON_SECRET = 'segredo-certo';
    expect(chamar(undefined)).toMatchObject({ status: 401 });
    expect(chamar('Bearer errado')).toMatchObject({ status: 401 });
    expect(chamar('Bearer segredo-certo-e-mais')).toMatchObject({ status: 401 });
  });
  it('libera com o segredo correto', () => {
    process.env.CRON_SECRET = 'segredo-certo';
    expect(chamar('Bearer segredo-certo')).toBeUndefined();
  });
});
