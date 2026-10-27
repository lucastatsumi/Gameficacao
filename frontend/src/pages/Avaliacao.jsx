import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import Spinner from '../components/ui/Spinner.jsx';
import Alerta from '../components/ui/Alerta.jsx';

// Roadmap H3: proficiência por tema, matriz de competências (maiores gaps
// primeiro) e certificado de conclusão. Tudo calculado no servidor.
const ROTULO_PROFICIENCIA = {
  iniciante: 'Iniciante',
  praticante: 'Praticante',
  proficiente: 'Proficiente',
  referencia: 'Referência',
};

export default function Avaliacao() {
  const [proficiencia, setProficiencia] = useState(null);
  const [competencias, setCompetencias] = useState([]);
  const [certificado, setCertificado] = useState(null);
  const [prestigios, setPrestigios] = useState([]);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/avaliacao/proficiencia'),
      api.get('/avaliacao/competencias'),
      api.get('/avaliacao/prestigio'),
    ])
      .then(([p, c, pr]) => {
        setProficiencia(p);
        setCompetencias(c);
        setPrestigios(pr);
      })
      .catch((err) => setErro(err.message));
  }, []);

  async function emitirCertificado(temaId) {
    setErro(null);
    try {
      setCertificado(await api.get(`/avaliacao/certificado/${temaId}`));
      // dá tempo de o certificado renderizar antes de abrir o diálogo de impressão
      setTimeout(() => window.print(), 100);
    } catch (err) {
      setErro(err.message);
    }
  }

  async function prestigiar(temaId) {
    setErro(null);
    try {
      await api.post(`/avaliacao/prestigio/${temaId}`);
      setPrestigios(await api.get('/avaliacao/prestigio'));
    } catch (err) {
      setErro(err.message);
    }
  }

  if (!proficiencia && !erro) return <Spinner texto="Carregando sua avaliação..." />;

  return (
    <div>
      <h1 className="text-xl font-bold print:hidden">Minha avaliação</h1>
      {erro && <Alerta>{erro}</Alerta>}

      <section className="mt-4 grid gap-3 print:hidden">
        {proficiencia?.map((p) => {
          const prest = prestigios.find((x) => x.tema_id === p.tema_id);
          return (
          <div key={p.tema_id} className="card-pixel flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">
                {p.tema} {prest?.ciclo > 0 && <span title="Prestígio">{'★'.repeat(prest.ciclo)}</span>}
              </p>
              <p className="text-sm opacity-80">
                {p.modulos_concluidos}/{p.modulos_total} módulos · score médio {p.score_medio ?? '—'}
              </p>
              <p className="text-sm text-amber-300">{ROTULO_PROFICIENCIA[p.proficiencia]}</p>
            </div>
            <div className="flex gap-2">
              {p.modulos_concluidos === p.modulos_total && (
                <button className="btn-pixel" onClick={() => emitirCertificado(p.tema_id)}>
                  Certificado
                </button>
              )}
              {prest?.pode_prestigiar && (
                <button className="btn-pixel" onClick={() => prestigiar(p.tema_id)}>
                  Prestigiar
                </button>
              )}
            </div>
          </div>
          );
        })}
      </section>

      <section className="mt-6 print:hidden">
        <h2 className="font-semibold">Competências</h2>
        {competencias.length === 0 ? (
          <p className="mt-2 text-sm opacity-70">Ainda não há competências avaliadas.</p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="text-left opacity-70">
                <th className="py-1">Competência</th>
                <th>Respondidas</th>
                <th>Acerto</th>
              </tr>
            </thead>
            <tbody>
              {competencias.map((c) => (
                <tr key={c.competencia}>
                  <td className="py-1">{c.competencia}</td>
                  <td>{c.respondidas}</td>
                  <td className={c.taxa_acerto < 60 ? 'text-red-400' : 'text-emerald-300'}>
                    {c.taxa_acerto}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {certificado && (
        <section className="mt-6 hidden border-4 p-10 text-center print:block">
          <h2 className="text-3xl font-bold">Certificado de Conclusão</h2>
          <p className="mt-6">Certificamos que</p>
          <p className="mt-2 text-2xl font-bold">{certificado.nome}</p>
          <p className="mt-2">concluiu a trilha “{certificado.tema}”</p>
          <p className="mt-2">
            Score médio {certificado.score_medio} · {ROTULO_PROFICIENCIA[certificado.proficiencia]}
          </p>
          <p className="mt-6 text-sm">
            Emitido em {new Date(certificado.emitido_em).toLocaleDateString('pt-BR')}
          </p>
        </section>
      )}
    </div>
  );
}
