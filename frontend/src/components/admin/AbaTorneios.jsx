import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Alerta from '../ui/Alerta.jsx';
import { inputCls } from './inputCls.js';

// Roadmap H4: torneio entre equipes. Placar = XP médio por membro na janela.
export default function AbaTorneios() {
  const [torneios, setTorneios] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [form, setForm] = useState({ nome: '', inicio: '', fim: '', turma_ids: [] });
  const [placar, setPlacar] = useState(null);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(() => {
    api.get('/admin/torneios').then(setTorneios).catch((err) => setErro(err.message));
  }, []);

  useEffect(() => {
    carregar();
    api.get('/admin/turmas').then(setTurmas).catch(() => {});
  }, [carregar]);

  function alternar(id) {
    setForm((f) => ({
      ...f,
      turma_ids: f.turma_ids.includes(id) ? f.turma_ids.filter((x) => x !== id) : [...f.turma_ids, id],
    }));
  }

  async function criar(e) {
    e.preventDefault();
    setErro(null);
    try {
      await api.post('/admin/torneios', form);
      setForm({ nome: '', inicio: '', fim: '', turma_ids: [] });
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function verPlacar(id) {
    setErro(null);
    try {
      setPlacar(await api.get(`/admin/torneios/${id}/placar`));
    } catch (err) {
      setErro(err.message);
    }
  }

  async function encerrar(id) {
    setErro(null);
    try {
      const linhas = await api.post(`/admin/torneios/${id}/encerrar`, {});
      setPlacar({ torneio: { id, status: 'encerrado' }, placar: linhas });
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <div className="space-y-6">
      {erro && <Alerta>{erro}</Alerta>}

      <form onSubmit={criar} className="grid gap-2 sm:grid-cols-2">
        <input
          required
          className={`${inputCls} sm:col-span-2`}
          placeholder="Nome do torneio"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
        />
        <input
          required
          type="datetime-local"
          className={inputCls}
          value={form.inicio}
          onChange={(e) => setForm({ ...form, inicio: e.target.value })}
        />
        <input
          required
          type="datetime-local"
          className={inputCls}
          value={form.fim}
          onChange={(e) => setForm({ ...form, fim: e.target.value })}
        />
        <div className="sm:col-span-2">
          <p className="text-sm opacity-70">Equipes participantes (mínimo 2):</p>
          {turmas.map((t) => (
            <label key={t.id} className="mr-4 inline-flex items-center gap-1">
              <input
                type="checkbox"
                checked={form.turma_ids.includes(t.id)}
                onChange={() => alternar(t.id)}
              />
              {t.nome}
            </label>
          ))}
        </div>
        <button className="btn-pixel px-4 sm:col-span-2">Criar torneio</button>
      </form>

      <ul className="space-y-2">
        {torneios.map((t) => (
          <li key={t.id} className="card-pixel flex items-center justify-between p-3">
            <span>
              {t.nome} <span className="text-xs opacity-70">({t.status})</span>
            </span>
            <span className="flex gap-2">
              <button className="btn-pixel px-3" onClick={() => verPlacar(t.id)}>
                Placar
              </button>
              {t.status === 'ativo' && (
                <button className="btn-pixel px-3" onClick={() => encerrar(t.id)}>
                  Encerrar e premiar
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>

      {placar && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left opacity-70">
              <th>#</th>
              <th>Equipe</th>
              <th>Membros</th>
              <th>XP médio</th>
            </tr>
          </thead>
          <tbody>
            {placar.placar.map((e) => (
              <tr key={e.turma_id}>
                <td>{e.posicao}</td>
                <td>{e.nome}</td>
                <td>{e.membros}</td>
                <td>{e.media_xp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
