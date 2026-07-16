import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Alerta from '../components/ui/Alerta.jsx';
import BarraXp from '../components/ui/BarraXp.jsx';
import PixelIcon from '../components/ui/PixelIcon.jsx';

export default function Perfil() {
  const { perfil } = useAuth();
  const [badges, setBadges] = useState(null);
  const [historico, setHistorico] = useState(null);
  const [revisao, setRevisao] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/perfil/badges'), api.get('/perfil/historico'), api.get('/perfil/revisao')])
      .then(([b, h, r]) => {
        setBadges(b);
        setHistorico(h);
        setRevisao(r);
      })
      .catch((err) => setErro(err.message));
  }, []);

  if (erro) return <Alerta>{erro}</Alerta>;
  if (!perfil || !badges || !historico || !revisao) return <Spinner texto="Carregando perfil..." />;

  const conquistadas = badges.filter((b) => b.conquistada).length;

  return (
    <div className="space-y-8">
      {/* cabeçalho do perfil */}
      <div className="card-pixel border-2 border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center border-2 border-indigo-500/40 bg-indigo-950 text-indigo-300">
            <PixelIcon nome={perfil.role === 'professor' ? 'book-open' : 'gamepad'} className="h-9 w-9" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-pixel text-base text-slate-100">{perfil.nome}</h1>
            <p className="mt-1 text-sm text-slate-400">{perfil.email}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-indigo-300">
              {perfil.role === 'professor' ? 'Professor' : 'Aluno'}
              {perfil.role !== 'professor' && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-violet-300">{perfil.titulo_nivel}</span>
                  {perfil.classe && (
                    <>
                      <span className="text-slate-600">·</span>
                      <span className="text-emerald-300">{perfil.classe}</span>
                    </>
                  )}
                </>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-2 font-pixel text-xl text-amber-300">
              <PixelIcon nome="coins" className="h-6 w-6" />
              {perfil.xp_total}
            </p>
            <p className="mt-1 text-xs text-slate-400">XP total</p>
          </div>
          {perfil.streak_dias > 0 && (
            <div
              title="Dias seguidos jogando"
              className="card-pixel flex items-center gap-2 border-2 border-orange-500/40 bg-orange-500/10 px-3 py-2"
            >
              <PixelIcon nome="fire" className="h-6 w-6 text-orange-400" />
              <div>
                <p className="font-pixel text-sm text-orange-300">{perfil.streak_dias}</p>
                <p className="text-[10px] uppercase tracking-wide text-orange-400/70">
                  {perfil.streak_dias === 1 ? 'dia seguido' : 'dias seguidos'}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-5">
          <BarraXp perfil={perfil} />
          <p className="mt-1 text-right text-xs text-slate-500">
            Faltam {Math.max(0, perfil.xp_proximo_nivel - perfil.xp_total)} XP para o nível{' '}
            {perfil.nivel + 1}
          </p>
        </div>

        {perfil.poderes && (perfil.poderes.eliminar_alternativa > 0 || perfil.poderes.tempo_extra > 0) && (
          <div className="mt-4 flex flex-wrap gap-3 border-t-2 border-slate-800 pt-4">
            <p className="w-full text-xs uppercase tracking-wide text-slate-500">
              Poderes disponíveis (use durante o quiz)
            </p>
            {perfil.poderes.eliminar_alternativa > 0 && (
              <span className="flex items-center gap-1.5 border-2 border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-300">
                <PixelIcon nome="trash" className="h-4 w-4" />
                50/50 × {perfil.poderes.eliminar_alternativa}
              </span>
            )}
            {perfil.poderes.tempo_extra > 0 && (
              <span className="flex items-center gap-1.5 border-2 border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs text-sky-300">
                <PixelIcon nome="clock" className="h-4 w-4" />
                +15s × {perfil.poderes.tempo_extra}
              </span>
            )}
          </div>
        )}
      </div>

      {/* estante de badges */}
      <section>
        <h2 className="flex items-center gap-2 font-pixel text-sm text-slate-100">
          <PixelIcon nome="trophy" className="h-5 w-5 text-amber-400" />
          Conquistas{' '}
          <span className="font-sans text-sm font-normal text-slate-400">
            ({conquistadas}/{badges.length})
          </span>
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {badges.map((badge) => (
            <div
              key={badge.id}
              title={badge.descricao}
              className={`card-pixel border-2 p-4 text-center transition-colors ${
                badge.conquistada
                  ? 'border-amber-500/40 bg-amber-500/10'
                  : 'border-slate-800 bg-slate-900/40 opacity-50 grayscale'
              }`}
            >
              <div className="text-3xl">{badge.icone}</div>
              <p className="mt-2 text-xs font-semibold text-slate-200">{badge.nome}</p>
              <p className="mt-1 text-[11px] leading-tight text-slate-500">{badge.descricao}</p>
            </div>
          ))}
        </div>
      </section>

      {/* revisão de erros — reforço espaçado */}
      {revisao.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 font-pixel text-sm text-slate-100">
            <PixelIcon nome="reload" className="h-5 w-5 text-red-400" />
            Revisão de erros
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Suas últimas respostas erradas, com a explicação da alternativa certa.
          </p>
          <div className="mt-4 space-y-3">
            {revisao.map((r) => (
              <div key={r.resposta_id} className="card-pixel border-2 border-slate-800 bg-slate-900/60 p-4">
                <p className="text-sm text-slate-200">{r.questao.enunciado}</p>
                {r.questao.codigo_snippet && (
                  <pre className="mt-3 overflow-x-auto border-2 border-slate-800 bg-slate-950 p-3 text-xs text-emerald-300">
                    <code>{r.questao.codigo_snippet}</code>
                  </pre>
                )}
                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                  <p className="border-2 border-red-500/30 bg-red-500/10 p-2 text-red-300">
                    {r.sua_alternativa
                      ? <>Você marcou <strong>{r.sua_alternativa.letra}</strong>: {r.sua_alternativa.texto}</>
                      : 'Tempo esgotado — sem resposta'}
                  </p>
                  {r.alternativa_correta && (
                    <p className="border-2 border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-300">
                      Certa era <strong>{r.alternativa_correta.letra}</strong>: {r.alternativa_correta.texto}
                    </p>
                  )}
                </div>
                {r.alternativa_correta?.explicacao && (
                  <p className="mt-2 text-xs text-slate-400">{r.alternativa_correta.explicacao}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* histórico */}
      <section>
        <h2 className="flex items-center gap-2 font-pixel text-sm text-slate-100">
          <PixelIcon nome="book-open" className="h-5 w-5 text-indigo-400" />
          Histórico de quizzes
        </h2>
        {historico.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Você ainda não finalizou nenhum quiz — comece pelo mapa de fases!
          </p>
        ) : (
          <div className="card-pixel mt-4 overflow-hidden border-2 border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Fase</th>
                  <th className="px-4 py-3">Acertos</th>
                  <th className="px-4 py-3">XP</th>
                  <th className="px-4 py-3">Resultado</th>
                  <th className="px-4 py-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {historico.map((t) => (
                  <tr key={t.id} className="border-t border-slate-800 odd:bg-slate-950 even:bg-slate-900/40">
                    <td className="px-4 py-3 font-medium">{t.fase?.nome}</td>
                    <td className="px-4 py-3">
                      {t.acertos}/{t.total_questoes}
                    </td>
                    <td className="px-4 py-3 font-mono text-amber-300">+{t.xp_ganho}</td>
                    <td className="px-4 py-3">
                      {t.aprovada ? (
                        <span className="flex items-center gap-1 text-emerald-300">
                          <PixelIcon nome="check" className="h-4 w-4" />
                          Aprovado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-500">
                          <PixelIcon nome="close" className="h-4 w-4" />
                          Reprovado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(t.finalizada_em).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
