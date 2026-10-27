import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import Spinner from '../components/ui/Spinner.jsx';
import Alerta from '../components/ui/Alerta.jsx';
import PixelIcon from '../components/ui/PixelIcon.jsx';

// Certificado de conclusão de trilha (Horizonte 3). O servidor só emite
// com todos os módulos aprovados; aqui é só a folha para imprimir/salvar
// como PDF — mesmo padrão de window.print() do relatório do gestor.
export default function Certificado() {
  const { temaId } = useParams();
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api
      .get(`/perfil/certificado/${temaId}`)
      .then(setDados)
      .catch((err) => setErro(err.message));
  }, [temaId]);

  if (erro) return <Alerta>{erro}</Alerta>;
  if (!dados) return <Spinner />;

  const data = dados.concluido_em
    ? new Date(dados.concluido_em).toLocaleDateString('pt-BR', { dateStyle: 'long' })
    : '';

  return (
    <div>
      <div className="mb-4 flex gap-2 print:hidden">
        <Link to="/perfil" className="px-3 py-2 text-sm text-slate-400 hover:text-slate-200">
          ← Voltar ao perfil
        </Link>
        <button
          onClick={() => window.print()}
          className="btn-pixel ml-auto flex items-center gap-1.5 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
        >
          <PixelIcon nome="download" className="h-4 w-4" />
          Imprimir / salvar PDF
        </button>
      </div>

      <article className="mx-auto max-w-3xl border-8 border-double border-amber-500/70 bg-white p-10 text-center text-slate-900 print:border-amber-600">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Certificado de conclusão
        </p>
        <h1 className="mt-6 text-3xl font-bold">{dados.colaborador}</h1>
        <p className="mt-4 text-slate-600">concluiu a trilha de treinamento</p>
        <h2 className="mt-2 text-2xl font-semibold text-indigo-700">{dados.tema}</h2>
        {dados.empresa && <p className="mt-2 text-slate-600">na {dados.empresa}</p>}

        <dl className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">Nota média</dt>
            <dd className="text-xl font-semibold">{dados.score_medio ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Proficiência</dt>
            <dd className="text-xl font-semibold">{dados.nivel}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Módulos</dt>
            <dd className="text-xl font-semibold">{dados.total_modulos}</dd>
          </div>
        </dl>

        <p className="mt-10 text-sm text-slate-600">Concluído em {data}</p>
        <p className="mt-1 font-mono text-xs text-slate-400">
          Código de verificação: {dados.codigo}
        </p>
        <p className="mt-6 text-xs text-slate-400">Emitido pelo TeamQuest</p>
      </article>
    </div>
  );
}
