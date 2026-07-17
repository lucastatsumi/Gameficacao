import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import Spinner from '../components/ui/Spinner.jsx';
import Alerta from '../components/ui/Alerta.jsx';
import PixelIcon from '../components/ui/PixelIcon.jsx';

// Página do desafio assíncrono: o colega que recebeu o link vê quem
// desafiou, a fase e a pontuação a bater, e vai jogar a fase normalmente
// (o próprio /quiz/iniciar já cuida de tudo — este desafio é só o convite).
export default function Desafio() {
  const { desafioId } = useParams();
  const [desafio, setDesafio] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api
      .get(`/desafios/${desafioId}`)
      .then(setDesafio)
      .catch((err) => setErro(err.message));
  }, [desafioId]);

  if (erro) return <Alerta>{erro}</Alerta>;
  if (!desafio) return <Spinner texto="Carregando desafio..." />;

  return (
    <div className="mx-auto max-w-lg text-center">
      <PixelIcon nome="zap" className="mx-auto h-12 w-12 text-amber-400" />
      <h1 className="mt-4 font-pixel text-lg text-slate-100">Você foi desafiado!</h1>
      <p className="mt-3 text-slate-300">
        <strong>{desafio.criador_nome}</strong> te desafia na fase{' '}
        <strong>{desafio.fase.nome}</strong>.
      </p>
      <div className="card-pixel mt-6 border-2 border-amber-500/40 bg-amber-500/10 p-5">
        <p className="text-xs uppercase tracking-wide text-amber-400/80">Pontuação a bater</p>
        <p className="mt-1 font-pixel text-2xl text-amber-300">{desafio.acertos_alvo} acertos</p>
      </div>
      <Link
        to={`/quiz/${desafio.fase.id}`}
        className="btn-pixel mt-6 flex items-center justify-center gap-2 bg-indigo-600 px-6 py-3 font-pixel text-[10px] text-white transition-colors hover:bg-indigo-500"
      >
        <PixelIcon nome="play" className="h-4 w-4" />
        ACEITAR O DESAFIO
      </Link>
    </div>
  );
}
