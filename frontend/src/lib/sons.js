// Efeitos sonoros 8-bit sintetizados com a Web Audio API — sem arquivos
// de áudio nem dependências. Ondas quadradas/triangulares curtas, no
// espírito dos consoles antigos. O navegador exige um gesto do usuário
// antes de tocar som; como tudo aqui responde a cliques, está coberto.

let ctx = null;
let mudo = localStorage.getItem('dataquest-mudo') === '1';

function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function somLigado() {
  return !mudo;
}

export function alternarSom() {
  mudo = !mudo;
  localStorage.setItem('dataquest-mudo', mudo ? '1' : '0');
  return !mudo;
}

// Toca uma nota: frequência (Hz), atraso e duração (s)
function nota(freq, atraso, duracao, { tipo = 'square', volume = 0.12 } = {}) {
  const c = audio();
  const inicio = c.currentTime + atraso;
  const osc = c.createOscillator();
  const ganho = c.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, inicio);
  ganho.gain.setValueAtTime(volume, inicio);
  ganho.gain.exponentialRampToValueAtTime(0.001, inicio + duracao);
  osc.connect(ganho);
  ganho.connect(c.destination);
  osc.start(inicio);
  osc.stop(inicio + duracao);
}

// Clique de seleção (blip curto)
export function tocarClique() {
  if (mudo) return;
  nota(880, 0, 0.06, { volume: 0.07 });
}

// Acerto: arpejo maior ascendente (dó-mi-sol)
export function tocarAcerto() {
  if (mudo) return;
  nota(523.25, 0, 0.1);
  nota(659.25, 0.09, 0.1);
  nota(783.99, 0.18, 0.16);
}

// Erro: "buzz" grave descendente
export function tocarErro() {
  if (mudo) return;
  nota(196, 0, 0.18, { tipo: 'sawtooth', volume: 0.1 });
  nota(146.83, 0.14, 0.3, { tipo: 'sawtooth', volume: 0.1 });
}

// Tick do timer nos segundos finais
export function tocarTick() {
  if (mudo) return;
  nota(1320, 0, 0.04, { tipo: 'triangle', volume: 0.06 });
}

// Fanfarra de vitória (fase concluída)
export function tocarVitoria() {
  if (mudo) return;
  const melodia = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
  melodia.forEach((f, i) => nota(f, i * 0.12, 0.16));
  nota(1318.51, 0.72, 0.4);
}

// Derrota: descida melancólica
export function tocarDerrota() {
  if (mudo) return;
  const melodia = [392, 329.63, 261.63, 196];
  melodia.forEach((f, i) => nota(f, i * 0.16, 0.22, { tipo: 'triangle' }));
}

// Badge nova: brilho agudo
export function tocarBadge() {
  if (mudo) return;
  nota(1046.5, 0, 0.08);
  nota(1318.51, 0.08, 0.08);
  nota(1567.98, 0.16, 0.2);
}
