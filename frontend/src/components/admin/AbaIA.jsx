import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Spinner from '../ui/Spinner.jsx';
import Alerta from '../ui/Alerta.jsx';
import PixelIcon from '../ui/PixelIcon.jsx';
import { inputCls } from './inputCls.js';

// Horizonte 2: a IA gera RASCUNHOS — nada entra em produção sem a
// aprovação feita aqui. Também é onde o gestor revisa as notas que a IA
// deu às respostas abertas (Horizonte 3).
const TIPO_ACHADO = {
  erro_factual: 'Erro factual',
  ambiguidade: 'Ambiguidade',
  distrator_fraco: 'Distrator fraco',
  desatualizada: 'Desatualizada',
  linguagem: 'Linguagem',
};

function lerArquivo(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    const ehPdf = arquivo.type === 'application/pdf' || arquivo.name.toLowerCase().endsWith('.pdf');
    leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo'));
    leitor.onload = () =>
      resolve(
        ehPdf
          ? { tipo: 'pdf', nome: arquivo.name, conteudo: String(leitor.result).split(',')[1] }
          : { tipo: 'texto', nome: arquivo.name, conteudo: String(leitor.result) },
      );
    if (ehPdf) leitor.readAsDataURL(arquivo);
    else leitor.readAsText(arquivo);
  });
}

function Custo({ custo }) {
  if (!custo) return null;
  return (
    <span className="text-xs text-slate-500">
      {custo.input_tokens + custo.output_tokens} tokens · US$ {Number(custo.custo_usd).toFixed(4)}
    </span>
  );
}

export default function AbaIA() {
  const [temas, setTemas] = useState(null);
  const [custos, setCustos] = useState(null);
  const [rascunhos, setRascunhos] = useState(null);
  const [erro, setErro] = useState(null);

  const carregarRascunhos = useCallback(() => {
    api
      .get('/admin/ia/rascunhos')
      .then(setRascunhos)
      .catch((err) => setErro(err.message));
    api
      .get('/admin/ia/custos')
      .then(setCustos)
      .catch(() => {});
  }, []);

  useEffect(() => {
    api
      .get('/admin/temas')
      .then((lista) => setTemas(lista.filter((t) => t.editavel)))
      .catch((err) => setErro(err.message));
    carregarRascunhos();
  }, [carregarRascunhos]);

  if (!temas) return <Spinner />;

  return (
    <div className="space-y-6">
      {custos && (
        <div className="card-pixel flex flex-wrap items-center gap-3 border-2 border-slate-800 bg-slate-900/60 p-3 text-sm">
          <PixelIcon nome="zap" className="h-5 w-5 text-violet-300" />
          {custos.configurada ? (
            <span className="text-slate-300">
              IA ativa ({custos.modelo}) · gasto estimado nos últimos {custos.dias} dias:{' '}
              <strong className="text-slate-100">US$ {Number(custos.total_usd).toFixed(2)}</strong>{' '}
              em {custos.chamadas.length} chamada(s)
            </span>
          ) : (
            <span className="text-amber-300">
              IA não configurada no servidor (ANTHROPIC_API_KEY). Respostas abertas ficam pendentes
              para correção manual.
            </span>
          )}
        </div>
      )}
      <Alerta>{erro}</Alerta>

      {temas.length === 0 ? (
        <p className="text-sm text-slate-500">
          Crie um tema próprio na aba Temas para gerar questões com IA (temas do catálogo são
          somente leitura).
        </p>
      ) : (
        <>
          <GerarQuestoes temas={temas} aoGerar={carregarRascunhos} />
          <AuditarTema temas={temas} aoAuditar={carregarRascunhos} />
        </>
      )}

      <Rascunhos rascunhos={rascunhos} aoMudar={carregarRascunhos} aoErro={setErro} />
      <AvaliacoesAbertas />
    </div>
  );
}

function GerarQuestoes({ temas, aoGerar }) {
  const [modo, setModo] = useState('zero'); // zero | documento
  const [pedido, setPedido] = useState({
    fase_id: '',
    quantidade: 5,
    dificuldade: '',
    formato: 'padrao',
    instrucoes: '',
  });
  const [documento, setDocumento] = useState(null);
  const [textoColado, setTextoColado] = useState('');
  const [gerando, setGerando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);

  function mudar(campo, valor) {
    setPedido((p) => ({ ...p, [campo]: valor }));
  }

  async function escolherArquivo(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    try {
      setDocumento(await lerArquivo(arquivo));
    } catch (err) {
      setErro(err.message);
    }
  }

  async function gerar(e) {
    e.preventDefault();
    setErro(null);
    setResultado(null);
    setGerando(true);
    const corpo = {
      ...pedido,
      fase_id: Number(pedido.fase_id),
      quantidade: Number(pedido.quantidade),
      dificuldade: pedido.dificuldade || undefined,
    };
    try {
      if (modo === 'documento') {
        const doc =
          documento ??
          (textoColado.trim()
            ? { tipo: 'texto', nome: 'texto colado', conteudo: textoColado }
            : null);
        if (!doc) throw new Error('Envie um arquivo ou cole o texto do documento');
        setResultado(await api.post('/admin/ia/documento', { ...corpo, documento: doc }));
      } else {
        setResultado(await api.post('/admin/ia/gerar', corpo));
      }
      aoGerar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setGerando(false);
    }
  }

  return (
    <form
      onSubmit={gerar}
      className="card-pixel space-y-3 border-2 border-violet-500/30 bg-violet-500/5 p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-slate-100">Gerar questões com IA</h3>
        <div className="ml-auto flex gap-1 text-xs" role="tablist" aria-label="Origem do conteúdo">
          {[
            ['zero', 'A partir do tema'],
            ['documento', 'A partir de documento da empresa'],
          ].map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              role="tab"
              aria-selected={modo === valor}
              onClick={() => setModo(valor)}
              className={`px-2 py-1 ${modo === valor ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        <select
          value={pedido.fase_id}
          onChange={(e) => mudar('fase_id', e.target.value)}
          aria-label="Módulo de destino"
          className={inputCls}
          required
        >
          <option value="">Módulo...</option>
          {temas.map((t) => (
            <optgroup key={t.id} label={t.nome}>
              {t.modulos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <select
          value={pedido.formato}
          onChange={(e) => mudar('formato', e.target.value)}
          aria-label="Formato"
          className={inputCls}
        >
          <option value="padrao">Múltipla escolha</option>
          <option value="batalha_complexidade">Duelo (2 alternativas)</option>
        </select>
        <select
          value={pedido.dificuldade}
          onChange={(e) => mudar('dificuldade', e.target.value)}
          aria-label="Dificuldade"
          className={inputCls}
        >
          <option value="">Dificuldades variadas</option>
          <option value="facil">Fácil</option>
          <option value="media">Média</option>
          <option value="dificil">Difícil</option>
        </select>
        <input
          type="number"
          min={1}
          max={10}
          value={pedido.quantidade}
          onChange={(e) => mudar('quantidade', e.target.value)}
          aria-label="Quantidade de questões"
          title="Quantidade (1 a 10)"
          className={inputCls}
        />
      </div>

      {modo === 'documento' && (
        <div className="space-y-2">
          <input
            type="file"
            accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
            onChange={escolherArquivo}
            aria-label="Documento da empresa (PDF, TXT ou MD)"
            className="text-sm text-slate-300"
          />
          {documento && <p className="text-xs text-slate-400">Arquivo: {documento.nome}</p>}
          {!documento && (
            <textarea
              value={textoColado}
              onChange={(e) => setTextoColado(e.target.value)}
              placeholder="...ou cole aqui o texto da política, manual ou playbook"
              aria-label="Texto do documento"
              rows={4}
              className={inputCls}
            />
          )}
          <p className="text-xs text-slate-500">
            Cada questão cita o trecho do documento que sustenta a resposta. Em texto puro, o
            servidor confere se o trecho existe de verdade e descarta citações inventadas.
          </p>
        </div>
      )}

      <input
        value={pedido.instrucoes}
        onChange={(e) => mudar('instrucoes', e.target.value)}
        placeholder="Orientações opcionais (ex.: foque em atendimento por telefone)"
        aria-label="Orientações para a IA"
        className={inputCls}
      />
      <Alerta>{erro}</Alerta>
      <div className="flex flex-wrap items-center gap-3">
        <button
          disabled={gerando}
          className="btn-pixel flex items-center gap-1.5 bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
        >
          <PixelIcon nome="zap" className="h-4 w-4" />
          {gerando ? 'Gerando (pode levar um minuto)...' : 'Gerar rascunhos'}
        </button>
        {resultado && (
          <span className="text-sm text-slate-300">
            {resultado.rascunhos.length} rascunho(s) criados
            {resultado.rejeitadas.length > 0 &&
              `, ${resultado.rejeitadas.length} descartado(s) na validação`}
            . <Custo custo={resultado.custo} />
          </span>
        )}
      </div>
      {resultado?.rejeitadas?.length > 0 && (
        <ul className="text-xs text-slate-500">
          {resultado.rejeitadas.map((r, i) => (
            <li key={i}>
              • {r.enunciado || '(sem enunciado)'} — {r.motivo}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

function AuditarTema({ temas, aoAuditar }) {
  const [temaId, setTemaId] = useState('');
  const [auditando, setAuditando] = useState(false);
  const [relatorio, setRelatorio] = useState(null);
  const [erro, setErro] = useState(null);

  async function auditar() {
    setErro(null);
    setRelatorio(null);
    setAuditando(true);
    try {
      setRelatorio(await api.post(`/admin/ia/auditar/${temaId}`));
      aoAuditar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setAuditando(false);
    }
  }

  return (
    <div className="card-pixel space-y-3 border-2 border-slate-800 bg-slate-900/60 p-4">
      <h3 className="font-semibold text-slate-100">Auditar tema com IA</h3>
      <p className="text-xs text-slate-500">
        A IA revisa até 30 questões ativas procurando erros, ambiguidade e distratores fracos. Cada
        correção sugerida vira um rascunho que substitui a original só se você aprovar.
      </p>
      <div className="flex flex-wrap gap-2">
        <select
          value={temaId}
          onChange={(e) => setTemaId(e.target.value)}
          aria-label="Tema a auditar"
          className="border-2 border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="">Tema...</option>
          {temas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
        <button
          onClick={auditar}
          disabled={!temaId || auditando}
          className="btn-pixel bg-slate-700 px-4 py-2 text-sm text-slate-100 hover:bg-slate-600 disabled:opacity-50"
        >
          {auditando ? 'Auditando...' : 'Auditar'}
        </button>
      </div>
      <Alerta>{erro}</Alerta>
      {relatorio && (
        <div className="space-y-2 text-sm">
          <p className="text-slate-300">
            {relatorio.auditadas} questão(ões) revisada(s), {relatorio.achados.length} achado(s).{' '}
            <Custo custo={relatorio.custo} />
          </p>
          {relatorio.achados.map((a) => (
            <div key={a.questao_id} className="border-l-4 border-amber-500/60 bg-slate-950/60 p-2">
              <p className="text-xs text-amber-300">
                {TIPO_ACHADO[a.tipo] ?? a.tipo} · gravidade {a.gravidade}
                {a.rascunho_id && ' · correção enviada para revisão'}
              </p>
              <p className="text-slate-400">{a.enunciado}</p>
              <p className="mt-1 text-slate-200">{a.descricao}</p>
              {a.correcao_rejeitada && (
                <p className="text-xs text-slate-500">
                  Correção descartada: {a.correcao_rejeitada}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const ORIGEM = {
  ia_geracao: 'gerada pela IA',
  ia_documento: 'gerada a partir de documento',
  ia_auditoria: 'correção sugerida pela auditoria',
};

function Rascunhos({ rascunhos, aoMudar, aoErro }) {
  async function decidir(id, acao) {
    aoErro(null);
    try {
      await api.post(`/admin/ia/rascunhos/${id}/${acao}`);
      aoMudar();
    } catch (err) {
      aoErro(err.message);
    }
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-200">Rascunhos aguardando revisão</h3>
      <p className="mt-1 text-xs text-slate-500">
        Para ajustar o texto antes de aprovar, edite o rascunho na aba Questões.
      </p>
      {!rascunhos ? (
        <Spinner />
      ) : rascunhos.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Nenhum rascunho pendente.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {rascunhos.map((q) => (
            <div
              key={q.id}
              className="card-pixel border-2 border-violet-500/30 bg-slate-900/60 p-4"
            >
              <p className="text-xs text-violet-300">
                {ORIGEM[q.origem] ?? q.origem} · {q.modulo} · {q.dificuldade}
              </p>
              <p className="mt-1 text-sm text-slate-100">{q.enunciado}</p>
              <ul className="mt-2 space-y-1 text-xs">
                {q.alternativas.map((a) => (
                  <li key={a.letra} className={a.correta ? 'text-emerald-300' : 'text-slate-400'}>
                    <strong>{a.letra})</strong> {a.texto}
                    <span className="block pl-4 text-slate-500">{a.explicacao}</span>
                  </li>
                ))}
              </ul>
              {q.fonte_trecho && (
                <blockquote className="mt-2 border-l-4 border-l-indigo-500/60 pl-2 text-xs italic text-slate-400">
                  “{q.fonte_trecho}”
                </blockquote>
              )}
              {q.nota_ia && <p className="mt-2 text-xs text-amber-300">Motivo: {q.nota_ia}</p>}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => decidir(q.id, 'aprovar')}
                  className="btn-pixel flex items-center gap-1 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  <PixelIcon nome="check" className="h-3.5 w-3.5" />
                  {q.substitui_questao_id ? 'Aprovar e substituir a original' : 'Aprovar'}
                </button>
                <button
                  onClick={() => decidir(q.id, 'descartar')}
                  className="btn-pixel flex items-center gap-1 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
                >
                  <PixelIcon nome="trash" className="h-3.5 w-3.5" />
                  Descartar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AvaliacoesAbertas() {
  const [status, setStatus] = useState('pendente');
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(() => {
    setLista(null);
    api
      .get(`/admin/avaliacoes-abertas${status ? `?status=${status}` : ''}`)
      .then(setLista)
      .catch((err) => setErro(err.message));
  }, [status]);

  useEffect(carregar, [carregar]);

  return (
    <section>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-200">Respostas abertas</h3>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filtrar respostas abertas"
          className="ml-auto border-2 border-slate-700 bg-slate-900 px-2 py-1 text-xs"
        >
          <option value="pendente">Pendentes de correção</option>
          <option value="">Todas (recentes)</option>
        </select>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        A nota da IA fica registrada com a justificativa; a sua, quando houver, prevalece na
        avaliação de competências.
      </p>
      <Alerta>{erro}</Alerta>
      {!lista ? (
        <Spinner />
      ) : lista.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Nada por aqui.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {lista.map((a) => (
            <ItemAvaliacao key={a.resposta_id} avaliacao={a} aoSalvar={carregar} />
          ))}
        </div>
      )}
    </section>
  );
}

function ItemAvaliacao({ avaliacao, aoSalvar }) {
  const [nota, setNota] = useState(avaliacao.nota_final ?? '');
  const [comentario, setComentario] = useState(avaliacao.comentario_gestor ?? '');
  const [msg, setMsg] = useState(null);

  async function salvar(e) {
    e.preventDefault();
    setMsg(null);
    try {
      await api.put(`/admin/avaliacoes-abertas/${avaliacao.resposta_id}`, {
        nota: Number(nota),
        comentario,
      });
      aoSalvar();
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <form
      onSubmit={salvar}
      className="card-pixel border-2 border-slate-800 bg-slate-900/60 p-4 text-sm"
    >
      <p className="text-xs text-slate-500">
        {avaliacao.colaborador} · {new Date(avaliacao.respondida_em).toLocaleString('pt-BR')}
      </p>
      <p className="mt-1 font-medium text-slate-200">{avaliacao.enunciado}</p>
      <p className="mt-2 whitespace-pre-wrap border-l-4 border-slate-700 pl-2 text-slate-300">
        {avaliacao.texto_resposta || '(em branco)'}
      </p>
      {avaliacao.feedback?.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-slate-400">
          {avaliacao.feedback.map((f) => (
            <li key={f.criterio}>
              {f.criterio}: <strong className="text-slate-200">{f.nota}</strong> — {f.comentario}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-slate-400">
        Nota da IA: <strong>{avaliacao.nota_ia ?? '—'}</strong>
        {avaliacao.nota_gestor != null && (
          <>
            {' '}
            · sua nota: <strong className="text-emerald-300">{avaliacao.nota_gestor}</strong>
          </>
        )}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <input
          type="number"
          min={0}
          max={100}
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          aria-label="Sua nota (0 a 100)"
          className="w-24 border-2 border-slate-700 bg-slate-900 px-2 py-1"
          required
        />
        <input
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Comentário (opcional)"
          aria-label="Comentário do gestor"
          className="min-w-0 flex-1 border-2 border-slate-700 bg-slate-900 px-2 py-1"
        />
        <button className="btn-pixel bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
          Salvar nota
        </button>
      </div>
      {msg && <p className="mt-1 text-xs text-red-300">{msg}</p>}
    </form>
  );
}
