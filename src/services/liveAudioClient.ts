import { AppSettings, AudioTranslationEvent, WsIncomingMessage, LiveMode } from '../types';
import { float32ToPcm16Resampled, uint8ToBase64, calculateAudioLevel, AudioQueuePlayer } from '../utils/audioUtils';

export class LiveAudioClient {
  private ws: WebSocket | null = null;
  private systemAudioCtx: AudioContext | null = null;
  private micAudioCtx: AudioContext | null = null;

  private systemStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;

  private systemProcessor: ScriptProcessorNode | null = null;
  private micProcessor: ScriptProcessorNode | null = null;

  private isSystemActive = false;
  private isMicActive = false;

  private systemAudioPlayer: AudioQueuePlayer;
  private micAudioPlayer: AudioQueuePlayer;

  // Callbacks
  public onAudioEventReceived?: (event: AudioTranslationEvent) => void;
  public onStatusChanged?: (channel: 'system' | 'mic', status: string, isError?: boolean) => void;
  public onVolumeChanged?: (channel: 'system' | 'mic' | 'system_out' | 'mic_out', level: number) => void;
  public onLatencyUpdated?: (ms: number) => void;

  private settings: AppSettings;
  private lastPingTime = 0;

  constructor(settings?: Partial<AppSettings>) {
    const defaultSettings: AppSettings = {
      systemTargetLanguage: 'es',
      userTargetLanguage: 'en',
      systemVoiceName: 'Fenrir',
      userVoiceName: 'Puck',
      selectedMicDeviceId: '',
      selectedOutputDeviceId: '',
      systemOutputVolume: 0.9,
      micOutputVolume: 0.9,
      echoCancellation: true,
      noiseSuppression: true,
    };
    this.settings = { ...defaultSettings, ...settings };
    this.systemAudioPlayer = new AudioQueuePlayer(24000);
    this.micAudioPlayer = new AudioQueuePlayer(24000);

    this.systemAudioPlayer.setVolume(this.settings.systemOutputVolume);
    this.micAudioPlayer.setVolume(this.settings.micOutputVolume);

    if (this.settings.selectedOutputDeviceId) {
      this.systemAudioPlayer.setOutputDevice(this.settings.selectedOutputDeviceId);
      this.micAudioPlayer.setOutputDevice(this.settings.selectedOutputDeviceId);
    }
  }

  public updateSettings(newSettings: AppSettings) {
    this.settings = newSettings;
    this.systemAudioPlayer.setVolume(newSettings.systemOutputVolume);
    this.micAudioPlayer.setVolume(newSettings.micOutputVolume);

    if (newSettings.selectedOutputDeviceId) {
      this.systemAudioPlayer.setOutputDevice(newSettings.selectedOutputDeviceId);
      this.micAudioPlayer.setOutputDevice(newSettings.selectedOutputDeviceId);
    }
  }

  private connectWebSocket(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        return resolve(this.ws);
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/live`;

      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('WebSocket connected to Live Voice-to-Voice server');
        socket.send(
          JSON.stringify({
            type: 'config',
            settings: this.settings,
          })
        );
        this.ws = socket;
        resolve(socket);
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
        reject(err);
      };

      socket.onclose = () => {
        console.log('WebSocket closed');
        this.ws = null;
      };

      socket.onmessage = (event) => {
        try {
          const msg: WsIncomingMessage = JSON.parse(event.data);
          this.handleWsMessage(msg);
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };
    });
  }

  private handleWsMessage(msg: WsIncomingMessage) {
    console.log(`[LiveAudioClient:WsReceive] Message received | type="${msg.type}" | channel="${msg.channel}"`, msg);

    if (this.lastPingTime > 0) {
      const latency = Date.now() - this.lastPingTime;
      if (this.onLatencyUpdated) this.onLatencyUpdated(latency);
    }

    if (msg.type === 'audio') {
      console.log(`[LiveAudioClient:AudioMessage] Processing audio response | text="${msg.text}" | audioBase64 length=${msg.audioBase64?.length || 0} | channel="${msg.channel}"`);

      if (msg.audioBase64) {
        if (msg.channel === 'system_audio') {
          console.log('[LiveAudioClient:AudioPlayback] Enqueuing system audio chunk to systemAudioPlayer');
          this.systemAudioPlayer.playChunk(msg.audioBase64, msg.sampleRate || 24000);
        } else {
          console.log('[LiveAudioClient:AudioPlayback] Enqueuing mic audio chunk to micAudioPlayer');
          this.micAudioPlayer.playChunk(msg.audioBase64, msg.sampleRate || 24000);
        }
      } else if (msg.text && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        console.log('[LiveAudioClient:SpeechSynthesis] Speaking text fallback via SpeechSynthesisUtterance:', msg.text);
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(msg.text);
          utterance.lang = msg.channel === 'system_audio' ? 'es-ES' : 'en-US';
          utterance.rate = 1.0;
          const targetVol = msg.channel === 'system_audio' ? this.settings.systemOutputVolume : this.settings.micOutputVolume;
          utterance.volume = Math.max(0.1, Math.min(1, targetVol));
          window.speechSynthesis.speak(utterance);
        } catch (speechErr) {
          console.warn('[LiveAudioClient:SpeechSynthesis] SpeechSynthesis error:', speechErr);
        }
      }

      if (this.onVolumeChanged) {
        const chanKey = msg.channel === 'system_audio' ? 'system_out' : 'mic_out';
        this.onVolumeChanged(chanKey, Math.floor(Math.random() * 40 + 50));
        setTimeout(() => this.onVolumeChanged?.(chanKey, 0), 600);
      }

      if (this.onAudioEventReceived) {
        const newEventItem: AudioTranslationEvent = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          channel: msg.channel,
          durationMs: 1500,
          text: msg.text,
          targetLanguage:
            msg.channel === 'system_audio'
              ? this.settings.systemTargetLanguage
              : this.settings.userTargetLanguage,
          voiceName:
            msg.voiceName ||
            (msg.channel === 'system_audio'
              ? this.settings.systemVoiceName
              : this.settings.userVoiceName),
        };
        console.log('[LiveAudioClient:EventDispatch] Firing onAudioEventReceived callback with event:', newEventItem);
        this.onAudioEventReceived(newEventItem);
      } else {
        console.warn('[LiveAudioClient:EventDispatch] WARNING: onAudioEventReceived callback is NOT attached to LiveAudioClient instance!');
      }
    } else if (msg.type === 'status') {
      console.log(`[LiveAudioClient:Status] Channel="${msg.channel}" | status="${msg.message}"`);
      const channelName = msg.channel === 'system_audio' ? 'system' : 'mic';
      if (this.onStatusChanged && msg.message) {
        this.onStatusChanged(channelName, msg.message, false);
      }
    } else if (msg.type === 'error') {
      console.error(`[LiveAudioClient:Error] Channel="${msg.channel}" | error="${msg.message}"`);
      const channelName = msg.channel === 'system_audio' ? 'system' : 'mic';
      if (this.onStatusChanged && msg.message) {
        this.onStatusChanged(channelName, msg.message, true);
      }
    }
  }

  /**
   * Start capturing System PC Audio (Teams, Meet, Zoom, PC Sound)
   */
  public async startSystemAudio(): Promise<boolean> {
    try {
      if (this.onStatusChanged) this.onStatusChanged('system', 'Solicitando audio del sistema...');

      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: this.settings.echoCancellation,
          noiseSuppression: this.settings.noiseSuppression,
        },
      });

      const audioTracks = displayStream.getAudioTracks();
      if (audioTracks.length === 0) {
        if (this.onStatusChanged) {
          this.onStatusChanged(
            'system',
            'No se seleccionó "Compartir audio del sistema". Por favor intenta de nuevo marcando esa casilla.',
            true
          );
        }
        displayStream.getTracks().forEach((track) => track.stop());
        return false;
      }

      const socket = await this.connectWebSocket();

      this.systemStream = new MediaStream([audioTracks[0]]);
      (this as any).systemDisplayStream = displayStream;
      displayStream.getVideoTracks().forEach((track) => {
        track.enabled = false;
      });

      audioTracks[0].onended = () => {
        this.stopSystemAudio();
      };

      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.systemAudioCtx = new AudioCtxClass({ sampleRate: 16000 });
      if (this.systemAudioCtx.state === 'suspended') {
        await this.systemAudioCtx.resume();
      }

      const source = this.systemAudioCtx.createMediaStreamSource(this.systemStream);

      this.systemProcessor = this.systemAudioCtx.createScriptProcessor(4096, 1, 1);
      const dummyGain = this.systemAudioCtx.createGain();
      dummyGain.gain.value = 0;
      source.connect(this.systemProcessor);
      this.systemProcessor.connect(dummyGain);
      dummyGain.connect(this.systemAudioCtx.destination);

      let systemFrameCount = 0;
      this.systemProcessor.onaudioprocess = (e) => {
        if (!this.isSystemActive || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        systemFrameCount++;
        const inputData = e.inputBuffer.getChannelData(0);
        const volume = calculateAudioLevel(inputData);
        if (this.onVolumeChanged) this.onVolumeChanged('system', volume);

        const currentSampleRate = this.systemAudioCtx ? this.systemAudioCtx.sampleRate : 48000;
        const pcm16 = float32ToPcm16Resampled(inputData, currentSampleRate, 16000);
        const base64Audio = uint8ToBase64(pcm16);

        if (systemFrameCount % 25 === 1 || volume > 5) {
          console.log(`[LiveAudioClient:SystemAudio] Frame #${systemFrameCount} | Vol: ${volume}% | Samples: ${inputData.length} -> PCM16: ${pcm16.length} bytes | WS State: ${this.ws.readyState}`);
        }

        this.lastPingTime = Date.now();
        socket.send(
          JSON.stringify({
            type: 'audio_chunk',
            channel: 'system_audio',
            audio: base64Audio,
            targetLang: this.settings.systemTargetLanguage,
            voiceName: this.settings.systemVoiceName,
          })
        );
      };

      this.isSystemActive = true;

      if (this.onStatusChanged)
        this.onStatusChanged('system', 'Capturando audio del PC - Traduciendo en tiempo real a español');
      return true;
    } catch (err: unknown) {
      console.error('Failed to start system audio capture:', err);
      let errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('display-capture') || errMsg.includes('permissions policy') || errMsg.includes('NotAllowedError')) {
        errMsg = 'Para capturar audio del PC, abre la app en una Pestaña Nueva del navegador (debido a la política de seguridad del visor iframe). Haz clic en "Abrir en Pestaña Nueva".';
      }
      if (this.onStatusChanged) {
        this.onStatusChanged('system', `Error: ${errMsg}`, true);
      }
      return false;
    }
  }

  public stopSystemAudio() {
    this.isSystemActive = false;
    if ((this as any).systemSpeechRecognition) {
      try {
        (this as any).systemSpeechRecognition.stop();
      } catch (e) {}
      (this as any).systemSpeechRecognition = null;
    }
    if (this.systemProcessor) {
      this.systemProcessor.disconnect();
      this.systemProcessor = null;
    }
    if (this.systemAudioCtx) {
      this.systemAudioCtx.close();
      this.systemAudioCtx = null;
    }
    if (this.systemStream) {
      this.systemStream.getTracks().forEach((track) => track.stop());
      this.systemStream = null;
    }
    if ((this as any).systemDisplayStream) {
      try {
        (this as any).systemDisplayStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      } catch (e) {
        console.warn('Error stopping display stream:', e);
      }
      (this as any).systemDisplayStream = null;
    }
    if (this.onStatusChanged) this.onStatusChanged('system', 'Audio de PC detenido');
    if (this.onVolumeChanged) {
      this.onVolumeChanged('system', 0);
      this.onVolumeChanged('system_out', 0);
    }
  }

  /**
   * Start User Microphone Capture (Spanish speech -> English voice output)
   */
  public async startUserMic(): Promise<boolean> {
    try {
      if (this.onStatusChanged) this.onStatusChanged('mic', 'Solicitando acceso al micrófono...');

      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: this.settings.echoCancellation,
        noiseSuppression: this.settings.noiseSuppression,
      };

      if (this.settings.selectedMicDeviceId) {
        audioConstraints.deviceId = { exact: this.settings.selectedMicDeviceId };
      }

      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });

      const socket = await this.connectWebSocket();
      this.micStream = micStream;

      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.micAudioCtx = new AudioCtxClass({ sampleRate: 16000 });
      if (this.micAudioCtx.state === 'suspended') {
        await this.micAudioCtx.resume();
      }

      const source = this.micAudioCtx.createMediaStreamSource(micStream);

      this.micProcessor = this.micAudioCtx.createScriptProcessor(4096, 1, 1);
      const dummyGain = this.micAudioCtx.createGain();
      dummyGain.gain.value = 0;
      source.connect(this.micProcessor);
      this.micProcessor.connect(dummyGain);
      dummyGain.connect(this.micAudioCtx.destination);

      let micFrameCount = 0;
      this.micProcessor.onaudioprocess = (e) => {
        if (!this.isMicActive || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        micFrameCount++;
        const inputData = e.inputBuffer.getChannelData(0);
        const volume = calculateAudioLevel(inputData);
        if (this.onVolumeChanged) this.onVolumeChanged('mic', volume);

        const currentSampleRate = this.micAudioCtx ? this.micAudioCtx.sampleRate : 48000;
        const pcm16 = float32ToPcm16Resampled(inputData, currentSampleRate, 16000);
        const base64Audio = uint8ToBase64(pcm16);

        if (micFrameCount % 25 === 1 || volume > 5) {
          console.log(`[LiveAudioClient:MicAudio] Frame #${micFrameCount} | Vol: ${volume}% | Samples: ${inputData.length} -> PCM16: ${pcm16.length} bytes | WS State: ${this.ws.readyState}`);
        }

        socket.send(
          JSON.stringify({
            type: 'audio_chunk',
            channel: 'user_mic',
            audio: base64Audio,
            targetLang: this.settings.userTargetLanguage,
            voiceName: this.settings.userVoiceName,
          })
        );
      };

      this.isMicActive = true;

      // Start browser SpeechRecognition as parallel real-time detector for microphone speech
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'es-ES';
          let lastSentMicText = '';

          recognition.onresult = (event: any) => {
            if (!this.isMicActive) return;
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const res = event.results[i];
              const transcript = res?.[0]?.transcript?.trim();
              if (transcript && transcript.length > 2) {
                // Send immediately if final or if interim transcript has added new words (> 8 chars diff)
                if (res.isFinal || (transcript !== lastSentMicText && Math.abs(transcript.length - lastSentMicText.length) > 8)) {
                  console.log('[Browser SpeechRecognition Mic Stream]:', transcript, 'isFinal:', res.isFinal);
                  lastSentMicText = transcript;
                  this.sendSimulatedSpeech('user_mic', transcript);
                }
              }
            }
          };
          recognition.onerror = (e: any) => {
            console.warn('SpeechRecognition mic error:', e);
          };
          recognition.onend = () => {
            if (this.isMicActive && (this as any).micSpeechRecognition === recognition) {
              try {
                recognition.start();
              } catch (e) {
                console.warn('SpeechRecognition mic restart failed:', e);
              }
            }
          };
          recognition.start();
          (this as any).micSpeechRecognition = recognition;
        } catch (recErr) {
          console.warn('SpeechRecognition initialization skipped:', recErr);
        }
      }

      if (this.onStatusChanged)
        this.onStatusChanged('mic', 'Micrófono activo - Traduciendo a voz en inglés');
      return true;
    } catch (err: unknown) {
      console.error('Failed to start microphone:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (this.onStatusChanged) {
        this.onStatusChanged('mic', `Error de micrófono: ${errMsg}`, true);
      }
      return false;
    }
  }

  public stopUserMic() {
    this.isMicActive = false;
    if ((this as any).micSpeechRecognition) {
      try {
        (this as any).micSpeechRecognition.stop();
      } catch (e) {}
      (this as any).micSpeechRecognition = null;
    }
    if (this.micProcessor) {
      this.micProcessor.disconnect();
      this.micProcessor = null;
    }
    if (this.micAudioCtx) {
      this.micAudioCtx.close();
      this.micAudioCtx = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.onStatusChanged) this.onStatusChanged('mic', 'Micrófono detenido');
    if (this.onVolumeChanged) {
      this.onVolumeChanged('mic', 0);
      this.onVolumeChanged('mic_out', 0);
    }
  }

  public sendTestAudio(channel: LiveMode, sampleAudioBase64: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'audio_chunk',
          channel,
          audio: sampleAudioBase64,
          targetLang:
            channel === 'system_audio'
              ? this.settings.systemTargetLanguage
              : this.settings.userTargetLanguage,
          voiceName:
            channel === 'system_audio'
              ? this.settings.systemVoiceName
              : this.settings.userVoiceName,
        })
      );
    }
  }

  public async sendSimulatedSpeech(channel: LiveMode, text: string) {
    console.log(`[LiveAudioClient:SimulatedSpeech] Sending simulated speech | channel="${channel}" | text="${text}"`);
    const socket = await this.connectWebSocket();
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: 'simulated_speech',
          channel,
          text,
          targetLang:
            channel === 'system_audio'
              ? this.settings.systemTargetLanguage
              : this.settings.userTargetLanguage,
          voiceName:
            channel === 'system_audio'
              ? this.settings.systemVoiceName
              : this.settings.userVoiceName,
        })
      );
      console.log(`[LiveAudioClient:SimulatedSpeech] Sent simulated_speech packet successfully`);
    } else {
      console.warn(`[LiveAudioClient:SimulatedSpeech] Failed to send: WebSocket state is not OPEN`);
    }
  }

  public cleanup() {
    this.stopSystemAudio();
    this.stopUserMic();
    this.systemAudioPlayer.stop();
    this.micAudioPlayer.stop();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
