import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Alerta from '../components/ui/Alerta.jsx';
import PixelIcon from '../components/ui/PixelIcon.jsx';

// Roadmap 4.5: competição justa por divisão — o XP aqui é só o ganho NA
// SEMANA, então quem começou depois compete de igual pra igual dentro da
// própria divisão (o ranking global, por XP total, continua premiando
// veteranos para sempre).
const DIVISOES = {
  bronze: { rotulo: 'Bronze', cor: 'text-amber-600', borda: 'border-amber-700/40' },
  prata: { rotulo: 'Prata', cor: 'text-slate-300', borda: 'border-slate-400/40' },
  ouro: { rotulo: 'Ouro', cor: 'text-amber-400', borda: 'border-amber-400/40' },
  diamante: { rotulo: 'Diamante', cor: 'text-sky-300', borda: 'border-sky-400/40' },
};

export default function Ligas() {
  const { perfil } = useAuth();
  const [liga, setLiga] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api
      .get('/ligas')
      .then(setLiga)
      .catch((err) => setErro(err.message));
  }, []);

  if (erro) return <Alerta>{erro}</Alerta>;
  if (!liga) return <Spinner texto="Carregando sua liga..." />;

  const divisao = DIVISOES[liga.divisao] ?? DIVISOES.bronze;

  return (
    <div>
      <div className="flex items-center gap-3">
        <PixelIcon nome="flag" className={`h-8 w-8 ${divisao.cor}`} />
        <div>
          <h1 className="font-pixel text-lg text-slate-100">Liga da semana</h1>
          <p className="mt-1 text-sm text-slate-400">
            Sua posição nesta semana ({liga.semana}) — o placar zera toda segunda-feira.
          </p>
        </div>
      </div>

      <div
        className={`card-pixel mt-4 flex flex-wrap items-center justify-between gap-3 border-2 ${divisao.borda} bg-slate-900/60 p-4`}
      >
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Sua divisão</p>
          <p className={`font-pixel text-base ${divisao.cor}`}>{divisao.rotulo}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-500">XP na semana</p>
          <p className="font-pixel text-base text-indigo-300">{liga.xp_semana}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Ao fim da semana, o top 20% da divisão sobe, o bottom 20% desce — todos ganham fichas
        conforme a posição.
      </p>

      <div className="mt-6">
        {!liga.ranking.length && (
          <p className="text-sm text-slate-500">Ainda não há mais ninguém nesta divisão.</p>
        )}
        {liga.ranking.length > 0 && (
          <div className="card-pixel overflow-hidden border-2 border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Jogador</th>
                  <th className="px-4 py-3 text-right">XP na semana</th>
                </tr>
              </thead>
              <tbody>
                {liga.ranking.map((linha) => (
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
                    <td className="px-4 py-3 text-right text-slate-300">{linha.xp_semana}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
