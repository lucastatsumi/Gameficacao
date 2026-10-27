import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import PixelIcon from '../ui/PixelIcon.jsx';

// Cards do mapa para as mecânicas coletivas com prazo: campanha temática
// (meta do período + ranking próprio) e torneio entre equipes (vitórias em
// desafios assíncronos). Falhas são silenciosas: o mapa funciona sem eles.
export default function CampanhasETorneios() {
  const [campanhas, setCampanhas] = useState([]);
  const [torneios, setTorneios] = useState([]);
  const [ranking, setRanking] = useState(null); // { campanha, ranking }

  useEffect(() => {
    api
      .get('/perfil/campanhas')
      .then(setCampanhas)
      .catch(() => {});
    api
      .get('/perfil/torneios')
      .then((lista) => setTorneios(lista.filter((t) => t.status !== 'futuro').slice(0, 2)))
      .catch(() => {});
  }, []);

  async function verRanking(id) {
    if (ranking?.campanha.id === id) return setRanking(null);
    try {
      setRanking(await api.get(`/perfil/campanhas/${id}/ranking`));
    } catch {
      setRanking(null);
    }
  }

  if (!campanhas.length && !torneios.length) return null;

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {campanhas.map((c) => (
        <div
          key={c.id}
          className="card-pixel border-2 border-rose-500/30 bg-rose-500/5 p-3 text-xs"
        >
          <p className="flex items-center gap-2 font-semibold uppercase tracking-wide text-rose-300">
            <PixelIcon nome="flag" className="h-4 w-4" />
            Campanha: {c.nome}
          </p>
          {c.descricao && <p className="mt-1 text-slate-400">{c.descricao}</p>}
          <p className="mt-2 text-slate-300">
            {c.cumprida
              ? '✔ Meta cumprida — badge garantida!'
              : `${c.aprovadas}/${c.meta_quizzes} quizzes aprovados`}
            <span className="text-slate-500">
              {' '}
              · até {new Date(c.fim).toLocaleDateString('pt-BR')}
            </span>
          </p>
          <button
            onClick={() => verRanking(c.id)}
            className="mt-2 text-rose-300 hover:text-rose-200"
          >
            {ranking?.campanha.id === c.id ? 'Fechar ranking' : 'Ver ranking da campanha'}
          </button>
          {ranking?.campanha.id === c.id && (
            <ol className="mt-2 space-y-0.5 text-slate-300">
              {ranking.ranking.slice(0, 5).map((r) => (
                <li key={r.id} className={r.voce ? 'text-rose-200' : ''}>
                  {r.posicao}º {r.nome} — {r.xp} XP
                </li>
              ))}
              {ranking.ranking.length === 0 && (
                <li className="text-slate-500">Ninguém pontuou ainda.</li>
              )}
            </ol>
          )}
        </div>
      ))}
      {torneios.map((t) => (
        <div
          key={t.id}
          className="card-pixel border-2 border-amber-500/30 bg-amber-500/5 p-3 text-xs"
        >
          <p className="flex items-center gap-2 font-semibold uppercase tracking-wide text-amber-300">
            <PixelIcon nome="trophy" className="h-4 w-4" />
            Torneio: {t.nome} {t.status === 'encerrado' && '(encerrado)'}
          </p>
          <p className="mt-1 text-slate-400">
            Vença desafios de colegas para pontuar pela sua equipe. Prêmio: {t.fichas_premio} fichas
            para cada membro da campeã.
          </p>
          <ol className="mt-2 space-y-0.5 text-slate-300">
            {t.placar.slice(0, 3).map((p) => (
              <li key={p.turma_id}>
                {p.posicao}º {p.nome} — {p.vitorias} vitória(s)
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
