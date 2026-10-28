import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import PixelIcon from '../ui/PixelIcon.jsx';

// Horizonte 3 no Perfil: proficiência por tema + matriz de competências.
// É a parte AVALIATIVA (score, cobertura) — XP e conquistas ficam nas
// outras seções do perfil.
const COR_NIVEL = {
  Iniciante: 'text-slate-300 border-slate-600',
  Praticante: 'text-sky-300 border-sky-500/50',
  Proficiente: 'text-emerald-300 border-emerald-500/50',
  Referência: 'text-amber-300 border-amber-500/60',
};

export function BarraPct({ pct, rotulo }) {
  const valor = pct ?? 0;
  const cor =
    pct == null
      ? 'bg-slate-700'
      : valor >= 80
        ? 'bg-emerald-500'
        : valor >= 50
          ? 'bg-amber-500'
          : 'bg-red-500';
  return (
    <div
      className="h-2 w-full bg-slate-800"
      role="meter"
      aria-label={rotulo}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct ?? 0}
    >
      <div className={`h-2 ${cor}`} style={{ width: `${valor}%` }} />
    </div>
  );
}

export default function PainelAvaliacao() {
  const [proficiencia, setProficiencia] = useState(null);
  const [competencias, setCompetencias] = useState(null);
  const [prestigio, setPrestigio] = useState({ estrelas: 0, por_tema: [] });
  const [msgPrestigio, setMsgPrestigio] = useState(null);

  function carregar() {
    api
      .get('/perfil/proficiencia')
      .then(setProficiencia)
      .catch(() => setProficiencia([]));
    api
      .get('/perfil/competencias')
      .then(setCompetencias)
      .catch(() => setCompetencias([]));
    api
      .get('/perfil/prestigio')
      .then(setPrestigio)
      .catch(() => {});
  }

  useEffect(carregar, []);

  // Prestígio (4.11): recomeça a trilha com modificadores; score e
  // competências não resetam
  async function novaJornada(p) {
    if (
      !window.confirm(
        `Começar a Nova Jornada+ em "${p.tema}"? O progresso dos módulos reinicia (sem questões fáceis e com 25% menos tempo). Nota, competências e certificado continuam.`,
      )
    )
      return;
    setMsgPrestigio(null);
    try {
      const r = await api.post(`/perfil/prestigio/${p.tema_id}`);
      setMsgPrestigio(`Nova Jornada+ iniciada — ciclo ${r.ciclo}. Boa sorte!`);
      carregar();
    } catch (err) {
      setMsgPrestigio(err.message);
    }
  }

  if (!proficiencia || !competencias) return null;

  return (
    <section>
      <h2 className="flex items-center gap-2 font-pixel text-sm text-slate-100">
        <PixelIcon nome="chart-bar-big" className="h-5 w-5 text-indigo-300" />
        Avaliação por tema
      </h2>
      {prestigio.estrelas > 0 && (
        <p className="mt-1 text-xs text-amber-300">
          {'★'.repeat(Math.min(prestigio.estrelas, 10))} {prestigio.estrelas} estrela(s) de
          prestígio
        </p>
      )}
      {msgPrestigio && <p className="mt-1 text-xs text-slate-300">{msgPrestigio}</p>}
      <p className="mt-1 text-xs text-slate-500">
        Nota 0–100 ponderada por dificuldade, velocidade e sequência de acertos. Separada do XP: é o
        que mede a sua proficiência.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {proficiencia.map((p) => (
          <div key={p.tema_id} className="card-pixel border-2 border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-100">{p.tema}</h3>
              <span className={`border-2 px-2 py-0.5 text-xs font-semibold ${COR_NIVEL[p.nivel]}`}>
                {p.nivel}
              </span>
            </div>
            <dl className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <dt className="text-slate-500">Nota média</dt>
                <dd className="text-lg font-semibold text-slate-100">{p.score_medio ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Cobertura</dt>
                <dd className="text-lg font-semibold text-slate-100">{p.cobertura_pct}%</dd>
              </div>
              <div>
                <dt className="text-slate-500">Módulos</dt>
                <dd className="text-lg font-semibold text-slate-100">
                  {p.modulos_concluidos}/{p.total_modulos}
                </dd>
              </div>
            </dl>
            {p.trilha_concluida && (
              <Link
                to={`/certificado/${p.tema_id}`}
                className="btn-pixel mt-3 inline-flex items-center gap-1.5 bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500"
              >
                <PixelIcon nome="trophy" className="h-3.5 w-3.5" />
                Certificado
              </Link>
            )}
            {p.trilha_concluida && p.modulos_concluidos === p.total_modulos && (
              <button
                onClick={() => novaJornada(p)}
                className="btn-pixel ml-2 mt-3 inline-flex items-center gap-1.5 bg-slate-700 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-slate-600"
              >
                <PixelIcon nome="star" className="h-3.5 w-3.5" />
                Nova Jornada+
              </button>
            )}
            {prestigio.por_tema.some((x) => x.tema_id === p.tema_id) && (
              <p className="mt-2 text-xs text-amber-300">
                ★ Ciclo {prestigio.por_tema.find((x) => x.tema_id === p.tema_id).ciclo} da Nova
                Jornada+
              </p>
            )}
            <ul className="mt-3 space-y-1.5">
              {competencias
                .filter((c) => c.tema_id === p.tema_id)
                .map((c) => (
                  <li key={c.id} className="text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>
                        {c.nome}
                        {c.dominada && <span className="ml-1 text-emerald-300">★</span>}
                      </span>
                      <span>{c.pct == null ? 'sem respostas' : `${c.pct}% (${c.total})`}</span>
                    </div>
                    <BarraPct pct={c.pct} rotulo={`Acerto em ${c.nome}`} />
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
