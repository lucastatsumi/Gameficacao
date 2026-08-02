import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Alerta from '../components/ui/Alerta.jsx';
import PixelIcon from '../components/ui/PixelIcon.jsx';
import AvatarPixel from '../components/ui/AvatarPixel.jsx';
import pixelPodio from '../assets/img/pixel-podio.svg';

// cores das medalhas do pódio (ouro, prata, bronze)
const CORES_MEDALHA = ['text-amber-400', 'text-slate-300', 'text-amber-700'];

// Mascote da equipe (4.10): humor semanal -> ícone/cor/rótulo em pt-br
const MASCOTE_HUMOR = {
  radiante: { rotulo: 'Radiante', icone: 'fire', cor: 'text-amber-400' },
  feliz: { rotulo: 'Feliz', icone: 'heart', cor: 'text-emerald-400' },
  neutro: { rotulo: 'Neutro', icone: 'users', cor: 'text-slate-300' },
  dormindo: { rotulo: 'Dormindo', icone: 'clock', cor: 'text-indigo-300' },
};
const MASCOTE_FORMA = { filhote: 'Filhote', adulto: 'Adulto', lendario: 'Lendário' };

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
  const [copiado, setCopiado] = useState(false);
  const [kudosResumo, setKudosResumo] = useState(null);
  const [kudosEnviados, setKudosEnviados] = useState(new Set());
  const [kudosMsg, setKudosMsg] = useState(null);
  const [mascote, setMascote] = useState(null);

  useEffect(() => {
    api
      .get('/turmas')
      .then(setTurmas)
      .catch(() => {});
    api
      .get('/fases')
      .then(setFases)
      .catch(() => {});
    api
      .get('/kudos')
      .then(setKudosResumo)
      .catch(() => {});
  }, []);

  // Kudos entre colegas (roadmap 4.12): reconhecimento sem competição —
  // 3 por semana, um por colega. O servidor decide fichas e teto; aqui só
  // refletimos a resposta na UI.
  async function darKudos(userId) {
    setKudosMsg(null);
    try {
      const resultado = await api.post('/kudos', { para_usuario: userId });
      setKudosEnviados((atual) => new Set(atual).add(userId));
      setKudosResumo((atual) => (atual ? { ...atual, dados: atual.dados + 1, restantes: resultado.restantes } : atual));
      setKudosMsg({
        tipo: 'sucesso',
        texto: resultado.fichas_concedidas
          ? 'Kudos enviado! Seu colega ganhou fichas.'
          : 'Kudos enviado!',
      });
    } catch (err) {
      setKudosMsg({ tipo: 'erro', texto: err.message });
    }
  }

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

  // Mascote da equipe (roadmap 4.10): humor semanal agregado da turma —
  // nunca expõe quem individualmente esteve ativo. Refaz a busca sempre
  // que a turma escolhida muda; falha silenciosa (não deve travar a página).
  useEffect(() => {
    if (aba !== 'turma' || !turmaId) {
      setMascote(null);
      return;
    }
    api
      .get(`/turmas/${turmaId}/mascote`)
      .then(setMascote)
      .catch(() => setMascote(null));
  }, [aba, turmaId]);

  // Qualquer participante (aluno ou professor) pode convidar: copia o
  // código de acesso da turma para compartilhar
  async function copiarConvite(turma) {
    const texto = `Entre na minha equipe "${turma.nome}" no TeamQuest com o código: ${turma.codigo_acesso}`;
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
            aria-label="Turma do ranking"
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
            aria-label="Fase do ranking"
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
              aria-label="Código da turma"
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

      {/* Mascote da equipe (4.10): só o agregado semanal, nunca quem individualmente
          está ativo. Badge simples por ora — a ilustração pixel procedural completa
          fica para uma iteração futura do roadmap. */}
      {aba === 'turma' && turmaId && mascote && (
        <div className="card-pixel mt-4 flex items-center gap-3 border-2 border-slate-800 bg-slate-900/60 p-4">
          <PixelIcon nome={MASCOTE_HUMOR[mascote.humor].icone} className={`h-8 w-8 shrink-0 ${MASCOTE_HUMOR[mascote.humor].cor}`} />
          <div className="text-sm">
            <p className="font-pixel text-[11px] text-slate-200">
              Mascote da equipe: {MASCOTE_HUMOR[mascote.humor].rotulo}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {mascote.percentual_ativos}% da turma ativa esta semana · Forma:{' '}
              {MASCOTE_FORMA[mascote.forma]}
            </p>
          </div>
        </div>
      )}

      {/* quizzes customizados são globais desde a migration 07 — atalho para a lista completa */}
      {aba === 'turma' && turmaId && (
        <Link
          to="/quizzes"
          className="card-pixel mt-4 flex items-center gap-2 border-2 border-indigo-500/40 bg-slate-900/60 p-4 font-pixel text-[11px] text-indigo-300 hover:bg-indigo-500/10"
        >
          <PixelIcon nome="gamepad" className="h-4 w-4" />
          Ver quizzes disponíveis para jogar →
        </Link>
      )}

      {kudosResumo && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <PixelIcon nome="heart" className="h-4 w-4 text-rose-400" />
          Kudos restantes esta semana: {kudosResumo.restantes}/3
          {kudosMsg && (
            <span className={kudosMsg.tipo === 'erro' ? 'text-rose-400' : 'text-emerald-400'}>
              — {kudosMsg.texto}
            </span>
          )}
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
        {dados && (
          <TabelaRanking
            dados={dados}
            meuId={perfil?.id}
            ehFase={aba === 'fase'}
            kudosRestantes={kudosResumo?.restantes ?? 0}
            kudosEnviados={kudosEnviados}
            aoDarKudos={darKudos}
          />
        )}
      </div>
    </div>
  );
}

function TabelaRanking({ dados, meuId, ehFase, kudosRestantes, kudosEnviados, aoDarKudos }) {
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
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {ranking.map((linha) => (
            <LinhaRanking
              key={linha.id}
              linha={linha}
              souEu={linha.id === meuId}
              ehFase={ehFase}
              kudosRestantes={kudosRestantes}
              jaEnviado={kudosEnviados.has(linha.id)}
              aoDarKudos={aoDarKudos}
            />
          ))}
          {minhaForaDoTopo && (
            <>
              <tr>
                <td colSpan={ehFase ? 4 : 5} className="px-4 py-1 text-center text-slate-600">
                  ⋯
                </td>
              </tr>
              <LinhaRanking linha={minha} souEu ehFase={ehFase} kudosRestantes={0} jaEnviado aoDarKudos={aoDarKudos} />
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

function LinhaRanking({ linha, souEu, ehFase, kudosRestantes, jaEnviado, aoDarKudos }) {
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
        <div className="flex items-center gap-2">
          {!ehFase && <AvatarPixel nivel={linha.nivel} className="h-6 w-6 shrink-0" />}
          <span>
            {linha.nome}
            {souEu && <span className="ml-2 text-xs text-indigo-300">(você)</span>}
            {!ehFase && linha.classe && (
              <span className="ml-2 text-xs font-normal text-emerald-400/80">{linha.classe}</span>
            )}
          </span>
        </div>
      </td>
      {!ehFase && <td className="px-4 py-3 text-slate-400">Nv. {linha.nivel}</td>}
      <td className="px-4 py-3 text-right font-mono text-amber-300">
        {ehFase ? linha.xp_fase : linha.xp_total}
      </td>
      <td className="px-4 py-3 text-right">
        {!souEu && (
          <button
            onClick={() => aoDarKudos(linha.id)}
            disabled={jaEnviado || kudosRestantes <= 0}
            title={jaEnviado ? 'Kudos já enviado' : 'Dar kudos'}
            aria-label={`Dar kudos a ${linha.nome}`}
            className="btn-pixel inline-flex items-center gap-1 bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-rose-500/20 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-slate-800 disabled:hover:text-slate-300"
          >
            <PixelIcon nome="heart" className={`h-3.5 w-3.5 ${jaEnviado ? 'text-rose-400' : ''}`} />
          </button>
        )}
      </td>
    </tr>
  );
}
