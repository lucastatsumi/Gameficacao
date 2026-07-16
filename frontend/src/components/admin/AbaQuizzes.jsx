import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Spinner from '../ui/Spinner.jsx';
import Alerta from '../ui/Alerta.jsx';
import PixelIcon from '../ui/PixelIcon.jsx';
import { inputCls } from './inputCls.js';

const QUIZ_VAZIO = {
  turma_id: '',
  titulo: '',
  descricao: '',
  tempo_fixo: false,
  tempo_limite_seg: 30,
  sons: true,
  permitir_dicas: true,
  questao_ids: [],
};

export default function AbaQuizzes() {
  const [quizzes, setQuizzes] = useState(null);
  const [turmas, setTurmas] = useState([]);
  const [fases, setFases] = useState([]);
  const [questoes, setQuestoes] = useState([]);
  const [form, setForm] = useState(null); // { dados, editandoId }
  const [erro, setErro] = useState(null);

  const carregar = useCallback(() => {
    api.get('/admin/quizzes').then(setQuizzes).catch((err) => setErro(err.message));
  }, []);

  useEffect(() => {
    carregar();
    api.get('/admin/turmas').then(setTurmas).catch(() => {});
    api.get('/fases').then(setFases).catch(() => {});
    api.get('/admin/questoes').then((qs) => setQuestoes(qs.filter((q) => q.ativa))).catch(() => {});
  }, [carregar]);

  async function alternarAtivo(quiz) {
    try {
      await api.patch(`/admin/quizzes/${quiz.id}/ativo`, { ativo: !quiz.ativo });
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  if (!quizzes) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-slate-400">
          Monte quizzes com suas questões e configure tempo, sons e dicas para a turma.
        </p>
        <button
          onClick={() => setForm({ dados: structuredClone(QUIZ_VAZIO), editandoId: null })}
          className="btn-pixel ml-auto flex items-center gap-1.5 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          <PixelIcon nome="plus" className="h-4 w-4" />
          Novo quiz
        </button>
      </div>

      <Alerta>{erro}</Alerta>

      {form && (
        <FormQuiz
          turmas={turmas}
          fases={fases}
          questoes={questoes}
          form={form}
          aoFechar={() => setForm(null)}
          aoSalvar={() => {
            setForm(null);
            carregar();
          }}
        />
      )}

      {quizzes.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nenhum quiz criado ainda. Crie um e ele aparece para os alunos da turma na aba Ranking →
          Turma.
        </p>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className={`card-pixel border-2 border-slate-800 bg-slate-900/60 p-4 ${quiz.ativo ? '' : 'opacity-50'}`}
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-100">{quiz.titulo}</p>
                  <p className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="text-indigo-300">{quiz.turma?.nome}</span>
                    <span>{quiz.total_questoes} questões</span>
                    <span className="flex items-center gap-1">
                      <PixelIcon nome="clock" className="h-3.5 w-3.5" />
                      {quiz.tempo_limite_seg
                        ? `${quiz.tempo_limite_seg}s por questão`
                        : 'tempo de cada questão'}
                    </span>
                    <span>{quiz.sons ? 'sons ligados' : 'sons desligados'}</span>
                    <span>{quiz.permitir_dicas ? 'dicas liberadas' : 'sem dicas'}</span>
                    {!quiz.ativo && <span className="text-red-300">desativado</span>}
                  </p>
                </div>
                <button
                  onClick={() => alternarAtivo(quiz)}
                  className={`btn-pixel px-3 py-1.5 text-xs ${
                    quiz.ativo
                      ? 'bg-red-500/10 text-red-300 hover:bg-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                  }`}
                >
                  {quiz.ativo ? 'Desativar' : 'Reativar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormQuiz({ turmas, fases, questoes, form, aoFechar, aoSalvar }) {
  const [dados, setDados] = useState(form.dados);
  const [filtroFase, setFiltroFase] = useState('');
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

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
        turma_id: dados.turma_id,
        titulo: dados.titulo,
        descricao: dados.descricao?.trim() || null,
        tempo_limite_seg: dados.tempo_fixo ? Number(dados.tempo_limite_seg) : null,
        sons: dados.sons,
        permitir_dicas: dados.permitir_dicas,
        questao_ids: dados.questao_ids,
      };
      if (form.editandoId) await api.put(`/admin/quizzes/${form.editandoId}`, payload);
      else await api.post('/admin/quizzes', payload);
      aoSalvar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  const visiveis = filtroFase
    ? questoes.filter((q) => q.fase_id === Number(filtroFase))
    : questoes;

  return (
    <form onSubmit={salvar} className="card-pixel space-y-4 border-2 border-indigo-500/40 bg-slate-900/80 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{form.editandoId ? 'Editar quiz' : 'Novo quiz da turma'}</h3>
        <button
          type="button"
          onClick={aoFechar}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
        >
          <PixelIcon nome="close" className="h-4 w-4" />
          Cancelar
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <select
          value={dados.turma_id}
          onChange={(e) => mudar('turma_id', e.target.value)}
          className={inputCls}
          required
        >
          <option value="">Turma...</option>
          {turmas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
        <input
          value={dados.titulo}
          onChange={(e) => mudar('titulo', e.target.value)}
          placeholder="Título do quiz (ex.: Revisão P1 — Pilhas e Filas)"
          className={inputCls}
          required
        />
      </div>

      <input
        value={dados.descricao}
        onChange={(e) => mudar('descricao', e.target.value)}
        placeholder="Descrição (opcional)"
        className={inputCls}
      />

      {/* configuração do quiz */}
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
          {visiveis.map((q) => (
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
                  {fases.find((f) => f.id === q.fase_id)?.nome} · {q.dificuldade} · {q.xp_valor} XP
                  {q.dica && <span className="text-amber-400/80"> · tem dica</span>}
                </span>
              </span>
            </label>
          ))}
          {visiveis.length === 0 && (
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
