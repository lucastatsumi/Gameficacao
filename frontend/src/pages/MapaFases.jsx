import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import Spinner from '../components/ui/Spinner.jsx';
import Alerta from '../components/ui/Alerta.jsx';
import PixelIcon from '../components/ui/PixelIcon.jsx';
import pixelNuvem from '../assets/img/pixel-nuvem.svg';
import pixelEstrela from '../assets/img/pixel-estrela.svg';

// Ícone pixel de cada fase: Listas, Pilhas, Filas, Árvores, Ordenação,
// Batalha de Complexidade (fase bônus)
const ICONES_FASE = ['arrow-right', 'coins', 'users', 'map-pin', 'chart-bar-big', 'fire'];

function NoFase({ fase, indice }) {
  const concluida = fase.progresso?.concluida;
  const bloqueada = !fase.desbloqueada;

  const estilo = concluida
    ? 'border-emerald-500/60 bg-emerald-500/10'
    : bloqueada
      ? 'border-slate-800 bg-slate-900/40 opacity-60'
      : 'border-indigo-500/60 bg-indigo-500/10 hover:border-indigo-400';

  const conteudo = (
    <div className={`card-pixel border-2 p-5 transition-colors ${estilo}`}>
      <div className="flex items-start gap-4">
        {/* "tile" da fase */}
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center border-2 ${
            concluida
              ? 'border-emerald-500/60 bg-emerald-950 text-emerald-300'
              : bloqueada
                ? 'border-slate-700 bg-slate-900 text-slate-600'
                : 'border-indigo-500/60 bg-indigo-950 text-indigo-300'
          }`}
        >
          <PixelIcon
            nome={bloqueada ? 'lock' : ICONES_FASE[indice % ICONES_FASE.length]}
            className="h-7 w-7"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-pixel text-[10px] text-slate-500">FASE {fase.ordem}</span>
            <h3 className="font-semibold text-slate-100">{fase.nome}</h3>
            {concluida && (
              <span className="flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
                <PixelIcon nome="check" className="h-3.5 w-3.5" />
                Concluída
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-400">{fase.descricao}</p>
          {fase.progresso && (
            <p className="mt-2 flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <PixelIcon nome="star" className="h-3.5 w-3.5 text-amber-400/70" />
                Melhor: {fase.progresso.melhor_pontuacao}
              </span>
              <span className="flex items-center gap-1">
                <PixelIcon nome="reload" className="h-3.5 w-3.5" />
                Tentativas: {fase.progresso.num_tentativas}
              </span>
            </p>
          )}
          {bloqueada && (
            <p className="mt-2 flex items-center gap-1 text-xs text-amber-400/80">
              <PixelIcon nome="lock" className="h-3.5 w-3.5" />
              Conclua a fase anterior para desbloquear
            </p>
          )}
        </div>

        {!bloqueada && (
          <span className="btn-pixel flex items-center gap-2 self-center bg-indigo-600 px-4 py-2 font-pixel text-[10px] text-white">
            <PixelIcon nome={concluida ? 'reload' : 'play'} className="h-4 w-4" />
            {concluida ? 'REJOGAR' : 'JOGAR'}
          </span>
        )}
      </div>
    </div>
  );

  return bloqueada ? (
    <div>{conteudo}</div>
  ) : (
    <Link to={`/quiz/${fase.id}`} className="block">
      {conteudo}
    </Link>
  );
}

export default function MapaFases() {
  const [fases, setFases] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api
      .get('/fases')
      .then(setFases)
      .catch((err) => setErro(err.message));
  }, []);

  if (erro) return <Alerta>{erro}</Alerta>;
  if (!fases) return <Spinner texto="Carregando o mapa..." />;

  return (
    <div className="relative">
      {/* cenário do mundo */}
      <img src={pixelNuvem} alt="" aria-hidden className="anim-flutuar-lento pointer-events-none absolute -top-4 right-[5%] w-24 opacity-30" />
      <img src={pixelNuvem} alt="" aria-hidden className="anim-flutuar pointer-events-none absolute top-1/3 -left-6 w-16 opacity-20" />
      <img src={pixelEstrela} alt="" aria-hidden className="anim-flutuar-rapido pointer-events-none absolute top-10 right-[30%] w-6 opacity-60" />

      <div className="flex items-center gap-3">
        <PixelIcon nome="map-pin" className="h-7 w-7 text-indigo-400" />
        <h1 className="font-pixel text-lg text-slate-100">Mapa de Fases</h1>
      </div>
      <p className="mt-2 text-sm text-slate-400">
        Acerte pelo menos 70% do quiz para concluir a fase e desbloquear a próxima.
      </p>

      <div className="relative mt-6 space-y-5">
        {/* trilha vertical ligando as fases */}
        <div
          aria-hidden
          className="absolute left-[42px] top-4 bottom-4 w-1 bg-[repeating-linear-gradient(180deg,#4c1d95_0px,#4c1d95_6px,transparent_6px,transparent_14px)]"
        />
        {fases.map((fase, i) => (
          <div key={fase.id} className="relative">
            <NoFase fase={fase} indice={i} />
          </div>
        ))}
      </div>
    </div>
  );
}
