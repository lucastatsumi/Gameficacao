// Avatar pixel-art gerado por CSS/SVG (nenhum arquivo de arte novo) —
// muda de cor e ganha acessórios conforme o nível do jogador. Substitui o
// ícone genérico de "gamepad" no Perfil/Ranking por algo que evolui com a
// progressão, sem depender de sprites desenhados à mão.
//
// Faixas espelham backend/src/utils/titulo.js (FAIXAS_NIVEL) — mantenha as
// duas em sincronia se uma mudar.
const FAIXAS = [
  { min: 1, max: 2, titulo: 'Aprendiz', pele: '#94a3b8', acento: '#475569' }, // slate
  { min: 3, max: 5, titulo: 'Aventureiro', pele: '#818cf8', acento: '#4338ca' }, // indigo
  { min: 6, max: 9, titulo: 'Especialista', pele: '#a78bfa', acento: '#6d28d9' }, // violet
  { min: 10, max: Infinity, titulo: 'Lenda', pele: '#fbbf24', acento: '#b45309' }, // amber
];

function faixaPorNivel(nivel) {
  return FAIXAS.find((f) => nivel >= f.min && nivel <= f.max) ?? FAIXAS[0];
}

// Grade 8x8 do rosto (1 = pinta com a cor de "pele"/base do personagem)
const ROSTO = [
  '01111110',
  '11111111',
  '11011011',
  '11111111',
  '11100111',
  '11111111',
  '10111101',
  '01111110',
];

// `paleta` (opcional, vinda da loja: { pele, acento }) sobrepõe as cores
// da faixa de nível — os acessórios por nível continuam os mesmos.
export default function AvatarPixel({ nivel = 1, paleta = null, className = 'h-14 w-14' }) {
  const faixaBase = faixaPorNivel(nivel);
  const faixa = paleta?.pele
    ? { ...faixaBase, pele: paleta.pele, acento: paleta.acento ?? faixaBase.acento }
    : faixaBase;
  const tam = 8;
  const px = 100 / tam;

  const quadrados = [];
  ROSTO.forEach((linha, y) => {
    [...linha].forEach((bit, x) => {
      if (bit === '1') {
        quadrados.push(
          <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={faixa.pele} />
        );
      }
    });
  });

  // olhos sempre na cor de acento, por cima do rosto
  const olhos = [
    [2, 2],
    [5, 2],
  ].map(([x, y]) => (
    <rect key={`olho-${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={faixa.acento} />
  ));

  // acessórios cumulativos por faixa: aventureiro+ ganha bandana,
  // especialista+ ganha ombreiras, lenda ganha coroa
  const acessorios = [];
  const indiceFaixa = FAIXAS.indexOf(faixaBase);
  if (indiceFaixa >= 1) {
    // bandana: linha logo acima dos olhos
    for (let x = 1; x < 7; x++) {
      acessorios.push(
        <rect key={`bandana-${x}`} x={x * px} y={0.5 * px} width={px} height={px * 0.6} fill={faixa.acento} />
      );
    }
  }
  if (indiceFaixa >= 2) {
    // ombreiras: cantos inferiores
    acessorios.push(
      <rect key="ombro-e" x={-px * 0.3} y={5.5 * px} width={px * 1} height={px * 1.2} fill={faixa.acento} />,
      <rect key="ombro-d" x={7.3 * px} y={5.5 * px} width={px * 1} height={px * 1.2} fill={faixa.acento} />
    );
  }
  if (indiceFaixa >= 3) {
    // coroa: 3 picos no topo
    for (const x of [1, 3.5, 6]) {
      acessorios.push(
        <polygon
          key={`coroa-${x}`}
          points={`${x * px},${-0.2 * px} ${(x + 1) * px},${-1.4 * px} ${(x + 2) * px},${-0.2 * px}`}
          fill="#facc15"
        />
      );
    }
  }

  return (
    <svg
      viewBox="-15 -15 130 130"
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Avatar — nível ${nivel}, ${faixa.titulo}`}
    >
      {quadrados}
      {olhos}
      {acessorios}
    </svg>
  );
}
