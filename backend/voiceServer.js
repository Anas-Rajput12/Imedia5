// Simple Voice Server - JavaScript Version
const WebSocket = require('ws');
const dotenv = require('dotenv');
const https = require('https');

dotenv.config();

const PORT = process.env.VOICE_PORT || 4000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`🎤 [VOICE SERVER] Starting on port ${PORT}...`);
console.log(`🔑 Google TTS: ${process.env.GOOGLE_TTS_API_KEY ? '✅' : '❌'}`);

wss.on('connection', (ws) => {
  console.log('🎤 [VOICE SERVER] ✅ Student connected!');

  ws.on('message', async (message) => {
    console.log('🎤 [VOICE SERVER] 📩 Received audio chunk:', message.length, 'bytes');
    
    try {
      const testResponse = "Thank you for your question! This is a test response from AI teacher.";
      const audioBuffer = await textToSpeech(testResponse);
      
      console.log('🎤 [VOICE SERVER] 📤 Sending audio response:', audioBuffer.length, 'bytes');
      ws.send(audioBuffer);
    } catch (error) {
      console.error('🎤 [VOICE SERVER] ❌ Error:', error.message);
    }
  });

  ws.on('close', () => {
    console.log('🎤 [VOICE SERVER] 🔌 Student disconnected');
  });

  ws.on('error', (error) => {
    console.error('🎤 [VOICE SERVER] ❌ WebSocket error:', error.message);
  });
});

function textToSpeech(text) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    
    const postData = JSON.stringify({
      input: { text },
      voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3' },
    });

    const options = {
      hostname: 'texttospeech.googleapis.com',
      path: `/v1/text:synthesize?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const parsed = JSON.parse(data);
        if (!parsed.audioContent) {
          reject(new Error('No audio content'));
        } else {
          resolve(Buffer.from(parsed.audioContent, 'base64'));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

console.log(`🎤 [VOICE SERVER] ✅ Server ready! ws://localhost:${PORT}`);
