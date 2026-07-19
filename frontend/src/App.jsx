import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Spinner from './components/ui/Spinner.jsx';
import Login from './pages/Login.jsx';
import MapaFases from './pages/MapaFases.jsx';
import Quiz from './pages/Quiz.jsx';
import Quizzes from './pages/Quizzes.jsx';
import Ranking from './pages/Ranking.jsx';
import Perfil from './pages/Perfil.jsx';
import Admin from './pages/Admin.jsx';
import Desafio from './pages/Desafio.jsx';
import Loja from './pages/Loja.jsx';

function RotaProtegida({ children, apenasProfessor = false }) {
  const { sessao, perfil, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!sessao) return <Navigate to="/login" replace />;
  if (apenasProfessor && perfil?.role !== 'professor') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RotaProtegida>
            <Layout />
          </RotaProtegida>
        }
      >
        <Route path="/" element={<MapaFases />} />
        <Route path="/quizzes" element={<Quizzes />} />
        <Route path="/quiz/custom/:quizId" element={<Quiz />} />
        {/* "diario" casa com /quiz/:faseId — Quiz.jsx trata faseId === 'diario' */}
        <Route path="/quiz/:faseId" element={<Quiz />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/loja" element={<Loja />} />
        <Route path="/desafio/:desafioId" element={<Desafio />} />
        <Route
          path="/admin"
          element={
            <RotaProtegida apenasProfessor>
              <Admin />
            </RotaProtegida>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
