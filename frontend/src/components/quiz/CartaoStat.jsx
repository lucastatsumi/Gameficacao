export default function CartaoStat({ rotulo, valor, destaque = false }) {
  return (
    <div
      className={`card-pixel border-2 p-4 ${
        destaque ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-slate-800 bg-slate-900/60'
      }`}
    >
      <p className={`font-pixel text-lg ${destaque ? 'text-indigo-300' : 'text-slate-100'}`}>
        {valor}
      </p>
      <p className="mt-2 text-xs text-slate-400">{rotulo}</p>
    </div>
  );
}
