import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PixelIcon from '../ui/PixelIcon.jsx';
import ConfetePixel from './ConfetePixel.jsx';
import CartaoStat from './CartaoStat.jsx';
import pixelTrofeu from '../../assets/img/pixel-trofeu.svg';
import pixelTriste from '../../assets/img/pixel-triste.svg';
import { tocarVitoria, tocarDerrota, tocarBadge } from '../../lib/sons.js';

export default function TelaResultado({ resultado, sons = true }) {
  const pct = Math.round((100 * resultado.acertos) / resultado.total_questoes);

  // fanfarra ao entrar na tela (e brilho extra se ganhou badge)
  useEffect(() => {
    if (!sons) return;
    if (resultado.aprovada) tocarVitoria();
    else tocarDerrota();
    if (resultado.badges_novas?.length) {
      const t = setTimeout(tocarBadge, 1200);
      return () => clearTimeout(t);
    }
  }, [resultado, sons]);

  return (
    <div className="mx-auto max-w-2xl text-center">
      {resultado.aprovada && <ConfetePixel />}

      {resultado.aprovada ? (
        <img src={pixelTrofeu} alt="Troféu pixel-art" className="anim-flutuar mx-auto w-24" />
      ) : (
        <img src={pixelTriste} alt="Carinha triste pixel-art" className="anim-flutuar mx-auto w-20" />
      )}
      <h1 className={`mt-6 font-pixel text-lg text-slate-100 ${resultado.aprovada ? 'anim-pop' : ''}`}>
        {resultado.aprovada ? 'FASE CONCLUÍDA!' : 'QUASE LÁ!'}
      </h1>
      <p className="mt-1 text-slate-400">
        {resultado.fase} — você acertou {resultado.acertos} de {resultado.total_questoes} ({pct}%)
      </p>
      {!resultado.aprovada && (
        <p className="mt-1 text-sm text-amber-400/80">
          Acerte pelo menos 70% para concluir a fase. Tente de novo!
        </p>
      )}

      <div className="mt-8 grid grid-cols-3 gap-3">
        <CartaoStat rotulo="XP ganho" valor={`+${resultado.xp_ganho}`} destaque />
        <CartaoStat rotulo="XP total" valor={resultado.xp_total} />
        <CartaoStat rotulo="Nível" valor={resultado.nivel} />
      </div>

      {resultado.streak_dias > 1 && (
        <div className="anim-pop card-pixel mt-4 flex items-center justify-center gap-2 border-2 border-orange-500/40 bg-orange-500/10 p-3 text-orange-300">
          <PixelIcon nome="fire" className="h-5 w-5" />
          {resultado.streak_dias} dias seguidos jogando!
        </div>
      )}

      {resultado.xp_ganho === 0 && resultado.xp_bruto > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          Você já havia alcançado essa pontuação antes — repetir a fase só rende XP ao superar seu
          recorde.
        </p>
      )}

      {resultado.subiu_nivel && (
        <div className="anim-pop card-pixel mt-6 flex items-center justify-center gap-2 border-2 border-violet-500/40 bg-violet-500/10 p-4 text-violet-300">
          <PixelIcon nome="zap" className="h-5 w-5" />
          Você subiu para o nível {resultado.nivel}!
        </div>
      )}

      {resultado.badges_novas?.length > 0 && (
        <div className="anim-pop card-pixel mt-6 border-2 border-amber-500/40 bg-amber-500/10 p-4">
          <p className="flex items-center justify-center gap-2 font-semibold text-amber-300">
            <PixelIcon nome="trophy" className="h-5 w-5" />
            Novas conquistas!
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            {resultado.badges_novas.map((badge) => (
              <div
                key={badge.id ?? badge.nome}
                className="anim-pular border-2 border-amber-500/30 bg-slate-900/60 px-4 py-2"
              >
                <span className="text-2xl">{badge.icone}</span>
                <p className="mt-1 text-xs font-medium text-slate-200">{badge.nome}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-center gap-4">
        <Link
          to="/"
          className="btn-pixel flex items-center gap-2 bg-indigo-600 px-6 py-3 font-pixel text-[10px] text-white transition-colors hover:bg-indigo-500"
        >
          <PixelIcon nome="map-pin" className="h-4 w-4" />
          VOLTAR AO MAPA
        </Link>
        <Link
          to="/ranking"
          className="btn-pixel flex items-center gap-2 border-2 border-slate-700 bg-slate-900 px-6 py-3 font-pixel text-[10px] text-slate-300 transition-colors hover:bg-slate-800"
        >
          <PixelIcon nome="trophy" className="h-4 w-4" />
          RANKING
        </Link>
      </div>
    </div>
  );
}
