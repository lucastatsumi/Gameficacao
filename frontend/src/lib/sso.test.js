import { describe, expect, it } from 'vitest';
import { dominioDoEmail } from './sso.js';

describe('dominioDoEmail', () => {
  it('extrai o domínio em minúsculas', () => {
    expect(dominioDoEmail(' Ana@Empresa.COM.br ')).toBe('empresa.com.br');
  });
  it('rejeita entradas sem e-mail válido', () => {
    for (const ruim of ['', 'semarroba', 'a@b', '@x.com', 'a b@x.com', null, undefined]) {
      expect(dominioDoEmail(ruim)).toBeNull();
    }
  });
});
