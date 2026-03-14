'use client'

import { useState, useRef } from 'react'
import { Play, Pause, Volume2, VolumeX, CheckCircle, HelpCircle } from 'lucide-react'

interface VideoPlayerProps {
  videoId: string
  title: string
  url: string
  source: string
  duration_secs: number
  before_task: string
  after_questions: string[]
  onVideoComplete?: (responses: Record<string, string>) => void
  onClose?: () => void
}

export default function VideoPlayer({
  videoId,
  title,
  url,
  source,
  duration_secs,
  before_task,
  after_questions,
  onVideoComplete,
  onClose,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [videoComplete, setVideoComplete] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)
  const [studentResponses, setStudentResponses] = useState<Record<string, string>>({})
  const videoRef = useRef<HTMLIFrameElement>(null)
  const timerRef = useRef<NodeJS.Timeout>()

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
    
    if (!isPlaying) {
      // Start timer when video plays
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1
          if (newTime >= duration_secs) {
            handleVideoEnd()
            return duration_secs
          }
          return newTime
        })
      }, 1000)
    } else {
      // Pause timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const handleVideoEnd = () => {
    setIsPlaying(false)
    setVideoComplete(true)
    setShowQuestions(true)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const handleResponseChange = (questionIndex: number, value: string) => {
    setStudentResponses(prev => ({
      ...prev,
      [`question_${questionIndex}`]: value,
    }))
  }

  const handleSubmitResponses = () => {
    onVideoComplete?.(studentResponses)
  }

  const getEmbedUrl = (videoUrl: string) => {
    // Extract video ID from YouTube URL
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const match = videoUrl.match(youtubeRegex)
    
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?enablejsapi=1`
    }
    
    // For other sources, return as is (in production, handle each source)
    return videoUrl
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border-2 border-purple-200">
      {/* Before Watching Task */}
      {!videoComplete && (
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
          <div className="flex items-start gap-3">
            <HelpCircle size={24} className="text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-blue-800 mb-1">Before You Watch</h3>
              <p className="text-blue-700">{before_task}</p>
            </div>
          </div>
        </div>
      )}

      {/* Video Player */}
      <div className="mb-6">
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
          <iframe
            ref={videoRef}
            src={getEmbedUrl(url)}
            title={title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoadedData={() => console.log('Video loaded')}
          />
          
          {/* Custom Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="w-full bg-gray-600 rounded-full h-1">
                <div
                  className="bg-purple-500 h-1 rounded-full transition-all"
                  style={{ width: `${(currentTime / duration_secs) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-white mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration_secs)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayPause}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                >
                  {isPlaying ? (
                    <Pause size={20} className="text-white" />
                  ) : (
                    <Play size={20} className="text-white" />
                  )}
                </button>
                
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                >
                  {isMuted ? (
                    <VolumeX size={20} className="text-white" />
                  ) : (
                    <Volume2 size={20} className="text-white" />
                  )}
                </button>
              </div>

              <div className="text-white text-sm font-medium">
                {source}
              </div>
            </div>
          </div>
        </div>

        {/* Video Info */}
        <div className="mt-4">
          <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
              {formatTime(duration_secs)}
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
              {source}
            </span>
          </div>
        </div>
      </div>

      {/* Post-Video Questions */}
      {showQuestions && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600 font-bold text-lg">
            <CheckCircle size={24} />
            Video Complete! Now let's check your understanding:
          </div>

          {after_questions.map((question, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
              <p className="font-medium text-gray-800 mb-3">
                Question {index + 1}: {question}
              </p>
              <textarea
                value={studentResponses[`question_${index}`] || ''}
                onChange={(e) => handleResponseChange(index, e.target.value)}
                placeholder="Type your answer here..."
                className="w-full p-3 border-2 border-gray-300 rounded-lg resize-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                rows={3}
              />
            </div>
          ))}

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSubmitResponses}
              className="flex-1 py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors"
            >
              Submit Answers
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="py-3 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold transition-colors"
              >
                Skip for Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Video Complete Message (if already watched) */}
      {videoComplete && !showQuestions && (
        <div className="text-center p-6 bg-green-50 rounded-xl border-2 border-green-300">
          <CheckCircle size={48} className="mx-auto mb-4 text-green-600" />
          <h3 className="text-xl font-bold text-green-800 mb-2">
            Video Watched!
          </h3>
          <p className="text-green-700 mb-4">
            Great job! Let's continue with the lesson.
          </p>
          <button
            onClick={() => setShowQuestions(true)}
            className="py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors"
          >
            Answer Questions
          </button>
        </div>
      )}
    </div>
  )
}
