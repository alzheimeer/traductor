import React, { useState } from 'react';
import { Sparkles, Play, X, MessageSquare, Volume2, Mic, CheckCircle2 } from 'lucide-react';
import { LiveAudioClient } from '../services/liveAudioClient';

interface AudioTestSimulatorProps {
  client: LiveAudioClient | null;
  onClose: () => void;
  hasApiKey: boolean;
}

export const AudioTestSimulator: React.FC<AudioTestSimulatorProps> = ({
  client,
  onClose,
  hasApiKey,
}) => {
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogMessages((prev) => [ `[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // Helper function to synthesize a simple PCM sine-wave tone or speech audio simulation buffer
  const generateSimulatedAudioBase64 = (durationSec = 2.0, frequency = 440) => {
    const sampleRate = 16000;
    const numSamples = Math.floor(sampleRate * durationSec);
    const buffer = new ArrayBuffer(numSamples * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Synthesize a speech-like modulated harmonic tone
      const sample = Math.sin(2 * Math.PI * frequency * t) * Math.sin(2 * Math.PI * 4 * t) * 0.4;
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(i * 2, int16, true);
    }

    const uint8 = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < uint8.length; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    return btoa(binary);
  };

  const handleRunSystemAudioTest = async (title: string, sampleText: string) => {
    setActiveTest(`system-${title}`);
    addLog(`Iniciando prueba de Audio de Reunión: "${title}"...`);

    try {
      if (client) {
        addLog(`Enviando frase de reunión a Gemini: "${sampleText}"...`);
        await client.sendSimulatedSpeech('system_audio', sampleText);
        addLog(`Solicitud enviada a Gemini (Traduciendo y reproduciendo voz en español)...`);
      } else {
        addLog(`Conectando cliente...`);
        const tempClient = new LiveAudioClient();
        await tempClient.sendSimulatedSpeech('system_audio', sampleText);
        addLog(`Frase enviada a Gemini con éxito.`);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      addLog(`Error en simulación: ${errMsg}`);
    } finally {
      setTimeout(() => setActiveTest(null), 1500);
    }
  };

  const handleRunMicTest = async (title: string, sampleSpanish: string) => {
    setActiveTest(`mic-${title}`);
    addLog(`Iniciando prueba de Micrófono (Voz a Voz): "${sampleSpanish}"...`);

    try {
      if (client) {
        addLog(`Enviando habla en español a Gemini: "${sampleSpanish}"...`);
        await client.sendSimulatedSpeech('user_mic', sampleSpanish);
        addLog(`Gemini procesando (Generando voz traducida en inglés en tus altavoces)...`);
      } else {
        addLog(`Conectando cliente...`);
        const tempClient = new LiveAudioClient();
        await tempClient.sendSimulatedSpeech('user_mic', sampleSpanish);
        addLog(`Frase enviada a Gemini con éxito.`);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      addLog(`Error en simulación de voz: ${errMsg}`);
    } finally {
      setTimeout(() => setActiveTest(null), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 border border-slate-700 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Simulador de Audio para Pruebas
            </h2>
            <p className="text-xs text-slate-400">
              Prueba la traducción al español e inglés sin necesidad de estar en una llamada real
            </p>
          </div>
        </div>

        {!hasApiKey && (
          <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 text-xs text-amber-200">
            ⚠️ Recuerda que la API Key de Gemini debe configurarse en los secretos del proyecto para recibir traducciones reales.
          </div>
        )}

        {/* System Audio Test Options */}
        <div className="space-y-3 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Volume2 className="w-4 h-4" /> 1. Probar Audio de PC (Traducción Directa a Voz en Español)
          </h3>
          <p className="text-xs text-slate-400">
            Simula audio proveniente de una videollamada de Teams/Meet para traducirlo a voz en español:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() =>
                handleRunSystemAudioTest(
                  'Presentación de Proyecto',
                  'Welcome everyone, today we will review our project roadmap.'
                )
              }
              disabled={Boolean(activeTest)}
              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition text-xs space-y-1 cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center justify-between text-slate-200 font-medium">
                <span>Introducción a Reunión</span>
                <Play className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <p className="text-[11px] text-slate-400">"Welcome everyone to our project review..."</p>
            </button>

            <button
              onClick={() =>
                handleRunSystemAudioTest(
                  'Pregunta Técnica',
                  'How does the real-time audio pipeline handle low latency?'
                )
              }
              disabled={Boolean(activeTest)}
              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition text-xs space-y-1 cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center justify-between text-slate-200 font-medium">
                <span>Pregunta Técnica</span>
                <Play className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <p className="text-[11px] text-slate-400">"How does the audio pipeline handle latency?"</p>
            </button>
          </div>
        </div>

        {/* User Mic Audio Test Options */}
        <div className="space-y-3 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Mic className="w-4 h-4" /> 2. Probar Micrófono (Traducción Directa a Voz en Inglés)
          </h3>
          <p className="text-xs text-slate-400">
            Simula tu habla en español para generar la voz traducida a inglés en tus altavoces:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() =>
                handleRunMicTest(
                  'Saludo de prueba',
                  'Hola a todos, estoy usando la API de Gemini para traducir mi voz en tiempo real.'
                )
              }
              disabled={Boolean(activeTest)}
              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition text-xs space-y-1 cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center justify-between text-slate-200 font-medium">
                <span>Saludo en Español</span>
                <Play className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-[11px] text-slate-400">"Hola a todos, traduciendo mi voz en vivo..."</p>
            </button>

            <button
              onClick={() =>
                handleRunMicTest(
                  'Respuesta en reunión',
                  'Excelente propuesta, estoy totalmente de acuerdo con la arquitectura planteada.'
                )
              }
              disabled={Boolean(activeTest)}
              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition text-xs space-y-1 cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center justify-between text-slate-200 font-medium">
                <span>Respuesta Profesional</span>
                <Play className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-[11px] text-slate-400">"Excelente propuesta, de acuerdo con la solución..."</p>
            </button>
          </div>
        </div>

        {/* Activity log */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
          <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> Log de Ejecución de Pruebas
          </h4>
          <div className="font-mono text-[11px] text-slate-300 max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
            {logMessages.length > 0 ? (
              logMessages.map((log, idx) => <p key={idx}>{log}</p>)
            ) : (
              <p className="text-slate-600 italic">Haz clic en una opción de arriba para simular eventos de audio.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" /> Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
