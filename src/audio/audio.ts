// Áudio 100% sintetizado: efeitos, ambiência e trilha procedural.
import { rng } from '../core/util';

let ac: AudioContext | null = null;
let master: GainNode, sfxBus: GainNode, musicBus: GainNode, ambBus: GainNode, reverb: ConvolverNode;
let noiseBuf: AudioBuffer;
let sfxVol = 0.7, musicVol = 0.5;

function ensure() {
  if (ac) return ac;
  try { ac = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { return null; }
  master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
  sfxBus = ac.createGain(); sfxBus.gain.value = sfxVol; sfxBus.connect(master);
  musicBus = ac.createGain(); musicBus.gain.value = musicVol * 0.55; musicBus.connect(master);
  ambBus = ac.createGain(); ambBus.gain.value = sfxVol * 0.5; ambBus.connect(master);
  // reverb simples
  reverb = ac.createConvolver();
  const len = ac.sampleRate * 2.2, ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  reverb.buffer = ir;
  const rg = ac.createGain(); rg.gain.value = 0.35; reverb.connect(rg); rg.connect(master);
  noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  return ac;
}

export function unlockAudio() { const a = ensure(); if (a && a.state === 'suspended') a.resume(); }
export function setVolumes(music: number, sfx: number) {
  musicVol = music; sfxVol = sfx;
  if (!ac) return;
  musicBus.gain.value = music * 0.55; sfxBus.gain.value = sfx; ambBus.gain.value = sfx * 0.5;
}

function tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.2, slide = 0, when = 0, bus?: AudioNode, attack = 0.005) {
  const a = ensure(); if (!a) return;
  const t = a.currentTime + when;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(bus || sfxBus); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur: number, vol = 0.2, filterFreq = 2000, type: BiquadFilterType = 'lowpass', when = 0, bus?: AudioNode, q = 1) {
  const a = ensure(); if (!a) return;
  const t = a.currentTime + when;
  const s = a.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const f = a.createBiquadFilter(); f.type = type; f.frequency.value = filterFreq; f.Q.value = q;
  const g = a.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(bus || sfxBus); s.start(t, Math.random()); s.stop(t + dur + 0.05);
}

export const SFX: Record<string, () => void> = {
  chop: () => { noise(0.12, 0.35, 900); tone(140, 0.12, 'triangle', 0.25, -60); },
  pick: () => { noise(0.08, 0.3, 3500, 'bandpass'); tone(520, 0.06, 'square', 0.08, -200); },
  stoneBreak: () => { noise(0.25, 0.4, 1800); tone(90, 0.2, 'triangle', 0.3, -40); },
  till: () => { noise(0.1, 0.25, 600); },
  water: () => { noise(0.35, 0.18, 1400, 'bandpass', 0, undefined, 3); },
  scythe: () => { noise(0.08, 0.2, 5000, 'highpass'); },
  coin: () => { tone(988, 0.08, 'square', 0.1); tone(1319, 0.2, 'square', 0.1, 0, 0.07); },
  pickup: () => { tone(660, 0.06, 'triangle', 0.18); tone(880, 0.08, 'triangle', 0.15, 0, 0.05); },
  splash: () => { noise(0.4, 0.3, 1200, 'bandpass', 0, undefined, 1.5); },
  cast: () => { noise(0.18, 0.12, 4000, 'highpass'); tone(400, 0.2, 'sine', 0.05, 300); },
  bite: () => { tone(880, 0.06, 'square', 0.16); tone(1175, 0.1, 'square', 0.16, 0, 0.08); },
  reel: () => { tone(300 + Math.random() * 60, 0.03, 'square', 0.04); },
  catch: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.16, 0, i * 0.08)); },
  fail: () => { tone(330, 0.2, 'triangle', 0.15, -120); tone(220, 0.3, 'triangle', 0.15, -60, 0.15); },
  hit: () => { noise(0.08, 0.3, 2500); tone(200, 0.08, 'square', 0.12, -100); },
  hurt: () => { tone(260, 0.15, 'sawtooth', 0.15, -140); },
  kill: () => { noise(0.25, 0.25, 1600); tone(400, 0.25, 'square', 0.1, -300); },
  swing: () => { noise(0.1, 0.12, 3000, 'bandpass', 0, undefined, 0.6); },
  menu: () => { tone(740, 0.04, 'square', 0.06); },
  open: () => { tone(523, 0.06, 'triangle', 0.12); tone(784, 0.08, 'triangle', 0.12, 0, 0.05); },
  close: () => { tone(784, 0.06, 'triangle', 0.1); tone(523, 0.08, 'triangle', 0.1, 0, 0.05); },
  step: () => { noise(0.04, 0.05, 700); },
  stepWood: () => { tone(120, 0.04, 'triangle', 0.06); },
  door: () => { noise(0.15, 0.15, 500); tone(180, 0.1, 'triangle', 0.1); },
  cluck: () => { tone(700, 0.05, 'square', 0.08, 300); tone(600, 0.06, 'square', 0.08, 200, 0.08); },
  moo: () => { tone(140, 0.6, 'sawtooth', 0.08, 30, 0, undefined, 0.1); },
  quack: () => { tone(500, 0.1, 'sawtooth', 0.08, -150); },
  baa: () => { tone(320, 0.4, 'sawtooth', 0.06, 20, 0, undefined, 0.05); },
  bleat: () => { tone(420, 0.3, 'sawtooth', 0.06, -40, 0, undefined, 0.05); },
  levelup: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.25, 'square', 0.08, 0, i * 0.09)); },
  quest: () => { [784, 988, 1175].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, 0, i * 0.1)); },
  treeFall: () => { noise(0.9, 0.35, 500); tone(80, 0.6, 'triangle', 0.3, -30, 0.2); },
  eat: () => { for (let i = 0; i < 3; i++) noise(0.05, 0.15, 1200, 'bandpass', i * 0.12); },
  craft: () => { tone(392, 0.07, 'square', 0.1); tone(523, 0.07, 'square', 0.1, 0, 0.07); tone(659, 0.12, 'square', 0.1, 0, 0.14); },
  ship: () => { noise(0.15, 0.2, 800); tone(330, 0.1, 'triangle', 0.1, 0, 0.05); },
  warp: () => { tone(300, 0.12, 'sine', 0.05, 200); },
  thunder: () => { noise(2.5, 0.5, 300); },
  harvest: () => { tone(587, 0.07, 'triangle', 0.16); tone(880, 0.1, 'triangle', 0.14, 0, 0.06); },
  error: () => { tone(160, 0.15, 'square', 0.1); },
  heart: () => { tone(880, 0.1, 'sine', 0.15); tone(1175, 0.2, 'sine', 0.15, 0, 0.1); },
  place: () => { tone(220, 0.06, 'triangle', 0.2); noise(0.05, 0.1, 900); },
  ladder: () => { [400, 350, 300, 250].forEach((f, i) => tone(f, 0.06, 'triangle', 0.1, 0, i * 0.07)); },
  machine: () => { tone(260, 0.05, 'square', 0.06); tone(330, 0.05, 'square', 0.06, 0, 0.06); },
  pet: () => { tone(660, 0.1, 'sine', 0.12, 120); },
  sleep: () => { [523, 392, 330, 262].forEach((f, i) => tone(f, 0.4, 'sine', 0.1, 0, i * 0.25, musicBus)); },
};
export function sfx(name: string) { try { SFX[name]?.(); } catch { /* sem áudio */ } }

// ---------------- AMBIÊNCIA ----------------
interface Loop { src: AudioBufferSourceNode; gain: GainNode }
const loops: Record<string, Loop> = {};
function startLoop(name: string, vol: number, freq: number, type: BiquadFilterType, q = 1) {
  const a = ensure(); if (!a) return;
  if (loops[name]) { loops[name].gain.gain.setTargetAtTime(vol, a.currentTime, 0.5); return; }
  const s = a.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = a.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(vol, a.currentTime, 0.8);
  s.connect(f); f.connect(g); g.connect(ambBus); s.start();
  loops[name] = { src: s, gain: g };
}
function stopLoop(name: string) {
  const l = loops[name]; if (!l || !ac) return;
  l.gain.gain.setTargetAtTime(0, ac.currentTime, 0.5);
  setTimeout(() => { try { l.src.stop(); } catch { } }, 2500);
  delete loops[name];
}
let ambTimer = 0;
export function updateAmbience(dt: number, env: { rain: boolean; storm: boolean; ocean: boolean; night: boolean; season: number; outdoor: boolean; mine: boolean; wind: boolean }) {
  if (!ac) return;
  if (env.rain && env.outdoor) startLoop('rain', env.storm ? 0.32 : 0.2, 2200, 'lowpass'); else stopLoop('rain');
  if (env.ocean && env.outdoor) startLoop('ocean', 0.12 + Math.sin(performance.now() / 2600) * 0.06, 500, 'lowpass'); else stopLoop('ocean');
  if (env.wind && env.outdoor) startLoop('wind', 0.06, 400, 'bandpass', 0.6); else stopLoop('wind');
  ambTimer -= dt;
  if (ambTimer <= 0) {
    ambTimer = 1.5 + Math.random() * 4;
    if (env.outdoor && !env.rain && !env.night && env.season < 3 && Math.random() < 0.6) { const f = 2400 + Math.random() * 1600; for (let i = 0; i < 3 + Math.random() * 3; i++) tone(f + Math.random() * 400, 0.05, 'sine', 0.025, 600, i * 0.09, ambBus); }
    if (env.outdoor && env.night && (env.season === 1 || env.season === 2)) for (let i = 0; i < 6; i++) tone(4200, 0.03, 'square', 0.008, 0, i * 0.06, ambBus);
    if (env.outdoor && !env.night && env.season === 1 && Math.random() < 0.4) noise(1.4, 0.03, 5500, 'bandpass', 0, ambBus, 8);
    if (env.mine && Math.random() < 0.5) tone(1200 + Math.random() * 800, 0.15, 'sine', 0.03, -400, 0, ambBus);
  }
}
export function thunderClap() { sfx('thunder'); }

// ---------------- MÚSICA ----------------
const SCALES: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11], lydian: [0, 2, 4, 6, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10], minor: [0, 2, 3, 5, 7, 8, 10], penta: [0, 2, 4, 7, 9], minpenta: [0, 3, 5, 7, 10], mixo: [0, 2, 4, 5, 7, 9, 10],
};
interface Track { root: number; scale: string; bpm: number; lead: OscillatorType; prog: number[]; seed: number; bells?: boolean; sparse?: number; vol?: number }
const TRACKS: Record<string, Track> = {
  'fazenda0': { root: 60, scale: 'major', bpm: 96, lead: 'triangle', prog: [0, 3, 4, 0, 5, 3, 1, 4], seed: 11 },
  'fazenda1': { root: 62, scale: 'mixo', bpm: 104, lead: 'square', prog: [0, 6, 3, 0, 0, 6, 4, 4], seed: 12, vol: 0.6 },
  'fazenda2': { root: 57, scale: 'dorian', bpm: 84, lead: 'triangle', prog: [0, 3, 6, 4, 0, 3, 4, 0], seed: 13 },
  'fazenda3': { root: 64, scale: 'minor', bpm: 70, lead: 'sine', prog: [0, 5, 3, 6, 0, 5, 4, 4], seed: 14, bells: true, sparse: 0.4 },
  vila: { root: 65, scale: 'major', bpm: 108, lead: 'square', prog: [0, 4, 5, 3, 0, 4, 3, 4], seed: 21, vol: 0.55 },
  floresta: { root: 62, scale: 'dorian', bpm: 80, lead: 'triangle', prog: [0, 6, 3, 4], seed: 31, sparse: 0.3 },
  praia: { root: 67, scale: 'lydian', bpm: 92, lead: 'triangle', prog: [0, 1, 4, 3], seed: 41 },
  montanha: { root: 55, scale: 'mixo', bpm: 88, lead: 'triangle', prog: [0, 6, 0, 4], seed: 51 },
  mina: { root: 45, scale: 'minor', bpm: 66, lead: 'sine', prog: [0, 5, 0, 6], seed: 61, bells: true, sparse: 0.55 },
  taverna: { root: 62, scale: 'mixo', bpm: 128, lead: 'square', prog: [0, 3, 4, 0, 0, 3, 4, 4], seed: 71, vol: 0.55 },
  casa: { root: 60, scale: 'penta', bpm: 72, lead: 'sine', prog: [0, 3, 1, 4], seed: 81, sparse: 0.4, bells: true },
  loja: { root: 64, scale: 'major', bpm: 100, lead: 'triangle', prog: [0, 3, 4, 3], seed: 91 },
  biblioteca: { root: 57, scale: 'minor', bpm: 76, lead: 'sine', prog: [0, 3, 4, 2], seed: 101, sparse: 0.3, bells: true },
  hall: { root: 59, scale: 'lydian', bpm: 64, lead: 'sine', prog: [0, 2, 4, 1], seed: 111, bells: true, sparse: 0.35 },
  enseada: { root: 66, scale: 'lydian', bpm: 70, lead: 'sine', prog: [0, 4, 1, 5], seed: 121, bells: true },
  selma: { root: 52, scale: 'dorian', bpm: 68, lead: 'sine', prog: [0, 1, 0, 6], seed: 131, bells: true, sparse: 0.4 },
  festival: { root: 65, scale: 'major', bpm: 120, lead: 'square', prog: [0, 3, 4, 4, 0, 3, 4, 0], seed: 141, vol: 0.6 },
};

let curTrack = '';
let nextBarTime = 0, bar = 0, songBars = 16, silentUntil = 0;
let musicOn = true;
export function setMusic(name: string, season: number, force = false) {
  let key = name === 'fazenda' ? 'fazenda' + season : name;
  if (!TRACKS[key]) key = 'fazenda' + season;
  if (key === curTrack && !force) return;
  curTrack = key; bar = 0; songBars = 16;
  const a = ensure(); if (!a) return;
  nextBarTime = a.currentTime + 0.6;
  silentUntil = 0;
}
export function stopMusic() { curTrack = ''; }
export function musicEnabled(on: boolean) { musicOn = on; }

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
function degree(t: Track, d: number, oct = 0) { const sc = SCALES[t.scale]; const n = sc.length; const o = Math.floor(d / n); return t.root + sc[((d % n) + n) % n] + 12 * (o + oct); }

export function updateMusic() {
  const a = ac; if (!a || !curTrack || !musicOn) return;
  const t = TRACKS[curTrack];
  const beat = 60 / t.bpm;
  while (nextBarTime < a.currentTime + 0.3) {
    if (silentUntil > 0) { if (a.currentTime < silentUntil) { nextBarTime = silentUntil; return; } silentUntil = 0; bar = 0; }
    if (bar >= songBars) { silentUntil = a.currentTime + 18 + Math.random() * 25; nextBarTime = silentUntil; return; }
    const R = rng(t.seed * 1000 + (bar % 8) * 7 + Math.floor(bar / 8) * 3);
    const chord = t.prog[bar % t.prog.length];
    const vol = (t.vol ?? 1) * 0.11;
    // baixo
    tone(mtof(degree(t, chord, -2)), beat * 1.8, 'sine', vol * 1.4, 0, nextBarTime - a.currentTime, musicBus, 0.02);
    tone(mtof(degree(t, chord + 4, -2)), beat * 1.8, 'sine', vol * 1.0, 0, nextBarTime - a.currentTime + beat * 2, musicBus, 0.02);
    // pad
    for (const k of [0, 2, 4]) tone(mtof(degree(t, chord + k, -1)), beat * 3.8, 'sine', vol * 0.35, 0, nextBarTime - a.currentTime, musicBus, 0.3);
    // melodia
    let pos = 0;
    while (pos < 4) {
      const len = R() < 0.5 ? 0.5 : R() < 0.7 ? 1 : 1.5;
      if (R() > (t.sparse ?? 0.15)) {
        const d = chord + [0, 2, 4, 1, 3, 5, 7][Math.floor(R() * 7)];
        const when = nextBarTime - a.currentTime + pos * beat;
        tone(mtof(degree(t, d, 0)), beat * len * 0.9, t.lead, vol * (t.lead === 'square' ? 0.45 : 0.9), 0, when, musicBus, 0.01);
        if (t.bells && R() < 0.4) tone(mtof(degree(t, d, 1)), beat * 1.5, 'sine', vol * 0.4, 0, when, reverb, 0.002);
      }
      pos += len;
    }
    nextBarTime += beat * 4;
    bar++;
  }
}
