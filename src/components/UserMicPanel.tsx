import React from 'react';
import { AppSettings, AudioTranslationEvent } from '../types';
import { Mic, Volume2, VolumeX, Sparkles, User, Play, Square, Headphones, ShieldAlert, Radio } from 'lucide-react';

interface UserMicPanelProps {
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
  statusText: string;
  isError: boolean;
  micVolume: number;
  outVolume: number;
  audioEvents: AudioTranslationEvent[];
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const UserMicPanel: React.FC<UserMicPanelProps> = ({
  isActive,
  onStart,
  onStop,
  statusText,
  isError,
  micVolume,
  outVolume,
  audioEvents,
  settings,
  onUpdateSettings,
}) => {
  const voices: Array<AppSettings['userVoiceName']> = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

  const handleVoiceChange = (voiceName: AppSettings['userVoiceName']) => {
    onUpdateSettings({
      ...settings,
      userVoiceName: voiceName,
    });
  };

  const handleVolumeChange = (vol: number) => {
    onUpdateSettings({
      ...settings,
      micOutputVolume: vol,
    });
  };

  const micAudioEvents = audioEvents.filter((e) => e.channel === 'user_mic');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col space-y-5">
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Mic className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              Mi Micrófono (Voz a Voz)
            </h2>
            <p className="text-xs text-slate-400">Traducción de tu habla en español a audio en inglés en vivo</p>
          </div>
        </div>

        {/* Voice-only pure badge */}
        <span className="px-3 py-1 text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Exclusivo Voz a Voz
        </span>
      </div>

      {/* Mode callout note */}
      <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3.5 text-xs text-amber-200/90 flex items-start space-x-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-amber-100 font-semibold">Modo Voz a Voz puro:</strong> Tu voz en el micrófono se transcribe y traduce a audio en inglés en tiempo real sin mostrar bloques de texto. El audio traducido se reproduce automáticamente por los altavoces / salida de audio seleccionada.
        </p>
      </div>

      {/* Control Actions & Mic Meter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
        <div className="flex items-center space-x-3">
          {!isActive ? (
            <button
              onClick={onStart}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-xs flex items-center space-x-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Activar Micrófono</span>
            </button>
          ) : (
            <button
              onClick={onStop}
              className="px-4 py-2.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 font-medium text-xs flex items-center space-x-2 transition cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current text-rose-400" />
              <span>Detener Micrófono</span>
            </button>
          )}
        </div>

        {/* Status text & Volume meters */}
        <div className="flex items-center space-x-3 flex-1 justify-end">
          <div className="text-right">
            <span
              className={`text-xs font-medium block ${
                isError ? 'text-rose-400' : isActive ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {statusText || (isActive ? 'Escuchando en español...' : 'Inactivo')}
            </span>
          </div>

          {/* Mic Level Bar */}
          <div className="w-24 bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700/60 flex items-center">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-75"
              style={{ width: `${micVolume}%` }}
            />
          </div>
        </div>
      </div>

      {/* Voice Selection & Speaker Output Volume Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        {/* Voice selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <User className="w-3.5 h-3.5 text-amber-400" /> Voz de Salida en Inglés (Gemini TTS)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {voices.map((v) => (
              <button
                key={v}
                onClick={() => handleVoiceChange(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  settings.userVoiceName === v
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Output Speaker Volume Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-amber-400" /> Volumen de Voz Traducida
            </span>
            <span className="text-amber-400">{Math.round(settings.micOutputVolume * 100)}%</span>
          </div>

          <div className="flex items-center space-x-3 pt-1">
            <button
              onClick={() => handleVolumeChange(settings.micOutputVolume > 0 ? 0 : 0.8)}
              className="text-slate-400 hover:text-white p-1 transition cursor-pointer"
            >
              {settings.micOutputVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-amber-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.micOutputVolume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Speaker Output Visualizer Waveform */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-3 h-3 rounded-full ${
              outVolume > 5 ? 'bg-amber-400 animate-ping' : 'bg-slate-700'
            }`}
          />
          <span className="text-xs text-slate-300 font-medium">
            {outVolume > 5 ? 'Reproduciendo audio traducido en inglés...' : 'Esperando tu habla para traducir a inglés...'}
          </span>
        </div>

        {/* Simulated Equalizer Bars */}
        <div className="flex items-end space-x-1 h-6">
          {[40, 75, 50, 90, 60, 30, 85, 45].map((h, i) => (
            <div
              key={i}
              className="w-1.5 bg-amber-500/80 rounded-t transition-all duration-100"
              style={{
                height: outVolume > 5 ? `${Math.min(100, Math.max(15, (outVolume * h) / 50))}%` : '4px',
              }}
            />
          ))}
        </div>
      </div>

      {/* Voice Events Stream Indicator */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-amber-400" /> Eventos de Voz Traducida en Vivo ({micAudioEvents.length})
        </h3>

        <div className="max-h-36 overflow-y-auto space-y-1.5 custom-scrollbar text-xs">
          {micAudioEvents.length > 0 ? (
            micAudioEvents.slice(-6).reverse().map((ev) => (
              <div
                key={ev.id}
                className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-slate-200 font-medium">
                      Voz traducida a inglés con <strong className="text-amber-300">{ev.voiceName}</strong>
                    </span>
                    {ev.text && (
                      <span className="text-amber-200/90 text-[11px] italic font-mono mt-0.5">
                        "{ev.text}"
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-500 shrink-0">{ev.timestamp}</span>
              </div>
            ))
          ) : (
            <p className="text-center text-xs text-slate-600 py-4 italic">
              Sin eventos de voz traducidos aún. Activa tu micrófono para comenzar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
