// Background music engine. Plays through Web Audio (decoded AudioBufferSourceNode) instead of an
// <audio> element, so the browser never registers the page as a media session: keyboard media keys
// and OS "Now Playing" controls neither pause nor control the game music.

const bufferCache = new Map<string, Promise<AudioBuffer>>();

let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
let source: AudioBufferSourceNode | null = null;
let loadToken = 0;
let volume = 0.5;
let endedHandler: (() => void) | null = null;

const getCtx = (): AudioContext | null => {
  if (ctx) return ctx;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  gain = ctx.createGain();
  gain.gain.value = volume;
  gain.connect(ctx.destination);
  return ctx;
};

const loadBuffer = (url: string, audioCtx: AudioContext): Promise<AudioBuffer> => {
  let p = bufferCache.get(url);
  if (!p) {
    p = fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.arrayBuffer();
      })
      .then(data => audioCtx.decodeAudioData(data));
    p.catch(() => bufferCache.delete(url));
    bufferCache.set(url, p);
  }
  return p;
};

const stopSource = () => {
  if (source) {
    source.onended = null;
    try { source.stop(); } catch { /* already stopped */ }
    source.disconnect();
    source = null;
  }
};

export const musicPlayer = {
  /** Called when a track finishes naturally. */
  onEnded(handler: (() => void) | null) { endedHandler = handler; },

  async play(url: string): Promise<void> {
    const audioCtx = getCtx();
    if (!audioCtx || !gain) throw new Error('Web Audio unavailable');
    const token = ++loadToken;
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    const buffer = await loadBuffer(url, audioCtx);
    if (token !== loadToken) return; // superseded by a newer play()
    stopSource();
    const node = audioCtx.createBufferSource();
    node.buffer = buffer;
    node.connect(gain);
    node.onended = () => {
      if (source === node) {
        source = null;
        endedHandler?.();
      }
    };
    node.start();
    source = node;
  },

  /** Pause keeps the playback position (the whole context is suspended). */
  async pause(): Promise<void> {
    if (ctx && ctx.state === 'running') await ctx.suspend();
  },

  async resume(): Promise<void> {
    if (ctx && ctx.state === 'suspended') await ctx.resume();
  },

  hasSource: () => source !== null,
  isRunning: () => !!ctx && ctx.state === 'running' && source !== null,

  getVolume: () => volume,
  setVolume(v: number) {
    volume = Math.max(0, Math.min(1, v));
    if (gain) gain.gain.value = volume;
  },
};
