import { useRef, useCallback } from 'react'

/**
 * DIRECT VOICE-TO-VOICE COMMUNICATION
 * Student speaks → SpeechRecognition → OpenRouter API → Avatar speaks
 * NO chat messages, NO text shown - pure voice conversation!
 */
export default function useLiveVoice(
  onGetContext: () => Promise<{ topic: string; subject: string; year: string; context: string }>,
  onSpeakResponse: (text: string) => Promise<void>
) {
  const recognitionRef = useRef<any>(null)
  const isProcessingRef = useRef(false)

  const startVoice = useCallback(async () => {
    console.log('🎤 [DIRECT VOICE] Starting voice conversation...')
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('🎤 Voice not supported. Use Chrome or Edge.')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognitionRef.current = recognition

    // Welcome message (silent, just visual feedback)
    console.log('🎤 [DIRECT VOICE] 🟢 Listening... Speak now!')

    recognition.onstart = () => {
      console.log('🎤 [DIRECT VOICE] ✅ Listening active')
    }

    recognition.onresult = async (event: any) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        } else {
          interimTranscript += event.results[i][0].transcript
        }
      }

      // SHOW TRANSCRIPT IN CONSOLE (BIG & CLEAR)
      console.log('='.repeat(60))
      console.log('🎤 [DIRECT VOICE] 📝 YOU SAID:')
      console.log('   Interim:', interimTranscript)
      console.log('   ✅ FINAL:', finalTranscript.trim())
      console.log('='.repeat(60))

      // Process when we have final transcript
      if (finalTranscript.trim().length > 3 && !isProcessingRef.current) {
        isProcessingRef.current = true
        console.log('🎤 [DIRECT VOICE] 🧠 Processing:', finalTranscript.trim())
        console.log('🎤 [DIRECT VOICE] ⏳ Getting AI response...')

        try {
          // Get context from tutor page
          const { topic, subject, year, context } = await onGetContext()

          console.log('🎤 [DIRECT VOICE] 📚 Topic:', topic)
          console.log('🎤 [DIRECT VOICE] 📚 Subject:', subject)
          console.log('🎤 [DIRECT VOICE] 📚 Year:', year)

          // Call OpenRouter API directly
          console.log('🚀 [DIRECT VOICE] Calling OpenRouter API...')
          
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:3000',
            },
            body: JSON.stringify({
              model: 'meta-llama/llama-3-8b-instruct',
              messages: [
                {
                  role: 'system',
                  content: `You are a friendly AI teacher having a VOICE conversation with a student about ${topic}.
Keep responses VERY SHORT (20-40 seconds when spoken).
Speak naturally like a real teacher.
Use simple language.
End with "Does that make sense?"

Context: ${context}`,
                },
                {
                  role: 'user',
                  content: finalTranscript.trim(),
                },
              ],
              max_tokens: 150, // Very brief for voice
              temperature: 0.7,
            }),
          })

          const data = await response.json()
          const aiResponse = data.choices?.[0]?.message?.content || "Let me explain that..."

          // SHOW AI RESPONSE IN CONSOLE
          console.log('='.repeat(60))
          console.log('🤖 [DIRECT VOICE] ✅ AI RESPONSE:')
          console.log('   ' + aiResponse.replace(/\n/g, '\n   '))
          console.log('='.repeat(60))

          // Avatar speaks response (NO text shown in chat!)
          console.log('🔊 [DIRECT VOICE] 🔈 Speaking response...')
          await onSpeakResponse(aiResponse)

          console.log('🎤 [DIRECT VOICE] ✅ Response spoken!')
          console.log('='.repeat(60))

        } catch (error: any) {
          console.error('='.repeat(60))
          console.error('🔴 [DIRECT VOICE] ❌ ERROR:', error.message)
          console.error('='.repeat(60))
          await onSpeakResponse("Sorry, I'm having trouble. Can you try again?")
        } finally {
          isProcessingRef.current = false
          // Restart listening after response
          setTimeout(() => {
            try {
              recognition.start()
              console.log('🎤 [DIRECT VOICE] 🟢 Listening again...')
            } catch (e) {
              // Ignore
            }
          }, 1000)
        }
      }
    }

    recognition.onerror = (event: any) => {
      console.log('🎤 [DIRECT VOICE] Error:', event.error)
      if (event.error === 'no-speech') {
        console.log('🎤 [DIRECT VOICE] No speech detected')
      }
    }

    recognition.onend = () => {
      console.log('🎤 [DIRECT VOICE] Recognition ended')
      // Auto-restart if still in voice mode
      if (recognitionRef.current && !isProcessingRef.current) {
        setTimeout(() => {
          try {
            recognitionRef.current.start()
          } catch (e) {
            // Ignore
          }
        }, 500)
      }
    }

    try {
      recognition.start()
      console.log('🎤 [DIRECT VOICE] ✅ Voice conversation STARTED!')
    } catch (e) {
      console.error('🎤 [DIRECT VOICE] ❌ Could not start:', e)
    }
  }, [onGetContext, onSpeakResponse])

  const stopVoice = useCallback(() => {
    console.log('🎤 [DIRECT VOICE] Stopping voice conversation...')
    
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    isProcessingRef.current = false
    console.log('🎤 [DIRECT VOICE] ⏹️ Stopped!')
  }, [])

  return { 
    startVoice, 
    stopVoice, 
    isStreaming: recognitionRef.current !== null 
  }
}
