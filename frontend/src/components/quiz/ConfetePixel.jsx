import { useMemo } from 'react';

// Confete pixel que cai pela tela (só na aprovação)
export default function ConfetePixel() {
  const pecas = useMemo(() => {
    const cores = ['#fbbf24', '#34d399', '#818cf8', '#f87171', '#f0abfc', '#38bdf8'];
    return Array.from({ length: 36 }, (_, i) => ({
      id: i,
      esquerda: Math.random() * 100,
      atraso: Math.random() * 1.2,
      duracao: 2.4 + Math.random() * 2,
      deriva: (Math.random() - 0.5) * 120,
      tamanho: 6 + Math.floor(Math.random() * 6),
      cor: cores[i % cores.length],
    }));
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {pecas.map((p) => (
        <span
          key={p.id}
          className="anim-confete absolute top-0 block"
          style={{
            left: `${p.esquerda}%`,
            width: p.tamanho,
            height: p.tamanho,
            backgroundColor: p.cor,
            animationDelay: `${p.atraso}s`,
            '--dur': `${p.duracao}s`,
            '--dx': `${p.deriva}px`,
          }}
        />
      ))}
    </div>
  );
}
