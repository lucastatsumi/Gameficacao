import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Alerta from '../components/ui/Alerta.jsx';
import PixelIcon from '../components/ui/PixelIcon.jsx';

// Roadmap 4.6: arco de longo prazo — os pontos aqui são o XP ganho DENTRO
// do período da temporada (mesma ideia de xp_semana nas ligas), acumulando
// numa trilha fixa de recompensas que nunca reseta durante a temporada.
export default function Temporada() {
  const { perfil } = useAuth();
  const [temporada, setTemporada] = useState(undefined);
  const [ranking, setRanking] = useState([]);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api
      .get('/temporadas')
      .then((dados) => {
        setTemporada(dados);
        if (dados?.id) return api.get(`/temporadas/${dados.id}/hall-da-fama`).then(setRanking);
      })
      .catch((err) => setErro(err.message));
  }, []);

  if (erro) return <Alerta>{erro}</Alerta>;
  if (temporada === undefined) return <Spinner texto="Carregando temporada..." />;

  if (!temporada) {
    return (
      <div>
        <div className="flex items-center gap-3">
          <PixelIcon nome="star" className="h-8 w-8 text-indigo-300" />
          <h1 className="font-pixel text-lg text-slate-100">Temporada</h1>
        </div>
        <p className="mt-4 text-sm text-slate-400">Nenhuma temporada ativa no momento.</p>
      </div>
    );
  }

  const proximoDegrau = temporada.trilha.find((d) => !d.resgatada);

  return (
    <div>
      <div className="flex items-center gap-3">
        <PixelIcon nome="star" className="h-8 w-8 text-indigo-300" />
        <div>
          <h1 className="font-pixel text-lg text-slate-100">{temporada.nome}</h1>
          {temporada.tema && <p className="mt-1 text-sm text-slate-400">{temporada.tema}</p>}
        </div>
      </div>

      <div className="card-pixel mt-4 flex flex-wrap items-center justify-between gap-3 border-2 border-indigo-500/40 bg-slate-900/60 p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Seus pontos de temporada</p>
          <p className="font-pixel text-base text-indigo-300">{temporada.pontos}</p>
        </div>
        {proximoDegrau && (
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500">Próxima recompensa em</p>
            <p className="font-pixel text-base text-amber-300">
              {Math.max(0, proximoDegrau.pontos_necessarios - temporada.pontos)} pts
            </p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h2 className="font-pixel text-sm text-slate-200">Trilha de recompensas</h2>
        <ol className="mt-3 space-y-2">
          {temporada.trilha.map((degrau) => (
            <li
              key={degrau.id}
              className={`card-pixel flex items-center gap-3 border-2 p-3 ${
                degrau.resgatada
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : temporada.pontos >= degrau.pontos_necessarios
                    ? 'border-amber-500/40 bg-amber-500/10'
                    : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              <PixelIcon
                nome={degrau.resgatada ? 'unlock' : 'lock'}
                className={`h-5 w-5 ${degrau.resgatada ? 'text-emerald-400' : 'text-slate-500'}`}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-200">
                  {degrau.tipo === 'fichas' ? `${degrau.fichas} fichas` : 'Cosmético exclusivo'}
                </p>
                <p className="text-xs text-slate-500">{degrau.pontos_necessarios} pts</p>
              </div>
              <PixelIcon
                nome={degrau.tipo === 'fichas' ? 'coins' : 'star'}
                className="h-5 w-5 text-amber-300"
              />
            </li>
          ))}
        </ol>
      </div>

      {ranking.length > 0 && (
        <div className="mt-6">
          <h2 className="font-pixel text-sm text-slate-200">Placar da temporada</h2>
          <div className="card-pixel mt-3 overflow-hidden border-2 border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Jogador</th>
                  <th className="px-4 py-3 text-right">Pontos</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((linha) => (
                  <tr
                    key={linha.id}
                    className={`border-t border-slate-800 ${
                      linha.id === perfil?.id ? 'bg-indigo-500/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-400">{linha.posicao}</td>
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {linha.nome}
                      {linha.id === perfil?.id && (
                        <span className="ml-2 text-xs text-indigo-300">(você)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">{linha.pontos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
