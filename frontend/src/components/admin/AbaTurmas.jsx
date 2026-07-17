import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Spinner from '../ui/Spinner.jsx';
import Alerta from '../ui/Alerta.jsx';
import PixelIcon from '../ui/PixelIcon.jsx';
import { inputCls } from './inputCls.js';

export default function AbaTurmas() {
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

  // "Exportação em PDF" via impressão do navegador: abre uma janela com uma
  // tabela simples e chama print() — o professor escolhe "Salvar como PDF"
  // no diálogo de impressão. Sem biblioteca nova nem endpoint novo.
  async function exportarPdf(turma) {
    try {
      const lista = await api.get(`/admin/turmas/${turma.id}/alunos`);
      const escapar = (v) =>
        String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

      const linhas = lista
        .map(
          (a) =>
            `<tr><td>${escapar(a.nome)}</td><td>${a.nivel}</td><td>${a.xp_total}</td><td>${a.fases_concluidas}</td><td>${a.total_tentativas}</td><td>${a.total_badges}</td></tr>`
        )
        .join('');

      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Desempenho — ${escapar(turma.nome)}</title>
        <style>
          body { font-family: sans-serif; padding: 24px; color: #111; }
          h1 { font-size: 18px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 13px; }
          th { background: #f3f3f3; }
        </style></head>
        <body>
          <h1>Desempenho — ${escapar(turma.nome)}</h1>
          <p>Código de acesso: ${escapar(turma.codigo_acesso)} · Gerado em ${new Date().toLocaleString('pt-BR')}</p>
          <table>
            <thead><tr><th>Nome</th><th>Nível</th><th>XP</th><th>Fases concluídas</th><th>Tentativas</th><th>Badges</th></tr></thead>
            <tbody>${linhas || '<tr><td colspan="6">Nenhum aluno matriculado ainda.</td></tr>'}</tbody>
          </table>
        </body></html>`;

      const janela = window.open('', '_blank');
      if (!janela) {
        setErro('Não foi possível abrir a janela de impressão — verifique o bloqueador de pop-ups.');
        return;
      }
      janela.document.write(html);
      janela.document.close();
      janela.focus();
      janela.print();
    } catch (err) {
      setErro(err.message);
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
          aria-label="Nome da nova turma"
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
                <button
                  onClick={() => exportarPdf(turma)}
                  className="btn-pixel flex items-center gap-1 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                >
                  <PixelIcon nome="download" className="h-3.5 w-3.5" />
                  PDF
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
