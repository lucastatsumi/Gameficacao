// PRNG determinístico (mulberry32 + hash FNV-1a da seed): mesma seed →
// mesma sequência, em qualquer processo. Usado onde o sorteio precisa ser
// reprodutível — missões do dia por jogador e desafio diário por data —
// diferente de utils/random.js (Math.random), que segue sendo o sorteio
// "de verdade" dos quizzes normais.
export function criarPrng(seedTexto) {
  let h = 0x811c9dc5;
  for (const ch of String(seedTexto)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193);
  }
  let a = h >>> 0;
  return function prng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates com PRNG injetado — não muta o array original.
export function embaralharComSeed(array, prng) {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
