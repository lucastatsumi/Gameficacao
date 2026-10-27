import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import Spinner from '../ui/Spinner.jsx';
import Alerta from '../ui/Alerta.jsx';
import { inputCls } from './inputCls.js';

// Roadmap H1: onboarding (criar tema próprio) e trilhas por equipe (quais
// temas cada equipe vê). Equipe sem nenhum tema marcado continua vendo tudo.
export default function AbaTrilhas() {
  const [temas, setTemas] = useState(null);
  const [turmas, setTurmas] = useState([]);
  const [turmaId, setTurmaId] = useState('');
  const [selecionados, setSelecionados] = useState([]);
  const [novoTema, setNovoTema] = useState('');
  const [erro, setErro] = useState(null);
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/admin/temas'), api.get('/admin/turmas')])
      .then(([t, tu]) => {
        setTemas(t);
        setTurmas(tu);
      })
      .catch((err) => setErro(err.message));
  }, []);

  async function escolherTurma(id) {
    setTurmaId(id);
    setAviso(null);
    setSelecionados(id ? await api.get(`/admin/turmas/${id}/temas`).catch(() => []) : []);
  }

  function alternar(id) {
    setSelecionados((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function salvar() {
    setErro(null);
    try {
      await api.put(`/admin/turmas/${turmaId}/temas`, { tema_ids: selecionados });
      setAviso('Trilha da equipe atualizada.');
    } catch (err) {
      setErro(err.message);
    }
  }

  async function criarTema(e) {
    e.preventDefault();
    setErro(null);
    try {
      const tema = await api.post('/admin/temas', { nome: novoTema });
      setTemas((t) => [...t, tema]);
      setNovoTema('');
    } catch (err) {
      setErro(err.message);
    }
  }

  if (!temas && !erro) return <Spinner />;

  return (
    <div className="space-y-6">
      {erro && <Alerta>{erro}</Alerta>}

      <form onSubmit={criarTema} className="flex gap-2">
        <input
          className={inputCls}
          placeholder="Novo tema (ex.: LGPD)"
          value={novoTema}
          onChange={(e) => setNovoTema(e.target.value)}
        />
        <button className="btn-pixel px-4">Criar tema</button>
      </form>

      <div>
        <select className={inputCls} value={turmaId} onChange={(e) => escolherTurma(e.target.value)}>
          <option value="">Escolha uma equipe...</option>
          {turmas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>

        {turmaId && (
          <div className="mt-3 space-y-2">
            {temas?.map((t) => (
              <label key={t.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selecionados.includes(t.id)}
                  onChange={() => alternar(t.id)}
                />
                {t.nome}
              </label>
            ))}
            <p className="text-xs opacity-70">Nenhum marcado = a equipe vê todos os temas.</p>
            <button className="btn-pixel px-4" onClick={salvar}>
              Salvar trilha
            </button>
            {aviso && <p className="text-sm text-emerald-300">{aviso}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
