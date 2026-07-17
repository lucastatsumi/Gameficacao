import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useI18n } from '../contexts/I18nContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Alerta from '../components/ui/Alerta.jsx';
import PixelIcon from '../components/ui/PixelIcon.jsx';
import pixelNuvem from '../assets/img/pixel-nuvem.svg';
import pixelEstrela from '../assets/img/pixel-estrela.svg';

// Ícone pixel de cada fase: Listas, Pilhas, Filas, Árvores, Ordenação,
// Batalha de Complexidade e Reordenar Algoritmo (fases bônus)
const ICONES_FASE = ['arrow-right', 'coins', 'users', 'map-pin', 'chart-bar-big', 'fire', 'reload'];

function NoFase({ fase, indice }) {
  const { t } = useI18n();
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
            <span className="font-pixel text-[10px] text-slate-500">
              {t('mapa.fase')} {fase.ordem}
            </span>
            <h3 className="font-semibold text-slate-100">{fase.nome}</h3>
            {concluida && (
              <span className="flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
                <PixelIcon nome="check" className="h-3.5 w-3.5" />
                {t('mapa.concluida')}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-400">{fase.descricao}</p>
          {fase.progresso && (
            <p className="mt-2 flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <PixelIcon nome="star" className="h-3.5 w-3.5 text-amber-400/70" />
                {t('mapa.melhor')}: {fase.progresso.melhor_pontuacao}
              </span>
              <span className="flex items-center gap-1">
                <PixelIcon nome="reload" className="h-3.5 w-3.5" />
                {t('mapa.tentativas')}: {fase.progresso.num_tentativas}
              </span>
            </p>
          )}
          {bloqueada && (
            <p className="mt-2 flex items-center gap-1 text-xs text-amber-400/80">
              <PixelIcon nome="lock" className="h-3.5 w-3.5" />
              {t('mapa.bloqueada')}
            </p>
          )}
        </div>

        {!bloqueada && (
          <span className="btn-pixel flex items-center gap-2 self-center bg-indigo-600 px-4 py-2 font-pixel text-[10px] text-white">
            <PixelIcon nome={concluida ? 'reload' : 'play'} className="h-4 w-4" />
            {concluida ? t('mapa.rejogar') : t('mapa.jogar')}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {bloqueada ? (
        <div>{conteudo}</div>
      ) : (
        <Link to={`/quiz/${fase.id}`} className="block">
          {conteudo}
        </Link>
      )}
      {/* "Desafio assíncrono": recorte de multiplayer sem infra de tempo
          real — gera um link com a melhor pontuação do aluno pra um colega
          tentar bater. Fora do <Link> da fase pra não aninhar elementos
          clicáveis. */}
      {concluida && <BotaoDesafiar faseId={fase.id} />}
    </div>
  );
}

function BotaoDesafiar({ faseId }) {
  const { t } = useI18n();
  const [estado, setEstado] = useState('idle'); // idle | enviando | copiado | erro

  async function desafiar() {
    setEstado('enviando');
    try {
      const { id } = await api.post('/desafios', { fase_id: faseId });
      const link = `${window.location.origin}/desafio/${id}`;
      try {
        await navigator.clipboard.writeText(link);
      } catch {
        window.prompt(t('mapa.copieOLink'), link);
      }
      setEstado('copiado');
      setTimeout(() => setEstado('idle'), 2500);
    } catch {
      setEstado('erro');
      setTimeout(() => setEstado('idle'), 2500);
    }
  }

  return (
    <button
      onClick={desafiar}
      disabled={estado === 'enviando'}
      className="btn-pixel mt-2 flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
    >
      <PixelIcon nome={estado === 'copiado' ? 'check' : 'zap'} className="h-3.5 w-3.5" />
      {estado === 'copiado'
        ? t('mapa.linkCopiado')
        : estado === 'erro'
          ? t('mapa.erroDesafio')
          : t('mapa.desafiar')}
    </button>
  );
}

export default function MapaFases() {
  const { t } = useI18n();
  const [fases, setFases] = useState(null);
  const [pendente, setPendente] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api
      .get('/fases')
      .then(setFases)
      .catch((err) => setErro(err.message));
    api
      .get('/perfil/pendente')
      .then(setPendente)
      .catch(() => {}); // lembrete é cosmético — falha silenciosa não deve travar o mapa
  }, []);

  if (erro) return <Alerta>{erro}</Alerta>;
  if (!fases) return <Spinner texto={t('mapa.carregando')} />;

  return (
    <div className="relative">
      {/* cenário do mundo */}
      <img src={pixelNuvem} alt="" aria-hidden className="anim-flutuar-lento pointer-events-none absolute -top-4 right-[5%] w-24 opacity-30" />
      <img src={pixelNuvem} alt="" aria-hidden className="anim-flutuar pointer-events-none absolute top-1/3 -left-6 w-16 opacity-20" />
      <img src={pixelEstrela} alt="" aria-hidden className="anim-flutuar-rapido pointer-events-none absolute top-10 right-[30%] w-6 opacity-60" />

      <div className="flex items-center gap-3">
        <PixelIcon nome="map-pin" className="h-7 w-7 text-indigo-400" />
        <h1 className="font-pixel text-lg text-slate-100">{t('mapa.titulo')}</h1>
      </div>
      <p className="mt-2 text-sm text-slate-400">{t('mapa.subtitulo')}</p>

      {pendente && (
        <Link
          to={pendente.quiz_custom_id ? `/quiz/custom/${pendente.quiz_custom_id}` : `/quiz/${pendente.fase_id}`}
          className="card-pixel mt-4 flex items-center gap-3 border-2 border-amber-500/40 bg-amber-500/10 p-3 text-amber-200 transition-colors hover:border-amber-400"
        >
          <PixelIcon nome="clock" className="h-5 w-5 shrink-0" />
          <span className="text-sm">
            {t('mapa.pendentePrefixo')} <strong>{pendente.titulo}</strong> {t('mapa.pendenteSufixo')}
          </span>
        </Link>
      )}

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
