import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { Settings as SettingsIcon, X, Check, Volume2, Mic, Sliders, Headphones, RefreshCw, Info, HelpCircle } from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [showDriverGuide, setShowDriverGuide] = useState(false);

  const loadDevices = async () => {
    setLoadingDevices(true);
    try {
      // Prompt permissions if needed so device labels are visible
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        // ignore if already denied or dismissed
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter((d) => d.kind === 'audioinput');
      const outputs = devices.filter((d) => d.kind === 'audiooutput');

      setAudioInputs(inputs);
      setAudioOutputs(outputs);
    } catch (err) {
      console.error('Error enumerating devices:', err);
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const languages = [
    { code: 'es', name: 'Español (Spanish)' },
    { code: 'en', name: 'Inglés (English)' },
    { code: 'pt', name: 'Portugués (Portuguese)' },
    { code: 'fr', name: 'Francés (French)' },
    { code: 'de', name: 'Alemán (German)' },
    { code: 'it', name: 'Italiano (Italian)' },
    { code: 'ja', name: 'Japonés (Japanese)' },
    { code: 'zh', name: 'Chino Mandarin' },
  ];

  const voices: Array<AppSettings['userVoiceName']> = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
              <SettingsIcon className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Configuración de Dispositivos de Audio</h2>
              <p className="text-xs text-slate-400">Selecciona micrófonos, altavoces y ajusta la traducción de voz</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800 border border-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* API Key Section (BYOK) */}
        <div className="space-y-3 bg-emerald-950/20 border border-emerald-800/40 p-4 rounded-xl">
          <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <SettingsIcon className="w-4 h-4" /> Licencia y API Key (BYOK)
          </h3>
          <div className="text-[11px] text-slate-300 space-y-2">
            <p>
              Esta aplicación requiere acceso a la inteligencia artificial de Google. Puedes usar tu propia clave de desarrollo gratuita.
            </p>
            <p>
              Obtén tu clave gratis aquí:{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline font-bold">
                Google AI Studio
              </a>
            </p>
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1 text-xs">
              Google Gemini API Key:
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={settings.userApiKey || ''}
              onChange={(e) => onUpdateSettings({ ...settings, userApiKey: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        {/* Device Picker Section */}
        <div className="space-y-3 bg-indigo-950/30 border border-indigo-800/60 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-indigo-400" /> Seleccionar Dispositivos del Sistema (Físicos o Virtuales)
            </h3>
            <button
              onClick={loadDevices}
              disabled={loadingDevices}
              className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-900/60 border border-indigo-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${loadingDevices ? 'animate-spin' : ''}`} />
              <span>Detectar Dispositivos</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
            {/* Input Mic selector */}
            <div>
              <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                <Mic className="w-3.5 h-3.5 text-amber-400" /> Micrófono de Entrada a Capturar:
              </label>
              <select
                value={settings.selectedMicDeviceId}
                onChange={(e) => onUpdateSettings({ ...settings, selectedMicDeviceId: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Por Defecto del Sistema (Default Mic)</option>
                {audioInputs.map((d, index) => (
                  <option key={d.deviceId || index} value={d.deviceId}>
                    {d.label || `Micrófono ${index + 1}`}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Tu voz hablada en español ingresará por este micrófono.
              </p>
            </div>

            {/* Output Mic Audio to Virtual Cable */}
            <div>
              <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                <Headphones className="w-3.5 h-3.5 text-amber-400" /> Salida de Traducción (Cable Virtual):
              </label>
              <select
                value={settings.selectedMicOutputDeviceId}
                onChange={(e) => onUpdateSettings({ ...settings, selectedMicOutputDeviceId: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Por Defecto del Sistema / Igual que Altavoces</option>
                {audioOutputs.map((d, index) => (
                  <option key={d.deviceId || index} value={d.deviceId}>
                    {d.label || `Dispositivo de Salida ${index + 1}`}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Selecciona CABLE Input aquí para enviar tu voz traducida a Teams.
              </p>
            </div>
            
            {/* Empty column or spacer if we wanted a 2x2 grid, but let's make the Output Speaker span if needed, or just add it below */}
          </div>
          <div className="grid grid-cols-1 gap-4 text-xs pt-2">
            {/* Output Speaker selector */}
            <div>
              <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                <Headphones className="w-3.5 h-3.5 text-cyan-400" /> Salida de Audio PC (Altavoces locales):
              </label>
              <select
                value={settings.selectedOutputDeviceId}
                onChange={(e) => onUpdateSettings({ ...settings, selectedOutputDeviceId: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Por Defecto del Sistema (Speakers / Headphones)</option>
                {audioOutputs.map((d, index) => (
                  <option key={d.deviceId || index} value={d.deviceId}>
                    {d.label || `Dispositivo de Salida ${index + 1}`}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Escucharás el audio de Teams (traducido a Español) por aquí.
              </p>
            </div>
          </div>
        </div>

        {/* How to setup Driver Guide button */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
          <button
            onClick={() => setShowDriverGuide(!showDriverGuide)}
            className="w-full text-left font-semibold text-amber-300 flex items-center justify-between hover:underline cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-400" /> ¿Cómo conectar la voz traducida a Teams/Zoom (Driver Virtual)?
            </span>
            <span>{showDriverGuide ? 'Ocultar Guía ▲' : 'Ver Guía ▼'}</span>
          </button>

          {showDriverGuide && (
            <div className="pt-2 text-slate-300 space-y-3 leading-relaxed border-t border-slate-800/80">
              <p>
                Para que las personas en tu reunión de <strong>Teams / Zoom / Meet</strong> escuchen la voz traducida en inglés emitida por esta app, necesitas enviar el audio de la app al micrófono de Teams:
              </p>

              <ol className="list-decimal list-inside space-y-2 bg-slate-900 p-3 rounded-lg border border-slate-800">
                <li>
                  <strong>Instala un Cable de Audio Virtual gratuito</strong>:
                  <ul className="list-disc list-inside pl-4 text-slate-400 text-[11px] mt-0.5">
                    <li>Windows: <strong>VB-Audio Virtual Cable (VB-CABLE)</strong></li>
                    <li>Mac: <strong>BlackHole 2ch</strong></li>
                  </ul>
                </li>
                <li>
                  <strong>En esta App</strong>: Selecciona como <strong>Salida de Audio</strong> el dispositivo <strong className="text-cyan-300 font-mono">CABLE Input (VB-Audio Virtual Cable)</strong>.
                </li>
                <li>
                  <strong>En Teams / Zoom</strong>: En Configuración &gt; Dispositivos de Audio &gt; Micrófono, selecciona <strong className="text-amber-300 font-mono">CABLE Output (VB-Audio Virtual Cable)</strong>.
                </li>
                <li>
                  ¡Listo! Tu llamada en Teams escuchará la voz traducida en inglés de forma nítida.
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Section 1: PC System Audio Voice Settings */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Volume2 className="w-4 h-4" /> Audio del PC (Teams/Meet/Zoom -&gt; Voz en Español)
          </h3>

          <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Idioma de voz traducida (PC):</label>
              <select
                value={settings.systemTargetLanguage}
                onChange={(e) => onUpdateSettings({ ...settings, systemTargetLanguage: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Voz sintética (Español):</label>
              <div className="flex flex-wrap gap-2">
                {voices.map((v) => (
                  <button
                    key={v}
                    onClick={() => onUpdateSettings({ ...settings, systemVoiceName: v })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                      settings.systemVoiceName === v
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Mic Voice Settings */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Mic className="w-4 h-4" /> Traducción de Micrófono (Voz a Voz)
          </h3>

          <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Idioma de destino de tu voz:</label>
              <select
                value={settings.userTargetLanguage}
                onChange={(e) => onUpdateSettings({ ...settings, userTargetLanguage: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Voz sintética (Gemini TTS):</label>
              <div className="flex flex-wrap gap-2">
                {voices.map((v) => (
                  <button
                    key={v}
                    onClick={() => onUpdateSettings({ ...settings, userVoiceName: v })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                      settings.userVoiceName === v
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Audio Hardware Options */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-4 h-4" /> Ajustes de Filtros del Navegador
          </h3>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs space-y-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-300">Cancelación de eco (Echo Cancellation)</span>
              <input
                type="checkbox"
                checked={settings.echoCancellation}
                onChange={(e) => onUpdateSettings({ ...settings, echoCancellation: e.target.checked })}
                className="accent-indigo-500 w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-300">Supresión de ruido de fondo (Noise Suppression)</span>
              <input
                type="checkbox"
                checked={settings.noiseSuppression}
                onChange={(e) => onUpdateSettings({ ...settings, noiseSuppression: e.target.checked })}
                className="accent-indigo-500 w-4 h-4 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Check className="w-4 h-4" /> Guardar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
