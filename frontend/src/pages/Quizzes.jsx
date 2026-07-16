import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import Spinner from '../components/ui/Spinner.jsx';
import Alerta from '../components/ui/Alerta.jsx';
import PixelIcon from '../components/ui/PixelIcon.jsx';

const inputCls =
  'w-full border-2 border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500';

const QUIZ_VAZIO = {
  titulo: '',
  descricao: '',
  tempo_fixo: false,
  tempo_limite_seg: 30,
  sons: true,
  permitir_dicas: true,
  questao_ids: [],
};

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState(null);
  const [form, setForm] = useState(null); // { dados, editandoId }
  const [erro, setErro] = useState(null);

  const carregar = useCallback(() => {
    api
      .get('/quizzes')
      .then(setQuizzes)
      .catch((err) => setErro(err.message));
  }, []);

  useEffect(carregar, [carregar]);

  async function alternarAtivo(quiz) {
    try {
      await api.patch(`/quizzes/${quiz.id}/ativo`, { ativo: !quiz.ativo });
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  if (!quizzes) return <Spinner texto="Carregando quizzes..." />;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <PixelIcon nome="gamepad" className="h-7 w-7 text-indigo-400" />
        <h1 className="font-pixel text-lg text-slate-100">Quizzes</h1>
        <button
          onClick={() => setForm({ dados: structuredClone(QUIZ_VAZIO), editandoId: null })}
          className="btn-pixel ml-auto flex items-center gap-1.5 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          <PixelIcon nome="plus" className="h-4 w-4" />
          Criar quiz
        </button>
      </div>
      <p className="mt-2 text-sm text-slate-400">
        Qualquer jogador pode montar um quiz com as questões do banco e configurar tempo, sons e
        dicas. Todos os quizzes ficam disponíveis aqui.
      </p>

      <div className="mt-4">
        <Alerta>{erro}</Alerta>
      </div>

      {form && (
        <div className="mt-4">
          <FormQuiz
            form={form}
            aoFechar={() => setForm(null)}
            aoSalvar={() => {
              setForm(null);
              carregar();
            }}
          />
        </div>
      )}

      {quizzes.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">Nenhum quiz criado ainda — seja o primeiro!</p>
      ) : (
        <div className="mt-6 space-y-3">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className={`card-pixel border-2 bg-slate-900/60 p-4 ${
                quiz.meu ? 'border-indigo-500/40' : 'border-slate-800'
              } ${quiz.ativo ? '' : 'opacity-60'}`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-100">{quiz.titulo}</p>
                    {quiz.meu && (
                      <span className="bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300">
                        seu quiz
                      </span>
                    )}
                    {!quiz.ativo && (
                      <span className="bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
                        desativado
                      </span>
                    )}
                  </div>
                  {quiz.descricao && (
                    <p className="mt-1 text-sm text-slate-400">{quiz.descricao}</p>
                  )}
                  <p className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <PixelIcon nome="user" className="h-3.5 w-3.5" />
                      {quiz.criador}
                    </span>
                    <span>{quiz.total_questoes} questões</span>
                    <span className="flex items-center gap-1">
                      <PixelIcon nome="clock" className="h-3.5 w-3.5" />
                      {quiz.tempo_limite_seg
                        ? `${quiz.tempo_limite_seg}s por questão`
                        : 'tempo de cada questão'}
                    </span>
                    {quiz.permitir_dicas && (
                      <span className="flex items-center gap-1 text-amber-400/80">
                        <PixelIcon nome="zap" className="h-3.5 w-3.5" />
                        dicas
                      </span>
                    )}
                    {!quiz.sons && <span>sem sons</span>}
                  </p>
                </div>

                <div className="flex gap-2">
                  {quiz.meu && (
                    <button
                      onClick={() => alternarAtivo(quiz)}
                      className={`btn-pixel px-3 py-2 text-xs ${
                        quiz.ativo
                          ? 'bg-red-500/10 text-red-300 hover:bg-red-500/20'
                          : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                      }`}
                    >
                      {quiz.ativo ? 'Desativar' : 'Reativar'}
                    </button>
                  )}
                  <Link
                    to={`/quiz/custom/${quiz.id}`}
                    className="btn-pixel flex items-center gap-2 bg-indigo-600 px-4 py-2 font-pixel text-[10px] text-white hover:bg-indigo-500"
                  >
                    <PixelIcon nome="play" className="h-4 w-4" />
                    JOGAR
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormQuiz({ form, aoFechar, aoSalvar }) {
  const [dados, setDados] = useState(form.dados);
  const [banco, setBanco] = useState(null); // questões sem gabarito
  const [fases, setFases] = useState([]);
  const [filtroFase, setFiltroFase] = useState('');
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api
      .get('/quizzes/banco')
      .then(setBanco)
      .catch((err) => setErro(err.message));
    api
      .get('/fases')
      .then(setFases)
      .catch(() => {});
  }, []);

  function mudar(campo, valor) {
    setDados((d) => ({ ...d, [campo]: valor }));
  }

  function alternarQuestao(id) {
    setDados((d) => ({
      ...d,
      questao_ids: d.questao_ids.includes(id)
        ? d.questao_ids.filter((q) => q !== id)
        : [...d.questao_ids, id],
    }));
  }

  async function salvar(e) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      const payload = {
        titulo: dados.titulo,
        descricao: dados.descricao?.trim() || null,
        tempo_limite_seg: dados.tempo_fixo ? Number(dados.tempo_limite_seg) : null,
        sons: dados.sons,
        permitir_dicas: dados.permitir_dicas,
        questao_ids: dados.questao_ids,
      };
      if (form.editandoId) await api.put(`/quizzes/${form.editandoId}`, payload);
      else await api.post('/quizzes', payload);
      aoSalvar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  const visiveis = banco
    ? filtroFase
      ? banco.filter((q) => q.fase_id === Number(filtroFase))
      : banco
    : [];

  return (
    <form
      onSubmit={salvar}
      className="card-pixel space-y-4 border-2 border-indigo-500/40 bg-slate-900/80 p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{form.editandoId ? 'Editar quiz' : 'Novo quiz'}</h3>
        <button
          type="button"
          onClick={aoFechar}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
        >
          <PixelIcon nome="close" className="h-4 w-4" />
          Cancelar
        </button>
      </div>

      <input
        value={dados.titulo}
        onChange={(e) => mudar('titulo', e.target.value)}
        placeholder="Título do quiz (ex.: Desafio relâmpago de Pilhas)"
        aria-label="Título do quiz"
        className={inputCls}
        required
      />
      <input
        value={dados.descricao}
        onChange={(e) => mudar('descricao', e.target.value)}
        placeholder="Descrição (opcional)"
        aria-label="Descrição do quiz"
        className={inputCls}
      />

      {/* configuração */}
      <div className="grid gap-3 border-2 border-slate-800 p-3 sm:grid-cols-3">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={dados.tempo_fixo}
            onChange={(e) => mudar('tempo_fixo', e.target.checked)}
          />
          Tempo fixo por questão
          {dados.tempo_fixo && (
            <input
              type="number"
              min={10}
              value={dados.tempo_limite_seg}
              onChange={(e) => mudar('tempo_limite_seg', e.target.value)}
              className={`${inputCls} w-20`}
              title="segundos"
              aria-label="Segundos por questão"
            />
          )}
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={dados.sons}
            onChange={(e) => mudar('sons', e.target.checked)}
          />
          Efeitos sonoros
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={dados.permitir_dicas}
            onChange={(e) => mudar('permitir_dicas', e.target.checked)}
          />
          Permitir dicas (-50% XP)
        </label>
      </div>

      {/* seleção de questões */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-slate-300">
            Questões ({dados.questao_ids.length} selecionadas, máx. 20)
          </p>
          <select
            value={filtroFase}
            onChange={(e) => setFiltroFase(e.target.value)}
            aria-label="Filtrar questões por fase"
            className="ml-auto border-2 border-slate-700 bg-slate-900 px-2 py-1 text-xs"
          >
            <option value="">Todas as fases</option>
            {fases.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2 max-h-64 space-y-1 overflow-y-auto border-2 border-slate-800 p-2">
          {!banco && <Spinner texto="Carregando banco de questões..." />}
          {banco &&
            visiveis.map((q) => (
              <label
                key={q.id}
                className={`flex cursor-pointer items-start gap-2 p-2 text-sm hover:bg-slate-800/60 ${
                  dados.questao_ids.includes(q.id) ? 'bg-indigo-500/10' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={dados.questao_ids.includes(q.id)}
                  onChange={() => alternarQuestao(q.id)}
                  className="mt-1"
                />
                <span className="min-w-0">
                  <span className="line-clamp-1 text-slate-200">{q.enunciado}</span>
                  <span className="text-xs text-slate-500">
                    {fases.find((f) => f.id === q.fase_id)?.nome} · {q.dificuldade} · {q.xp_valor}{' '}
                    XP
                    {q.tem_dica && <span className="text-amber-400/80"> · tem dica</span>}
                  </span>
                </span>
              </label>
            ))}
          {banco && visiveis.length === 0 && (
            <p className="p-2 text-xs text-slate-500">Nenhuma questão nesta fase.</p>
          )}
        </div>
      </div>

      <Alerta>{erro}</Alerta>

      <button
        disabled={salvando}
        className="btn-pixel flex items-center gap-1.5 bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        <PixelIcon nome="check" className="h-4 w-4" />
        {salvando ? 'Salvando...' : 'Salvar quiz'}
      </button>
    </form>
  );
}
