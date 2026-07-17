import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Spinner from '../ui/Spinner.jsx';
import Alerta from '../ui/Alerta.jsx';
import PixelIcon from '../ui/PixelIcon.jsx';

const inputCls =
  'w-full border-2 border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500';

export default function FormQuiz({ form, aoFechar, aoSalvar }) {
  const [dados, setDados] = useState(form.dados);
  const [banco, setBanco] = useState(null); // questões sem gabarito
  const [fases, setFases] = useState([]);
  const [filtroFase, setFiltroFase] = useState('');
  const [qtdTemplate, setQtdTemplate] = useState(10);
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api.get('/quizzes/banco').then(setBanco).catch((err) => setErro(err.message));
    api.get('/fases').then(setFases).catch(() => {});
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
        vidas: dados.boss_fight ? Number(dados.vidas) : null,
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

  // "Template rápido": sorteia N questões da fase filtrada e substitui a
  // seleção atual — atalho para montar um quiz de tópico único sem marcar
  // uma por uma.
  function aplicarTemplateAleatorio() {
    const qtd = Math.max(1, Math.min(20, Number(qtdTemplate) || 0));
    const embaralhadas = [...visiveis].sort(() => Math.random() - 0.5);
    mudar('questao_ids', embaralhadas.slice(0, qtd).map((q) => q.id));
  }

  return (
    <form onSubmit={salvar} className="card-pixel space-y-4 border-2 border-indigo-500/40 bg-slate-900/80 p-5">
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
        <label
          className="flex items-center gap-2 text-sm text-slate-300"
          title='"Boss fight": errar essa quantidade de questões encerra o desafio na hora'
        >
          <input
            type="checkbox"
            checked={dados.boss_fight}
            onChange={(e) => mudar('boss_fight', e.target.checked)}
          />
          Boss fight (vidas)
          {dados.boss_fight && (
            <input
              type="number"
              min={1}
              value={dados.vidas}
              onChange={(e) => mudar('vidas', e.target.value)}
              className={`${inputCls} w-16`}
              title="número de erros permitidos"
            />
          )}
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
        {filtroFase && (
          <div className="mt-2 flex flex-wrap items-center gap-2 border-2 border-dashed border-indigo-500/30 bg-indigo-500/5 p-2">
            <PixelIcon nome="reload" className="h-4 w-4 text-indigo-300" />
            <span className="text-xs text-slate-300">Template rápido: sortear</span>
            <input
              type="number"
              min={1}
              max={20}
              value={qtdTemplate}
              onChange={(e) => setQtdTemplate(e.target.value)}
              className={`${inputCls} w-16 py-1`}
            />
            <span className="text-xs text-slate-300">questões desta fase</span>
            <button
              type="button"
              onClick={aplicarTemplateAleatorio}
              disabled={visiveis.length === 0}
              className="btn-pixel ml-auto bg-indigo-600/80 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Aplicar
            </button>
          </div>
        )}
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
