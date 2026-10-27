import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Alerta from '../components/ui/Alerta.jsx';
import PixelIcon from '../components/ui/PixelIcon.jsx';
import { inputCls } from '../components/admin/inputCls.js';

// Onboarding da empresa (Horizonte 1): quem chega cria o espaço da empresa
// (vira dono e escolhe os temas do catálogo) ou entra com o código de
// convite. Quem já tem empresa vê o resumo e, se puder convidar, o código.
export default function Empresa() {
  const { perfil, recarregarPerfil } = useAuth();
  const navegar = useNavigate();
  const [empresa, setEmpresa] = useState(undefined);
  const [catalogo, setCatalogo] = useState([]);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api
      .get('/empresas/minha')
      .then(setEmpresa)
      .catch((err) => setErro(err.message));
    api
      .get('/temas/catalogo')
      .then(setCatalogo)
      .catch(() => {});
  }, [perfil?.empresa_id]);

  async function aposEntrar() {
    await recarregarPerfil?.();
    navegar('/');
  }

  if (erro) return <Alerta>{erro}</Alerta>;
  if (empresa === undefined) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <PixelIcon nome="briefcase" className="h-7 w-7 text-indigo-400" />
        <h1 className="font-pixel text-lg text-slate-100">Empresa</h1>
      </div>

      {empresa ? (
        <ResumoEmpresa empresa={empresa} catalogo={catalogo} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <EntrarNaEmpresa aoEntrar={aposEntrar} />
          <CriarEmpresa catalogo={catalogo} aoCriar={aposEntrar} />
        </div>
      )}
    </div>
  );
}

function ResumoEmpresa({ empresa, catalogo }) {
  const [copiado, setCopiado] = useState(false);
  const temas = catalogo.filter((t) => empresa.tema_ids.includes(t.id));

  async function copiar() {
    const texto = `Entre na ${empresa.nome} no TeamQuest com o código de convite: ${empresa.codigo_convite}`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.prompt('Copie o convite:', texto);
    }
  }

  return (
    <div className="card-pixel border-2 border-indigo-500/40 bg-indigo-500/5 p-5">
      <h2 className="text-xl font-semibold text-slate-100">{empresa.nome}</h2>
      <p className="mt-1 text-sm text-slate-400">
        Seu papel: <strong className="text-slate-200">{empresa.meu_papel}</strong>
      </p>
      {empresa.codigo_convite && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-400">Código de convite:</span>
          <span className="bg-slate-800 px-2 py-0.5 font-mono text-indigo-300">
            {empresa.codigo_convite}
          </span>
          <button
            onClick={copiar}
            className="btn-pixel flex items-center gap-1 bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-500"
          >
            <PixelIcon nome={copiado ? 'check' : 'users'} className="h-3.5 w-3.5" />
            {copiado ? 'Copiado!' : 'Convidar colaboradores'}
          </button>
        </div>
      )}
      <p className="mt-4 text-xs uppercase tracking-wide text-slate-500">
        Temas do catálogo ativos
      </p>
      <div className="mt-1 flex flex-wrap gap-2">
        {temas.map((t) => (
          <span key={t.id} className="bg-slate-800 px-2 py-1 text-xs text-slate-300">
            {t.nome}
          </span>
        ))}
        {temas.length === 0 && <span className="text-sm text-slate-500">Nenhum.</span>}
      </div>
    </div>
  );
}

function EntrarNaEmpresa({ aoEntrar }) {
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState(null);

  async function enviar(e) {
    e.preventDefault();
    setErro(null);
    try {
      await api.post('/empresas/entrar', { codigo });
      aoEntrar();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <form
      onSubmit={enviar}
      className="card-pixel space-y-3 border-2 border-slate-800 bg-slate-900/60 p-5"
    >
      <h2 className="font-semibold text-slate-100">Fui convidado(a)</h2>
      <p className="text-sm text-slate-400">
        Digite o código de convite que o RH ou seu gestor enviou.
      </p>
      <input
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        placeholder="Código de convite (ex.: ABCD2345)"
        aria-label="Código de convite da empresa"
        className={`${inputCls} font-mono uppercase`}
        required
      />
      <Alerta>{erro}</Alerta>
      <button className="btn-pixel bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
        Entrar na empresa
      </button>
    </form>
  );
}

function CriarEmpresa({ catalogo, aoCriar }) {
  const [nome, setNome] = useState('');
  const [temaIds, setTemaIds] = useState([]);
  const [erro, setErro] = useState(null);

  function alternar(id) {
    setTemaIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  async function enviar(e) {
    e.preventDefault();
    setErro(null);
    try {
      await api.post('/empresas', { nome, tema_ids: temaIds });
      aoCriar();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <form
      onSubmit={enviar}
      className="card-pixel space-y-3 border-2 border-slate-800 bg-slate-900/60 p-5"
    >
      <h2 className="font-semibold text-slate-100">Criar o espaço da minha empresa</h2>
      <p className="text-sm text-slate-400">
        Você vira dono(a) do espaço: escolhe os temas, cria equipes e convida o time.
      </p>
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome da empresa"
        aria-label="Nome da empresa"
        className={inputCls}
        required
      />
      <fieldset>
        <legend className="text-xs uppercase tracking-wide text-slate-500">
          Temas que a empresa vai treinar
        </legend>
        <div className="mt-2 space-y-2">
          {catalogo.map((t) => (
            <label
              key={t.id}
              className={`flex cursor-pointer items-start gap-2 border-2 p-2 text-sm ${
                temaIds.includes(t.id)
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={temaIds.includes(t.id)}
                onChange={() => alternar(t.id)}
                className="mt-1"
              />
              <span>
                <span className="font-medium text-slate-100">{t.nome}</span>
                <span className="block text-xs text-slate-400">{t.descricao}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <Alerta>{erro}</Alerta>
      <button
        disabled={!temaIds.length}
        className="btn-pixel bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        Criar empresa
      </button>
    </form>
  );
}
