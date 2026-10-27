import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Spinner from '../ui/Spinner.jsx';
import Alerta from '../ui/Alerta.jsx';
import { BarraPct } from '../avaliacao/PainelAvaliacao.jsx';

// Matriz de competências da equipe (Horizonte 3): % de acerto por
// competência para cada membro + o agregado — mostra os gaps da equipe.
function corCelula(pct) {
  if (pct == null) return 'text-slate-600';
  if (pct >= 80) return 'bg-emerald-500/20 text-emerald-200';
  if (pct >= 50) return 'bg-amber-500/20 text-amber-200';
  return 'bg-red-500/20 text-red-200';
}

export default function MatrizEquipe() {
  const [turmas, setTurmas] = useState([]);
  const [turmaId, setTurmaId] = useState('');
  const [matriz, setMatriz] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api
      .get('/admin/turmas')
      .then(setTurmas)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!turmaId) return;
    setMatriz(null);
    setErro(null);
    api
      .get(`/admin/turmas/${turmaId}/competencias`)
      .then(setMatriz)
      .catch((err) => setErro(err.message));
  }, [turmaId]);

  // Só colunas com alguma resposta na equipe — tema que ninguém começou
  // não ajuda a enxergar gap
  const colunas = matriz?.competencias.filter((c) => c.total > 0) ?? [];

  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-200">Matriz de competências da equipe</h3>
      <p className="mt-1 text-xs text-slate-500">
        % de acerto por competência — verde ≥ 80%, amarelo ≥ 50%, vermelho abaixo disso.
      </p>
      <select
        value={turmaId}
        onChange={(e) => setTurmaId(e.target.value)}
        aria-label="Equipe da matriz de competências"
        className="mt-3 border-2 border-slate-700 bg-slate-900 px-3 py-2 text-sm"
      >
        <option value="">Escolha a equipe...</option>
        {turmas.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nome}
          </option>
        ))}
      </select>

      <Alerta>{erro}</Alerta>
      {turmaId && !matriz && !erro && <Spinner />}
      {matriz && colunas.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">
          A equipe ainda não respondeu questões com competências.
        </p>
      )}
      {matriz && colunas.length > 0 && (
        <div className="mt-3 space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {colunas.map((c) => (
              <div key={c.id} className="text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>
                    {c.nome} <span className="text-slate-600">· {c.tema}</span>
                  </span>
                  <span>{c.pct}%</span>
                </div>
                <BarraPct pct={c.pct} rotulo={`Equipe em ${c.nome}`} />
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-3">Colaborador</th>
                  {colunas.map((c) => (
                    <th key={c.id} className="px-2 py-2 font-medium" title={c.tema}>
                      {c.nome}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matriz.membros.map((m) => (
                  <tr key={m.user_id} className="border-t border-slate-800">
                    <td className="py-1.5 pr-3 font-medium text-slate-200">{m.nome}</td>
                    {colunas.map((c) => {
                      const valor = m.por_competencia[c.id];
                      return (
                        <td key={c.id} className={`px-2 py-1.5 text-center ${corCelula(valor)}`}>
                          {valor == null ? '—' : `${valor}%`}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
