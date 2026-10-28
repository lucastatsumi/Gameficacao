import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Spinner from '../ui/Spinner.jsx';
import Alerta from '../ui/Alerta.jsx';

// Dashboard com evolução temporal (Horizonte 5): nota média acumulada da
// equipe, um ponto por dia de snapshot. Série única → sem legenda (o
// título nomeia); hover com linha-guia + tooltip; tabela de competências
// como visão alternativa em texto.
const L = 640;
const A = 200;
const M = { topo: 12, dir: 12, base: 28, esq: 36 };

function GraficoNota({ pontos }) {
  const [foco, setFoco] = useState(null);
  const validos = pontos.filter((p) => p.score_medio != null);
  if (validos.length === 0) {
    return (
      <p className="mt-3 text-sm text-slate-500">Ainda sem tentativas avaliadas nesta equipe.</p>
    );
  }

  const largura = L - M.esq - M.dir;
  const altura = A - M.topo - M.base;
  const x = (i) =>
    M.esq + (validos.length === 1 ? largura / 2 : (i * largura) / (validos.length - 1));
  const y = (v) => M.topo + altura - (v / 100) * altura;
  const caminho = validos.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.score_medio)}`).join(' ');
  const atual = foco != null ? validos[foco] : null;

  function mover(e) {
    const caixa = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - caixa.left) / caixa.width) * L;
    let melhor = 0;
    validos.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(melhor) - px)) melhor = i;
    });
    setFoco(melhor);
  }

  return (
    <div className="relative mt-3">
      <svg
        viewBox={`0 0 ${L} ${A}`}
        className="w-full"
        role="img"
        aria-label={`Nota média da equipe: de ${validos[0].score_medio} para ${validos.at(-1).score_medio}`}
        onMouseMove={mover}
        onMouseLeave={() => setFoco(null)}
      >
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line x1={M.esq} x2={L - M.dir} y1={y(v)} y2={y(v)} stroke="#334155" strokeWidth="1" />
            <text x={M.esq - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
              {v}
            </text>
          </g>
        ))}
        <text x={M.esq} y={A - 8} fontSize="11" fill="#94a3b8">
          {new Date(`${validos[0].dia}T12:00:00`).toLocaleDateString('pt-BR')}
        </text>
        <text x={L - M.dir} y={A - 8} textAnchor="end" fontSize="11" fill="#94a3b8">
          {new Date(`${validos.at(-1).dia}T12:00:00`).toLocaleDateString('pt-BR')}
        </text>
        <path d={caminho} fill="none" stroke="#818cf8" strokeWidth="2" strokeLinejoin="round" />
        {atual && (
          <line
            x1={x(foco)}
            x2={x(foco)}
            y1={M.topo}
            y2={M.topo + altura}
            stroke="#64748b"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}
        {validos.map((p, i) => (
          <circle
            key={p.dia}
            cx={x(i)}
            cy={y(p.score_medio)}
            r={foco === i || validos.length === 1 ? 5 : 3}
            fill="#818cf8"
            stroke="#0f172a"
            strokeWidth="2"
          />
        ))}
      </svg>
      {atual && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
          style={{ left: `${(x(foco) / L) * 100}%` }}
        >
          {new Date(`${atual.dia}T12:00:00`).toLocaleDateString('pt-BR')}: nota{' '}
          <strong>{atual.score_medio}</strong> ({atual.tentativas} tentativas)
        </div>
      )}
    </div>
  );
}

export default function EvolucaoEquipe() {
  const [turmas, setTurmas] = useState([]);
  const [turmaId, setTurmaId] = useState('');
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api
      .get('/admin/turmas')
      .then(setTurmas)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!turmaId) return;
    setDados(null);
    setErro(null);
    api
      .get(`/admin/turmas/${turmaId}/evolucao`)
      .then(setDados)
      .catch((err) => setErro(err.message));
  }, [turmaId]);

  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-200">Evolução da equipe</h3>
      <p className="mt-1 text-xs text-slate-500">
        Nota média acumulada (0–100), um ponto por dia — o registro do dia é feito no primeiro
        acesso a este painel.
      </p>
      <select
        value={turmaId}
        onChange={(e) => setTurmaId(e.target.value)}
        aria-label="Equipe da evolução"
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
      {turmaId && !dados && !erro && <Spinner />}
      {dados && (
        <>
          <GraficoNota pontos={dados.score} />
          {dados.competencias.length > 0 && (
            <table className="mt-4 w-full text-xs">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-1">Competência</th>
                  <th className="py-1 text-right">Primeiro registro</th>
                  <th className="py-1 text-right">Hoje</th>
                  <th className="py-1 text-right">Variação</th>
                </tr>
              </thead>
              <tbody>
                {dados.competencias.map((c) => {
                  const inicio = c.pontos[0]?.pct;
                  const fim = c.pontos.at(-1)?.pct;
                  const delta =
                    inicio != null && fim != null ? Math.round((fim - inicio) * 10) / 10 : null;
                  return (
                    <tr key={c.competencia_id} className="border-t border-slate-800 text-slate-300">
                      <td className="py-1">{c.nome}</td>
                      <td className="py-1 text-right">{inicio ?? '—'}%</td>
                      <td className="py-1 text-right">{fim ?? '—'}%</td>
                      <td className="py-1 text-right">
                        {delta == null
                          ? '—'
                          : `${delta > 0 ? '▲ +' : delta < 0 ? '▼ ' : ''}${delta} p.p.`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}
    </section>
  );
}
