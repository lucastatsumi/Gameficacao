import { useState } from 'react';
import { api } from '../../services/api.js';
import Alerta from '../ui/Alerta.jsx';

// Importação de colaboradores por CSV (colunas: nome, email, equipe). Cada
// pessoa recebe um convite por e-mail e entra já na empresa e na equipe.
export default function AbaImportar() {
  const [csv, setCsv] = useState('');
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function carregarArquivo(e) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (arquivo) setCsv(await arquivo.text());
  }

  async function importar() {
    setErro(null);
    setResultado(null);
    setEnviando(true);
    try {
      setResultado(await api.post('/admin/importar-colaboradores', { csv }));
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-4">
      {erro && <Alerta>{erro}</Alerta>}
      <p className="text-sm opacity-80">
        Cabeçalho obrigatório: <code>nome</code>, <code>email</code>; opcional: <code>equipe</code>{' '}
        (nome de uma das suas turmas). Até 200 linhas. Cada pessoa recebe um convite por e-mail.
      </p>
      <input type="file" accept=".csv,text/csv" onChange={carregarArquivo} className="text-sm" />
      <textarea
        rows={8}
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        aria-label="Conteúdo do CSV"
        placeholder={'nome,email,equipe\nAna Silva,ana@empresa.com,Vendas'}
        className="w-full border-2 border-slate-700 bg-slate-900 p-2 font-mono text-sm"
      />
      <button className="btn-pixel px-4" disabled={enviando || !csv.trim()} onClick={importar}>
        {enviando ? 'Convidando...' : 'Importar e convidar'}
      </button>

      {resultado && (
        <div className="card-pixel p-3 text-sm">
          <p>
            <strong>{resultado.convidados}</strong> convite(s) enviado(s), {resultado.falhas} com
            problema.
          </p>
          <ul className="mt-2 list-disc pl-5">
            {resultado.erros.map((e) => (
              <li key={`${e.linha}-${e.email}`}>
                Linha {e.linha} ({e.email || 'sem e-mail'}): {e.erro}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
