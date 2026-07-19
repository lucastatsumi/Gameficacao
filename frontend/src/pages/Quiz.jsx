import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Alerta from '../components/ui/Alerta.jsx';
import PixelIcon from '../components/ui/PixelIcon.jsx';
import BotaoAlternativa from '../components/quiz/BotaoAlternativa.jsx';
import BotaoBatalha from '../components/quiz/BotaoBatalha.jsx';
import TelaResultado from '../components/quiz/TelaResultado.jsx';
import pixelFeliz from '../assets/img/pixel-feliz.svg';
import pixelTriste from '../assets/img/pixel-triste.svg';
import { somLigado, alternarSom, tocarClique, tocarAcerto, tocarErro, tocarTick } from '../lib/sons.js';

export default function Quiz() {
  // /quiz/:faseId (campanha), /quiz/custom/:quizId (quiz da turma) ou
  // /quiz/diario (desafio diário — mesmas questões pra todo mundo hoje)
  const { faseId, quizId } = useParams();
  const ehDesafioDiario = faseId === 'diario';
  const { recarregarPerfil, perfil } = useAuth();

  const [quiz, setQuiz] = useState(null); // { tentativa_id, fase|quiz, questoes }
  const [indice, setIndice] = useState(0);
  const [feedback, setFeedback] = useState(null); // resposta de /quiz/responder
  const [selecionada, setSelecionada] = useState(null);
  const [resultado, setResultado] = useState(null); // resposta de /quiz/finalizar
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [somAtivo, setSomAtivo] = useState(somLigado());
  const [dica, setDica] = useState(null); // texto da dica revelada

  // poderes (power-ups): estoque local, sincronizado do perfil ao carregar o
  // quiz e debitado localmente a cada uso (o servidor é a fonte da verdade —
  // recarregarPerfil() no fim do quiz corrige qualquer divergência)
  const [estoquePoderes, setEstoquePoderes] = useState({
    eliminar_alternativa: 0,
    tempo_extra: 0,
    pular_questao: 0,
  });
  const [alternativaEscondida, setAlternativaEscondida] = useState(null);
  const [tempoExtraUsado, setTempoExtraUsado] = useState(false);
  const extraSegundosRef = useRef(0);

  useEffect(() => {
    if (perfil?.poderes) setEstoquePoderes(perfil.poderes);
  }, [perfil]);

  // minigame "reordenar algoritmo": ids dos passos na ordem que o aluno
  // clicou, até completar a sequência
  const [ordemEscolhida, setOrdemEscolhida] = useState([]);
  const [feedbackSeq, setFeedbackSeq] = useState(null); // resposta de /quiz/responder-sequencia

  // "boss fight" (quiz.quiz.vidas definido): contador de erros ACUMULADO
  // na tentativa inteira (não reseta por questão) — estoura o limite e o
  // desafio acaba ali, sem precisar responder o resto das questões
  const [errosCount, setErrosCount] = useState(0);

  // Combo de acertos seguidos — só animação/feedback: o bônus de XP é
  // calculado pelo servidor em /quiz/finalizar
  const [comboAtual, setComboAtual] = useState(0);

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
      : ehDesafioDiario
        ? api.post('/desafio-diario/iniciar')
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
        if (fb.correta) {
          som(tocarAcerto);
          setComboAtual((n) => n + 1);
        } else {
          som(tocarErro);
          setErrosCount((n) => n + 1);
          setComboAtual(0);
        }
      } catch (err) {
        setErro(err.message);
      } finally {
        setEnviando(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enviando, feedback, quiz, questao, sonsPermitidos]
  );

  // ---------- enviar sequência (minigame reordenar algoritmo) ----------
  const responderSeq = useCallback(
    async (ordem) => {
      if (enviando || feedbackSeq) return;
      setEnviando(true);
      try {
        const fb = await api.post('/quiz/responder-sequencia', {
          tentativa_id: quiz.tentativa_id,
          questao_id: questao.id,
          ordem,
        });
        setFeedbackSeq(fb);
        if (fb.correta) {
          som(tocarAcerto);
          setComboAtual((n) => n + 1);
        } else {
          som(tocarErro);
          setErrosCount((n) => n + 1);
          setComboAtual(0);
        }
      } catch (err) {
        setErro(err.message);
      } finally {
        setEnviando(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enviando, feedbackSeq, quiz, questao, sonsPermitidos]
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

  // ---------- usar poder (eliminar alternativa / tempo extra / pular) ----------
  async function usarPoder(poder) {
    if (enviando || feedback || feedbackSeq) return;
    if (poder === 'eliminar_alternativa' && (alternativaEscondida || estoquePoderes.eliminar_alternativa <= 0)) return;
    if (poder === 'tempo_extra' && (tempoExtraUsado || estoquePoderes.tempo_extra <= 0)) return;
    if (poder === 'pular_questao' && estoquePoderes.pular_questao <= 0) return;

    som(tocarClique);
    try {
      const resp = await api.post('/quiz/poder', {
        tentativa_id: quiz.tentativa_id,
        questao_id: questao.id,
        poder,
      });
      setEstoquePoderes((e) => ({ ...e, [poder]: e[poder] - 1 }));
      if (poder === 'pular_questao') {
        // sem tela de feedback: pular avança direto para a próxima questão
        proxima();
        return;
      }
      if (poder === 'eliminar_alternativa') {
        setAlternativaEscondida(resp.alternativa_removida_id);
      } else {
        extraSegundosRef.current += resp.segundos_extra;
        setTempoExtraUsado(true);
        setTempoRestante((t) => t + resp.segundos_extra);
      }
    } catch (err) {
      setErro(err.message);
    }
  }

  // ---------- timer da questão ----------
  useEffect(() => {
    if (!questao || feedback || feedbackSeq || resultado) return;
    const intervalo = setInterval(() => {
      const decorrido = Math.floor((Date.now() - inicioQuestaoRef.current) / 1000);
      const restante = questao.tempo_limite_seg + extraSegundosRef.current - decorrido;
      setTempoRestante(Math.max(0, restante));

      // tick sonoro nos 5 segundos finais (uma vez por segundo)
      if (restante > 0 && restante <= 5 && ultimoTickRef.current !== restante) {
        ultimoTickRef.current = restante;
        if (sonsPermitidos) tocarTick();
      }

      if (restante <= 0) {
        clearInterval(intervalo);
        // tempo esgotado: envia vazio/sem alternativa (o formato decide o formato do payload)
        if (questao.formato === 'reordenar_algoritmo') responderSeq(ordemEscolhida);
        else responder(null);
      }
    }, 250);
    return () => clearInterval(intervalo);
  }, [questao, feedback, feedbackSeq, resultado, responder, responderSeq, ordemEscolhida]);

  const vidasMax = quiz?.quiz?.vidas ?? null;
  const gameOver = vidasMax != null && errosCount >= vidasMax;

  // ---------- avançar / finalizar ----------
  async function proxima() {
    som(tocarClique);
    if (ultima || gameOver) {
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
    setFeedbackSeq(null);
    setOrdemEscolhida([]);
    setSelecionada(null);
    setDica(null);
    setAlternativaEscondida(null);
    setTempoExtraUsado(false);
    extraSegundosRef.current = 0;
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
  const respondida = Boolean(feedback) || Boolean(feedbackSeq);
  const correta = feedback?.correta ?? feedbackSeq?.correta ?? false;

  return (
    <div className="mx-auto max-w-3xl">
      {/* flash de tela ao responder */}
      {respondida && (
        <div
          key={`flash-${indice}`}
          aria-hidden
          className={`anim-flash pointer-events-none fixed inset-0 z-20 ${
            correta ? 'bg-emerald-400/15' : 'bg-red-500/15'
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
          {comboAtual >= 2 && (
            <span
              className="anim-pop flex items-center gap-1 border-2 border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-xs font-bold text-cyan-300"
              title="Acertos seguidos — bônus de XP no final"
            >
              <PixelIcon nome="zap" className="h-4 w-4" />
              COMBO ×{comboAtual}
            </span>
          )}
          {vidasMax != null && (
            <div className="flex items-center gap-1" title={`${Math.max(0, vidasMax - errosCount)} de ${vidasMax} vidas`}>
              {Array.from({ length: vidasMax }, (_, i) => (
                <PixelIcon
                  key={i}
                  nome="heart"
                  className={`h-5 w-5 ${i < vidasMax - errosCount ? 'text-red-400' : 'text-slate-700'}`}
                />
              ))}
            </div>
          )}
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
          style={{ width: `${((indice + (respondida ? 1 : 0)) / quiz.questoes.length) * 100}%` }}
        />
      </div>

      {/* enunciado */}
      <div
        className={`card-pixel relative border-2 border-slate-800 bg-slate-900/60 p-6 ${
          respondida && !correta ? 'anim-tremer' : ''
        }`}
      >
        <div className="mb-1 flex gap-2 text-xs">
          {questao.formato === 'batalha_complexidade' && (
            <span className="flex items-center gap-1 bg-fuchsia-500/10 px-2 py-0.5 text-fuchsia-300">
              <PixelIcon nome="fire" className="h-3.5 w-3.5" />
              BATALHA
            </span>
          )}
          {questao.formato === 'reordenar_algoritmo' && (
            <span className="flex items-center gap-1 bg-sky-500/10 px-2 py-0.5 text-sky-300">
              <PixelIcon nome="reload" className="h-3.5 w-3.5" />
              REORDENAR
            </span>
          )}
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
        {correta && (
          <span
            key={`xp-${indice}`}
            className="anim-subir pointer-events-none absolute -top-2 right-4 font-pixel text-sm text-amber-300"
          >
            +{feedback?.usou_dica ? Math.max(1, Math.floor(questao.xp_valor / 2)) : questao.xp_valor}{' '}
            XP
          </span>
        )}
      </div>

      {/* dica (quiz custom) */}
      {questao.tem_dica && !respondida && (
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

      {/* poderes — eliminar/tempo extra não se aplicam ao minigame de reordenar
          (sem alternativas) nem ao desafio diário (arena justa, sem poderes) */}
      {!respondida &&
        !ehDesafioDiario &&
        (estoquePoderes.pular_questao > 0 ||
          (questao.formato !== 'reordenar_algoritmo' &&
            (estoquePoderes.eliminar_alternativa > 0 || estoquePoderes.tempo_extra > 0))) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {questao.formato !== 'reordenar_algoritmo' && estoquePoderes.eliminar_alternativa > 0 && (
            <button
              onClick={() => usarPoder('eliminar_alternativa')}
              disabled={Boolean(alternativaEscondida) || enviando}
              title="Elimina uma alternativa errada"
              className="btn-pixel flex items-center gap-2 border-2 border-violet-500/40 bg-slate-900 px-3 py-2 font-pixel text-[10px] text-violet-300 hover:bg-violet-500/10 disabled:opacity-40"
            >
              <PixelIcon nome="trash" className="h-4 w-4" />
              50/50 ({estoquePoderes.eliminar_alternativa})
            </button>
          )}
          {questao.formato !== 'reordenar_algoritmo' && estoquePoderes.tempo_extra > 0 && (
            <button
              onClick={() => usarPoder('tempo_extra')}
              disabled={tempoExtraUsado || enviando}
              title="Adiciona 15 segundos ao tempo desta questão"
              className="btn-pixel flex items-center gap-2 border-2 border-sky-500/40 bg-slate-900 px-3 py-2 font-pixel text-[10px] text-sky-300 hover:bg-sky-500/10 disabled:opacity-40"
            >
              <PixelIcon nome="clock" className="h-4 w-4" />
              +15s ({estoquePoderes.tempo_extra})
            </button>
          )}
          {estoquePoderes.pular_questao > 0 && (
            <button
              onClick={() => usarPoder('pular_questao')}
              disabled={enviando}
              title="Pula esta questão sem contar contra sua aprovação"
              className="btn-pixel flex items-center gap-2 border-2 border-emerald-500/40 bg-slate-900 px-3 py-2 font-pixel text-[10px] text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40"
            >
              <PixelIcon nome="arrow-right" className="h-4 w-4" />
              PULAR ({estoquePoderes.pular_questao})
            </button>
          )}
        </div>
      )}

      {/* alternativas — layout normal ou "VS" da Batalha de Complexidade */}
      {questao.formato === 'batalha_complexidade' ? (
        <div className="relative mt-6">
          {!alternativaEscondida && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 border-2 border-fuchsia-500/60 bg-slate-950 px-3 py-1 font-pixel text-xs text-fuchsia-300 sm:block">
              VS
            </span>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {questao.alternativas
              .filter((alt) => alt.id !== alternativaEscondida)
              .map((alt) => (
                <BotaoBatalha
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
        </div>
      ) : questao.formato === 'reordenar_algoritmo' ? (
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
              Sua ordem {!respondida && '(clique para desfazer um passo)'}
            </p>
            {ordemEscolhida.length === 0 && !respondida && (
              <p className="text-xs text-slate-600">
                Clique nos passos abaixo, na ordem que você acha certa.
              </p>
            )}
            <div className="space-y-2">
              {ordemEscolhida.map((id, i) => {
                const passo = questao.passos.find((p) => p.id === id);
                if (!passo) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      if (respondida) return;
                      som(tocarClique);
                      setOrdemEscolhida((o) => o.filter((x) => x !== id));
                    }}
                    disabled={respondida || enviando}
                    className="card-pixel flex w-full items-center gap-3 border-2 border-sky-500/50 bg-sky-500/10 p-3 text-left text-sm text-slate-100 disabled:cursor-default"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-sky-500/30 font-pixel text-[10px] text-sky-200">
                      {i + 1}
                    </span>
                    {passo.texto}
                  </button>
                );
              })}
            </div>
          </div>

          {!respondida && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                Passos disponíveis
              </p>
              <div className="space-y-2">
                {questao.passos
                  .filter((p) => !ordemEscolhida.includes(p.id))
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        som(tocarClique);
                        setOrdemEscolhida((o) => [...o, p.id]);
                      }}
                      disabled={enviando}
                      className="card-pixel w-full border-2 border-slate-800 bg-slate-900/60 p-3 text-left text-sm text-slate-200 hover:border-sky-500/60"
                    >
                      {p.texto}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {!respondida && ordemEscolhida.length === questao.passos.length && (
            <button
              onClick={() => responderSeq(ordemEscolhida)}
              disabled={enviando}
              className="btn-pixel flex w-full items-center justify-center gap-2 bg-sky-600 py-3 font-pixel text-[11px] text-white hover:bg-sky-500 disabled:opacity-50"
            >
              <PixelIcon nome="check" className="h-4 w-4" />
              {enviando ? 'ENVIANDO...' : 'CONFIRMAR ORDEM'}
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {questao.alternativas
            .filter((alt) => alt.id !== alternativaEscondida)
            .map((alt) => (
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
      )}

      {/* feedback + próxima (formatos padrão/batalha) */}
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
                  (e) => e.id === (feedback.alternativa_correta?.id ?? null)
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
            <PixelIcon nome={ultima || gameOver ? 'flag' : 'arrow-right'} className="h-4 w-4" />
            {enviando ? 'AGUARDE...' : gameOver ? 'FIM DE JOGO — VER RESULTADO' : ultima ? 'VER RESULTADO' : 'PRÓXIMA'}
          </button>
        </div>
      )}

      {/* feedback + próxima (formato reordenar_algoritmo) */}
      {feedbackSeq && (
        <div className="mt-6 space-y-4">
          <div
            className={`card-pixel flex items-start gap-4 border-2 p-4 ${
              feedbackSeq.correta
                ? 'anim-pop border-emerald-500/40 bg-emerald-500/10'
                : 'anim-tremer border-red-500/40 bg-red-500/10'
            }`}
          >
            <img
              src={feedbackSeq.correta ? pixelFeliz : pixelTriste}
              alt={feedbackSeq.correta ? 'Carinha feliz' : 'Carinha triste'}
              className={`w-12 shrink-0 ${feedbackSeq.correta ? 'anim-pular' : 'anim-tremer'}`}
            />
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                <PixelIcon
                  nome={feedbackSeq.tempo_esgotado ? 'clock' : feedbackSeq.correta ? 'check' : 'close'}
                  className={`h-5 w-5 shrink-0 ${feedbackSeq.correta ? 'text-emerald-300' : 'text-red-300'}`}
                />
                {feedbackSeq.tempo_esgotado
                  ? 'Tempo esgotado!'
                  : feedbackSeq.correta
                    ? 'Ordem correta!'
                    : 'Ordem incorreta'}
              </p>
              {!feedbackSeq.correta && (
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-slate-300">
                  {feedbackSeq.ordem_correta.map((id) => (
                    <li key={id}>{questao.passos.find((p) => p.id === id)?.texto}</li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          <button
            onClick={proxima}
            disabled={enviando}
            className="btn-pixel flex w-full items-center justify-center gap-2 bg-indigo-600 py-3 font-pixel text-[11px] text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            <PixelIcon nome={ultima || gameOver ? 'flag' : 'arrow-right'} className="h-4 w-4" />
            {enviando ? 'AGUARDE...' : gameOver ? 'FIM DE JOGO — VER RESULTADO' : ultima ? 'VER RESULTADO' : 'PRÓXIMA'}
          </button>
        </div>
      )}
    </div>
  );
}
