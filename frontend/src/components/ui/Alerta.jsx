export default function Alerta({ children, tipo = 'erro' }) {
  if (!children) return null;
  const estilos = {
    erro: 'border-red-500/40 bg-red-500/10 text-red-300',
    sucesso: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  };
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${estilos[tipo]}`} role="alert">
      {children}
    </div>
  );
}
