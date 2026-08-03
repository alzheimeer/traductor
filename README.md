# Traductor Voz A Voz Con Gemini 3.5 Live Traslate

![Software Interface](assets/software.png)

## 🇪🇸 Descripción (Español)
Este proyecto es una herramienta de traducción en tiempo real de voz a voz, diseñada principalmente para entrevistas de trabajo, el día a día laboral y para romper la barrera del idioma de forma fluida. Funciona a través de dos canales principales:

1. **Canal 1 (Traducción Externa):** Captura y traduce voz a voz el audio de la persona que habla al otro lado, ya sea en una videollamada, un video de YouTube o una conferencia. 
2. **Canal 2 (Micrófono Local):** Te permite hablar en tu idioma (español) a través del micrófono, y la persona al otro lado escuchará tu respuesta traducida al inglés.

---

## 🇬🇧 Description (English)
This project is a real-time voice-to-voice translation tool, designed primarily for job interviews, day-to-day work, and to seamlessly break the language barrier. It operates through two main channels:

1. **Channel 1 (External Translation):** Captures and translates voice-to-voice audio from the person speaking on the other side, whether in a video call, a YouTube video, or a conference.
2. **Channel 2 (Local Microphone):** Allows you to speak in your language (Spanish) through your microphone, and the person on the other side will hear your response translated into English.

---

### ⚙️ Configuración de Audio (Audio Setup)

#### 🇪🇸 Cómo usarlo en Teams / Zoom / Meet
Para que la otra persona te escuche en inglés y tú la escuches en español, necesitas instalar un controlador de audio virtual como **VB-Audio Virtual Cable**.

1. **Tu micrófono**: En la configuración de esta app, selecciona tu micrófono físico (ej. Auriculares). Tu voz (en español) entra por aquí.
2. **Salida de Traducción (Cable Virtual)**: En la app, selecciona `CABLE Input (VB-Audio Virtual Cable)`. La traducción de tu voz al inglés saldrá por este canal. En **Teams / Zoom / Meet**, configura tu micrófono como `CABLE Output`. ¡Así la otra persona te escuchará en inglés!
3. **Salida de Audio PC (Altavoces locales)**: En la app, selecciona tus auriculares físicos. Aquí escucharás la voz traducida de la otra persona (al español) directamente en tus oídos.

#### 🇬🇧 How to use it in Teams / Zoom / Meet
For the other person to hear you in English and for you to hear them in Spanish, you need to install a virtual audio driver like **VB-Audio Virtual Cable**.

1. **Your Microphone**: In this app's settings, select your physical microphone (e.g., Headset). Your voice (Spanish) goes in here.
2. **Translation Output (Virtual Cable)**: In the app, select `CABLE Input (VB-Audio Virtual Cable)`. The English translation of your voice will output here. In **Teams / Zoom / Meet**, set your microphone to `CABLE Output`. The other person will now hear you in English!
3. **PC Audio Output (Local Speakers)**: In the app, select your physical headset. You will hear the other person's translated voice (Spanish) directly in your ears here.

---

### 🔑 Modelo "Bring Your Own Key" (BYOK) / API Key Setup

#### 🇪🇸 Cómo usar tu propia clave de Google API
Esta aplicación funciona utilizando la avanzada inteligencia artificial de Google (Gemini Live). Para mantener la privacidad y los costos bajo control, utiliza el modelo **BYOK**.
1. Puedes obtener tu propia clave de API gratuita en [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Haz clic en el ícono de **Configuración** ⚙️ en la esquina superior derecha de la aplicación.
3. Pega tu clave en el campo **Google Gemini API Key**. 
*Nota: La clave se guarda de manera segura solo en tu navegador.*

#### 🇬🇧 How to use your own Google API Key
This application runs on Google's advanced AI (Gemini Live). To ensure privacy and zero server costs, it uses the **BYOK** model.
1. You can get your own free API Key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click the **Settings** ⚙️ icon in the top right corner of the app.
3. Paste your key in the **Google Gemini API Key** field. 
*Note: Your key is securely saved locally in your browser.*

---

## Autor / Author
Niklauss Quintero Nick: Alzheimeer

## Licencia / License
Este proyecto está bajo la licencia [MIT](LICENSE) - siéntete libre de usarlo. / This project is licensed under the [MIT](LICENSE) License - feel free to use it.
