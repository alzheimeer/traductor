import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, AudioTranslationEvent } from './types';
import { LiveAudioClient } from './services/liveAudioClient';
import { Header } from './components/Header';
import { SystemAudioPanel } from './components/SystemAudioPanel';
import { UserMicPanel } from './components/UserMicPanel';
import { SettingsModal } from './components/SettingsModal';
import { AudioTestSimulator } from './components/AudioTestSimulator';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse settings from localStorage', e);
      }
    }
    return {
      systemTargetLanguage: 'es',
      userTargetLanguage: 'en',
      systemVoiceName: 'Fenrir',
      userVoiceName: 'Fenrir',
      selectedMicDeviceId: '',
      selectedOutputDeviceId: '',
      selectedMicOutputDeviceId: '',
      systemOutputVolume: 0.9,
      micOutputVolume: 0.9,
      echoCancellation: true,
      noiseSuppression: true,
    };
  });

  const [systemActive, setSystemActive] = useState(false);
  const [micActive, setMicActive] = useState(false);

  const [systemStatusText, setSystemStatusText] = useState('');
  const [micStatusText, setMicStatusText] = useState('');

  const [systemIsError, setSystemIsError] = useState(false);
  const [micIsError, setMicIsError] = useState(false);

  const [systemVolume, setSystemVolume] = useState(0);
  const [micVolume, setMicVolume] = useState(0);
  const [systemOutVolume, setSystemOutVolume] = useState(0);
  const [micOutVolume, setMicOutVolume] = useState(0);

  const [audioEvents, setAudioEvents] = useState<AudioTranslationEvent[]>([]);
  const [latencyMs, setLatencyMs] = useState(0);
  const [hasApiKey, setHasApiKey] = useState(true);

  const [showSettings, setShowSettings] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  const clientRef = useRef<LiveAudioClient | null>(null);

  // Check backend health & API key status
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasApiKey !== undefined) {
          setHasApiKey(data.hasApiKey);
        }
      })
      .catch((err) => console.error('Failed to fetch health status:', err));
  }, []);

  // Initialize LiveAudioClient instance
  useEffect(() => {
    const client = new LiveAudioClient(settings);

    client.onAudioEventReceived = (event) => {
      console.log('[App.tsx] AudioTranslationEvent received:', event);
      setAudioEvents((prev) => {
        const nextEvents = [...prev, event];
        console.log('[App.tsx] Updated audioEvents total count:', nextEvents.length);
        return nextEvents;
      });
    };

    client.onStatusChanged = (channel, status, isError) => {
      if (channel === 'system') {
        setSystemStatusText(status);
        setSystemIsError(Boolean(isError));
        if (status.includes('detenido') || isError) setSystemActive(false);
      } else {
        setMicStatusText(status);
        setMicIsError(Boolean(isError));
        if (status.includes('detenido') || isError) setMicActive(false);
      }
    };

    client.onVolumeChanged = (channel, level) => {
      if (channel === 'system') setSystemVolume(level);
      else if (channel === 'mic') setMicVolume(level);
      else if (channel === 'system_out') setSystemOutVolume(level);
      else if (channel === 'mic_out') setMicOutVolume(level);
    };

    client.onLatencyUpdated = (ms) => {
      setLatencyMs(ms);
    };

    clientRef.current = client;

    return () => {
      client.cleanup();
    };
  }, []);

  // Update client settings when state changes
  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    if (clientRef.current) {
      clientRef.current.updateSettings(settings);
    }
  }, [settings]);

  const handleStartSystemAudio = async () => {
    if (!clientRef.current) return;
    const ok = await clientRef.current.startSystemAudio();
    if (ok) setSystemActive(true);
  };

  const handleStopSystemAudio = () => {
    if (!clientRef.current) return;
    clientRef.current.stopSystemAudio();
    setSystemActive(false);
  };

  const handleStartUserMic = async () => {
    if (!clientRef.current) return;
    const ok = await clientRef.current.startUserMic();
    if (ok) setMicActive(true);
  };

  const handleStopUserMic = () => {
    if (!clientRef.current) return;
    clientRef.current.stopUserMic();
    setMicActive(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header Bar */}
      <Header
        systemActive={systemActive}
        micActive={micActive}
        latencyMs={latencyMs}
        hasApiKey={hasApiKey}
        onOpenSettings={() => setShowSettings(true)}
        onOpenTestSimulator={() => setShowSimulator(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Banner callout */}
        <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-cyan-950/60 border border-indigo-800/40 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Traducción Exclusiva Voz a Voz (Sin Subtítulos)
              </h2>
              <p className="text-xs text-slate-300">
                1. <strong>Audio Entrante del PC (Teams/Meet/Zoom)</strong>: Se traduce y sintetiza directamente a voz en <strong>Español</strong>.<br />
                2. <strong>Tu Voz en Micrófono</strong>: Se traduce y sintetiza directamente a voz en <strong>Inglés</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowSimulator(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition shrink-0 cursor-pointer"
          >
            Probar Demo Interactiva
          </button>
        </div>

        {/* Dual Deck Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Deck 1: System PC Audio -> Spanish Voice Output */}
          <SystemAudioPanel
            isActive={systemActive}
            onStart={handleStartSystemAudio}
            onStop={handleStopSystemAudio}
            statusText={systemStatusText}
            isError={systemIsError}
            volume={systemVolume}
            outVolume={systemOutVolume}
            audioEvents={audioEvents}
            settings={settings}
            onUpdateSettings={setSettings}
          />

          {/* Deck 2: User Microphone -> English Voice Output */}
          <UserMicPanel
            isActive={micActive}
            onStart={handleStartUserMic}
            onStop={handleStopUserMic}
            statusText={micStatusText}
            isError={micIsError}
            micVolume={micVolume}
            outVolume={micOutVolume}
            audioEvents={audioEvents}
            settings={settings}
            onUpdateSettings={setSettings}
          />
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Audio Test Simulator Modal */}
      {showSimulator && (
        <AudioTestSimulator
          client={clientRef.current}
          onClose={() => setShowSimulator(false)}
          hasApiKey={hasApiKey}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-4 text-center text-xs text-slate-500">
        <p>
          Traducción de Voz a Voz impulsada por <strong>Google Gemini 3.5 Live & TTS</strong>. Sin subtítulos ni texto intermediario.
        </p>
      </footer>
    </div>
  );
}
