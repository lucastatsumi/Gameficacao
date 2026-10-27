import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Spinner from '../ui/Spinner.jsx';
import Alerta from '../ui/Alerta.jsx';
import PixelIcon from '../ui/PixelIcon.jsx';
import { inputCls } from './inputCls.js';

// Horizonte 1: temas (o que a empresa treina) → módulos → competências.
// Temas do catálogo aparecem como leitura para gestores de empresa; os
// próprios da empresa (e, para o gestor legado, o catálogo) são editáveis.
export default function AbaTemas() {
  const { perfil } = useAuth();
  const [temas, setTemas] = useState(null);
  const [erro, setErro] = useState(null);
  const [novoTema, setNovoTema] = useState({ nome: '', descricao: '' });

  const carregar = useCallback(() => {
    api
      .get('/admin/temas')
      .then(setTemas)
      .catch((err) => setErro(err.message));
  }, []);

  useEffect(carregar, [carregar]);

  async function criarTema(e) {
    e.preventDefault();
    setErro(null);
    try {
      await api.post('/admin/temas', novoTema);
      setNovoTema({ nome: '', descricao: '' });
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  if (!temas) return <Spinner />;

  return (
    <div className="space-y-6">
      {perfil?.papel === 'dono' && <PainelDono aoMudarTemas={carregar} />}

      <form
        onSubmit={criarTema}
        className="card-pixel grid gap-2 border-2 border-slate-800 bg-slate-900/60 p-4 sm:grid-cols-[1fr_2fr_auto]"
      >
        <input
          value={novoTema.nome}
          onChange={(e) => setNovoTema((t) => ({ ...t, nome: e.target.value }))}
          placeholder="Novo tema (ex.: Política de Viagens)"
          aria-label="Nome do novo tema"
          className={inputCls}
          required
        />
        <input
          value={novoTema.descricao}
          onChange={(e) => setNovoTema((t) => ({ ...t, descricao: e.target.value }))}
          placeholder="Descrição curta"
          aria-label="Descrição do novo tema"
          className={inputCls}
        />
        <button className="btn-pixel flex items-center justify-center gap-1.5 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
          <PixelIcon nome="plus" className="h-4 w-4" />
          Criar tema
        </button>
      </form>

      <Alerta>{erro}</Alerta>

      <div className="space-y-4">
        {temas.map((tema) => (
          <CartaoTema key={tema.id} tema={tema} aoMudar={carregar} aoErro={setErro} />
        ))}
      </div>
    </div>
  );
}

function CartaoTema({ tema, aoMudar, aoErro }) {
  const [modulo, setModulo] = useState('');
  const [competencia, setCompetencia] = useState({ nome: '', resumo: '' });

  async function enviar(caminho, corpo, limpar) {
    aoErro(null);
    try {
      await api.post(caminho, corpo);
      limpar();
      aoMudar();
    } catch (err) {
      aoErro(err.message);
    }
  }

  return (
    <div className="card-pixel border-2 border-slate-800 bg-slate-900/60 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <PixelIcon nome={tema.icone ?? 'map-pin'} className="h-5 w-5 text-indigo-300" />
        <h3 className="font-semibold text-slate-100">{tema.nome}</h3>
        <span
          className={`px-2 py-0.5 text-xs ${
            tema.editavel ? 'bg-emerald-500/10 text-emerald-300' : 'bg-sky-500/10 text-sky-300'
          }`}
        >
          {tema.editavel ? 'editável' : 'catálogo · somente leitura'}
        </span>
      </div>
      {tema.descricao && <p className="mt-1 text-sm text-slate-400">{tema.descricao}</p>}

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Módulos (em ordem)</p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm text-slate-300">
            {tema.modulos.map((m) => (
              <li key={m.id}>{m.nome}</li>
            ))}
          </ol>
          {tema.modulos.length === 0 && (
            <p className="text-sm text-slate-500">Nenhum módulo ainda.</p>
          )}
          {tema.editavel && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                enviar(`/admin/temas/${tema.id}/modulos`, { nome: modulo }, () => setModulo(''));
              }}
              className="mt-2 flex gap-2"
            >
              <input
                value={modulo}
                onChange={(e) => setModulo(e.target.value)}
                placeholder="Novo módulo"
                aria-label={`Novo módulo em ${tema.nome}`}
                className={inputCls}
                required
              />
              <button className="btn-pixel shrink-0 bg-slate-800 px-3 text-xs text-slate-200 hover:bg-slate-700">
                Adicionar
              </button>
            </form>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Competências</p>
          <ul className="mt-1 space-y-1 text-sm text-slate-300">
            {tema.competencias.map((c) => (
              <li key={c.id} title={c.resumo}>
                • {c.nome}
              </li>
            ))}
          </ul>
          {tema.competencias.length === 0 && (
            <p className="text-sm text-slate-500">Nenhuma competência ainda.</p>
          )}
          {tema.editavel && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                enviar(`/admin/temas/${tema.id}/competencias`, competencia, () =>
                  setCompetencia({ nome: '', resumo: '' }),
                );
              }}
              className="mt-2 space-y-2"
            >
              <input
                value={competencia.nome}
                onChange={(e) => setCompetencia((c) => ({ ...c, nome: e.target.value }))}
                placeholder="Nova competência"
                aria-label={`Nova competência em ${tema.nome}`}
                className={inputCls}
                required
              />
              <textarea
                value={competencia.resumo}
                onChange={(e) => setCompetencia((c) => ({ ...c, resumo: e.target.value }))}
                placeholder="Resumo do conceito (verso da carta colecionável)"
                aria-label="Resumo da competência"
                rows={2}
                className={inputCls}
              />
              <button className="btn-pixel bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700">
                Adicionar competência
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// Papéis granulares (Horizonte 5): só o dono promove gestores e escolhe
// quais temas do catálogo a empresa treina.
function PainelDono({ aoMudarTemas }) {
  const [membros, setMembros] = useState(null);
  const [catalogo, setCatalogo] = useState([]);
  const [ativos, setAtivos] = useState([]);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    api
      .get('/admin/empresa/membros')
      .then(setMembros)
      .catch(() => setMembros([]));
    api
      .get('/temas/catalogo')
      .then(setCatalogo)
      .catch(() => {});
    api
      .get('/empresas/minha')
      .then((e) => setAtivos(e?.tema_ids ?? []))
      .catch(() => {});
  }, []);

  async function mudarPapel(membro, papel) {
    setMsg(null);
    try {
      const atualizado = await api.put(`/admin/empresa/membros/${membro.id}/papel`, { papel });
      setMembros((lista) => lista.map((m) => (m.id === membro.id ? { ...m, ...atualizado } : m)));
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message });
    }
  }

  async function salvarTemas() {
    setMsg(null);
    try {
      await api.put('/admin/empresa/temas', { tema_ids: ativos });
      setMsg({ tipo: 'sucesso', texto: 'Temas da empresa atualizados.' });
      aoMudarTemas();
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message });
    }
  }

  return (
    <div className="card-pixel space-y-4 border-2 border-amber-500/30 bg-amber-500/5 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-300">
        <PixelIcon nome="briefcase" className="h-4 w-4" />
        Administração da empresa (dono)
      </p>
      {msg && <Alerta tipo={msg.tipo}>{msg.texto}</Alerta>}

      <div>
        <p className="text-sm font-medium text-slate-200">Temas do catálogo que a empresa treina</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {catalogo.map((t) => (
            <label
              key={t.id}
              className={`flex cursor-pointer items-center gap-1.5 border-2 px-2 py-1 text-xs ${
                ativos.includes(t.id)
                  ? 'border-amber-500 bg-amber-500/10 text-amber-200'
                  : 'border-slate-700 text-slate-400'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={ativos.includes(t.id)}
                onChange={() =>
                  setAtivos((a) => (a.includes(t.id) ? a.filter((x) => x !== t.id) : [...a, t.id]))
                }
              />
              {t.nome}
            </label>
          ))}
        </div>
        <button
          onClick={salvarTemas}
          className="btn-pixel mt-2 bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500"
        >
          Salvar temas
        </button>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-200">Membros e papéis</p>
        {!membros ? (
          <Spinner />
        ) : (
          <table className="mt-2 w-full text-sm">
            <tbody>
              {membros.map((m) => (
                <tr key={m.id} className="border-t border-slate-800">
                  <td className="py-1.5 font-medium">{m.nome}</td>
                  <td className="py-1.5 text-xs text-slate-500">{m.email}</td>
                  <td className="py-1.5 text-right">
                    {m.papel === 'dono' ? (
                      <span className="text-xs text-amber-300">dono</span>
                    ) : (
                      <select
                        value={m.papel}
                        onChange={(e) => mudarPapel(m, e.target.value)}
                        aria-label={`Papel de ${m.nome}`}
                        className="border-2 border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                      >
                        <option value="colaborador">colaborador</option>
                        <option value="gestor">gestor</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
