// Barra de progresso do nível (usa os campos calculados pelo GET /perfil)
export default function BarraXp({ perfil, compacta = false }) {
  if (!perfil) return null;
  const pct = Math.max(0, Math.min(100, perfil.progresso_nivel_pct ?? 0));

  return (
    <div className={compacta ? 'w-40' : 'w-full'}>
      {!compacta && (
        <div className="mb-1 flex justify-between text-xs text-slate-400">
          <span>Nível {perfil.nivel}</span>
          <span>
            {perfil.xp_total} / {perfil.xp_proximo_nivel} XP
          </span>
        </div>
      )}
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
