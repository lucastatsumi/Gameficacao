import { useState } from 'react';
import PixelIcon from '../components/ui/PixelIcon.jsx';
import AbaTurmas from '../components/admin/AbaTurmas.jsx';
import AbaQuestoes from '../components/admin/AbaQuestoes.jsx';
import AbaQuizzes from '../components/admin/AbaQuizzes.jsx';
import AbaRelatorio from '../components/admin/AbaRelatorio.jsx';
import AbaEventos from '../components/admin/AbaEventos.jsx';

export default function Admin() {
  const [aba, setAba] = useState('turmas');

  return (
    <div>
      <div className="flex items-center gap-3">
        <PixelIcon nome="briefcase" className="h-7 w-7 text-indigo-400" />
        <h1 className="font-pixel text-lg text-slate-100">Painel do Professor</h1>
      </div>

      <div className="mt-4 flex gap-2">
        {[
          ['turmas', 'users', 'Turmas'],
          ['questoes', 'pencil', 'Questões'],
          ['quizzes', 'gamepad', 'Quizzes'],
          ['relatorio', 'chart-bar-big', 'Relatório'],
          ['eventos', 'fire', 'Eventos'],
        ].map(([valor, icone, rotulo]) => (
          <button
            key={valor}
            onClick={() => setAba(valor)}
            className={`btn-pixel flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
              aba === valor
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <PixelIcon nome={icone} className="h-4 w-4" />
            {rotulo}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {aba === 'turmas' && <AbaTurmas />}
        {aba === 'questoes' && <AbaQuestoes />}
        {aba === 'quizzes' && <AbaQuizzes />}
        {aba === 'relatorio' && <AbaRelatorio />}
        {aba === 'eventos' && <AbaEventos />}
      </div>
    </div>
  );
}
