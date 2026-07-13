import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import Spinner from '../components/ui/Spinner.jsx';
import Alerta from '../components/ui/Alerta.jsx';
import PixelIcon from '../components/ui/PixelIcon.jsx';

const inputCls =
  'w-full border-2 border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500';

export default function Admin() {
  const [aba, setAba] = useState('turmas');

  return (
    <div>
      <div className="flex items-center gap-3">
        <PixelIcon nome="briefcase" className="h-7 w-7 text-indigo-400" />
        <h1 className="font-pixel text-lg text-slate-100">Painel do Professor</h1>
      </div>

      <div className="mt-4 flex gap-2">
        {[
          ['turmas', 'users', 'Turmas'],
          ['questoes', 'pencil', 'Questões'],
          ['quizzes', 'gamepad', 'Quizzes'],
          ['relatorio', 'chart-bar-big', 'Relatório'],
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
      </div>

      <div className="mt-6">
        {aba === 'turmas' && <AbaTurmas />}
        {aba === 'questoes' && <AbaQuestoes />}
        {aba === 'quizzes' && <AbaQuizzes />}
        {aba === 'relatorio' && <AbaRelatorio />}
      </div>
    </div>
  );
}

// ================= TURMAS =================

function AbaTurmas() {
  const [turmas, setTurmas] = useState(null);
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState(null);
  const [alunos, setAlunos] = useState(null); // { turma, lista }
  const [copiado, setCopiado] = useState(false);

  async function copiarConvite(turma) {
    const texto = `Entre na turma "${turma.nome}" no DataQuest com o código: ${turma.codigo_acesso}`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(turma.id);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.prompt('Copie o convite:', texto);
    }
  }

  const carregar = useCallback(() => {
    api.get('/admin/turmas').then(setTurmas).catch((err) => setErro(err.message));
  }, []);

  useEffect(carregar, [carregar]);

  async function criar(e) {
    e.preventDefault();
    setErro(null);
    try {
      await api.post('/admin/turmas', { nome });
      setNome('');
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function verAlunos(turma) {
    setAlunos({ turma, lista: null });
    try {
      const lista = await api.get(`/admin/turmas/${turma.id}/alunos`);
      setAlunos({ turma, lista });
    } catch (err) {
      setErro(err.message);
      setAlunos(null);
    }
  }

  if (!turmas) return <Spinner />;

  return (
    <div className="space-y-6">
      <form onSubmit={criar} className="flex gap-2">
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome da nova turma (ex.: ES 2026/2 — Noturno)"
          className={inputCls}
          required
        />
        <button className="btn-pixel flex shrink-0 items-center gap-1.5 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
          <PixelIcon nome="plus" className="h-4 w-4" />
          Criar turma
        </button>
      </form>

      <Alerta>{erro}</Alerta>

      {turmas.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma turma criada ainda.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {turmas.map((turma) => (
            <div key={turma.id} className="card-pixel border-2 border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{turma.nome}</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Código de acesso:{' '}
                    <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-indigo-300">
                      {turma.codigo_acesso}
                    </span>
                  </p>
                </div>
                <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                  {turma.total_alunos} aluno(s)
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => copiarConvite(turma)}
                  className="btn-pixel flex items-center gap-1 bg-indigo-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                >
                  <PixelIcon
                    nome={copiado === turma.id ? 'check' : 'users'}
                    className="h-3.5 w-3.5"
                  />
                  {copiado === turma.id ? 'Copiado!' : 'Convidar'}
                </button>
                <button
                  onClick={() => verAlunos(turma)}
                  className="btn-pixel flex items-center gap-1 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                >
                  <PixelIcon nome="users" className="h-3.5 w-3.5" />
                  Ver alunos
                </button>
                <button
                  onClick={() =>
                    api
                      .baixarArquivo(`/admin/turmas/${turma.id}/relatorio.csv`, 'desempenho.csv')
                      .catch((err) => setErro(err.message))
                  }
                  className="btn-pixel flex items-center gap-1 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                >
                  <PixelIcon nome="download" className="h-3.5 w-3.5" />
                  CSV
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {alunos && (
        <div className="card-pixel border-2 border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Alunos — {alunos.turma.nome}</h3>
            <button
              onClick={() => setAlunos(null)}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
            >
              <PixelIcon nome="close" className="h-4 w-4" />
              Fechar
            </button>
          </div>
          {!alunos.lista ? (
            <Spinner />
          ) : alunos.lista.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Nenhum aluno matriculado ainda.</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">Nome</th>
                  <th className="py-2">Nível</th>
                  <th className="py-2">XP</th>
                  <th className="py-2">Fases</th>
                  <th className="py-2">Tentativas</th>
                  <th className="py-2">Badges</th>
                </tr>
              </thead>
              <tbody>
                {alunos.lista.map((a) => (
                  <tr key={a.user_id} className="border-t border-slate-800">
                    <td className="py-2 font-medium">{a.nome}</td>
                    <td className="py-2">{a.nivel}</td>
                    <td className="py-2 font-mono text-amber-300">{a.xp_total}</td>
                    <td className="py-2">{a.fases_concluidas}</td>
                    <td className="py-2">{a.total_tentativas}</td>
                    <td className="py-2">{a.total_badges}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ================= QUESTÕES =================

const QUESTAO_VAZIA = {
  fase_id: '',
  enunciado: '',
  codigo_snippet: '',
  linguagem: 'javascript',
  dificuldade: 'media',
  tempo_limite_seg: 60,
  xp_valor: 10,
  dica: '',
  alternativas: ['A', 'B', 'C', 'D'].map((letra) => ({
    letra,
    texto: '',
    correta: letra === 'A',
    explicacao: '',
  })),
};

function AbaQuestoes() {
  const [fases, setFases] = useState([]);
  const [filtroFase, setFiltroFase] = useState('');
  const [questoes, setQuestoes] = useState(null);
  const [form, setForm] = useState(null); // null | {dados, editandoId}
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api.get('/fases').then(setFases).catch(() => {});
  }, []);

  const carregar = useCallback(() => {
    setQuestoes(null);
    api
      .get(`/admin/questoes${filtroFase ? `?fase_id=${filtroFase}` : ''}`)
      .then(setQuestoes)
      .catch((err) => setErro(err.message));
  }, [filtroFase]);

  useEffect(carregar, [carregar]);

  async function desativar(questao) {
    if (!window.confirm('Desativar esta questão? Ela sai dos quizzes, mas o histórico é preservado.'))
      return;
    try {
      await api.delete(`/admin/questoes/${questao.id}`);
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filtroFase}
          onChange={(e) => setFiltroFase(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="">Todas as fases</option>
          {fases.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
        <button
          onClick={() => setForm({ dados: structuredClone(QUESTAO_VAZIA), editandoId: null })}
          className="btn-pixel ml-auto flex items-center gap-1.5 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          <PixelIcon nome="plus" className="h-4 w-4" />
          Nova questão
        </button>
      </div>

      <Alerta>{erro}</Alerta>

      {form && (
        <FormQuestao
          fases={fases}
          form={form}
          aoFechar={() => setForm(null)}
          aoSalvar={() => {
            setForm(null);
            carregar();
          }}
        />
      )}

      {!questoes ? (
        <Spinner />
      ) : questoes.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma questão encontrada.</p>
      ) : (
        <div className="space-y-3">
          {questoes.map((q) => (
            <div
              key={q.id}
              className={`card-pixel border-2 border-slate-800 bg-slate-900/60 p-4 ${q.ativa ? '' : 'opacity-50'}`}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-400">
                      {fases.find((f) => f.id === q.fase_id)?.nome ?? `Fase ${q.fase_id}`}
                    </span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-400">
                      {q.dificuldade}
                    </span>
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-300">
                      {q.xp_valor} XP
                    </span>
                    {!q.ativa && (
                      <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-red-300">
                        desativada
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-200">{q.enunciado}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() =>
                      setForm({
                        dados: {
                          fase_id: q.fase_id,
                          enunciado: q.enunciado,
                          codigo_snippet: q.codigo_snippet ?? '',
                          linguagem: q.linguagem,
                          dificuldade: q.dificuldade,
                          tempo_limite_seg: q.tempo_limite_seg,
                          xp_valor: q.xp_valor,
                          dica: q.dica ?? '',
                          alternativas: q.alternativas.map((a) => ({
                            letra: a.letra,
                            texto: a.texto,
                            correta: a.correta,
                            explicacao: a.explicacao,
                          })),
                        },
                        editandoId: q.id,
                      })
                    }
                    className="btn-pixel flex items-center gap-1 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
                  >
                    <PixelIcon nome="pencil" className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  {q.ativa && (
                    <button
                      onClick={() => desativar(q)}
                      className="btn-pixel flex items-center gap-1 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
                    >
                      <PixelIcon nome="trash" className="h-3.5 w-3.5" />
                      Desativar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormQuestao({ fases, form, aoFechar, aoSalvar }) {
  const [dados, setDados] = useState(form.dados);
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  function mudar(campo, valor) {
    setDados((d) => ({ ...d, [campo]: valor }));
  }

  function mudarAlternativa(letra, campo, valor) {
    setDados((d) => ({
      ...d,
      alternativas: d.alternativas.map((a) =>
        campo === 'correta'
          ? { ...a, correta: a.letra === letra }
          : a.letra === letra
            ? { ...a, [campo]: valor }
            : a
      ),
    }));
  }

  async function salvar(e) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    const payload = {
      ...dados,
      fase_id: Number(dados.fase_id),
      tempo_limite_seg: Number(dados.tempo_limite_seg),
      xp_valor: Number(dados.xp_valor),
      codigo_snippet: dados.codigo_snippet?.trim() ? dados.codigo_snippet : null,
      dica: dados.dica?.trim() ? dados.dica.trim() : null,
    };
    try {
      if (form.editandoId) await api.put(`/admin/questoes/${form.editandoId}`, payload);
      else await api.post('/admin/questoes', payload);
      aoSalvar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="card-pixel space-y-4 border-2 border-indigo-500/40 bg-slate-900/80 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{form.editandoId ? 'Editar questão' : 'Nova questão'}</h3>
        <button
          type="button"
          onClick={aoFechar}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
        >
          <PixelIcon nome="close" className="h-4 w-4" />
          Cancelar
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <select
          value={dados.fase_id}
          onChange={(e) => mudar('fase_id', e.target.value)}
          className={inputCls}
          required
        >
          <option value="">Fase...</option>
          {fases.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
        <select
          value={dados.dificuldade}
          onChange={(e) => mudar('dificuldade', e.target.value)}
          className={inputCls}
        >
          <option value="facil">Fácil</option>
          <option value="media">Média</option>
          <option value="dificil">Difícil</option>
        </select>
        <input
          type="number"
          min={10}
          value={dados.tempo_limite_seg}
          onChange={(e) => mudar('tempo_limite_seg', e.target.value)}
          className={inputCls}
          title="Tempo limite (segundos)"
        />
        <input
          type="number"
          min={1}
          value={dados.xp_valor}
          onChange={(e) => mudar('xp_valor', e.target.value)}
          className={inputCls}
          title="XP da questão"
        />
      </div>

      <textarea
        value={dados.enunciado}
        onChange={(e) => mudar('enunciado', e.target.value)}
        placeholder="Enunciado (cenário + pergunta)"
        rows={3}
        className={inputCls}
        required
      />
      <textarea
        value={dados.codigo_snippet}
        onChange={(e) => mudar('codigo_snippet', e.target.value)}
        placeholder="Trecho de código (opcional)"
        rows={4}
        className={`${inputCls} font-mono`}
      />
      <input
        value={dados.dica}
        onChange={(e) => mudar('dica', e.target.value)}
        placeholder="Dica (opcional — usada nos quizzes da turma; quem pedir ganha metade do XP)"
        className={inputCls}
      />

      <div className="space-y-3">
        {dados.alternativas.map((alt) => (
          <div key={alt.letra} className="rounded-lg border border-slate-800 p-3">
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="correta"
                  checked={alt.correta}
                  onChange={() => mudarAlternativa(alt.letra, 'correta', true)}
                />
                <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-800 text-xs font-bold text-indigo-300">
                  {alt.letra}
                </span>
              </label>
              <input
                value={alt.texto}
                onChange={(e) => mudarAlternativa(alt.letra, 'texto', e.target.value)}
                placeholder={`Texto da alternativa ${alt.letra}`}
                className={inputCls}
                required
              />
            </div>
            <input
              value={alt.explicacao}
              onChange={(e) => mudarAlternativa(alt.letra, 'explicacao', e.target.value)}
              placeholder="Explicação (feedback pedagógico mostrado após a resposta)"
              className={`${inputCls} mt-2`}
              required
            />
          </div>
        ))}
        <p className="text-xs text-slate-500">
          Marque o círculo da alternativa correta. Todas precisam de explicação.
        </p>
      </div>

      <Alerta>{erro}</Alerta>

      <button
        disabled={salvando}
        className="btn-pixel flex items-center gap-1.5 bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        <PixelIcon nome="check" className="h-4 w-4" />
        {salvando ? 'Salvando...' : 'Salvar questão'}
      </button>
    </form>
  );
}

// ================= QUIZZES CUSTOMIZADOS =================

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

function AbaQuizzes() {
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

// ================= RELATÓRIO =================

function AbaRelatorio() {
  const [fases, setFases] = useState([]);
  const [filtroFase, setFiltroFase] = useState('');
  const [linhas, setLinhas] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api.get('/fases').then(setFases).catch(() => {});
  }, []);

  useEffect(() => {
    setLinhas(null);
    api
      .get(`/admin/relatorio/questoes${filtroFase ? `?fase_id=${filtroFase}` : ''}`)
      .then(setLinhas)
      .catch((err) => setErro(err.message));
  }, [filtroFase]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <select
          value={filtroFase}
          onChange={(e) => setFiltroFase(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="">Todas as fases</option>
          {fases.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500">
          Ordenado da menor taxa de acerto — os conceitos em que a turma mais tem dificuldade.
        </p>
      </div>

      <Alerta>{erro}</Alerta>

      {!linhas ? (
        <Spinner />
      ) : (
        <div className="card-pixel overflow-hidden border-2 border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Questão</th>
                <th className="px-4 py-3">Dificuldade</th>
                <th className="px-4 py-3 text-right">Respostas</th>
                <th className="px-4 py-3 text-right">Taxa de acerto</th>
                <th className="px-4 py-3 text-right">Tempo médio</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.questao_id} className="border-t border-slate-800 odd:bg-slate-950 even:bg-slate-900/40">
                  <td className="px-4 py-3">{l.enunciado_resumo}...</td>
                  <td className="px-4 py-3 text-slate-400">{l.dificuldade}</td>
                  <td className="px-4 py-3 text-right font-mono">{l.total_respostas}</td>
                  <td className="px-4 py-3 text-right">
                    <TaxaAcerto pct={l.taxa_acerto_pct} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-400">
                    {l.tempo_medio_seg != null ? `${l.tempo_medio_seg}s` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TaxaAcerto({ pct }) {
  if (pct == null) return <span className="text-slate-600">sem dados</span>;
  const cor = pct >= 70 ? 'text-emerald-300' : pct >= 40 ? 'text-amber-300' : 'text-red-300';
  return <span className={`font-mono font-semibold ${cor}`}>{pct}%</span>;
}
