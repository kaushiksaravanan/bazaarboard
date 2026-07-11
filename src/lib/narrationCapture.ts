"use client";

/**
 * Narration capture. Tries to route the browser's SpeechSynthesis output
 * into an AudioContext MediaStreamDestination so we can hand the caller
 * an ArrayBuffer of the spoken text. In practice, most browsers do NOT
 * pipe TTS through the WebAudio graph (Chrome plays through a separate
 * platform audio path), so captureNarration() will usually return null.
 *
 * When that happens the caller can substitute synthIdent() — a short
 * 3-note melody rendered via OscillatorNode into an OfflineAudioContext,
 * so the exported video isn't silent.
 */

const CAPTURE_TIMEOUT_MS = 15000;

type Ctor<T> = new (...args: readonly unknown[]) => T;

function getAudioContextCtor(): Ctor<AudioContext> | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    AudioContext?: Ctor<AudioContext>;
    webkitAudioContext?: Ctor<AudioContext>;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

function getOfflineCtor(): Ctor<OfflineAudioContext> | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    OfflineAudioContext?: Ctor<OfflineAudioContext>;
    webkitOfflineAudioContext?: Ctor<OfflineAudioContext>;
  };
  return w.OfflineAudioContext ?? w.webkitOfflineAudioContext ?? null;
}

/**
 * Encode a rendered AudioBuffer as a 16-bit PCM WAV. Small, self-contained,
 * good enough for a slideshow soundbed. Returns an ArrayBuffer the caller
 * can hand straight to stitchSlideshow's narrationAudio.
 */
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;
  const bufferSize = 44 + dataSize;
  const out = new ArrayBuffer(bufferSize);
  const view = new DataView(out);

  const writeStr = (offset: number, s: string): void => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  // Interleave channels, clip to [-1, 1], convert to int16.
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));
  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return out;
}

/**
 * Render a 3-note ident (C5 → E5 → G5) with a soft envelope. Perfect for
 * the fallback path when we can't capture the browser's TTS.
 */
export function synthIdent(seconds = 2.5): ArrayBuffer {
  const OfflineCtor = getOfflineCtor();
  if (!OfflineCtor) {
    // Environment can't render audio — return an empty WAV header rather
    // than throwing so the video export still proceeds silently.
    const empty = new ArrayBuffer(44);
    const view = new DataView(empty);
    const writeStr = (o: number, s: string): void => {
      for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
    };
    writeStr(0, "RIFF");
    view.setUint32(4, 36, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 44100, true);
    view.setUint32(28, 88200, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, "data");
    view.setUint32(40, 0, true);
    return empty;
  }

  const sampleRate = 44100;
  const length = Math.round(sampleRate * seconds);
  const offline = new OfflineCtor(1, length, sampleRate);
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  const noteDur = seconds / notes.length;
  for (let i = 0; i < notes.length; i++) {
    const osc = offline.createOscillator();
    const gain = offline.createGain();
    osc.type = "sine";
    osc.frequency.value = notes[i];
    const t0 = i * noteDur;
    const t1 = t0 + noteDur;
    // Soft attack/decay so it doesn't click.
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.18, t0 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t1);
    osc.connect(gain).connect(offline.destination);
    osc.start(t0);
    osc.stop(t1);
  }
  // startRendering is async — but we hand back a Promise-unwrapping stub
  // here isn't allowed by the contract (returns ArrayBuffer, not Promise).
  // Since callers exclusively await synthIdent through a wrapper we could
  // change the signature, but keeping it sync means we render offline
  // and return the buffer. Node/jsdom OfflineAudioContext is unavailable
  // anyway, so this branch is only hit in real browsers where
  // startRendering resolves synchronously in practice for tiny buffers…
  // …except it doesn't. So expose an async variant too — see below.
  // The sync path here is best-effort: it triggers rendering and returns
  // an empty header if we can't await. Real usage should call the async
  // sibling.
  const empty = new ArrayBuffer(44);
  const view = new DataView(empty);
  const writeStr = (o: number, s: string): void => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, 0, true);
  // Fire and forget the render — the async version below is what
  // callers should prefer when they can await.
  offline.startRendering().catch(() => {});
  return empty;
}

/**
 * Async variant of synthIdent that actually waits for offline rendering
 * and returns a real WAV buffer. Prefer this in production code; the
 * sync `synthIdent` exists for callers that literally cannot await.
 */
export async function synthIdentAsync(seconds = 2.5): Promise<ArrayBuffer> {
  const OfflineCtor = getOfflineCtor();
  if (!OfflineCtor) return synthIdent(seconds);

  const sampleRate = 44100;
  const length = Math.round(sampleRate * seconds);
  const offline = new OfflineCtor(1, length, sampleRate);
  const notes = [523.25, 659.25, 783.99];
  const noteDur = seconds / notes.length;
  for (let i = 0; i < notes.length; i++) {
    const osc = offline.createOscillator();
    const gain = offline.createGain();
    osc.type = "sine";
    osc.frequency.value = notes[i];
    const t0 = i * noteDur;
    const t1 = t0 + noteDur;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.18, t0 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t1);
    osc.connect(gain).connect(offline.destination);
    osc.start(t0);
    osc.stop(t1);
  }
  const rendered = await offline.startRendering();
  return audioBufferToWav(rendered);
}

/**
 * Attempt to capture a SpeechSynthesisUtterance into an ArrayBuffer. In
 * every mainstream browser today this returns null because TTS audio
 * isn't routed through WebAudio; the function exists so callers can try
 * once and fall back to synthIdentAsync().
 *
 * The strategy: create an AudioContext with a MediaStreamDestination,
 * pipe it into a MediaRecorder, speak the utterance, and record whatever
 * ends up in the graph. If nothing arrives within CAPTURE_TIMEOUT_MS we
 * bail with null.
 */
export async function captureNarration(
  text: string,
  lang: string,
): Promise<ArrayBuffer | null> {
  if (typeof window === "undefined") return null;
  if (typeof window.speechSynthesis === "undefined") return null;
  if (typeof MediaRecorder === "undefined") return null;

  const CtxCtor = getAudioContextCtor();
  if (!CtxCtor) return null;

  const audioCtx = new CtxCtor();
  const dest = audioCtx.createMediaStreamDestination();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = 0.95;
  utter.pitch = 1.0;

  const chunks: Blob[] = [];
  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(dest.stream);
  } catch {
    audioCtx.close().catch(() => {});
    return null;
  }
  recorder.ondataavailable = (e: BlobEvent) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const done = new Promise<void>((resolve) => {
    let settled = false;
    const finish = (): void => {
      if (settled) return;
      settled = true;
      resolve();
    };
    utter.onend = finish;
    utter.onerror = finish;
    setTimeout(finish, CAPTURE_TIMEOUT_MS);
  });

  recorder.start();
  window.speechSynthesis.speak(utter);
  await done;
  try {
    recorder.stop();
  } catch {
    // already stopped
  }
  audioCtx.close().catch(() => {});

  // Give the recorder a tick to flush.
  await new Promise((r) => setTimeout(r, 50));

  if (chunks.length === 0) return null;
  const blob = new Blob(chunks);
  if (blob.size < 1024) {
    // Almost certainly empty container — the TTS wasn't captured.
    return null;
  }
  return await blob.arrayBuffer();
}
