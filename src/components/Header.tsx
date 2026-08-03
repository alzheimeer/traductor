import React from 'react';
import { Radio, Sparkles, Settings as SettingsIcon, ShieldCheck, Volume2, Mic } from 'lucide-react';

interface HeaderProps {
  systemActive: boolean;
  micActive: boolean;
  latencyMs: number;
  hasApiKey: boolean;
  onOpenSettings: () => void;
  onOpenTestSimulator: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  systemActive,
  micActive,
  latencyMs,
  hasApiKey,
  onOpenSettings,
  onOpenTestSimulator,
}) => {
  return (
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left branding */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
            {(systemActive || micActive) && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight">Traductor Voz a Voz en Tiempo Real</h1>
              <span className="px-2 py-0.5 text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Gemini 3.5 Live Translate
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Traducción directa de voz a voz sin subtítulos (Audio PC a Español + Micrófono a Inglés)
            </p>
          </div>
        </div>

        {/* Status badges & Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Active status indicators */}
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <div className="flex items-center space-x-1.5">
              <Volume2 className={`w-3.5 h-3.5 ${systemActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              <span className={systemActive ? 'text-emerald-300 font-medium' : 'text-slate-400'}>
                {systemActive ? 'Audio PC: Capturando' : 'Audio PC: Inactivo'}
              </span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center space-x-1.5">
              <Mic className={`w-3.5 h-3.5 ${micActive ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
              <span className={micActive ? 'text-amber-300 font-medium' : 'text-slate-400'}>
                {micActive ? 'Mic: Voz a Voz' : 'Mic: Inactivo'}
              </span>
            </div>
          </div>

          {/* Latency badge */}
          {latencyMs > 0 && (
            <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60 text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{latencyMs}ms latencia</span>
            </div>
          )}

          {/* API Key Status */}
          <div
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 ${
              hasApiKey
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                : 'bg-amber-950/40 text-amber-300 border-amber-800/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{hasApiKey ? 'Gemini API Activa' : 'API Key Pendiente'}</span>
          </div>

          {/* Open in New Tab Button */}
          <button
            onClick={() => window.open(window.location.href, '_blank')}
            className="px-3 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 transition font-medium flex items-center gap-1.5 cursor-pointer"
            title="Abrir en pestaña independiente para permitir la captura del audio del PC sin bloqueos de iframe"
          >
            <span>Pestaña Nueva ↗</span>
          </button>

          {/* Test Simulator Button */}
          <button
            onClick={onOpenTestSimulator}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 transition font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Probar Simulador</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Configuración"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
