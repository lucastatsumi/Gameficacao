import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Spinner from '../ui/Spinner.jsx';
import Alerta from '../ui/Alerta.jsx';
import PixelIcon from '../ui/PixelIcon.jsx';
import { inputCls } from './inputCls.js';

// Empacotamento para o gestor: campanha temática (evento + badge + meta +
// ranking numa ação só) e torneio entre equipes.
function hojeMais(dias) {
  const d = new Date(Date.now() + dias * 86400000);
  return d.toISOString().slice(0, 10);
}

export default function AbaCampanhas() {
  const [temas, setTemas] = useState([]);
  const [campanhas, setCampanhas] = useState(null);
  const [torneios, setTorneios] = useState(null);
  const [erro, setErro] = useState(null);
  const [campanha, setCampanha] = useState({
    nome: '',
    descricao: '',
    tema_id: '',
    inicio: hojeMais(0),
    fim: hojeMais(30),
    meta_quizzes: 5,
    multiplicador_xp: 1.5,
  });
  const [torneio, setTorneio] = useState({ nome: '', inicio: hojeMais(0), fim: hojeMais(14), fichas_premio: 50 });

  const carregar = useCallback(() => {
    api.get('/admin/campanhas').then(setCampanhas).catch((err) => setErro(err.message));
    api.get('/admin/torneios').then(setTorneios).catch((err) => setErro(err.message));
  }, []);

  useEffect(() => {
    api.get('/admin/temas').then(setTemas).catch(() => {});
    carregar();
  }, [carregar]);

  async function enviar(e, caminho, corpo, limpar) {
    e.preventDefault();
    setErro(null);
    try {
      await api.post(caminho, corpo);
      limpar();
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  // Datas do formulário são dias: o fim vale até o fim do dia
  const periodo = (inicio, fim) => ({
    inicio: new Date(`${inicio}T00:00:00`).toISOString(),
    fim: new Date(`${fim}T23:59:59`).toISOString(),
  });

  return (
    <div className="space-y-6">
      <Alerta>{erro}</Alerta>

      <form
        onSubmit={(e) =>
          enviar(
            e,
            '/admin/campanhas',
            {
              ...campanha,
              ...periodo(campanha.inicio, campanha.fim),
              meta_quizzes: Number(campanha.meta_quizzes),
              multiplicador_xp: Number(campanha.multiplicador_xp),
            },
            () => setCampanha((c) => ({ ...c, nome: '', descricao: '' }))
          )
        }
        className="card-pixel space-y-2 border-2 border-rose-500/30 bg-rose-500/5 p-4"
      >
        <h3 className="font-semibold text-slate-100">Nova campanha temática</h3>
        <p className="text-xs text-slate-500">
          Cria de uma vez: evento de XP multiplicado, badge exclusiva para quem cumprir a meta e
          ranking próprio do período.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={campanha.nome}
            onChange={(e) => setCampanha((c) => ({ ...c, nome: e.target.value }))}
            placeholder="Nome (ex.: Outubro da Segurança)"
            aria-label="Nome da campanha"
            className={inputCls}
            required
          />
          <select
            value={campanha.tema_id}
            onChange={(e) => setCampanha((c) => ({ ...c, tema_id: e.target.value }))}
            aria-label="Tema da campanha"
            className={inputCls}
          >
            <option value="">Todos os temas</option>
            {temas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </div>
        <input
          value={campanha.descricao}
          onChange={(e) => setCampanha((c) => ({ ...c, descricao: e.target.value }))}
          placeholder="Descrição para os colaboradores"
          aria-label="Descrição da campanha"
          className={inputCls}
        />
        <div className="grid gap-2 sm:grid-cols-4">
          <label className="text-xs text-slate-400">
            Início
            <input type="date" value={campanha.inicio} onChange={(e) => setCampanha((c) => ({ ...c, inicio: e.target.value }))} className={inputCls} required />
          </label>
          <label className="text-xs text-slate-400">
            Fim
            <input type="date" value={campanha.fim} onChange={(e) => setCampanha((c) => ({ ...c, fim: e.target.value }))} className={inputCls} required />
          </label>
          <label className="text-xs text-slate-400">
            Meta (quizzes aprovados)
            <input type="number" min={1} value={campanha.meta_quizzes} onChange={(e) => setCampanha((c) => ({ ...c, meta_quizzes: e.target.value }))} className={inputCls} />
          </label>
          <label className="text-xs text-slate-400">
            Multiplicador de XP
            <input type="number" min={1.1} step={0.1} value={campanha.multiplicador_xp} onChange={(e) => setCampanha((c) => ({ ...c, multiplicador_xp: e.target.value }))} className={inputCls} />
          </label>
        </div>
        <button className="btn-pixel flex items-center gap-1.5 bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500">
          <PixelIcon nome="plus" className="h-4 w-4" />
          Criar campanha
        </button>
      </form>

      <section>
        <h3 className="text-sm font-semibold text-slate-200">Campanhas</h3>
        {!campanhas ? (
          <Spinner />
        ) : campanhas.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nenhuma campanha criada.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            {campanhas.map((c) => (
              <li key={c.id}>
                <strong>{c.nome}</strong> · {new Date(c.inicio).toLocaleDateString('pt-BR')} a{' '}
                {new Date(c.fim).toLocaleDateString('pt-BR')} · meta {c.meta_quizzes}
              </li>
            ))}
          </ul>
        )}
      </section>

      <form
        onSubmit={(e) =>
          enviar(
            e,
            '/admin/torneios',
            { ...torneio, ...periodo(torneio.inicio, torneio.fim), fichas_premio: Number(torneio.fichas_premio) },
            () => setTorneio((t) => ({ ...t, nome: '' }))
          )
        }
        className="card-pixel space-y-2 border-2 border-amber-500/30 bg-amber-500/5 p-4"
      >
        <h3 className="font-semibold text-slate-100">Novo torneio entre equipes</h3>
        <p className="text-xs text-slate-500">
          No período, cada desafio vencido por um membro soma 1 ponto para a equipe dele. Ao final, a
          equipe campeã recebe as fichas (pagas automaticamente no primeiro acesso após o fim).
        </p>
        <div className="grid gap-2 sm:grid-cols-4">
          <input
            value={torneio.nome}
            onChange={(e) => setTorneio((t) => ({ ...t, nome: e.target.value }))}
            placeholder="Nome do torneio"
            aria-label="Nome do torneio"
            className={`${inputCls} sm:col-span-4`}
            required
          />
          <label className="text-xs text-slate-400">
            Início
            <input type="date" value={torneio.inicio} onChange={(e) => setTorneio((t) => ({ ...t, inicio: e.target.value }))} className={inputCls} required />
          </label>
          <label className="text-xs text-slate-400">
            Fim
            <input type="date" value={torneio.fim} onChange={(e) => setTorneio((t) => ({ ...t, fim: e.target.value }))} className={inputCls} required />
          </label>
          <label className="text-xs text-slate-400">
            Fichas por membro da campeã
            <input type="number" min={1} value={torneio.fichas_premio} onChange={(e) => setTorneio((t) => ({ ...t, fichas_premio: e.target.value }))} className={inputCls} />
          </label>
        </div>
        <button className="btn-pixel flex items-center gap-1.5 bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500">
          <PixelIcon nome="trophy" className="h-4 w-4" />
          Criar torneio
        </button>
      </form>

      <section>
        <h3 className="text-sm font-semibold text-slate-200">Torneios</h3>
        {!torneios ? (
          <Spinner />
        ) : torneios.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nenhum torneio criado.</p>
        ) : (
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {torneios.map((t) => (
              <div key={t.id} className="card-pixel border-2 border-slate-800 bg-slate-900/60 p-3 text-sm">
                <p className="font-semibold text-slate-100">
                  {t.nome} <span className="text-xs text-slate-500">({t.status})</span>
                </p>
                <ol className="mt-1 space-y-0.5 text-xs text-slate-300">
                  {t.placar.map((p) => (
                    <li key={p.turma_id}>
                      {p.posicao}º {p.nome} — {p.vitorias} vitória(s) · {p.membros} membro(s)
                    </li>
                  ))}
                  {t.placar.length === 0 && <li className="text-slate-500">Nenhuma equipe ainda.</li>}
                </ol>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
