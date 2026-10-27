import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Alerta from '../ui/Alerta.jsx';
import { inputCls } from './inputCls.js';

// Roadmap H4: campanha = evento de XP + badge exclusiva + ranking da janela.
const VAZIO = { nome: '', inicio: '', fim: '', multiplicador_xp: 2, min_quizzes: 5 };

export default function AbaCampanhas() {
  const [campanhas, setCampanhas] = useState([]);
  const [form, setForm] = useState(VAZIO);
  const [ranking, setRanking] = useState(null);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(() => {
    api.get('/admin/campanhas').then(setCampanhas).catch((err) => setErro(err.message));
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function criar(e) {
    e.preventDefault();
    setErro(null);
    try {
      await api.post('/admin/campanhas', {
        ...form,
        multiplicador_xp: Number(form.multiplicador_xp),
        min_quizzes: Number(form.min_quizzes),
      });
      setForm(VAZIO);
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function verRanking(id) {
    setErro(null);
    try {
      setRanking(await api.get(`/admin/campanhas/${id}/ranking`));
    } catch (err) {
      setErro(err.message);
    }
  }

  const mudar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  return (
    <div className="space-y-6">
      {erro && <Alerta>{erro}</Alerta>}

      <form onSubmit={criar} className="grid gap-2 sm:grid-cols-2">
        <input
          required
          className={`${inputCls} sm:col-span-2`}
          placeholder="Nome (ex.: Outubro da Segurança)"
          value={form.nome}
          onChange={mudar('nome')}
        />
        <input required type="datetime-local" className={inputCls} value={form.inicio} onChange={mudar('inicio')} />
        <input required type="datetime-local" className={inputCls} value={form.fim} onChange={mudar('fim')} />
        <label className="text-sm">
          Multiplicador de XP
          <input type="number" step="0.1" min="1.1" className={inputCls} value={form.multiplicador_xp} onChange={mudar('multiplicador_xp')} />
        </label>
        <label className="text-sm">
          Quizzes aprovados para a badge
          <input type="number" min="1" className={inputCls} value={form.min_quizzes} onChange={mudar('min_quizzes')} />
        </label>
        <button className="btn-pixel px-4 sm:col-span-2">Criar campanha</button>
      </form>

      <ul className="space-y-2">
        {campanhas.map((c) => (
          <li key={c.id} className="card-pixel flex items-center justify-between p-3">
            <span>
              {c.nome}{' '}
              <span className="text-xs opacity-70">
                {new Date(c.inicio).toLocaleDateString('pt-BR')} a {new Date(c.fim).toLocaleDateString('pt-BR')}
              </span>
            </span>
            <button className="btn-pixel px-3" onClick={() => verRanking(c.id)}>
              Ranking
            </button>
          </li>
        ))}
      </ul>

      {ranking && (
        <ol className="list-decimal pl-6 text-sm">
          {ranking.map((r) => (
            <li key={r.posicao}>
              {r.nome} — {r.xp} XP
            </li>
          ))}
          {!ranking.length && <p>Ninguém pontuou ainda.</p>}
        </ol>
      )}
    </div>
  );
}
