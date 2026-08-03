export type ChannelStatus = 'idle' | 'connecting' | 'active' | 'error' | 'paused';

export interface AppSettings {
  systemTargetLanguage: string; // e.g., 'es' (audio from PC translated to Spanish voice)
  userTargetLanguage: string;   // e.g., 'en' (audio from mic translated to English voice)
  systemVoiceName: 'Fenrir' | 'Kore' | 'Puck' | 'Charon' | 'Zephyr';
  userVoiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  selectedMicDeviceId: string; // Specific microphone device ID
  selectedOutputDeviceId: string; // Specific speaker for System Audio
  selectedMicOutputDeviceId: string; // Specific virtual cable for Mic Audio
  systemOutputVolume: number; // 0 to 1
  micOutputVolume: number;    // 0 to 1
  echoCancellation: boolean;
  noiseSuppression: boolean;
}

export interface AudioTranslationEvent {
  id: string;
  timestamp: string;
  channel: LiveMode;
  durationMs: number;
  targetLanguage: string;
  voiceName: string;
  text?: string;
}

export interface AudioStats {
  systemVolume: number; // 0 - 100
  micVolume: number;    // 0 - 100
  systemOutVolume: number; // 0 - 100
  micOutVolume: number;    // 0 - 100
  latencyMs: number;
  totalAudioPlayedCount: number;
}

export type LiveMode = 'system_audio' | 'user_mic';

export interface WsIncomingMessage {
  type: 'audio' | 'status' | 'error';
  channel: LiveMode;
  audioBase64?: string; // PCM 24kHz base64
  text?: string;
  sampleRate?: number;
  voiceName?: string;
  message?: string;
  timestamp?: string;
}
