// Tiny procedural WebAudio sounds
let ctx = null;

function getContext() {
  if (!ctx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) ctx = new AudioContext();
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

export const audio = {
  playGunshot(type = 'rifle') {
    const ac = getContext();
    if (!ac) return;
    const now = ac.currentTime;
    
    // Noise buffer for gunshot blast
    const bufferSize = ac.sampleRate * 0.15;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ac.sampleRate * 0.04));
    }
    
    const noise = ac.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'pistol' ? 1800 : type === 'dmr' ? 1200 : 1500, now);
    
    const gain = ac.createGain();
    gain.gain.setValueAtTime(type === 'dmr' ? 0.8 : 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    
    noise.start(now);
    noise.stop(now + 0.15);
  },

  playReload() {
    const ac = getContext();
    if (!ac) return;
    const now = ac.currentTime;
    
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  },

  playHit(killed) {
    const ac = getContext();
    if (!ac) return;
    const now = ac.currentTime;
    
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(killed ? 880 : 440, now);
    osc.frequency.exponentialRampToValueAtTime(killed ? 440 : 220, now + 0.08);
    
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
    
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  },

  playFootstep() {
    const ac = getContext();
    if (!ac) return;
    const now = ac.currentTime;
    
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.05);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
    
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  },

  playExplosion() {
    const ac = getContext();
    if (!ac) return;
    const now = ac.currentTime;
    
    const bufferSize = ac.sampleRate * 0.8;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ac.sampleRate * 0.2));
    }
    
    const noise = ac.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    
    noise.start(now);
    noise.stop(now + 0.8);
  }
};
