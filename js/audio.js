// Sistema de áudio com síntese Web Audio e fallback gracioso

let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioContext = new AC();
    } catch (e) {
      console.warn('Web Audio API não disponível');
      return null;
    }
  }
  if (audioContext.state === 'suspended') {
    document.addEventListener('click', () => audioContext?.resume(), { once: true });
  }
  return audioContext;
}

function play(freq, duration, type = 'sine', volume = 0.1) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function soundSell() {
  // Venda: sequência ascendente positiva
  play(523.25, 0.1, 'sine', 0.15); // C5
  setTimeout(() => play(659.25, 0.1, 'sine', 0.15), 60); // E5
  setTimeout(() => play(783.99, 0.15, 'sine', 0.2), 120); // G5
}

export function soundRefuse() {
  // Recusa: som grave descendente
  play(196, 0.15, 'sine', 0.12); // G3
  setTimeout(() => play(130.81, 0.2, 'sine', 0.12), 80); // C3
}

export function soundHaggle() {
  // Negociação: oscilação rápida
  play(440, 0.08, 'sine', 0.1); // A4
  setTimeout(() => play(330, 0.08, 'sine', 0.1), 100); // E4
  setTimeout(() => play(440, 0.08, 'sine', 0.1), 200); // A4
}

export function soundAgiota() {
  // Agiota: som ameaçador grave
  play(110, 0.3, 'sawtooth', 0.2); // A2
}

export function soundPrimo() {
  // Primo: som alegre
  play(587.33, 0.1, 'sine', 0.15); // D5
  setTimeout(() => play(783.99, 0.1, 'sine', 0.15), 80); // G5
  setTimeout(() => play(587.33, 0.1, 'sine', 0.15), 160); // D5
}

export function soundRapa() {
  // Rapa: som urgente, batida
  play(330, 0.08, 'square', 0.15); // E4
  setTimeout(() => play(220, 0.08, 'square', 0.15), 100); // A3
  setTimeout(() => play(330, 0.08, 'square', 0.15), 200); // E4
}

export function soundGameOver() {
  // Game Over: descida melancólica
  play(329.63, 0.15, 'sine', 0.15); // E4
  setTimeout(() => play(293.66, 0.15, 'sine', 0.15), 150); // D4
  setTimeout(() => play(246.94, 0.15, 'sine', 0.15), 300); // B3
  setTimeout(() => play(196, 0.3, 'sine', 0.2), 450); // G3
}

export function soundTick() {
  // Tick silencioso: confirmação suave
  play(880, 0.05, 'sine', 0.08); // A5
}
