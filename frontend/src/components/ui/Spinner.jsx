export default function Spinner({ texto = 'Carregando...' }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-slate-400">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-400" />
      <span className="text-sm">{texto}</span>
    </div>
  );
}
