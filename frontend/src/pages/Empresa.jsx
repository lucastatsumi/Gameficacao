import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Alerta from '../components/ui/Alerta.jsx';

// Roadmap H5: espaço da empresa (multi-tenancy) e papéis. Dono convida por
// código, promove colaboradores a gestor; colaborador entra pelo código.
const ROTULO = { dono: 'Dono', gestor: 'Gestor', colaborador: 'Colaborador' };

export default function Empresa() {
  const { perfil, recarregarPerfil } = useAuth();
  const [empresa, setEmpresa] = useState(undefined);
  const [membros, setMembros] = useState([]);
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const e = await api.get('/empresas/minha');
      setEmpresa(e);
      if (perfil?.papel === 'dono') setMembros(await api.get('/empresas/membros'));
    } catch (err) {
      setErro(err.message);
    }
  }, [perfil?.papel]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function acao(fn) {
    setErro(null);
    try {
      await fn();
      await recarregarPerfil();
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  if (empresa === undefined && !erro) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Minha empresa</h1>
      {erro && <Alerta>{erro}</Alerta>}

      {empresa && (
        <div className="card-pixel p-4">
          <p className="font-semibold">{empresa.nome}</p>
          <p className="text-sm opacity-80">Seu papel: {ROTULO[perfil?.papel] ?? '—'}</p>
          {empresa.codigo_convite && (
            <p className="mt-2 text-sm">
              Código de convite: <code className="font-mono">{empresa.codigo_convite}</code>
            </p>
          )}
        </div>
      )}

      {perfil?.papel !== 'dono' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <form
            className="card-pixel space-y-2 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              acao(() => api.post('/empresas/entrar', { codigo_convite: codigo }));
            }}
          >
            <p className="font-semibold">Entrar com código de convite</p>
            <input
              required
              className="w-full border-2 border-slate-700 bg-slate-900 p-2"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
            <button className="btn-pixel px-4">Entrar</button>
          </form>
          <form
            className="card-pixel space-y-2 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              acao(() => api.post('/empresas', { nome }));
            }}
          >
            <p className="font-semibold">Criar a minha empresa</p>
            <input
              required
              className="w-full border-2 border-slate-700 bg-slate-900 p-2"
              placeholder="Nome da empresa"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <button className="btn-pixel px-4">Criar</button>
          </form>
        </div>
      )}

      {perfil?.papel === 'dono' && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left opacity-70">
              <th>Nome</th>
              <th>E-mail</th>
              <th>Papel</th>
            </tr>
          </thead>
          <tbody>
            {membros.map((m) => (
              <tr key={m.id}>
                <td>{m.nome}</td>
                <td>{m.email}</td>
                <td>
                  {m.papel === 'dono' ? (
                    ROTULO.dono
                  ) : (
                    <select
                      value={m.papel ?? 'colaborador'}
                      aria-label={`Papel de ${m.nome}`}
                      className="border-2 border-slate-700 bg-slate-900 p-1"
                      onChange={(e) =>
                        acao(() =>
                          api.patch(`/empresas/membros/${m.id}/papel`, { papel: e.target.value })
                        )
                      }
                    >
                      <option value="colaborador">Colaborador</option>
                      <option value="gestor">Gestor</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
