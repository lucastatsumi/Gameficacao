import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Spinner from '../ui/Spinner.jsx';
import Alerta from '../ui/Alerta.jsx';
import PixelIcon from '../ui/PixelIcon.jsx';
import { inputCls } from './inputCls.js';

// Cada formato de questão exige um conjunto fixo de letras — precisa bater
// com LETRAS_POR_FORMATO em backend/src/services/questaoService.js.
const LETRAS_POR_FORMATO = { padrao: ['A', 'B', 'C', 'D'], batalha_complexidade: ['A', 'B'] };
const FORMATO_SEQUENCIA = 'reordenar_algoritmo';

function alternativasVazias(formato) {
  if (!LETRAS_POR_FORMATO[formato]) return [];
  return LETRAS_POR_FORMATO[formato].map((letra) => ({
    letra,
    texto: '',
    correta: letra === 'A',
    explicacao: '',
  }));
}

function passosVazios(formato) {
  return formato === FORMATO_SEQUENCIA ? [{ texto: '' }, { texto: '' }] : [];
}

function questaoVazia(formato = 'padrao') {
  return {
    fase_id: '',
    enunciado: '',
    codigo_snippet: '',
    linguagem: 'javascript',
    dificuldade: 'media',
    tempo_limite_seg: formato === 'batalha_complexidade' ? 15 : 60,
    xp_valor: formato === 'batalha_complexidade' ? 20 : 10,
    dica: '',
    formato,
    alternativas: alternativasVazias(formato),
    passos: passosVazios(formato),
  };
}

export default function AbaQuestoes() {
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
          onClick={() => setForm({ dados: questaoVazia(), editandoId: null })}
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
                    {q.formato === 'batalha_complexidade' && (
                      <span className="rounded-full bg-fuchsia-500/10 px-2 py-0.5 text-fuchsia-300">
                        batalha
                      </span>
                    )}
                    {q.formato === FORMATO_SEQUENCIA && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                        reordenar
                      </span>
                    )}
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
                          formato: q.formato ?? 'padrao',
                          alternativas: q.alternativas.map((a) => ({
                            letra: a.letra,
                            texto: a.texto,
                            correta: a.correta,
                            explicacao: a.explicacao,
                          })),
                          passos:
                            q.formato === FORMATO_SEQUENCIA && q.passos
                              ? [...q.passos]
                                  .sort(
                                    (a, b) =>
                                      (q.ordem_correta ?? []).indexOf(a.id) -
                                      (q.ordem_correta ?? []).indexOf(b.id)
                                  )
                                  .map((p) => ({ texto: p.texto }))
                              : passosVazios(q.formato),
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

  function mudarFormato(formato) {
    setDados((d) => ({
      ...d,
      formato,
      alternativas: alternativasVazias(formato),
      passos: passosVazios(formato),
    }));
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

  function mudarPasso(indice, texto) {
    setDados((d) => ({
      ...d,
      passos: d.passos.map((p, i) => (i === indice ? { texto } : p)),
    }));
  }

  function adicionarPasso() {
    setDados((d) => ({ ...d, passos: [...d.passos, { texto: '' }] }));
  }

  function removerPasso(indice) {
    setDados((d) => ({ ...d, passos: d.passos.filter((_, i) => i !== indice) }));
  }

  function moverPasso(indice, direcao) {
    setDados((d) => {
      const alvo = indice + direcao;
      if (alvo < 0 || alvo >= d.passos.length) return d;
      const passos = [...d.passos];
      [passos[indice], passos[alvo]] = [passos[alvo], passos[indice]];
      return { ...d, passos };
    });
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
          value={dados.formato}
          onChange={(e) => mudarFormato(e.target.value)}
          disabled={Boolean(form.editandoId)}
          title={form.editandoId ? 'O formato não pode ser alterado depois de criada' : undefined}
          className={`${inputCls} disabled:opacity-50`}
        >
          <option value="padrao">Múltipla escolha (4 alternativas)</option>
          <option value="batalha_complexidade">Batalha de Complexidade (2 alternativas)</option>
          <option value={FORMATO_SEQUENCIA}>Reordenar algoritmo (passos em sequência)</option>
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

      {dados.formato === FORMATO_SEQUENCIA ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            Digite os passos do algoritmo NA ORDEM CERTA — essa ordem vira o gabarito. O
            jogo embaralha a exibição a cada tentativa.
          </p>
          {dados.passos.map((passo, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-800 text-xs font-bold text-emerald-300">
                {i + 1}
              </span>
              <input
                value={passo.texto}
                onChange={(e) => mudarPasso(i, e.target.value)}
                placeholder={`Passo ${i + 1}`}
                className={inputCls}
                required
              />
              <button
                type="button"
                onClick={() => moverPasso(i, -1)}
                disabled={i === 0}
                title="Mover para cima"
                className="shrink-0 rounded border border-slate-700 px-2 py-1.5 text-xs leading-none text-slate-300 hover:bg-slate-800 disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moverPasso(i, 1)}
                disabled={i === dados.passos.length - 1}
                title="Mover para baixo"
                className="shrink-0 rounded border border-slate-700 px-2 py-1.5 text-xs leading-none text-slate-300 hover:bg-slate-800 disabled:opacity-30"
              >
                ▼
              </button>
              <button
                type="button"
                onClick={() => removerPasso(i)}
                disabled={dados.passos.length <= 2}
                title="Remover passo"
                className="shrink-0 rounded border border-red-500/30 p-1.5 text-red-300 hover:bg-red-500/10 disabled:opacity-30"
              >
                <PixelIcon nome="trash" className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={adicionarPasso}
            className="btn-pixel flex items-center gap-1 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
          >
            <PixelIcon nome="plus" className="h-3.5 w-3.5" />
            Adicionar passo
          </button>
        </div>
      ) : (
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
      )}

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
