import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import PixelIcon from '../ui/PixelIcon.jsx';

// Cartas colecionáveis (roadmap 4.9): frente com arte pixel procedural
// (derivada do id da competência, mesma ideia do AvatarPixel), verso com o
// resumo do conceito — material de consulta rápida. Carta não revelada
// mostra só o nome.
const PALETAS = [
  ['#312e81', '#818cf8'],
  ['#064e3b', '#34d399'],
  ['#7c2d12', '#fb923c'],
  ['#701a75', '#e879f9'],
  ['#0c4a6e', '#38bdf8'],
];

function ArteCarta({ semente, revelada }) {
  // 5x5 espelhado na horizontal (padrão de "identicon"), determinístico
  let h = semente * 2654435761;
  const bits = [];
  for (let i = 0; i < 15; i++) {
    h = (h ^ (h >>> 13)) * 1274126177;
    bits.push(((h >>> 7) & 1) === 1);
  }
  const [fundo, tinta] = revelada ? PALETAS[semente % PALETAS.length] : ['#1e293b', '#334155'];
  const celulas = [];
  for (let linha = 0; linha < 5; linha++) {
    for (let col = 0; col < 3; col++) {
      if (!bits[linha * 3 + col]) continue;
      celulas.push([col, linha]);
      if (col < 2) celulas.push([4 - col, linha]);
    }
  }
  return (
    <svg viewBox="0 0 5 5" className="h-16 w-16" aria-hidden shapeRendering="crispEdges">
      <rect width="5" height="5" fill={fundo} />
      {celulas.map(([cx, cy]) => (
        <rect key={`${cx}-${cy}`} x={cx} y={cy} width="1" height="1" fill={tinta} />
      ))}
    </svg>
  );
}

function Carta({ carta }) {
  const [verso, setVerso] = useState(false);
  return (
    <button
      type="button"
      onClick={() => carta.revelada && setVerso((v) => !v)}
      disabled={!carta.revelada}
      aria-pressed={verso}
      aria-label={carta.revelada ? `Carta ${carta.nome} — ver ${verso ? 'frente' : 'verso'}` : `Carta ${carta.nome} (não revelada)`}
      className={`card-pixel flex h-48 w-36 shrink-0 flex-col items-center border-2 p-3 text-center transition-colors ${
        carta.revelada
          ? 'border-amber-500/50 bg-slate-900 hover:border-amber-400'
          : 'border-slate-800 bg-slate-950/60 opacity-70'
      }`}
    >
      {verso ? (
        <p className="overflow-y-auto text-left text-[11px] leading-snug text-slate-200">{carta.resumo}</p>
      ) : (
        <>
          <ArteCarta semente={carta.id} revelada={carta.revelada} />
          <p className="mt-3 text-xs font-semibold text-slate-100">{carta.nome}</p>
          <p className="mt-auto text-[10px] text-slate-500">
            {carta.revelada ? 'toque para ver o verso' : 'domine a competência para revelar'}
          </p>
        </>
      )}
    </button>
  );
}

export default function AlbumCartas() {
  const [albuns, setAlbuns] = useState(null);

  useEffect(() => {
    api.get('/perfil/cartas').then(setAlbuns).catch(() => setAlbuns([]));
  }, []);

  if (!albuns?.length) return null;

  return (
    <section>
      <h2 className="flex items-center gap-2 font-pixel text-sm text-slate-100">
        <PixelIcon nome="book-open" className="h-5 w-5 text-amber-300" />
        Álbum de cartas
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Acerte ao menos 80% de 5 ou mais questões de uma competência para revelar a carta dela.
      </p>
      <div className="mt-3 space-y-4">
        {albuns.map((a) => (
          <div key={a.tema_id}>
            <p className="text-xs text-slate-400">
              {a.tema} — {a.reveladas}/{a.total}
              {a.completo && <span className="ml-2 text-amber-300">álbum completo!</span>}
            </p>
            <div className="mt-2 flex gap-3 overflow-x-auto pb-2">
              {a.cartas.map((c) => (
                <Carta key={c.id} carta={c} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
