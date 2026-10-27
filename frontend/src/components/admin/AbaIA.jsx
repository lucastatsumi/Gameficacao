import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Alerta from '../ui/Alerta.jsx';
import { inputCls } from './inputCls.js';

// Roadmap H2: o gestor pede questões à IA, que chegam como RASCUNHO. Nada
// entra no banco de questões sem o clique em "Aprovar".
export default function AbaIA() {
  const [fases, setFases] = useState([]);
  const [form, setForm] = useState({ fase_id: '', tema: '', nivel: 'media', quantidade: 3 });
  const [rascunhos, setRascunhos] = useState([]);
  const [gerando, setGerando] = useState(false);
  const [info, setInfo] = useState(null);
  const [sugestoes, setSugestoes] = useState([]);
  const [faseAuditoria, setFaseAuditoria] = useState('');
  const [abertas, setAbertas] = useState([]);
  const [notas, setNotas] = useState({});
  const [erro, setErro] = useState(null);

  const carregar = useCallback(() => {
    api.get('/admin/ia/rascunhos').then(setRascunhos).catch((err) => setErro(err.message));
    api.get('/admin/ia/sugestoes').then(setSugestoes).catch(() => {});
    api.get('/admin/respostas-abertas').then(setAbertas).catch(() => {});
  }, []);

  useEffect(() => {
    carregar();
    api.get('/fases').then(setFases).catch(() => {});
  }, [carregar]);

  async function gerar(e) {
    e.preventDefault();
    setErro(null);
    setInfo(null);
    setGerando(true);
    try {
      const r = await api.post('/admin/ia/gerar', {
        ...form,
        fase_id: Number(form.fase_id),
        quantidade: Number(form.quantidade),
      });
      setInfo(
        `${r.rascunhos.length} rascunho(s) gerado(s)` +
          (r.descartadas ? `, ${r.descartadas} descartado(s) por formato inválido` : '') +
          ` · custo: ${r.tokens_entrada} tokens de entrada, ${r.tokens_saida} de saída`
      );
      carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setGerando(false);
    }
  }

  async function auditar() {
    setErro(null);
    setInfo(null);
    try {
      const r = await api.post('/admin/ia/auditar', { fase_id: Number(faseAuditoria) });
      setInfo(`${r.auditadas} questão(ões) auditada(s), ${r.sugestoes.length} sugestão(ões).`);
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function revisarNota(id) {
    setErro(null);
    try {
      await api.patch(`/admin/respostas-abertas/${id}`, { nota: Number(notas[id]) });
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function resolver(id, status) {
    await api.patch(`/admin/ia/sugestoes/${id}`, { status }).catch((err) => setErro(err.message));
    carregar();
  }

  async function revisar(id, acao) {
    setErro(null);
    try {
      if (acao === 'aprovar') await api.post(`/admin/ia/rascunhos/${id}/aprovar`, {});
      else await api.delete(`/admin/ia/rascunhos/${id}`);
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <div className="space-y-6">
      {erro && <Alerta>{erro}</Alerta>}

      <form onSubmit={gerar} className="grid gap-2 sm:grid-cols-2">
        <select
          required
          className={inputCls}
          value={form.fase_id}
          onChange={(e) => setForm({ ...form, fase_id: e.target.value })}
        >
          <option value="">Módulo de destino...</option>
          {fases.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
        <input
          required
          className={inputCls}
          placeholder="Assunto (ex.: resposta a incidentes)"
          value={form.tema}
          onChange={(e) => setForm({ ...form, tema: e.target.value })}
        />
        <select
          className={inputCls}
          value={form.nivel}
          onChange={(e) => setForm({ ...form, nivel: e.target.value })}
        >
          <option value="facil">Fácil</option>
          <option value="media">Média</option>
          <option value="dificil">Difícil</option>
        </select>
        <input
          type="number"
          min="1"
          max="10"
          className={inputCls}
          value={form.quantidade}
          onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
        />
        <button className="btn-pixel px-4 sm:col-span-2" disabled={gerando}>
          {gerando ? 'Gerando...' : 'Gerar rascunhos com IA'}
        </button>
      </form>
      {info && <p className="text-sm text-emerald-300">{info}</p>}

      <div className="space-y-2">
        <h2 className="font-semibold">Auditar banco existente</h2>
        <div className="flex gap-2">
          <select className={inputCls} value={faseAuditoria} onChange={(e) => setFaseAuditoria(e.target.value)}>
            <option value="">Módulo...</option>
            {fases.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
          <button className="btn-pixel px-4" disabled={!faseAuditoria} onClick={auditar}>
            Auditar
          </button>
        </div>
        {sugestoes.map((s) => (
          <div key={s.id} className="card-pixel p-3 text-sm">
            <p className="opacity-70">{s.questoes?.enunciado}</p>
            <p>
              <strong>{s.tipo}</strong>: {s.descricao}
            </p>
            <div className="mt-2 flex gap-2">
              <button className="btn-pixel px-3" onClick={() => resolver(s.id, 'resolvida')}>
                Resolvida
              </button>
              <button className="btn-pixel px-3" onClick={() => resolver(s.id, 'ignorada')}>
                Ignorar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Respostas abertas corrigidas pela IA</h2>
        {abertas.map((r) => (
          <div key={r.id} className="card-pixel p-3 text-sm">
            <p className="opacity-70">
              {r.tentativas?.profiles?.nome} — {r.questoes?.enunciado}
            </p>
            <p className="mt-1 whitespace-pre-wrap">{r.texto_resposta}</p>
            <p className="mt-1">
              Nota atual: <strong>{r.nota}</strong> (IA: {r.nota_ia})
              {r.revisada_em && ' · revisada pelo gestor'}
            </p>
            {r.feedback_ia?.criterios?.map((c) => (
              <p key={c.criterio} className="text-xs opacity-80">
                {c.criterio} ({c.pontos}): {c.feedback}
              </p>
            ))}
            <div className="mt-2 flex gap-2">
              <input
                type="number"
                min="0"
                max="100"
                className={`${inputCls} w-24`}
                aria-label="Nova nota"
                value={notas[r.id] ?? ''}
                onChange={(e) => setNotas({ ...notas, [r.id]: e.target.value })}
              />
              <button
                className="btn-pixel px-3"
                disabled={notas[r.id] === undefined || notas[r.id] === ''}
                onClick={() => revisarNota(r.id)}
              >
                Sobrescrever nota
              </button>
            </div>
          </div>
        ))}
        {!abertas.length && <p className="text-sm opacity-70">Nenhuma resposta aberta ainda.</p>}
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Rascunhos pendentes de revisão ({rascunhos.length})</h2>
        {rascunhos.map((r) => (
          <div key={r.id} className="card-pixel p-4">
            <p className="font-medium">{r.payload.enunciado}</p>
            <ul className="mt-2 text-sm">
              {r.payload.alternativas.map((a) => (
                <li key={a.letra} className={a.correta ? 'text-emerald-300' : 'opacity-80'}>
                  {a.letra}) {a.texto} — <em>{a.explicacao}</em>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <button className="btn-pixel px-3" onClick={() => revisar(r.id, 'aprovar')}>
                Aprovar
              </button>
              <button className="btn-pixel px-3" onClick={() => revisar(r.id, 'descartar')}>
                Descartar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
