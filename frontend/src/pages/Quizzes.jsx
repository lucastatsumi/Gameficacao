import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import Spinner from '../components/ui/Spinner.jsx';
import Alerta from '../components/ui/Alerta.jsx';
import PixelIcon from '../components/ui/PixelIcon.jsx';
import FormQuiz from '../components/quizzes/FormQuiz.jsx';

const QUIZ_VAZIO = {
  titulo: '',
  descricao: '',
  tempo_fixo: false,
  tempo_limite_seg: 30,
  sons: true,
  permitir_dicas: true,
  boss_fight: false,
  vidas: 3,
  questao_ids: [],
};

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState(null);
  const [form, setForm] = useState(null); // { dados, editandoId }
  const [erro, setErro] = useState(null);

  const carregar = useCallback(() => {
    api.get('/quizzes').then(setQuizzes).catch((err) => setErro(err.message));
  }, []);

  useEffect(carregar, [carregar]);

  async function alternarAtivo(quiz) {
    try {
      await api.patch(`/quizzes/${quiz.id}/ativo`, { ativo: !quiz.ativo });
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  if (!quizzes) return <Spinner texto="Carregando quizzes..." />;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <PixelIcon nome="gamepad" className="h-7 w-7 text-indigo-400" />
        <h1 className="font-pixel text-lg text-slate-100">Quizzes</h1>
        <button
          onClick={() => setForm({ dados: structuredClone(QUIZ_VAZIO), editandoId: null })}
          className="btn-pixel ml-auto flex items-center gap-1.5 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          <PixelIcon nome="plus" className="h-4 w-4" />
          Criar quiz
        </button>
      </div>
      <p className="mt-2 text-sm text-slate-400">
        Qualquer jogador pode montar um quiz com as questões do banco e configurar tempo, sons e
        dicas. Todos os quizzes ficam disponíveis aqui.
      </p>

      <div className="mt-4">
        <Alerta>{erro}</Alerta>
      </div>

      {form && (
        <div className="mt-4">
          <FormQuiz
            form={form}
            aoFechar={() => setForm(null)}
            aoSalvar={() => {
              setForm(null);
              carregar();
            }}
          />
        </div>
      )}

      {quizzes.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">
          Nenhum quiz criado ainda — seja o primeiro!
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className={`card-pixel border-2 bg-slate-900/60 p-4 ${
                quiz.meu ? 'border-indigo-500/40' : 'border-slate-800'
              } ${quiz.ativo ? '' : 'opacity-60'}`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-100">{quiz.titulo}</p>
                    {quiz.meu && (
                      <span className="bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300">
                        seu quiz
                      </span>
                    )}
                    {!quiz.ativo && (
                      <span className="bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
                        desativado
                      </span>
                    )}
                  </div>
                  {quiz.descricao && (
                    <p className="mt-1 text-sm text-slate-400">{quiz.descricao}</p>
                  )}
                  <p className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <PixelIcon nome="user" className="h-3.5 w-3.5" />
                      {quiz.criador}
                    </span>
                    <span>{quiz.total_questoes} questões</span>
                    <span className="flex items-center gap-1">
                      <PixelIcon nome="clock" className="h-3.5 w-3.5" />
                      {quiz.tempo_limite_seg
                        ? `${quiz.tempo_limite_seg}s por questão`
                        : 'tempo de cada questão'}
                    </span>
                    {quiz.permitir_dicas && (
                      <span className="flex items-center gap-1 text-amber-400/80">
                        <PixelIcon nome="zap" className="h-3.5 w-3.5" />
                        dicas
                      </span>
                    )}
                    {!quiz.sons && <span>sem sons</span>}
                  </p>
                </div>

                <div className="flex gap-2">
                  {quiz.meu && (
                    <button
                      onClick={() => alternarAtivo(quiz)}
                      className={`btn-pixel px-3 py-2 text-xs ${
                        quiz.ativo
                          ? 'bg-red-500/10 text-red-300 hover:bg-red-500/20'
                          : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                      }`}
                    >
                      {quiz.ativo ? 'Desativar' : 'Reativar'}
                    </button>
                  )}
                  <Link
                    to={`/quiz/custom/${quiz.id}`}
                    className="btn-pixel flex items-center gap-2 bg-indigo-600 px-4 py-2 font-pixel text-[10px] text-white hover:bg-indigo-500"
                  >
                    <PixelIcon nome="play" className="h-4 w-4" />
                    JOGAR
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
