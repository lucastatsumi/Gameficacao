import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Alerta from '../ui/Alerta.jsx';
import { inputCls } from './inputCls.js';

// Roadmap H5: evolução semanal de uma equipe (score médio e XP).
const L = 560;
const A = 160;

function Linha({ serie, campo, cor, max }) {
  const pontos = serie
    .map((s, i) => (s[campo] == null ? null : [(i / Math.max(serie.length - 1, 1)) * L, A - (s[campo] / max) * A]))
    .filter(Boolean);
  if (pontos.length < 2) return null;
  return (
    <polyline fill="none" stroke={cor} strokeWidth="2" points={pontos.map((p) => p.join(',')).join(' ')} />
  );
}

export default function AbaEvolucao() {
  const [turmas, setTurmas] = useState([]);
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api.get('/admin/turmas').then(setTurmas).catch((err) => setErro(err.message));
  }, []);

  async function escolher(id) {
    setErro(null);
    setDados(null);
    if (!id) return;
    try {
      setDados(await api.get(`/admin/turmas/${id}/evolucao?semanas=12`));
    } catch (err) {
      setErro(err.message);
    }
  }

  const maxXp = dados ? Math.max(1, ...dados.serie.map((s) => s.xp_total)) : 1;

  return (
    <div className="space-y-4">
      {erro && <Alerta>{erro}</Alerta>}
      <select className={inputCls} onChange={(e) => escolher(e.target.value)} defaultValue="">
        <option value="">Escolha uma equipe...</option>
        {turmas.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nome}
          </option>
        ))}
      </select>

      {dados && (
        <>
          <svg
            viewBox={`-10 -10 ${L + 20} ${A + 20}`}
            role="img"
            aria-label="Evolução semanal de score médio (verde) e XP (amarelo)"
            className="w-full"
          >
            <Linha serie={dados.serie} campo="score_medio" cor="#34d399" max={100} />
            <Linha serie={dados.serie} campo="xp_total" cor="#fbbf24" max={maxXp} />
          </svg>
          <p className="text-xs opacity-70">Verde: score médio (0–100) · Amarelo: XP da semana</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left opacity-70">
                <th>Semana</th>
                <th>Ativos</th>
                <th>Quizzes</th>
                <th>Score</th>
                <th>XP</th>
              </tr>
            </thead>
            <tbody>
              {dados.serie.map((s) => (
                <tr key={s.semana}>
                  <td>{s.semana}</td>
                  <td>
                    {s.colaboradores_ativos}/{dados.membros}
                  </td>
                  <td>{s.tentativas}</td>
                  <td>{s.score_medio ?? '—'}</td>
                  <td>{s.xp_total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
