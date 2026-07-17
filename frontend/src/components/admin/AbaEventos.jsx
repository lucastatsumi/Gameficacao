import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Spinner from '../ui/Spinner.jsx';
import Alerta from '../ui/Alerta.jsx';
import PixelIcon from '../ui/PixelIcon.jsx';
import { inputCls } from './inputCls.js';

const EVENTO_VAZIO = { nome: '', fase_id: '', multiplicador_xp: 2, inicio: '', fim: '' };

const STATUS_ESTILO = {
  ativo: 'bg-emerald-500/10 text-emerald-300',
  futuro: 'bg-indigo-500/10 text-indigo-300',
  encerrado: 'bg-slate-800 text-slate-500',
};

export default function AbaEventos() {
  const [eventos, setEventos] = useState(null);
  const [fases, setFases] = useState([]);
  const [dados, setDados] = useState(EVENTO_VAZIO);
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(() => {
    api.get('/admin/eventos').then(setEventos).catch((err) => setErro(err.message));
  }, []);

  useEffect(() => {
    carregar();
    api.get('/fases').then(setFases).catch(() => {});
  }, [carregar]);

  function mudar(campo, valor) {
    setDados((d) => ({ ...d, [campo]: valor }));
  }

  async function criar(e) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      await api.post('/admin/eventos', {
        ...dados,
        fase_id: dados.fase_id || null,
        multiplicador_xp: Number(dados.multiplicador_xp),
      });
      setDados(EVENTO_VAZIO);
      carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  async function remover(evento) {
    if (!window.confirm(`Remover o evento "${evento.nome}"?`)) return;
    try {
      await api.delete(`/admin/eventos/${evento.id}`);
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">
        Eventos multiplicam o XP ganho pelos alunos numa fase (ou em todas) durante um período —
        ótimo para incentivar revisão antes de uma prova.
      </p>

      <form onSubmit={criar} className="card-pixel space-y-3 border-2 border-indigo-500/40 bg-slate-900/80 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={dados.nome}
            onChange={(e) => mudar('nome', e.target.value)}
            placeholder="Nome do evento (ex.: Semana das Árvores)"
            className={inputCls}
            required
          />
          <select
            value={dados.fase_id}
            onChange={(e) => mudar('fase_id', e.target.value)}
            className={inputCls}
          >
            <option value="">Todas as fases</option>
            {fases.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs text-slate-400">
            Multiplicador de XP
            <input
              type="number"
              min={1.1}
              step={0.1}
              value={dados.multiplicador_xp}
              onChange={(e) => mudar('multiplicador_xp', e.target.value)}
              className={`${inputCls} mt-1`}
              required
            />
          </label>
          <label className="text-xs text-slate-400">
            Início
            <input
              type="datetime-local"
              value={dados.inicio}
              onChange={(e) => mudar('inicio', e.target.value)}
              className={`${inputCls} mt-1`}
              required
            />
          </label>
          <label className="text-xs text-slate-400">
            Fim
            <input
              type="datetime-local"
              value={dados.fim}
              onChange={(e) => mudar('fim', e.target.value)}
              className={`${inputCls} mt-1`}
              required
            />
          </label>
        </div>

        <Alerta>{erro}</Alerta>

        <button
          disabled={salvando}
          className="btn-pixel flex items-center gap-1.5 bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          <PixelIcon nome="plus" className="h-4 w-4" />
          {salvando ? 'Criando...' : 'Criar evento'}
        </button>
      </form>

      {!eventos ? (
        <Spinner />
      ) : eventos.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum evento criado ainda.</p>
      ) : (
        <div className="space-y-2">
          {eventos.map((ev) => (
            <div
              key={ev.id}
              className="card-pixel flex flex-wrap items-center gap-3 border-2 border-slate-800 bg-slate-900/60 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium text-slate-100">
                  {ev.nome}
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_ESTILO[ev.status]}`}>
                    {ev.status}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {fases.find((f) => f.id === ev.fase_id)?.nome ?? 'Todas as fases'} · XP x
                  {ev.multiplicador_xp} · {new Date(ev.inicio).toLocaleString('pt-BR')} até{' '}
                  {new Date(ev.fim).toLocaleString('pt-BR')}
                </p>
              </div>
              <button
                onClick={() => remover(ev)}
                className="btn-pixel flex items-center gap-1 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
              >
                <PixelIcon nome="trash" className="h-3.5 w-3.5" />
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
