'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Pencil, Eraser, Square, Circle, Type, Trash2, Download,
  Undo, Redo, Sparkles, Award, Star, Trophy, Zap, Target,
  BookOpen, Rocket, ChevronLeft, ChevronRight, Heart, Smile,
  Cloud, Sun, Moon
} from 'lucide-react'

interface WhiteboardKidProps {
  initialText?: string
  tutorType: 'maths' | 'science' | 'homework'
  currentSlide?: number
  totalSlides?: number
  onNextSlide?: () => void
  onPrevSlide?: () => void
  boardText?: string
  onBoardTextChange?: (text: string) => void
}

// Super colorful themes for kids
const THEMES = {
  maths: {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    bg: 'bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400',
    canvasBg: 'bg-gradient-to-br from-sky-100 via-blue-50 to-purple-50',
    title: 'Math Magic! ',
    mascot: '',
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'],
    floatingElements: ['', '', '', '', '', '', '', ''],
  },
  science: {
    primary: '#10B981',
    secondary: '#34D399',
    bg: 'bg-gradient-to-br from-green-400 via-emerald-400 to-cyan-400',
    canvasBg: 'bg-gradient-to-br from-green-100 via-emerald-50 to-cyan-50',
    title: 'Science Lab! ',
    mascot: '',
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'],
    floatingElements: ['', '', '', '', '', '', '', ''],
  },
  homework: {
    primary: '#EC4899',
    secondary: '#F472B6',
    bg: 'bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400',
    canvasBg: 'bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-50',
    title: 'Learning Quest! ',
    mascot: '',
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'],
    floatingElements: ['', '', '', '', '', '⭐', '', ''],
  },
}

// Fun lesson templates with BIG emojis
const LESSONS = {
  maths: [
    {
      title: ' Counting Stars!',
      content: '⭐⭐⭐⭐⭐\n\nHow many stars?\n\n +  = ?',
      activity: 'Count and draw more!',
    },
    {
      title: ' Addition Fun!',
      content: '2 + 3 = ?\n\n + \n\nLet\'s add!',
      activity: 'Draw apples and solve!',
    },
    {
      title: ' Subtraction!',
      content: '5 - 2 = ?\n\n\n\nPop 2 balloons!',
      activity: 'Cross out 2!',
    },
    {
      title: ' Multiplication!',
      content: '3 × 2 = ?\n\n    \n\n3 groups!',
      activity: 'Count cookies!',
    },
    {
      title: ' Shapes!',
      content: 'Draw these:\n⬜ Square\n Triangle\n⭕ Circle\n⭐ Star',
      activity: 'Draw all shapes!',
    },
  ],
  science: [
    {
      title: ' Rainbow!',
      content: 'ROYGBIV\n\nRed, Orange, Yellow\nGreen, Blue, Violet\n +  = ',
      activity: 'Draw a rainbow!',
    },
    {
      title: ' Plants!',
      content: ' Roots →  Stem →  Leaves →  Flower',
      activity: 'Draw a plant!',
    },
    {
      title: ' Life Cycle!',
      content: ' →  →  → \n\nEgg to Butterfly!',
      activity: 'Draw the cycle!',
    },
    {
      title: ' Solar System!',
      content: ' Sun (center)\n Earth (our home)\n Moon (orbits)',
      activity: 'Draw planets!',
    },
    {
      title: ' Water Cycle!',
      content: ' →  (up)\n (clouds)\n (rain)',
      activity: 'Draw water cycle!',
    },
  ],
  homework: [
    {
      title: ' Phonics!',
      content: 'Sound: "CH"\n\n CHoo CHoo\n CHocolate\n CHampion',
      activity: 'Write CH words!',
    },
    {
      title: ' Writing!',
      content: 'Complete:\n\nMy favorite animal is ___\n\nbecause ________',
      activity: 'Finish sentence!',
    },
    {
      title: ' Goals!',
      content: 'Today I will:\n Read 20 min\n Practice math\n Learn new thing',
      activity: 'Check goals!',
    },
    {
      title: ' Spelling!',
      content: 'Unscramble:\n\nT A C = ? \nD O G = ? \nS I H F = ? ',
      activity: 'Write words!',
    },
    {
      title: ' Story!',
      content: 'Once upon a time,\na little dragon...\n\nContinue the story!',
      activity: 'Finish story!',
    },
  ],
}

export default function WhiteboardKid({
  initialText = '',
  tutorType = 'maths',
  currentSlide = 1,
  totalSlides = 5,
  onNextSlide,
  onPrevSlide,
  boardText: externalBoardText,
  onBoardTextChange
}: WhiteboardKidProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentColor, setCurrentColor] = useState(THEMES[tutorType].colors[0])
  const [lineWidth, setLineWidth] = useState(8)
  const [currentTool, setCurrentTool] = useState<'pencil' | 'eraser' | 'rectangle' | 'circle' | 'text'>('pencil')
  const [boardText, setBoardText] = useState(initialText)
  const [currentLesson, setCurrentLesson] = useState(LESSONS[tutorType][0])
  const [stars, setStars] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [floatingElements, setFloatingElements] = useState<Array<{
    id: number
    emoji: string
    x: number
    y: number
    rotation: number
    scale: number
  }>>([])

  const theme = THEMES[tutorType]

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    context.lineCap = 'round'
    context.lineJoin = 'round'
    setCtx(context)

    // Fill with white
    context.fillStyle = '#FFFFFF'
    context.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  // Update lesson when slide changes
  useEffect(() => {
    const lessons = LESSONS[tutorType]
    const lessonIndex = (currentSlide - 1) % lessons.length
    setCurrentLesson(lessons[lessonIndex])
  }, [currentSlide, tutorType])

  // Sync with external board text
  useEffect(() => {
    if (externalBoardText && ctx) {
      redrawCanvas(externalBoardText)
    }
  }, [externalBoardText])

  // Create floating elements
  useEffect(() => {
    const elements = theme.floatingElements.map((emoji, i) => ({
      id: i,
      emoji,
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
    }))
    setFloatingElements(elements)
  }, [tutorType])

  const redrawCanvas = (text: string) => {
    const canvas = canvasRef.current
    if (!canvas || !ctx) return

    // Clear canvas
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw text
    ctx.fillStyle = '#1F2937'
    ctx.font = 'bold 24px Arial'
    
    const lines = text.split('\n')
    lines.forEach((line, i) => {
      ctx.fillText(line, 40, 60 + i * 35)
    })
  }

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX * scaleX - rect.left * scaleX,
        y: e.touches[0].clientY * scaleY - rect.top * scaleY,
      }
    }

    return {
      x: e.clientX * scaleX - rect.left * scaleX,
      y: e.clientY * scaleY - rect.top * scaleY,
    }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(e)
    
    if (currentTool === 'text') {
      // Add text at position
      const text = prompt('Enter text:')
      if (text && ctx) {
        ctx.fillStyle = currentColor
        ctx.font = 'bold 28px Arial'
        ctx.fillText(text, coords.x, coords.y)
        setStars(prev => prev + 5)
        triggerCelebration()
      }
      return
    }

    setIsDrawing(true)
    ctx?.beginPath()
    ctx?.moveTo(coords.x, coords.y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !ctx) return

    const coords = getCoordinates(e)

    if (currentTool === 'pencil') {
      ctx.strokeStyle = currentColor
      ctx.lineWidth = lineWidth
      ctx.lineTo(coords.x, coords.y)
      ctx.stroke()
    } else if (currentTool === 'eraser') {
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = lineWidth * 3
      ctx.lineTo(coords.x, coords.y)
      ctx.stroke()
    }
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    
    // Award stars for drawing
    if (currentTool !== 'eraser') {
      setStars(prev => prev + 1)
      if ((stars + 1) % 5 === 0) {
        triggerCelebration()
      }
    }
  }

  const triggerCelebration = () => {
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 2000)
  }

  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
  }

  const downloadCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `my-learning-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className={`w-full h-full flex flex-col ${theme.bg} rounded-3xl overflow-hidden shadow-2xl`}>
      
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {floatingElements.map((el) => (
          <div
            key={el.id}
            className="absolute animate-bounce"
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              fontSize: `${el.scale * 40}px`,
              transform: `rotate(${el.rotation}deg)`,
              animationDelay: `${el.id * 0.2}s`,
              animationDuration: '3s',
            }}
          >
            {el.emoji}
          </div>
        ))}
      </div>

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-8xl animate-bounce">⭐</div>
        </div>
      )}

      {/* Top Bar - Super Colorful */}
      <div className="relative z-10 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          {/* Title with Mascot */}
          <div className="flex items-center gap-3">
            <div className="text-4xl animate-bounce">{theme.mascot}</div>
            <div>
              <h2 className="text-white font-black text-xl drop-shadow-lg">{theme.title}</h2>
              <p className="text-white/90 text-xs font-bold">Lesson {currentSlide} of {totalSlides}</p>
            </div>
          </div>

          {/* Stars Counter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full">
              <Star className="text-yellow-300 fill-yellow-300 w-8 h-8 animate-pulse" />
              <span className="text-white font-black text-2xl">{stars}</span>
            </div>
            
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={onPrevSlide}
                disabled={currentSlide <= 1}
                className="p-2 bg-white/30 hover:bg-white/50 disabled:opacity-30 rounded-full transition-all"
              >
                <ChevronLeft className="text-white w-6 h-6" />
              </button>
              <div className="flex gap-1">
                {[...Array(totalSlides)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all ${
                      i + 1 === currentSlide ? 'bg-white scale-125' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={onNextSlide}
                disabled={currentSlide >= totalSlides}
                className="p-2 bg-white/30 hover:bg-white/50 disabled:opacity-30 rounded-full transition-all"
              >
                <ChevronRight className="text-white w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-3 p-4 relative z-10">
        
        {/* Lesson Panel - LEFT SIDE */}
        <div className="w-1/4 min-w-[250px] bg-white rounded-3xl shadow-2xl border-4 border-yellow-300 overflow-hidden flex flex-col">
          {/* Lesson Header */}
          <div className="bg-gradient-to-r from-blue-400 to-purple-400 px-4 py-3">
            <div className="flex items-center gap-2">
              <BookOpen className="text-white w-5 h-5" />
              <h3 className="text-white font-bold text-sm">Today's Lesson</h3>
            </div>
          </div>

          {/* Lesson Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {/* Title */}
            <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl p-4 mb-3 border-2 border-yellow-400">
              <p className="text-lg font-black text-gray-800">{currentLesson.title}</p>
            </div>

            {/* Content */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 mb-3 border-2 border-blue-300">
              <p className="text-sm font-medium text-gray-800 whitespace-pre-line leading-relaxed">
                {currentLesson.content}
              </p>
            </div>

            {/* Activity */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border-2 border-green-300">
              <div className="flex items-center gap-2 mb-2">
                <Target className="text-green-600 w-4 h-4" />
                <p className="text-xs font-bold text-gray-700">Your Mission:</p>
              </div>
              <p className="text-sm font-bold text-green-800">{currentLesson.activity}</p>
            </div>

            {/* Quick Lesson Switcher */}
            <div className="mt-4">
              <p className="text-xs font-bold text-gray-600 mb-2">More Lessons:</p>
              <div className="grid grid-cols-2 gap-2">
                {LESSONS[tutorType].map((lesson, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentLesson(lesson)
                      setBoardText(lesson.content)
                      onBoardTextChange?.(lesson.content)
                    }}
                    className="p-2 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-2 border-blue-200 text-xs font-bold transition-all hover:scale-105"
                  >
                    {lesson.title.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Area - RIGHT SIDE */}
        <div className="flex-1 bg-white rounded-3xl shadow-2xl border-4 border-blue-300 overflow-hidden relative">
          
          {/* Toolbar */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-white rounded-2xl shadow-2xl border-4 border-blue-200 p-2 flex items-center gap-2">
            {/* Pencil */}
            <button
              onClick={() => setCurrentTool('pencil')}
              className={`p-3 rounded-xl transition-all ${
                currentTool === 'pencil'
                  ? 'bg-gradient-to-br from-blue-400 to-purple-400 text-white scale-110 shadow-lg'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Pencil className="w-5 h-5" />
            </button>

            {/* Eraser */}
            <button
              onClick={() => setCurrentTool('eraser')}
              className={`p-3 rounded-xl transition-all ${
                currentTool === 'eraser'
                  ? 'bg-gradient-to-br from-pink-400 to-red-400 text-white scale-110 shadow-lg'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Eraser className="w-5 h-5" />
            </button>

            {/* Colors */}
            <div className="flex gap-1 px-2 border-l-2 border-gray-300">
              {theme.colors.map((color, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-125 ${
                    currentColor === color ? 'border-gray-800 scale-110 shadow-lg' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {/* Brush Size */}
            <div className="flex gap-1 px-2 border-l-2 border-gray-300">
              {[6, 10, 16, 24].map((size) => (
                <button
                  key={size}
                  onClick={() => setLineWidth(size)}
                  className={`rounded-full transition-all ${
                    lineWidth === size
                      ? 'bg-blue-400 scale-110'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  style={{ width: size, height: size }}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-1 px-2 border-l-2 border-gray-300">
              <button
                onClick={clearCanvas}
                className="p-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-600 transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={downloadCanvas}
                className="p-2 rounded-xl bg-green-100 hover:bg-green-200 text-green-600 transition-all"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full cursor-crosshair touch-none"
          />

          {/* Encouragement Message */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-3 rounded-full shadow-lg font-bold text-sm animate-bounce">
              ⭐ You're doing amazing! 
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
