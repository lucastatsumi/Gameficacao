import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Spinner from '../ui/Spinner.jsx';
import Alerta from '../ui/Alerta.jsx';

export default function AbaRelatorio() {
  const [fases, setFases] = useState([]);
  const [filtroFase, setFiltroFase] = useState('');
  const [linhas, setLinhas] = useState(null);
  const [porFase, setPorFase] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api.get('/fases').then(setFases).catch(() => {});
    api
      .get('/admin/relatorio/fases')
      .then(setPorFase)
      .catch((err) => setErro(err.message));
  }, []);

  useEffect(() => {
    setLinhas(null);
    api
      .get(`/admin/relatorio/questoes${filtroFase ? `?fase_id=${filtroFase}` : ''}`)
      .then(setLinhas)
      .catch((err) => setErro(err.message));
  }, [filtroFase]);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-slate-200">Desempenho por fase</h3>
        <p className="mt-1 text-xs text-slate-500">
          Taxa de aprovação de todas as tentativas finalizadas em cada fase — mostra em que ponto
          da trilha a turma mais trava.
        </p>
        {!porFase ? (
          <Spinner />
        ) : (
          <div className="mt-3 space-y-2">
            {porFase.map((f) => (
              <div key={f.fase_id} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-sm text-slate-300" title={f.fase_nome}>
                  {f.fase_nome}
                </span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-slate-800">
                  <div
                    className={`h-full ${corBarra(f.taxa_aprovacao_pct)}`}
                    style={{ width: `${f.taxa_aprovacao_pct ?? 0}%` }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right font-mono text-xs text-slate-400">
                  {f.taxa_aprovacao_pct != null ? `${f.taxa_aprovacao_pct}%` : '—'}
                </span>
                <span className="w-20 shrink-0 text-right text-xs text-slate-500">
                  {f.total_tentativas} tent.
                </span>
              </div>
            ))}
            {porFase.length === 0 && (
              <p className="text-xs text-slate-500">Nenhuma fase cadastrada ainda.</p>
            )}
          </div>
        )}
      </section>

      <div className="flex items-center gap-2">
        <select
          value={filtroFase}
          onChange={(e) => setFiltroFase(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="">Todas as fases</option>
          {fases.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500">
          Ordenado da menor taxa de acerto — os conceitos em que a turma mais tem dificuldade.
        </p>
      </div>

      <Alerta>{erro}</Alerta>

      {!linhas ? (
        <Spinner />
      ) : (
        <div className="card-pixel overflow-hidden border-2 border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Questão</th>
                <th className="px-4 py-3">Dificuldade</th>
                <th className="px-4 py-3 text-right">Respostas</th>
                <th className="px-4 py-3 text-right">Taxa de acerto</th>
                <th className="px-4 py-3 text-right">Tempo médio</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.questao_id} className="border-t border-slate-800 odd:bg-slate-950 even:bg-slate-900/40">
                  <td className="px-4 py-3">{l.enunciado_resumo}...</td>
                  <td className="px-4 py-3 text-slate-400">{l.dificuldade}</td>
                  <td className="px-4 py-3 text-right font-mono">{l.total_respostas}</td>
                  <td className="px-4 py-3 text-right">
                    <TaxaAcerto pct={l.taxa_acerto_pct} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-400">
                    {l.tempo_medio_seg != null ? `${l.tempo_medio_seg}s` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TaxaAcerto({ pct }) {
  if (pct == null) return <span className="text-slate-600">sem dados</span>;
  const cor = pct >= 70 ? 'text-emerald-300' : pct >= 40 ? 'text-amber-300' : 'text-red-300';
  return <span className={`font-mono font-semibold ${cor}`}>{pct}%</span>;
}

function corBarra(pct) {
  if (pct == null) return 'bg-slate-700';
  return pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
}
