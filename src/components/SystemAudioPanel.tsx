import React, { useState } from 'react';
import { AppSettings, AudioTranslationEvent } from '../types';
import {
  Volume2,
  Play,
  Square,
  HelpCircle,
  Monitor,
  Headphones,
  Sparkles,
  VolumeX,
  User,
  Radio,
  AlertTriangle,
} from 'lucide-react';

interface SystemAudioPanelProps {
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
  statusText: string;
  isError: boolean;
  volume: number;
  outVolume: number;
  audioEvents: AudioTranslationEvent[];
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const SystemAudioPanel: React.FC<SystemAudioPanelProps> = ({
  isActive,
  onStart,
  onStop,
  statusText,
  isError,
  volume,
  outVolume,
  audioEvents,
  settings,
  onUpdateSettings,
}) => {
  const [showGuide, setShowGuide] = useState(false);

  const voices: Array<AppSettings['systemVoiceName']> = ['Fenrir', 'Kore', 'Puck', 'Charon', 'Zephyr'];

  const handleVoiceChange = (voiceName: AppSettings['systemVoiceName']) => {
    onUpdateSettings({
      ...settings,
      systemVoiceName: voiceName,
    });
  };

  const handleVolumeChange = (vol: number) => {
    onUpdateSettings({
      ...settings,
      systemOutputVolume: vol,
    });
  };

  const systemAudioEvents = audioEvents.filter((e) => e.channel === 'system_audio');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col space-y-5">
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              Audio del PC (Teams, Meet, Zoom)
            </h2>
            <p className="text-xs text-slate-400">Traducción directa de audio entrante a Voz en Español en vivo</p>
          </div>
        </div>

        <button
          onClick={() => setShowGuide(!showGuide)}
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-2.5 py-1.5 rounded-lg border border-cyan-500/20 transition cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>¿Cómo capturar?</span>
        </button>
      </div>

      {/* Guide popup */}
      {showGuide && (
        <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-xl p-4 text-xs text-cyan-200 space-y-2">
          <p className="font-semibold text-cyan-100 flex items-center gap-1.5">
            <Monitor className="w-4 h-4 text-cyan-400" /> Pasos para capturar el audio de la llamada:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-300">
            <li>
              Haz clic en el botón <strong className="text-cyan-300">"Capturar Audio del PC"</strong> abajo.
            </li>
            <li>En la ventana emergente de tu navegador, selecciona la pestaña o pantalla de tu reunión.</li>
            <li>
              <strong className="text-amber-300 uppercase underline">Crucial:</strong> Marca la casilla{' '}
              <strong className="text-cyan-200 font-bold">"Compartir audio del sistema"</strong> en la parte inferior.
            </li>
            <li>
              ¡Listo! Escucharás la voz traducida al <strong className="text-emerald-300">Español</strong> al instante por tus bocinas/auriculares.
            </li>
          </ol>
        </div>
      )}

      {/* Iframe & Security Warning Banner */}
      {(isError || (typeof window !== 'undefined' && window.self !== window.top)) && (
        <div className="bg-amber-950/60 border border-amber-700/80 rounded-xl p-4 text-xs space-y-2.5">
          <div className="flex items-center space-x-2 text-amber-200 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Atención sobre Captura de Audio del PC en el Navegador:</span>
          </div>
          <ul className="text-slate-300 space-y-1.5 leading-relaxed pl-5 list-disc">
            <li>
              <strong className="text-amber-200">Visor Iframe:</strong> Si estás dentro del visor del editor, el navegador bloquea la captura de pantalla por políticas de seguridad. Haz clic en el botón de abajo para abrir la app en su <strong>Pestaña Nueva</strong> independiente.
            </li>
            <li>
              <strong className="text-amber-200">En el diálogo de Chrome:</strong> Selecciona <strong>"Toda la Pantalla"</strong> o <strong>"Pestaña de Chrome"</strong> (¡no la opción "Ventana", ya que Windows no incluye sonido en esa opción!) y <strong>marca la casilla "Compartir audio del sistema"</strong> en la parte inferior izquierda.
            </li>
          </ul>
          <div className="pt-1">
            <button
              onClick={() => {
                const url = window.location.href;
                window.open(url, '_blank');
              }}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-lg transition cursor-pointer"
            >
              <span>Abrir en Pestaña Nueva (Recomendado) ↗</span>
            </button>
          </div>
        </div>
      )}

      {/* Control Actions & Audio Input Level */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
        <div className="flex items-center space-x-3">
          {!isActive ? (
            <button
              onClick={onStart}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs flex items-center space-x-2 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Capturar Audio del PC</span>
            </button>
          ) : (
            <button
              onClick={onStop}
              className="px-4 py-2.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 font-medium text-xs flex items-center space-x-2 transition cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current text-rose-400" />
              <span>Detener Captura</span>
            </button>
          )}
        </div>

        {/* Status text & Volume Bar */}
        <div className="flex items-center space-x-3 flex-1 justify-end">
          <div className="text-right">
            <span
              className={`text-xs font-medium block ${
                isError ? 'text-rose-400' : isActive ? 'text-cyan-400' : 'text-slate-400'
              }`}
            >
              {statusText || (isActive ? 'Capturando audio...' : 'Inactivo')}
            </span>
          </div>

          {/* Input Level Bar */}
          <div className="w-24 bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700/60 flex items-center">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-75"
              style={{ width: `${volume}%` }}
            />
          </div>
        </div>
      </div>

      {/* Voice Selection & Output Volume */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        {/* Voice selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <User className="w-3.5 h-3.5 text-cyan-400" /> Voz de Traducción en Español (TTS)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {voices.map((v) => (
              <button
                key={v}
                onClick={() => handleVoiceChange(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  settings.systemVoiceName === v
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
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
              <Headphones className="w-3.5 h-3.5 text-cyan-400" /> Volumen de Voz Traducida
            </span>
            <span className="text-cyan-400">{Math.round(settings.systemOutputVolume * 100)}%</span>
          </div>

          <div className="flex items-center space-x-3 pt-1">
            <button
              onClick={() => handleVolumeChange(settings.systemOutputVolume > 0 ? 0 : 0.8)}
              className="text-slate-400 hover:text-white p-1 transition cursor-pointer"
            >
              {settings.systemOutputVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.systemOutputVolume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Active Speaker Output Waveform Monitor */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-3 h-3 rounded-full ${
              outVolume > 5 ? 'bg-cyan-400 animate-ping' : 'bg-slate-700'
            }`}
          />
          <span className="text-xs text-slate-300 font-medium">
            {outVolume > 5
              ? 'Reproduciendo voz traducida al español...'
              : 'Escuchando audio del PC para traducir voz en tiempo real...'}
          </span>
        </div>

        {/* Dynamic Equalizer Bars */}
        <div className="flex items-end space-x-1 h-6">
          {[35, 80, 55, 95, 70, 40, 90, 60].map((h, i) => (
            <div
              key={i}
              className="w-1.5 bg-cyan-500/80 rounded-t transition-all duration-100"
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
          <Radio className="w-3.5 h-3.5 text-cyan-400" /> Eventos de Voz Traducida en Vivo ({systemAudioEvents.length})
        </h3>

        <div className="max-h-36 overflow-y-auto space-y-1.5 custom-scrollbar text-xs">
          {systemAudioEvents.length > 0 ? (
            systemAudioEvents.slice(-6).reverse().map((ev) => (
              <div
                key={ev.id}
                className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-slate-200 font-medium">
                      Audio en voz <strong className="text-cyan-300">{ev.voiceName}</strong> (Español)
                    </span>
                    {ev.text && (
                      <span className="text-cyan-200/90 text-[11px] italic font-mono mt-0.5">
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
              Sin eventos de voz transmitidos aún. Activa la captura del PC para comenzar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
