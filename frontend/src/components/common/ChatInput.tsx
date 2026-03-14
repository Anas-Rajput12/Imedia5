'use client'

import { useState, useRef } from 'react'
import { Send, Paperclip, Mic, Square } from 'lucide-react'

interface ChatInputProps {
  onSendMessage?: (question: string) => void
  placeholder?: string
  disabled?: boolean
  isLoading?: boolean
  showAttachments?: boolean
  showVoice?: boolean
  // Support legacy props from tutor page
  question?: string
  setQuestion?: (question: string) => void
  handleSend?: () => void
  currentTutor?: any
}

export default function ChatInput({
  onSendMessage,
  placeholder = 'Ask anything...',
  disabled = false,
  isLoading = false,
  showAttachments = true,
  showVoice = true,
  question: externalQuestion,
  setQuestion: externalSetQuestion,
  handleSend: externalHandleSend
}: ChatInputProps) {
  const [question, setQuestion] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Use external question/setQuestion if provided, otherwise use internal state
  const questionValue = externalQuestion !== undefined ? externalQuestion : question
  const questionSetter = externalSetQuestion || setQuestion

  const handleSend = () => {
    console.log('ChatInput handleSend called, question:', questionValue)
    if (!questionValue || !questionValue.trim() || disabled || isLoading) {
      console.log('ChatInput: Cannot send - empty or disabled')
      return
    }

    // If external handleSend is provided, use it
    if (externalHandleSend) {
      console.log('ChatInput: Calling external handleSend')
      externalHandleSend()
    } else if (onSendMessage) {
      console.log('ChatInput: Calling onSendMessage')
      onSendMessage(questionValue)
      questionSetter('')
    }
  }

  const startVoice = () => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('')
        setQuestion(transcript)
      }

      recognitionRef.current.onend = () => {
        setIsRecording(false)
      }

      recognitionRef.current.start()
      setIsRecording(true)
    } else {
      alert('Voice recognition is not supported in your browser.')
    }
  }

  const stopVoice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  return (
    <div className="border-2 border-gray-300 rounded-xl bg-white shadow-sm">
      {/* Input Field - Fixed to ensure text is visible */}
      <div className="p-4">
        <div className="flex items-end gap-3">
          {/* Attachment Button */}
          {showAttachments && (
            <button
              type="button"
              className="flex-shrink-0 p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer z-10 text-gray-500 hover:text-gray-700"
              title="Attach file"
            >
              <Paperclip size={20} strokeWidth={2} />
            </button>
          )}

          {/* Text Input */}
          <textarea
            value={questionValue}
            onChange={(e) => questionSetter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={placeholder}
            className="flex-1 outline-none py-2.5 text-sm sm:text-base text-gray-900 placeholder-gray-400 bg-white resize-none max-h-32 leading-relaxed"
            style={{ minHeight: '40px' }}
            rows={1}
            disabled={disabled || isLoading}
          />

          {/* Voice Button */}
          {showVoice && (
            <button
              type="button"
              onClick={isRecording ? stopVoice : startVoice}
              className={`flex-shrink-0 p-2 rounded-full transition-all duration-200 cursor-pointer z-10 ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
              title={isRecording ? 'Stop recording' : 'Voice input'}
            >
              {isRecording ? (
                <Square size={20} fill="currentColor" strokeWidth={0} />
              ) : (
                <Mic size={20} strokeWidth={2} />
              )}
            </button>
          )}

          {/* Send Icon Button */}
          <button
            type="button"
            onClick={() => {
              handleSend()
            }}
            disabled={!questionValue.trim()}
            className={`flex-shrink-0 p-2 rounded-full transition-all duration-200 cursor-pointer z-10 ${
              questionValue.trim()
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-90 shadow-md hover:shadow-lg'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
            title="Send message"
          >
            <Send size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Helper Text */}
      {recognitionRef.current && (
        <div className="mt-2 text-center text-xs text-gray-400 pb-2">
          <p className="flex items-center justify-center gap-1">
            <Mic size={12} />
            Voice input available
          </p>
        </div>
      )}
    </div>
  )
}

