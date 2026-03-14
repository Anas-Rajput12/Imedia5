'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Mic, MicOff, Volume2, VolumeX, Languages, Activity } from 'lucide-react'

interface VoiceInputProps {
  onTranscription?: (text: string) => void
  onSpeakingStart?: () => void
  onSpeakingEnd?: () => void
  disabled?: boolean
  language?: 'en' | 'ur'
  placeholder?: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (event: Event) => void
  onend: (event: Event) => void
  onerror: (event: any) => void
  onresult: (event: any) => void
}

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export default function VoiceInput({
  onTranscription,
  onSpeakingStart,
  onSpeakingEnd,
  disabled = false,
  language = 'en',
  placeholder = 'Click to speak...',
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number>(0)

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = language === 'ur' ? 'ur-PK' : 'en-US'
      
      recognition.onstart = () => {
        setIsListening(true)
        setError(null)
        onSpeakingStart?.()
        startAudioLevelMonitoring()
      }
      
      recognition.onend = () => {
        setIsListening(false)
        onSpeakingEnd?.()
        stopAudioLevelMonitoring()
      }
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        
        if (event.error === 'no-speech') {
          setError('No speech detected. Please try again.')
        } else if (event.error === 'audio-capture') {
          setError('No microphone found. Please check your microphone.')
        } else if (event.error === 'not-allowed') {
          setError('Microphone permission denied. Please allow microphone access.')
        } else {
          setError(`Error: ${event.error}`)
        }
        
        setIsListening(false)
        stopAudioLevelMonitoring()
      }
      
      recognition.onresult = (event: any) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }
        
        setTranscript(interimTranscript || finalTranscript)
        
        if (finalTranscript) {
          onTranscription?.(finalTranscript)
          setTranscript('')
        }
      }
      
      recognitionRef.current = recognition
    } else {
      setError('Speech recognition not supported in this browser.')
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      stopAudioLevelMonitoring()
    }
  }, [language, onTranscription, onSpeakingStart, onSpeakingEnd])

  // Update language when changed
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'ur' ? 'ur-PK' : 'en-US'
    }
  }, [language])

  const startAudioLevelMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(Math.min(100, (average / 255) * 100))
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
        }
      }
      
      updateAudioLevel()
    } catch (err) {
      console.error('Error accessing microphone for audio level:', err)
    }
  }

  const stopAudioLevelMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    setAudioLevel(0)
  }

  const handleToggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Speech recognition not available')
      return
    }
    
    if (isListening) {
      recognitionRef.current.stop()
    } else {
      setError(null)
      recognitionRef.current.start()
    }
  }, [isListening])

  const handleClearError = () => {
    setError(null)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Voice Input Button */}
      <div className="relative">
        <button
          onClick={handleToggleListening}
          disabled={disabled}
          className={`
            relative
            w-16 h-16
            rounded-full
            flex items-center justify-center
            transition-all duration-300
            ${disabled
              ? 'bg-gray-300 cursor-not-allowed'
              : isListening
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-blue-500 hover:bg-blue-600'
            }
            text-white
            shadow-lg
            focus:outline-none focus:ring-4 focus:ring-blue-300
          `}
          title={isListening ? 'Stop listening' : 'Start speaking'}
        >
          {isListening ? (
            <MicOff size={28} strokeWidth={2.5} />
          ) : (
            <Mic size={28} strokeWidth={2.5} />
          )}
          
          {/* Audio level indicator ring */}
          {isListening && (
            <svg
              className="absolute inset-0 w-full h-full -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="white"
                strokeWidth="8"
                strokeDasharray={`${(audioLevel / 100) * 289} 289`}
                strokeLinecap="round"
                className="transition-all duration-100"
              />
            </svg>
          )}
        </button>
        
        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="absolute -top-2 -right-2">
            <div className="relative">
              <Volume2 size={20} className="text-green-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity size={12} className="text-green-600 animate-pulse" />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Language selector */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <Languages size={16} className="text-gray-500" />
        <select
          value={language}
          onChange={(e) => {
            // Language change handled by useEffect
          }}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        >
          <option value="en">English</option>
          <option value="ur">اردو (Urdu)</option>
        </select>
      </div>
      
      {/* Transcript display */}
      {(transcript || error) && (
        <div className="mt-4 p-4 bg-white rounded-lg shadow-md border border-gray-200">
          {error ? (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <VolumeX size={16} className="text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-red-600 font-medium text-sm">{error}</p>
                <button
                  onClick={handleClearError}
                  className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Mic size={16} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-700 text-sm">{transcript}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {isListening ? 'Listening...' : 'Processing...'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Status text */}
      <p className="mt-3 text-center text-sm text-gray-600">
        {disabled
          ? 'Voice input disabled'
          : isListening
            ? 'Listening... Speak now'
            : 'Click microphone to speak'
        }
      </p>
    </div>
  )
}
