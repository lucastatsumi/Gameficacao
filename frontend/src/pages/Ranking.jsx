import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Alerta from '../components/ui/Alerta.jsx';
import PixelIcon from '../components/ui/PixelIcon.jsx';
import pixelPodio from '../assets/img/pixel-podio.svg';

// cores das medalhas do pódio (ouro, prata, bronze)
const CORES_MEDALHA = ['text-amber-400', 'text-slate-300', 'text-amber-700'];

export default function Ranking() {
  const { perfil } = useAuth();
  const [aba, setAba] = useState('global'); // 'global' | 'turma' | 'fase'
  const [turmas, setTurmas] = useState([]);
  const [fases, setFases] = useState([]);
  const [turmaId, setTurmaId] = useState('');
  const [faseId, setFaseId] = useState('');
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [codigoTurma, setCodigoTurma] = useState('');
  const [msgTurma, setMsgTurma] = useState(null);
  const [quizzesTurma, setQuizzesTurma] = useState([]);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    api.get('/turmas').then(setTurmas).catch(() => {});
    api.get('/fases').then(setFases).catch(() => {});
  }, []);

  const carregar = useCallback(async () => {
    setDados(null);
    setErro(null);
    try {
      if (aba === 'global') setDados(await api.get('/ranking/global'));
      else if (aba === 'turma' && turmaId) setDados(await api.get(`/ranking/turma/${turmaId}`));
      else if (aba === 'fase' && faseId) setDados(await api.get(`/ranking/fase/${faseId}`));
    } catch (err) {
      setErro(err.message);
    }
  }, [aba, turmaId, faseId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // quizzes customizados da turma selecionada
  useEffect(() => {
    setQuizzesTurma([]);
    if (aba === 'turma' && turmaId) {
      api.get(`/turmas/${turmaId}/quizzes`).then(setQuizzesTurma).catch(() => {});
    }
  }, [aba, turmaId]);

  // Qualquer participante (aluno ou professor) pode convidar: copia o
  // código de acesso da turma para compartilhar
  async function copiarConvite(turma) {
    const texto = `Entre na minha turma "${turma.nome}" no DataQuest com o código: ${turma.codigo_acesso}`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(turma.id);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.prompt('Copie o convite:', texto);
    }
  }

  async function entrarNaTurma(e) {
    e.preventDefault();
    setMsgTurma(null);
    try {
      const turma = await api.post('/turmas/entrar', { codigo_acesso: codigoTurma });
      setMsgTurma({ tipo: 'sucesso', texto: `Você entrou na turma "${turma.nome}"!` });
      setCodigoTurma('');
      const novas = await api.get('/turmas');
      setTurmas(novas);
      setTurmaId(turma.id);
    } catch (err) {
      setMsgTurma({ tipo: 'erro', texto: err.message });
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <img src={pixelPodio} alt="" aria-hidden className="w-14" />
        <h1 className="font-pixel text-lg text-slate-100">Ranking</h1>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {[
          ['global', 'trophy', 'Global'],
          ['turma', 'users', 'Turma'],
          ['fase', 'map-pin', 'Fase'],
        ].map(([valor, icone, rotulo]) => (
          <button
            key={valor}
            onClick={() => setAba(valor)}
            className={`btn-pixel flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
              aba === valor
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <PixelIcon nome={icone} className="h-4 w-4" />
            {rotulo}
          </button>
        ))}

        {aba === 'turma' && turmas.length > 0 && (
          <select
            value={turmaId}
            onChange={(e) => setTurmaId(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="">Escolha a turma...</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        )}

        {aba === 'fase' && (
          <select
            value={faseId}
            onChange={(e) => setFaseId(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="">Escolha a fase...</option>
            {fases.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* entrar em turma pelo código */}
      {aba === 'turma' && (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <form onSubmit={entrarNaTurma} className="flex flex-wrap items-center gap-2">
            <input
              value={codigoTurma}
              onChange={(e) => setCodigoTurma(e.target.value.toUpperCase())}
              placeholder="Código da turma (ex.: ABC123)"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm uppercase placeholder-slate-500 outline-none focus:border-indigo-500"
            />
            <button className="btn-pixel flex items-center gap-1.5 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              <PixelIcon nome="users" className="h-4 w-4" />
              Entrar na turma
            </button>
          </form>
          {msgTurma && (
            <div className="mt-3">
              <Alerta tipo={msgTurma.tipo}>{msgTurma.texto}</Alerta>
            </div>
          )}
          {turmas.length === 0 && (
            <p className="mt-3 text-xs text-slate-500">
              Você ainda não está em nenhuma turma — peça o código ao seu professor ou a um colega.
            </p>
          )}

          {/* minhas turmas: qualquer membro pode compartilhar o convite */}
          {turmas.length > 0 && (
            <div className="mt-4 space-y-2 border-t-2 border-slate-800 pt-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Minhas turmas</p>
              {turmas.map((turma) => (
                <div key={turma.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-slate-200">{turma.nome}</span>
                  <span className="bg-slate-800 px-2 py-0.5 font-mono text-xs text-indigo-300">
                    {turma.codigo_acesso}
                  </span>
                  <button
                    onClick={() => copiarConvite(turma)}
                    className="btn-pixel flex items-center gap-1 bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
                  >
                    <PixelIcon
                      nome={copiado === turma.id ? 'check' : 'plus'}
                      className={`h-3.5 w-3.5 ${copiado === turma.id ? 'text-emerald-300' : ''}`}
                    />
                    {copiado === turma.id ? 'Convite copiado!' : 'Convidar colega'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* quizzes montados pelo professor para a turma selecionada */}
      {aba === 'turma' && turmaId && quizzesTurma.length > 0 && (
        <div className="card-pixel mt-4 border-2 border-indigo-500/40 bg-slate-900/60 p-4">
          <p className="flex items-center gap-2 font-pixel text-[11px] text-indigo-300">
            <PixelIcon nome="gamepad" className="h-4 w-4" />
            Quizzes da turma
          </p>
          <div className="mt-3 space-y-2">
            {quizzesTurma.map((q) => (
              <div
                key={q.id}
                className="flex flex-wrap items-center gap-3 border-2 border-slate-800 bg-slate-950/60 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-100">{q.titulo}</p>
                  {q.descricao && <p className="text-xs text-slate-400">{q.descricao}</p>}
                  <p className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>{q.total_questoes} questões</span>
                    <span className="flex items-center gap-1">
                      <PixelIcon nome="clock" className="h-3.5 w-3.5" />
                      {q.tempo_limite_seg ? `${q.tempo_limite_seg}s fixos` : 'tempo por questão'}
                    </span>
                    {q.permitir_dicas && (
                      <span className="flex items-center gap-1 text-amber-400/80">
                        <PixelIcon nome="zap" className="h-3.5 w-3.5" />
                        dicas liberadas
                      </span>
                    )}
                    {!q.sons && <span>sem sons</span>}
                  </p>
                </div>
                <Link
                  to={`/quiz/custom/${q.id}`}
                  className="btn-pixel flex items-center gap-2 bg-indigo-600 px-4 py-2 font-pixel text-[10px] text-white hover:bg-indigo-500"
                >
                  <PixelIcon nome="play" className="h-4 w-4" />
                  JOGAR
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        {erro && <Alerta>{erro}</Alerta>}
        {!erro && !dados && (aba === 'global' || turmaId || faseId) && <Spinner />}
        {!erro && !dados && aba === 'turma' && !turmaId && turmas.length > 0 && (
          <p className="text-sm text-slate-500">Selecione uma turma acima.</p>
        )}
        {!erro && !dados && aba === 'fase' && !faseId && (
          <p className="text-sm text-slate-500">Selecione uma fase acima.</p>
        )}
        {dados && <TabelaRanking dados={dados} meuId={perfil?.id} ehFase={aba === 'fase'} />}
      </div>
    </div>
  );
}

function TabelaRanking({ dados, meuId, ehFase }) {
  const { ranking, minha_posicao: minha } = dados;

  if (!ranking.length) {
    return <p className="text-sm text-slate-500">Ainda não há jogadores neste ranking.</p>;
  }

  const minhaForaDoTopo = minha && !ranking.some((r) => r.id === meuId);

  return (
    <div className="card-pixel overflow-hidden border-2 border-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-slate-900 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Jogador</th>
            {!ehFase && <th className="px-4 py-3">Nível</th>}
            <th className="px-4 py-3 text-right">{ehFase ? 'XP na fase' : 'XP total'}</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((linha) => (
            <LinhaRanking key={linha.id} linha={linha} souEu={linha.id === meuId} ehFase={ehFase} />
          ))}
          {minhaForaDoTopo && (
            <>
              <tr>
                <td colSpan={ehFase ? 3 : 4} className="px-4 py-1 text-center text-slate-600">
                  ⋯
                </td>
              </tr>
              <LinhaRanking linha={minha} souEu ehFase={ehFase} />
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

function LinhaRanking({ linha, souEu, ehFase }) {
  return (
    <tr
      className={`border-t border-slate-800 ${souEu ? 'bg-indigo-500/10' : 'odd:bg-slate-950 even:bg-slate-900/40'}`}
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
        {souEu && <span className="ml-2 text-xs text-indigo-300">(você)</span>}
      </td>
      {!ehFase && <td className="px-4 py-3 text-slate-400">Nv. {linha.nivel}</td>}
      <td className="px-4 py-3 text-right font-mono text-amber-300">
        {ehFase ? linha.xp_fase : linha.xp_total}
      </td>
    </tr>
  );
}
