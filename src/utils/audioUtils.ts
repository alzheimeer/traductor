/**
 * Helper utilities for raw PCM Web Audio API processing and gapless playback.
 */

// Convert Float32Array (-1.0 to 1.0) to 16-bit PCM Little Endian Uint8Array, with downsampling to 16000Hz
export function float32ToPcm16Resampled(
  float32Array: Float32Array,
  fromSampleRate: number,
  toSampleRate = 16000
): Uint8Array {
  let samples = float32Array;

  if (fromSampleRate && fromSampleRate !== toSampleRate && fromSampleRate > 8000) {
    const ratio = fromSampleRate / toSampleRate;
    const newLength = Math.floor(float32Array.length / ratio);
    const resampled = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const origIndex = i * ratio;
      const index1 = Math.floor(origIndex);
      const index2 = Math.min(index1 + 1, float32Array.length - 1);
      const interpolation = origIndex - index1;
      resampled[i] = float32Array[index1] * (1 - interpolation) + float32Array[index2] * interpolation;
    }
    samples = resampled;
  }

  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Uint8Array(buffer);
}

// Convert Float32Array (-1.0 to 1.0) to 16-bit PCM Little Endian Uint8Array
export function float32ToPcm16(float32Array: Float32Array): Uint8Array {
  return float32ToPcm16Resampled(float32Array, 16000, 16000);
}

// Convert Uint8Array to Base64
export function uint8ToBase64(uint8: Uint8Array): string {
  let binary = '';
  const len = uint8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

// Convert Base64 string to Float32Array (assuming 16-bit PCM Little Endian)
export function base64Pcm16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const dataView = new DataView(bytes.buffer);
  const sampleCount = len / 2;
  const float32 = new Float32Array(sampleCount);

  for (let i = 0; i < sampleCount; i++) {
    const int16 = dataView.getInt16(i * 2, true);
    float32[i] = int16 < 0 ? int16 / 0x8000 : int16 / 0x7fff;
  }

  return float32;
}

// Calculate RMS audio level (0 to 100)
export function calculateAudioLevel(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(sum / buffer.length);
  // Scale to 0-100 with logarithmic curve
  const db = 20 * Math.log10(Math.max(rms, 0.0001));
  const minDb = -60;
  const maxDb = 0;
  const scaled = Math.max(0, Math.min(100, ((db - minDb) / (maxDb - minDb)) * 100));
  return Math.round(scaled);
}

/**
 * AudioQueuePlayer manages smooth gapless playback of PCM audio chunks from Gemini.
 */
export class AudioQueuePlayer {
  private audioCtx: AudioContext | null = null;
  private nextStartTime = 0;
  private sampleRate: number;
  private volumeNode: GainNode | null = null;
  private outputDeviceId: string = '';

  constructor(sampleRate = 24000) {
    this.sampleRate = sampleRate;
  }

  private async initCtx() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ sampleRate: this.sampleRate });
      this.volumeNode = this.audioCtx.createGain();
      this.volumeNode.connect(this.audioCtx.destination);

      if (this.outputDeviceId && (this.audioCtx as any).setSinkId) {
        try {
          await (this.audioCtx as any).setSinkId(this.outputDeviceId);
        } catch (err) {
          console.warn('Could not set sink ID on AudioContext:', err);
        }
      }
    }
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
  }

  public async setOutputDevice(deviceId: string) {
    this.outputDeviceId = deviceId;
    if (this.audioCtx && (this.audioCtx as any).setSinkId && deviceId) {
      try {
        await (this.audioCtx as any).setSinkId(deviceId);
      } catch (err) {
        console.warn('Error setting output device:', err);
      }
    }
  }

  public setVolume(volume: number) {
    if (this.volumeNode) {
      this.volumeNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  public async playChunk(base64Pcm: string, sampleRate = 24000) {
    try {
      await this.initCtx();
      if (!this.audioCtx || !this.volumeNode) return;

      if (sampleRate !== this.sampleRate) {
        this.sampleRate = sampleRate;
      }

      const float32Data = base64Pcm16ToFloat32(base64Pcm);
      if (float32Data.length === 0) return;

      const audioBuffer = this.audioCtx.createBuffer(1, float32Data.length, sampleRate);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.volumeNode);

      const currentTime = this.audioCtx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime + 0.02; // Small buffer delay
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
    } catch (err) {
      console.error('Error playing audio chunk:', err);
    }
  }

  public stop() {
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
      this.nextStartTime = 0;
    }
  }
}
