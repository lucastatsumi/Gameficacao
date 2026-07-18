import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Alerta from '../components/ui/Alerta.jsx';
import PixelIcon from '../components/ui/PixelIcon.jsx';
import AvatarPixel from '../components/ui/AvatarPixel.jsx';

const RARIDADE = {
  comum: { rotulo: 'Comum', borda: 'border-slate-700', texto: 'text-slate-400' },
  raro: { rotulo: 'Raro', borda: 'border-sky-500/40', texto: 'text-sky-300' },
  epico: { rotulo: 'Épico', borda: 'border-fuchsia-500/40', texto: 'text-fuchsia-300' },
};

const SECOES = [
  { tipo: 'poder', titulo: 'Poderes (consumíveis)', icone: 'zap' },
  { tipo: 'paleta', titulo: 'Paletas do avatar', icone: 'user' },
  { tipo: 'titulo', titulo: 'Títulos exibíveis', icone: 'star' },
];

export default function Loja() {
  const { perfil, recarregarPerfil } = useAuth();
  const [catalogo, setCatalogo] = useState(null);
  const [erro, setErro] = useState(null);
  const [ocupado, setOcupado] = useState(null); // id do item em compra/equipar

  const carregar = useCallback(() => {
    api.get('/loja').then(setCatalogo).catch((err) => setErro(err.message));
  }, []);

  useEffect(carregar, [carregar]);

  async function agir(item, acao) {
    setErro(null);
    setOcupado(item.id);
    try {
      if (acao === 'comprar') await api.post('/loja/comprar', { item_id: item.id });
      else if (acao === 'equipar') await api.post('/loja/equipar', { item_id: item.id });
      else await api.post('/loja/equipar', { item_id: null, tipo: item.tipo });
      carregar();
      await recarregarPerfil?.();
    } catch (err) {
      setErro(err.message);
    } finally {
      setOcupado(null);
    }
  }

  if (!catalogo) return <Spinner texto="Abrindo a loja..." />;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-pixel text-base text-slate-100">Loja</h1>
          <p className="mt-1 text-sm text-slate-400">
            Gaste as fichas ganhas jogando. Cosméticos são só visuais — nada aqui compra
            vantagem na correção.
          </p>
        </div>
        <span className="flex items-center gap-2 border-2 border-cyan-500/40 bg-cyan-500/10 px-3 py-2 font-pixel text-sm text-cyan-300">
          <PixelIcon nome="star" className="h-5 w-5" />
          {perfil?.fichas ?? 0} fichas
        </span>
      </div>

      <Alerta>{erro}</Alerta>

      {SECOES.map((secao) => {
        const itens = catalogo.filter((i) => i.tipo === secao.tipo);
        if (!itens.length) return null;
        return (
          <section key={secao.tipo}>
            <h2 className="flex items-center gap-2 font-pixel text-sm text-slate-100">
              <PixelIcon nome={secao.icone} className="h-5 w-5 text-indigo-400" />
              {secao.titulo}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {itens.map((item) => {
                const rar = RARIDADE[item.raridade] ?? RARIDADE.comum;
                const consumivel = item.tipo === 'poder';
                const semSaldo = (perfil?.fichas ?? 0) < item.preco;
                return (
                  <div key={item.id} className={`card-pixel border-2 ${rar.borda} bg-slate-900/60 p-4`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-200">{item.nome}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.descricao}</p>
                      </div>
                      {item.tipo === 'paleta' ? (
                        <AvatarPixel
                          nivel={perfil?.nivel ?? 1}
                          paleta={item.parametro}
                          className="h-10 w-10 shrink-0"
                        />
                      ) : (
                        <span className={`shrink-0 text-[10px] uppercase tracking-wide ${rar.texto}`}>
                          {rar.rotulo}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 text-sm text-cyan-300">
                        <PixelIcon nome="star" className="h-4 w-4" />
                        {item.preco}
                      </span>
                      {consumivel || !item.possuido ? (
                        <button
                          onClick={() => agir(item, 'comprar')}
                          disabled={ocupado === item.id || semSaldo}
                          title={semSaldo ? 'Fichas insuficientes' : undefined}
                          className="btn-pixel bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-40"
                        >
                          {ocupado === item.id ? '...' : 'Comprar'}
                        </button>
                      ) : item.equipado ? (
                        <button
                          onClick={() => agir(item, 'desequipar')}
                          disabled={ocupado === item.id}
                          className="btn-pixel border-2 border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
                        >
                          Em uso — tirar
                        </button>
                      ) : (
                        <button
                          onClick={() => agir(item, 'equipar')}
                          disabled={ocupado === item.id}
                          className="btn-pixel bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                        >
                          Equipar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
