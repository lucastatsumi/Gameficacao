import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Alerta from '../components/ui/Alerta.jsx';
import PixelIcon from '../components/ui/PixelIcon.jsx';
import pixelTrofeu from '../assets/img/pixel-trofeu.svg';
import pixelFeliz from '../assets/img/pixel-feliz.svg';
import pixelTriste from '../assets/img/pixel-triste.svg';
import {
  somLigado,
  alternarSom,
  tocarClique,
  tocarAcerto,
  tocarErro,
  tocarTick,
  tocarVitoria,
  tocarDerrota,
  tocarBadge,
} from '../lib/sons.js';

export default function Quiz() {
  // /quiz/:faseId (campanha) ou /quiz/custom/:quizId (quiz da turma)
  const { faseId, quizId } = useParams();
  const { recarregarPerfil } = useAuth();

  const [quiz, setQuiz] = useState(null); // { tentativa_id, fase|quiz, questoes }
  const [indice, setIndice] = useState(0);
  const [feedback, setFeedback] = useState(null); // resposta de /quiz/responder
  const [selecionada, setSelecionada] = useState(null);
  const [resultado, setResultado] = useState(null); // resposta de /quiz/finalizar
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [somAtivo, setSomAtivo] = useState(somLigado());
  const [dica, setDica] = useState(null); // texto da dica revelada

  const [tempoRestante, setTempoRestante] = useState(0);
  const inicioQuestaoRef = useRef(Date.now());
  const ultimoTickRef = useRef(null); // evita tocar o tick 2x no mesmo segundo

  const questao = quiz?.questoes[indice];
  const ultima = quiz && indice === quiz.questoes.length - 1;
  // o professor pode desligar os sons na configuração do quiz custom
  const sonsPermitidos = quiz?.quiz?.sons !== false;
  const som = (tocar) => {
    if (sonsPermitidos) tocar();
  };

  // ---------- carregar quiz ----------
  useEffect(() => {
    const chamada = quizId
      ? api.post('/quiz/iniciar-custom', { quiz_id: quizId })
      : api.post('/quiz/iniciar', { fase_id: Number(faseId) });
    chamada
      .then((dados) => {
        setQuiz(dados);
        setTempoRestante(dados.questoes[0].tempo_limite_seg);
        inicioQuestaoRef.current = Date.now();
      })
      .catch((err) => setErro(err.message));
  }, [faseId, quizId]);

  // ---------- enviar resposta ----------
  const responder = useCallback(
    async (alternativaId) => {
      if (enviando || feedback) return;
      setEnviando(true);
      setSelecionada(alternativaId);
      try {
        const fb = await api.post('/quiz/responder', {
          tentativa_id: quiz.tentativa_id,
          questao_id: questao.id,
          alternativa_id: alternativaId,
          tempo_resposta_ms: Date.now() - inicioQuestaoRef.current,
        });
        setFeedback(fb);
        if (fb.correta) som(tocarAcerto);
        else som(tocarErro);
      } catch (err) {
        setErro(err.message);
      } finally {
        setEnviando(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enviando, feedback, quiz, questao, sonsPermitidos],
  );

  // ---------- pedir dica (quiz custom; corta o XP da questão) ----------
  async function pedirDica() {
    som(tocarClique);
    try {
      const resposta = await api.post('/quiz/dica', {
        tentativa_id: quiz.tentativa_id,
        questao_id: questao.id,
      });
      setDica(resposta.dica);
    } catch (err) {
      setErro(err.message);
    }
  }

  // ---------- timer da questão ----------
  useEffect(() => {
    if (!questao || feedback || resultado) return;
    const intervalo = setInterval(() => {
      const decorrido = Math.floor((Date.now() - inicioQuestaoRef.current) / 1000);
      const restante = questao.tempo_limite_seg - decorrido;
      setTempoRestante(Math.max(0, restante));

      // tick sonoro nos 5 segundos finais (uma vez por segundo)
      if (restante > 0 && restante <= 5 && ultimoTickRef.current !== restante) {
        ultimoTickRef.current = restante;
        if (sonsPermitidos) tocarTick();
      }

      if (restante <= 0) {
        clearInterval(intervalo);
        responder(null); // tempo esgotado: envia sem alternativa
      }
    }, 250);
    return () => clearInterval(intervalo);
    // sonsPermitidos de propósito fora das deps: alternar o som não pode
    // reiniciar o intervalo e resetar a contagem do timer em andamento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questao, feedback, resultado, responder]);

  // ---------- avançar / finalizar ----------
  async function proxima() {
    som(tocarClique);
    if (ultima) {
      setEnviando(true);
      try {
        const res = await api.post('/quiz/finalizar', { tentativa_id: quiz.tentativa_id });
        setResultado(res);
        recarregarPerfil(); // atualiza XP/nível na navbar
      } catch (err) {
        setErro(err.message);
      } finally {
        setEnviando(false);
      }
      return;
    }
    setIndice((i) => i + 1);
    setFeedback(null);
    setSelecionada(null);
    setDica(null);
    ultimoTickRef.current = null;
    const proximaQuestao = quiz.questoes[indice + 1];
    setTempoRestante(proximaQuestao.tempo_limite_seg);
    inicioQuestaoRef.current = Date.now();
  }

  // ---------- telas ----------
  if (erro)
    return (
      <div className="space-y-4">
        <Alerta>{erro}</Alerta>
        <Link to="/" className="text-sm text-indigo-300 hover:underline">
          ← Voltar ao mapa
        </Link>
      </div>
    );
  if (!quiz) return <Spinner texto="Preparando o quiz..." />;
  if (resultado) return <TelaResultado resultado={resultado} sons={sonsPermitidos} />;

  const timerCritico = tempoRestante <= 10;

  return (
    <div className="mx-auto max-w-3xl">
      {/* flash de tela ao responder */}
      {feedback && (
        <div
          key={`flash-${indice}`}
          aria-hidden
          className={`anim-flash pointer-events-none fixed inset-0 z-20 ${
            feedback.correta ? 'bg-emerald-400/15' : 'bg-red-500/15'
          }`}
        />
      )}

      {/* progresso e timer */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-pixel text-sm text-slate-100">
            {quiz.fase?.nome ?? quiz.quiz?.titulo}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Questão {indice + 1} de {quiz.questoes.length}
            {quiz.quiz && <span className="ml-2 text-indigo-300">· Quiz da turma</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const ligado = alternarSom();
              setSomAtivo(ligado);
              if (ligado) tocarClique();
            }}
            title={somAtivo ? 'Desligar som' : 'Ligar som'}
            className="btn-pixel border-2 border-slate-700 bg-slate-900 p-2 text-slate-300 hover:bg-slate-800"
          >
            <PixelIcon
              nome={somAtivo ? 'volume-2' : 'volume'}
              className={`h-5 w-5 ${somAtivo ? '' : 'text-slate-600'}`}
            />
          </button>
          <div
            className={`card-pixel flex items-center gap-2 border-2 px-4 py-2 text-center font-pixel text-sm ${
              timerCritico
                ? 'animate-pulse border-red-500/60 bg-red-500/10 text-red-300'
                : 'border-slate-700 bg-slate-900 text-slate-200'
            }`}
          >
            <PixelIcon nome="clock" className="h-5 w-5" />
            {tempoRestante}s
          </div>
        </div>
      </div>

      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full bg-indigo-500 transition-all"
          style={{ width: `${((indice + (feedback ? 1 : 0)) / quiz.questoes.length) * 100}%` }}
        />
      </div>

      {/* enunciado */}
      <div
        className={`card-pixel relative border-2 border-slate-800 bg-slate-900/60 p-6 ${
          feedback && !feedback.correta ? 'anim-tremer' : ''
        }`}
      >
        <div className="mb-1 flex gap-2 text-xs">
          <span className="bg-slate-800 px-2 py-0.5 text-slate-400">{questao.dificuldade}</span>
          <span className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 text-amber-300">
            <PixelIcon nome="zap" className="h-3.5 w-3.5" />+{questao.xp_valor} XP
          </span>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-slate-100">{questao.enunciado}</p>
        {questao.codigo_snippet && (
          <pre className="mt-4 overflow-x-auto border-2 border-slate-800 bg-slate-950 p-4 text-sm text-emerald-300">
            <code>{questao.codigo_snippet}</code>
          </pre>
        )}

        {/* "+XP" flutuando quando acerta (metade se usou dica) */}
        {feedback?.correta && (
          <span
            key={`xp-${indice}`}
            className="anim-subir pointer-events-none absolute -top-2 right-4 font-pixel text-sm text-amber-300"
          >
            +{feedback.usou_dica ? Math.max(1, Math.floor(questao.xp_valor / 2)) : questao.xp_valor}{' '}
            XP
          </span>
        )}
      </div>

      {/* dica (quiz custom) */}
      {questao.tem_dica && !feedback && (
        <div className="mt-3">
          {dica ? (
            <div className="anim-pop card-pixel flex items-start gap-3 border-2 border-amber-500/40 bg-amber-500/10 p-4">
              <PixelIcon nome="zap" className="h-5 w-5 shrink-0 text-amber-300" />
              <div>
                <p className="text-sm text-amber-200">{dica}</p>
                <p className="mt-1 text-xs text-amber-400/70">
                  Dica usada: esta questão vale metade do XP.
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={pedirDica}
              className="btn-pixel flex items-center gap-2 border-2 border-amber-500/40 bg-slate-900 px-4 py-2 font-pixel text-[10px] text-amber-300 hover:bg-amber-500/10"
            >
              <PixelIcon nome="zap" className="h-4 w-4" />
              PEDIR DICA (-50% XP)
            </button>
          )}
        </div>
      )}

      {/* alternativas */}
      <div className="mt-4 space-y-3">
        {questao.alternativas.map((alt) => (
          <BotaoAlternativa
            key={alt.id}
            alt={alt}
            feedback={feedback}
            selecionada={selecionada}
            desabilitado={Boolean(feedback) || enviando}
            aoClicar={() => {
              som(tocarClique);
              responder(alt.id);
            }}
          />
        ))}
      </div>

      {/* feedback + próxima */}
      {feedback && (
        <div className="mt-6 space-y-4">
          <div
            className={`card-pixel flex items-start gap-4 border-2 p-4 ${
              feedback.correta
                ? 'anim-pop border-emerald-500/40 bg-emerald-500/10'
                : 'anim-tremer border-red-500/40 bg-red-500/10'
            }`}
          >
            {/* expressão pixel */}
            <img
              src={feedback.correta ? pixelFeliz : pixelTriste}
              alt={feedback.correta ? 'Carinha feliz' : 'Carinha triste'}
              className={`w-12 shrink-0 ${feedback.correta ? 'anim-pular' : 'anim-tremer'}`}
            />
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                <PixelIcon
                  nome={feedback.tempo_esgotado ? 'clock' : feedback.correta ? 'check' : 'close'}
                  className={`h-5 w-5 shrink-0 ${feedback.correta ? 'text-emerald-300' : 'text-red-300'}`}
                />
                {feedback.tempo_esgotado
                  ? 'Tempo esgotado!'
                  : feedback.correta
                    ? 'Resposta correta!'
                    : 'Resposta incorreta'}
                {!feedback.correta && feedback.alternativa_correta && (
                  <span className="font-normal text-slate-300">
                    A correta era a alternativa {feedback.alternativa_correta.letra}.
                  </span>
                )}
              </p>
              {(() => {
                const explicacao = feedback.explicacoes.find(
                  (e) => e.id === (feedback.alternativa_correta?.id ?? null),
                );
                return explicacao ? (
                  <p className="mt-2 text-sm text-slate-300">{explicacao.explicacao}</p>
                ) : null;
              })()}
            </div>
          </div>

          <button
            onClick={proxima}
            disabled={enviando}
            className="btn-pixel flex w-full items-center justify-center gap-2 bg-indigo-600 py-3 font-pixel text-[11px] text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            <PixelIcon nome={ultima ? 'flag' : 'arrow-right'} className="h-4 w-4" />
            {enviando ? 'AGUARDE...' : ultima ? 'VER RESULTADO' : 'PRÓXIMA'}
          </button>
        </div>
      )}
    </div>
  );
}

function BotaoAlternativa({ alt, feedback, selecionada, desabilitado, aoClicar }) {
  let estilo = 'border-slate-800 bg-slate-900/60 hover:border-indigo-500/60 card-pixel';
  let anim = '';
  if (feedback) {
    const ehCorreta = feedback.alternativa_correta?.id === alt.id;
    const foiEscolhida = selecionada === alt.id;
    if (ehCorreta) {
      estilo = 'border-emerald-500/60 bg-emerald-500/10';
      anim = 'anim-pop';
    } else if (foiEscolhida) {
      estilo = 'border-red-500/60 bg-red-500/10';
      anim = 'anim-tremer';
    } else estilo = 'border-slate-800 bg-slate-900/40 opacity-60';
  } else if (selecionada === alt.id) {
    estilo = 'border-indigo-500 bg-indigo-500/10';
  }

  const explicacao = feedback?.explicacoes.find((e) => e.id === alt.id);
  const mostrarExplicacao =
    feedback && (selecionada === alt.id || feedback.alternativa_correta?.id === alt.id);

  return (
    <button
      onClick={aoClicar}
      disabled={desabilitado}
      className={`w-full border-2 p-4 text-left transition-colors disabled:cursor-default ${estilo} ${anim}`}
    >
      <div className="flex gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-slate-800 font-pixel text-[10px] text-indigo-300">
          {alt.letra}
        </span>
        <span className="text-sm text-slate-200">{alt.texto}</span>
      </div>
      {mostrarExplicacao && explicacao && (
        <p className="mt-2 pl-10 text-xs text-slate-400">{explicacao.explicacao}</p>
      )}
    </button>
  );
}

// Confete pixel que cai pela tela (só na aprovação)
function ConfetePixel() {
  const pecas = useMemo(() => {
    const cores = ['#fbbf24', '#34d399', '#818cf8', '#f87171', '#f0abfc', '#38bdf8'];
    return Array.from({ length: 36 }, (_, i) => ({
      id: i,
      esquerda: Math.random() * 100,
      atraso: Math.random() * 1.2,
      duracao: 2.4 + Math.random() * 2,
      deriva: (Math.random() - 0.5) * 120,
      tamanho: 6 + Math.floor(Math.random() * 6),
      cor: cores[i % cores.length],
    }));
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {pecas.map((p) => (
        <span
          key={p.id}
          className="anim-confete absolute top-0 block"
          style={{
            left: `${p.esquerda}%`,
            width: p.tamanho,
            height: p.tamanho,
            backgroundColor: p.cor,
            animationDelay: `${p.atraso}s`,
            '--dur': `${p.duracao}s`,
            '--dx': `${p.deriva}px`,
          }}
        />
      ))}
    </div>
  );
}

function TelaResultado({ resultado, sons = true }) {
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
        <img
          src={pixelTriste}
          alt="Carinha triste pixel-art"
          className="anim-flutuar mx-auto w-20"
        />
      )}
      <h1
        className={`mt-6 font-pixel text-lg text-slate-100 ${resultado.aprovada ? 'anim-pop' : ''}`}
      >
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

function CartaoStat({ rotulo, valor, destaque = false }) {
  return (
    <div
      className={`card-pixel border-2 p-4 ${
        destaque ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-slate-800 bg-slate-900/60'
      }`}
    >
      <p className={`font-pixel text-lg ${destaque ? 'text-indigo-300' : 'text-slate-100'}`}>
        {valor}
      </p>
      <p className="mt-2 text-xs text-slate-400">{rotulo}</p>
    </div>
  );
}
