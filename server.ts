import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, MediaResolution, Modality, Session } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3105;

app.use(express.json({ limit: '50mb' }));

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is missing from environment variables');
  }
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      apiVersion: 'v1alpha',
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: '/ws/live' });

interface ClientSession {
  ws: WebSocket;
  settings: {
    systemTargetLanguage: string;
    userTargetLanguage: string;
    systemVoiceName: string;
    userVoiceName: string;
  };
  geminiSessions: {
    system_audio?: Session;
    user_mic?: Session;
  };
}

const LIVE_MODEL = 'models/gemini-3.5-live-translate-preview';

async function createGeminiLiveSession(
  clientWs: WebSocket,
  channel: 'system_audio' | 'user_mic',
  targetLanguage: string,
  voiceName: string
): Promise<Session> {
  const ai = getGeminiClient();

  const config = {
    responseModalities: [Modality.AUDIO],
    translationConfig: {
      targetLanguageCode: targetLanguage,
      echoTargetLanguage: true,
    },
    inputAudioTranscription: {},
    outputAudioTranscription: {},
  };

  const session = await ai.live.connect({
    model: LIVE_MODEL,
    config: config as any,
    callbacks: {
      onopen: () => {
        console.log(`[GeminiLive:${channel}] Session opened`);
      },
      onmessage: (message: LiveServerMessage) => {
        console.log(`[GeminiLive:${channel}] raw message keys:`, Object.keys(message));
        // Debugging logs to see what Gemini is actually returning
        if (message.serverContent) {
           console.log(`[GeminiLive:${channel}] received:`, Object.keys(message.serverContent));
           if (message.serverContent.modelTurn) {
             console.log(`[GeminiLive:${channel}] audio parts:`, message.serverContent.modelTurn.parts.length);
           }
        }
        
        if (message.serverContent?.modelTurn?.parts) {
          const part = message.serverContent.modelTurn.parts[0];
          
          if (part?.inlineData?.data) {
            // Forward audio output to client
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'audio',
                  channel: channel,
                  audioBase64: part.inlineData.data,
                  text: part.text || '',
                  sampleRate: 24000,
                  voiceName: voiceName,
                  timestamp: new Date().toLocaleTimeString(),
                })
              );
            }
          } else if (part?.text) {
             // Optional: send transcript if it arrives separately
             if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: 'audio', // The frontend expects 'audio' type for both transcript and audio data
                    channel: channel,
                    text: part.text,
                    sampleRate: 24000,
                    voiceName: voiceName,
                    timestamp: new Date().toLocaleTimeString(),
                  })
                );
             }
          }
        }
      },
      onerror: (e: any) => {
        console.error(`[GeminiLive:${channel}] Error:`, e.message || e);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'error', channel, message: e.message || 'Error en Gemini Live' }));
        }
      },
      onclose: (e: any) => {
        console.log(`[GeminiLive:${channel}] Connection closed:`, e.reason);
      },
    },
  });

  return session;
}

wss.on('connection', (clientWs: WebSocket) => {
  console.log('Client connected to Live Voice-to-Voice WebSocket');

  const session: ClientSession = {
    ws: clientWs,
    settings: {
      systemTargetLanguage: 'es',
      userTargetLanguage: 'en',
      systemVoiceName: 'Fenrir',
      userVoiceName: 'Puck',
    },
    geminiSessions: {},
  };

  clientWs.on('message', async (data: Buffer | string) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'config' && msg.settings) {
        session.settings = { ...session.settings, ...msg.settings };
        return;
      }

      if (msg.type === 'simulated_speech' && msg.text) {
          // Backward compatibility or fallback logic ignored
          // The new approach solely uses audio streaming.
          return;
      }

      if (msg.type === 'audio_chunk' && msg.audio && msg.channel) {
        const channel = msg.channel as 'system_audio' | 'user_mic';
        
        // Initialize Gemini Live Session for this channel if not exists
        if (!session.geminiSessions[channel]) {
           const targetLang = channel === 'system_audio' ? session.settings.systemTargetLanguage : session.settings.userTargetLanguage;
           const voiceName = channel === 'system_audio' ? session.settings.systemVoiceName : session.settings.userVoiceName;
           try {
               session.geminiSessions[channel] = await createGeminiLiveSession(clientWs, channel, targetLang, voiceName);
               console.log(`Initialized Gemini Live session for ${channel}`);
           } catch (e) {
               console.error(`Failed to create Gemini Live session for ${channel}`, e);
               return;
           }
        }

        const liveSession = session.geminiSessions[channel];
        if (liveSession) {
            // Forward PCM audio chunk to Gemini
            if (msg.audio.startsWith('data:')) {
              console.log('WARNING: msg.audio starts with data:!');
            }
            if (msg.audio.length < 100) {
              console.log('WARNING: msg.audio is too short! length:', msg.audio.length);
            }
            // Add this to confirm chunks are being sent
            console.log(`[Server] Forwarding ${msg.audio.length} bytes to Gemini channel ${channel}`);
            // Send correct object structure
            await liveSession.sendRealtimeInput({
              audio: {
                mimeType: "audio/pcm;rate=16000",
                data: msg.audio
              }
            });
        }
      }
    } catch (e) {
      console.error('Error processing websocket message', e);
    }
  });

  clientWs.on('close', () => {
    console.log('Client disconnected from WebSocket');
    if (session.geminiSessions.system_audio) {
        session.geminiSessions.system_audio.close();
    }
    if (session.geminiSessions.user_mic) {
        session.geminiSessions.user_mic.close();
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
