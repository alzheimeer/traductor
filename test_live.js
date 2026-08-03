import 'dotenv/config';
import { GoogleGenAI, Modality } from '@google/genai';

async function main() {
  const ai = new GoogleGenAI({});
  console.log('Connecting...');
  const session = await ai.live.connect({
    model: 'models/gemini-3.5-live-translate-preview',
    config: {
      responseModalities: [Modality.AUDIO],
      translationConfig: { 
          targetLanguageCode: 'es',
          echoTargetLanguage: true
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {}
    },
    callbacks: {
        onopen: () => console.log('OPENED'),
        onmessage: (msg) => console.log('MESSAGE:', Object.keys(msg)),
        onerror: (e) => console.log('ERROR:', e),
        onclose: (e) => console.log('CLOSED:', e.reason)
    }
  });
  console.log('Opened');
  
  const dummyAudio = Buffer.alloc(2730).toString('base64');
  
  for(let i=0; i<10; i++) {
    // Test object format
    session.sendRealtimeInput({ audio: {
      mimeType: "audio/pcm;rate=16000",
      data: dummyAudio
    } });
  }
  
  console.log('Sent audio chunks');
  await new Promise(r => setTimeout(r, 4000));
  console.log('Closing...');
  session.close();
}
main().catch(console.error);
