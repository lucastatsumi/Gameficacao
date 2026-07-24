import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import Spinner from '../components/ui/Spinner.jsx';
import Alerta from '../components/ui/Alerta.jsx';
import PixelIcon from '../components/ui/PixelIcon.jsx';

const CORES_MEDALHA = ['text-amber-400', 'text-slate-300', 'text-amber-700'];

const DIVISAO_INFO = {
  bronze: { rotulo: 'Bronze', cor: 'text-amber-700', borda: 'border-amber-700/40' },
  prata: { rotulo: 'Prata', cor: 'text-slate-300', borda: 'border-slate-400/40' },
  ouro: { rotulo: 'Ouro', cor: 'text-amber-400', borda: 'border-amber-400/40' },
  diamante: { rotulo: 'Diamante', cor: 'text-cyan-300', borda: 'border-cyan-400/40' },
};

export default function Ligas() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api
      .get('/ligas')
      .then(setDados)
      .catch((err) => setErro(err.message));
  }, []);

  if (erro) return <Alerta>{erro}</Alerta>;
  if (!dados) return <Spinner texto="Carregando sua liga..." />;

  const minhaDivisao = DIVISAO_INFO[dados.divisao] ?? DIVISAO_INFO.bronze;
  const indiceDivisao = dados.divisoes.indexOf(dados.divisao);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-pixel text-base text-slate-100">Liga Semanal</h1>
        <p className="mt-1 text-sm text-slate-400">
          Compete por XP ganho NESTA semana, dentro da sua divisão — todo mundo começa a segunda
          zerado. No fim da semana, os melhores sobem de divisão e os últimos descem.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {dados.divisoes.map((div, i) => {
          const info = DIVISAO_INFO[div];
          const ativa = div === dados.divisao;
          return (
            <span
              key={div}
              className={`flex items-center gap-1.5 border-2 px-3 py-1.5 font-pixel text-[10px] ${
                ativa
                  ? `${info.borda} bg-slate-900 ${info.cor}`
                  : 'border-slate-800 text-slate-600'
              }`}
            >
              <PixelIcon nome="trophy" className="h-4 w-4" />
              {info.rotulo}
              {ativa && i === dados.divisoes.length - 1 && (
                <span className="ml-1 text-slate-500">(topo)</span>
              )}
            </span>
          );
        })}
      </div>

      <div className={`card-pixel border-2 ${minhaDivisao.borda} bg-slate-900/60 p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Sua divisão</p>
            <p className={`font-pixel text-sm ${minhaDivisao.cor}`}>{minhaDivisao.rotulo}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500">XP nesta semana</p>
            <p className="font-pixel text-sm text-indigo-300">{dados.xp_semana}</p>
          </div>
        </div>
        {indiceDivisao === dados.divisoes.length - 1 && (
          <p className="mt-3 text-xs text-cyan-300">
            Você está na divisão mais alta — mantenha o ritmo para não cair!
          </p>
        )}
      </div>

      {erro && <Alerta>{erro}</Alerta>}
      <TabelaLiga ranking={dados.ranking} />
    </div>
  );
}

function TabelaLiga({ ranking }) {
  if (!ranking.length) {
    return <p className="text-sm text-slate-500">Ninguém pontuou na sua divisão ainda esta semana.</p>;
  }

  return (
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
          {ranking.map((linha) => (
            <tr
              key={linha.posicao}
              className={`border-t border-slate-800 ${
                linha.voce ? 'bg-indigo-500/10' : 'odd:bg-slate-950 even:bg-slate-900/40'
              }`}
            >
              <td className="px-4 py-3 font-mono">
                {linha.posicao <= 3 ? (
                  <PixelIcon nome="trophy" className={`h-5 w-5 ${CORES_MEDALHA[linha.posicao - 1]}`} />
                ) : (
                  `${linha.posicao}º`
                )}
              </td>
              <td className="px-4 py-3 font-medium">
                {linha.nome}
                {linha.voce && <span className="ml-2 text-xs text-indigo-300">(você)</span>}
              </td>
              <td className="px-4 py-3 text-right font-mono text-amber-300">{linha.xp_semana}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
