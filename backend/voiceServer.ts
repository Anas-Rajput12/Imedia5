/**
 * SIMPLE VOICE SERVER
 * Student Voice → Speech-to-Text → OpenRouter AI → Text-to-Speech → Audio
 */

import { WebSocketServer, WebSocket } from 'ws'
import * as dotenv from 'dotenv'

dotenv.config()

const PORT = parseInt(process.env.VOICE_PORT || '4000')
const wss = new WebSocketServer({ port: PORT })

console.log(`🎤 [VOICE SERVER] Starting on port ${PORT}...`)
console.log(`🔑 OpenRouter API: ${process.env.OPENROUTER_API_KEY ? '✅' : '❌'}`)
console.log(`🔑 Google TTS: ${process.env.GOOGLE_TTS_API_KEY ? '✅' : '❌'}`)

wss.on('connection', (ws: WebSocket) => {
  console.log('🎤 [VOICE SERVER] ✅ Student connected!')

  ws.on('message', async (message: Buffer) => {
    console.log('🎤 [VOICE SERVER] 📩 Received audio chunk:', message.length, 'bytes')
    
    try {
      // For now, just send back a test response
      const testResponse = "Thank you for your question! This is a test response from AI teacher."
      
      // Convert to speech using Google TTS
      const audioBuffer = await textToSpeech(testResponse)
      
      console.log('🎤 [VOICE SERVER] 📤 Sending audio response:', audioBuffer.length, 'bytes')
      ws.send(audioBuffer)
      
    } catch (error: any) {
      console.error('🎤 [VOICE SERVER] ❌ Error:', error.message)
    }
  })

  ws.on('close', () => {
    console.log('🎤 [VOICE SERVER] 🔌 Student disconnected')
  })

  ws.on('error', (error) => {
    console.error('🎤 [VOICE SERVER] ❌ WebSocket error:', error)
  })
})

/**
 * Text-to-Speech using Google Cloud TTS API
 */
async function textToSpeech(text: string): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY
  
  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
        audioConfig: { audioEncoding: 'MP3' },
      }),
    }
  )

  const data = await response.json()
  
  if (!data.audioContent) {
    throw new Error('No audio content from Google TTS')
  }
  
  return Buffer.from(data.audioContent, 'base64')
}

console.log(`🎤 [VOICE SERVER] ✅ Server ready! Listening on ws://localhost:${PORT}`)
console.log(`🎤 [VOICE SERVER] Test with: ws://localhost:${PORT}`)
