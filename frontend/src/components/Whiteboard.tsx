'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Pencil, Eraser, Square, Circle, Type, Trash2, Download,
  Undo, Redo, Sparkles, Award, Lightbulb, Star, Heart,
  Trophy, Zap, Target, CheckCircle, BookOpen, Rocket,
  ChevronLeft, ChevronRight, Volume2, Play, Pause, RefreshCw,
  Mic, Brain, Smile, Cloud, Flower, Tree, Animal, Fish, Bird
} from 'lucide-react'

interface WhiteboardProps {
  initialText?: string
  tutorGradient: string
  tutorType: 'maths' | 'science' | 'homework'
  currentSlide?: number
  totalSlides?: number
  onNextSlide?: () => void
  onPrevSlide?: () => void
}

type Tool = 'pencil' | 'eraser' | 'rectangle' | 'circle' | 'text' | 'highlighter' | 'magic'
type Color = string

// Subject-specific themes with kid-friendly colors
const THEMES = {
  maths: {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#06B6D4',
    bg: 'from-blue-400 via-indigo-400 to-purple-400',
    canvasBg: '#F0F9FF',
    icons: ['', '', '', '', '', '', '', '⭐', '', ''],
    stickers: ['⭐', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    title: 'Math Adventure',
    mascot: '',
    encouragement: ['Great Job!', 'Awesome!', 'Super Star!', 'Math Wizard!', 'Keep Going!', 'You\'re Amazing!', 'Fantastic!'],
    activityIcon: '',
    badgeColors: ['bg-yellow-400', 'bg-orange-400', 'bg-pink-400', 'bg-green-400', 'bg-blue-400'],
  },
  science: {
    primary: '#10B981',
    secondary: '#34D399',
    accent: '#06B6D4',
    bg: 'from-green-400 via-emerald-400 to-cyan-400',
    canvasBg: '#F0FDF4',
    icons: ['', '', '', '', '', '', '', '', '', ''],
    stickers: ['⭐', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    title: 'Science Lab',
    mascot: '',
    encouragement: ['Excellent!', 'Amazing!', 'Little Scientist!', 'Great Discovery!', 'Wow!', 'Brilliant!', 'Curious Mind!'],
    activityIcon: '',
    badgeColors: ['bg-green-400', 'bg-emerald-400', 'bg-teal-400', 'bg-cyan-400', 'bg-blue-400'],
  },
  homework: {
    primary: '#EC4899',
    secondary: '#F472B6',
    accent: '#A855F7',
    bg: 'from-pink-400 via-purple-400 to-indigo-400',
    canvasBg: '#FDF2F8',
    icons: ['', '', '', '', '', '', '', '⭐', '', ''],
    stickers: ['⭐', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    title: 'Learning Quest',
    mascot: '',
    encouragement: ['Perfect!', 'Well Done!', 'Super Learner!', 'Amazing Work!', 'You Got This!', 'Keep Shining!', 'Wonderful!'],
    activityIcon: '',
    badgeColors: ['bg-pink-400', 'bg-purple-400', 'bg-indigo-400', 'bg-blue-400', 'bg-cyan-400'],
  },
}

const COLORS = [
  { color: '#EF4444', name: 'Red', icon: '' },
  { color: '#F97316', name: 'Orange', icon: '🟠' },
  { color: '#EAB308', name: 'Yellow', icon: '🟡' },
  { color: '#22C55E', name: 'Green', icon: '🟢' },
  { color: '#3B82F6', name: 'Blue', icon: '' },
  { color: '#8B5CF6', name: 'Purple', icon: '🟣' },
  { color: '#EC4899', name: 'Pink', icon: '🩷' },
  { color: '#000000', name: 'Black', icon: '' },
]

// Fun lesson templates for each subject (ages 5-9)
const LESSON_TEMPLATES = {
  maths: [
    {
      title: ' Let\'s Count!',
      content: 'Count the stars: ⭐⭐⭐⭐⭐\nHow many stars?\n\n +  = ?',
      activity: 'Draw 5 more stars and count them!',
      reward: '⭐ Star Counter Badge',
    },
    {
      title: ' Addition Fun',
      content: '2 + 3 = ?\n +  = ?\n\nLet\'s add together!',
      activity: 'Draw apples and solve!',
      reward: ' Math Hero Badge',
    },
    {
      title: ' Subtraction Time',
      content: '5 - 2 = ?\n\nPop 2 balloons!',
      activity: 'Cross out 2 balloons!',
      reward: ' Subtraction Star',
    },
    {
      title: ' Multiplication Magic',
      content: '3 × 2 = ?\n    \n3 groups of 2',
      activity: 'Count all the cookies!',
      reward: ' Multiplication Master',
    },
    {
      title: ' Shape Explorer',
      content: 'Can you find:\n⬜ Square (4 equal sides)\n Triangle (3 sides)\n⭕ Circle (round)',
      activity: 'Draw each shape 3 times!',
      reward: ' Shape Detective',
    },
    {
      title: ' Division Fun',
      content: '6 ÷ 2 = ?\n\nShare equally between 2 friends',
      activity: 'Draw 2 circles and share!',
      reward: '⭐ Division Champion',
    },
    {
      title: ' Number Patterns',
      content: 'What comes next?\n2, 4, 6, 8, __\n\n5, 10, 15, __, __',
      activity: 'Complete the patterns!',
      reward: ' Pattern Wizard',
    },
    {
      title: ' Measuring',
      content: 'Which is longer? \n or ?\n or ?',
      activity: 'Draw and compare!',
      reward: ' Measurement Pro',
    },
  ],
  science: [
    {
      title: ' Rainbow Colors',
      content: 'ROYGBIV\nRed, Orange, Yellow\nGreen, Blue, Indigo, Violet\n +  = ',
      activity: 'Draw a beautiful rainbow!',
      reward: ' Color Master',
    },
    {
      title: ' Plant Life',
      content: 'Plant Parts:\n Roots (drink water)\n Stem (holds up plant)\n Leaves (make food)\n Flower (makes seeds)',
      activity: 'Draw a complete plant!',
      reward: ' Little Botanist',
    },
    {
      title: ' Butterfly Life Cycle',
      content: 'Egg  → Caterpillar  → Chrysalis  → Butterfly ',
      activity: 'Draw all 4 stages!',
      reward: ' Nature Scientist',
    },
    {
      title: ' Solar System',
      content: ' Sun (center star)\n Earth (our home)\n Moon (orbits Earth)',
      activity: 'Draw the Sun, Earth and Moon!',
      reward: ' Space Explorer',
    },
    {
      title: ' Water Cycle',
      content: ' Sun warms water\n Evaporation (goes up)\n Condensation (clouds)\n Precipitation (rain)',
      activity: 'Draw the water cycle!',
      reward: ' Weather Wizard',
    },
    {
      title: ' States of Matter',
      content: 'Solid  (ice)\nLiquid  (water)\nGas  (steam)\n\nHeat makes things change!',
      activity: 'Draw ice, water and steam!',
      reward: ' Science Star',
    },
    {
      title: ' Human Body',
      content: ' Brain (thinks)\n Heart (pumps blood)\n🫁 Lungs (breathe)\n Bones (support)',
      activity: 'Draw and label body parts!',
      reward: ' Body Expert',
    },
    {
      title: ' Volcanoes',
      content: 'Magma (inside) → Lava (outside)\n Volcano erupts!\n Hot lava flows',
      activity: 'Draw an erupting volcano!',
      reward: ' Geology Genius',
    },
  ],
  homework: [
    {
      title: ' Phonics Fun',
      content: 'Today\'s Sound: "CH"\n CHoo CHoo\n CHocolate\n CHampion',
      activity: 'Write 3 more "CH" words!',
      reward: ' Phonics Champion',
    },
    {
      title: ' Sentence Building',
      content: 'Complete the sentence:\nMy favorite animal is ______\nbecause ________________',
      activity: 'Write a complete sentence!',
      reward: ' Writing Star',
    },
    {
      title: ' Daily Goals',
      content: 'Today I will:\n Read for 20 minutes\n Practice math facts\n Help someone\n Learn something new',
      activity: 'Check off your goals!',
      reward: ' Goal Getter',
    },
    {
      title: ' Spelling Bee',
      content: 'Unscramble the words:\nT A C = ___ \nD O G = ___ \nS I H F = ___ ',
      activity: 'Write the correct words!',
      reward: ' Spelling Star',
    },
    {
      title: ' Creative Writing',
      content: 'Story Starter:\nOnce upon a time, a little dragon discovered...',
      activity: 'Finish the story!',
      reward: ' Story Master',
    },
    {
      title: ' Reading Comprehension',
      content: 'Read and answer:\nThe cat sat on the mat. It was sleeping.\n\nQ: What was the cat doing?',
      activity: 'Write the answer!',
      reward: ' Reading Rockstar',
    },
    {
      title: ' Memory Game',
      content: 'Look at these words:\nApple, Book, Cat, Dog\n\nNow close your eyes and remember!',
      activity: 'Write all 4 words from memory!',
      reward: ' Memory Master',
    },
    {
      title: ' Positive Affirmations',
      content: 'I am... \n Smart\n Brave\n Kind\n Creative',
      activity: 'Complete: "I am..."',
      reward: '⭐ Confidence Champion',
    },
  ],
}

export default function Whiteboard({
  initialText = '',
  tutorGradient,
  tutorType = 'maths',
  currentSlide = 1,
  totalSlides = 5,
  onNextSlide,
  onPrevSlide
}: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentTool, setCurrentTool] = useState<Tool>('pencil')
  const [currentColor, setCurrentColor] = useState(COLORS[4].color)
  const [lineWidth, setLineWidth] = useState(5)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [boardText, setBoardText] = useState(initialText)
  const [showTextBoard, setShowTextBoard] = useState(true)
  const [textInput, setTextInput] = useState('')
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null)
  const [stickers, setStickers] = useState<Array<{ icon: string; x: number; y: number; size: number }>>([])
  const [selectedSticker, setSelectedSticker] = useState(THEMES[tutorType].stickers[0])
  const [showStickerPanel, setShowStickerPanel] = useState(false)
  const [history, setHistory] = useState<ImageData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [stars, setStars] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [currentLesson, setCurrentLesson] = useState(LESSON_TEMPLATES[tutorType][0])
  const [showLesson, setShowLesson] = useState(true)
  const [magicTrail, setMagicTrail] = useState<Array<{x: number, y: number, color: string}>>([])
  const [badges, setBadges] = useState<string[]>([])
  const [showBadges, setShowBadges] = useState(false)
  const [activityLog, setActivityLog] = useState<Array<{id: number, text: string, icon: string, time: string}>>([])
  const [showActivityPanel, setShowActivityPanel] = useState(false)
  const [streak, setStreak] = useState(0)
  const [level, setLevel] = useState(1)
  const [experience, setExperience] = useState(0)
  const [showLevelUp, setShowLevelUp] = useState(false)

  const theme = THEMES[tutorType]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    context.lineCap = 'round'
    context.lineJoin = 'round'
    setCtx(context)

    context.fillStyle = theme.canvasBg
    context.fillRect(0, 0, canvas.width, canvas.height)

    saveState()
    
    // Add initial activity
    addActivity('Started learning!', '', 'Just now')
  }, [])

  // Add activity to log
  const addActivity = (text: string, icon: string, time?: string) => {
    const newActivity = {
      id: Date.now(),
      text,
      icon,
      time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setActivityLog(prev => [newActivity, ...prev.slice(0, 9)])
  }

  // Award badge
  const awardBadge = (badgeName: string, badgeIcon: string) => {
    if (!badges.includes(badgeName)) {
      setBadges(prev => [...prev, badgeName])
      triggerCelebration()
      addActivity(`Earned: ${badgeName}`, badgeIcon)
    }
  }

  // Add experience points
  const addExperience = (points: number) => {
    const newExp = experience + points
    const expForNextLevel = level * 100
    
    if (newExp >= expForNextLevel) {
      setLevel(prev => prev + 1)
      setExperience(newExp - expForNextLevel)
      setShowLevelUp(true)
      setTimeout(() => setShowLevelUp(false), 3000)
      addActivity(`Level Up! Now level ${level + 1}`, '⬆')
    } else {
      setExperience(newExp)
    }
  }

  useEffect(() => {
    if (ctx) {
      ctx.strokeStyle = currentColor
      ctx.lineWidth = lineWidth
      ctx.font = `bold ${lineWidth * 8}px Arial`
    }
  }, [currentColor, lineWidth, ctx])

  useEffect(() => {
    setCurrentLesson(LESSON_TEMPLATES[tutorType][currentSlide - 1] || LESSON_TEMPLATES[tutorType][0])
  }, [currentSlide, tutorType])

  const saveState = () => {
    const canvas = canvasRef.current
    if (!canvas || !ctx) return
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(imageData)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0 && ctx) {
      const newIndex = historyIndex - 1
      ctx.putImageData(history[newIndex], 0, 0)
      setHistoryIndex(newIndex)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1 && ctx) {
      const newIndex = historyIndex + 1
      ctx.putImageData(history[newIndex], 0, 0)
      setHistoryIndex(newIndex)
    }
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
    if (currentTool === 'text') {
      const coords = getCoordinates(e)
      setTextPosition(coords)
      return
    }

    if (currentTool === 'sticker') {
      const coords = getCoordinates(e)
      addSticker(coords.x, coords.y)
      return
    }

    const coords = getCoordinates(e)
    setStartPos(coords)
    setIsDrawing(true)

    if (currentTool === 'pencil' || currentTool === 'eraser' || currentTool === 'highlighter' || currentTool === 'magic') {
      ctx?.beginPath()
      ctx?.moveTo(coords.x, coords.y)
    }
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !ctx) return

    const coords = getCoordinates(e)

    if (currentTool === 'pencil') {
      ctx.lineTo(coords.x, coords.y)
      ctx.stroke()
    } else if (currentTool === 'eraser') {
      ctx.strokeStyle = theme.canvasBg
      ctx.lineWidth = lineWidth * 3
      ctx.lineTo(coords.x, coords.y)
      ctx.stroke()
      ctx.strokeStyle = currentColor
      ctx.lineWidth = lineWidth
    } else if (currentTool === 'highlighter') {
      ctx.strokeStyle = currentColor + '40'
      ctx.lineWidth = lineWidth * 3
      ctx.lineTo(coords.x, coords.y)
      ctx.stroke()
      ctx.strokeStyle = currentColor
      ctx.lineWidth = lineWidth
    } else if (currentTool === 'magic') {
      // Rainbow magic trail
      const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']
      const colorIndex = Math.floor(Date.now() / 100) % rainbowColors.length
      ctx.strokeStyle = rainbowColors[colorIndex]
      ctx.lineWidth = lineWidth * 2
      ctx.lineTo(coords.x, coords.y)
      ctx.stroke()
      
      // Add sparkle effect
      setMagicTrail(prev => [...prev.slice(-20), { x: coords.x, y: coords.y, color: rainbowColors[colorIndex] }])
    } else if (currentTool === 'rectangle' || currentTool === 'circle') {
      redrawCanvas()
      
      const width = coords.x - startPos.x
      const height = coords.y - startPos.y

      ctx.strokeStyle = currentColor
      ctx.lineWidth = lineWidth

      if (currentTool === 'rectangle') {
        ctx.strokeRect(startPos.x, startPos.y, width, height)
      } else if (currentTool === 'circle') {
        const radiusX = Math.abs(width) / 2
        const radiusY = Math.abs(height) / 2
        const centerX = startPos.x + width / 2
        const centerY = startPos.y + height / 2
        ctx.beginPath()
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
        ctx.stroke()
      }
    }
  }

  const stopDrawing = () => {
    if (!isDrawing || !ctx) return
    setIsDrawing(false)
    ctx.beginPath()
    saveState()

    // Award stars and experience for drawing
    if (currentTool !== 'eraser') {
      const earnedStars = currentTool === 'magic' ? 2 : 1
      setStars(prev => prev + earnedStars)
      addExperience(earnedStars * 5)
      
      // Check for badge achievements
      if (stars + earnedStars >= 10) {
        awardBadge('Star Collector', '⭐')
      }
      if (stars + earnedStars >= 25) {
        awardBadge('Super Star', '')
      }
      if (stars + earnedStars >= 50) {
        awardBadge('Legend', '')
      }
      
      if ((stars + earnedStars) % 5 === 0) {
        triggerCelebration()
      }
    }
  }

  const redrawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas || !ctx) return

    ctx.fillStyle = theme.canvasBg
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    stickers.forEach(sticker => {
      ctx.font = `${sticker.size}px Arial`
      ctx.fillText(sticker.icon, sticker.x, sticker.y)
    })
  }

  const addSticker = (x: number, y: number) => {
    setStickers(prev => [...prev, {
      icon: selectedSticker,
      x,
      y,
      size: 40 + Math.random() * 20
    }])
    setStars(prev => prev + 2)
    addExperience(10)
    saveState()
    
    // Award sticker badges
    if (stickers.length + 1 >= 5) {
      awardBadge('Sticker Fun', '')
    }
    if (stickers.length + 1 >= 15) {
      awardBadge('Sticker Master', '')
    }
    
    if ((stars + 2) % 5 === 0) {
      triggerCelebration()
    }
  }

  const addText = () => {
    if (!textInput.trim() || !textPosition || !ctx) return

    ctx.fillStyle = currentColor
    ctx.font = 'bold 28px Arial'
    ctx.fillText(textInput, textPosition.x, textPosition.y)

    setTextInput('')
    setTextPosition(null)
    setStars(prev => prev + 3)
    addExperience(15)
    saveState()
    
    // Award writing badges
    if (stars + 3 >= 20) {
      awardBadge('Wordsmith', '')
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas || !ctx) return

    ctx.fillStyle = theme.canvasBg
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setStickers([])
    saveState()
  }

  const downloadCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `${tutorType}-masterpiece-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const triggerCelebration = () => {
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 3000)
  }

  const loadLessonTemplate = (index: number) => {
    setCurrentLesson(LESSON_TEMPLATES[tutorType][index])
    setBoardText(LESSON_TEMPLATES[tutorType][index].content)
    addActivity(`Started: ${LESSON_TEMPLATES[tutorType][index].title}`, '')
    addExperience(20)
  }

  const ToolButton = ({ 
    tool, 
    icon: Icon, 
    label,
    active,
    onClick,
    emoji
  }: any) => (
    <button
      onClick={onClick}
      className={`p-2.5 rounded-xl transition-all duration-200 group relative ${
        active
          ? 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white shadow-lg scale-110 ring-2 ring-yellow-300 animate-pulse'
          : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-blue-400 hover:scale-105'
      }`}
      title={label}
    >
      <div className="flex items-center gap-1">
        {emoji && <span className="text-lg">{emoji}</span>}
        <Icon size={18} strokeWidth={2.5} />
      </div>
    </button>
  )

  return (
    <div className={`flex flex-col h-full bg-gradient-to-br ${theme.bg}`}>
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute text-3xl animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-50px`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: '1s'
              }}
            >
              {['⭐', '', '', '', '', ''][Math.floor(Math.random() * 6)]}
            </div>
          ))}
        </div>
      )}

      {/* Level Up Celebration */}
      {showLevelUp && (
        <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 text-white px-8 py-6 rounded-3xl shadow-2xl animate-bounce text-center">
            <div className="text-6xl mb-2"></div>
            <div className="text-3xl font-black mb-1">LEVEL UP!</div>
            <div className="text-5xl font-black">Level {level}</div>
            <div className="text-xl mt-2 opacity-90">Keep learning! </div>
          </div>
        </div>
      )}

      {/* Magic Trail Effect */}
      {magicTrail.map((trail, i) => (
        <div
          key={i}
          className="absolute w-4 h-4 rounded-full pointer-events-none animate-ping"
          style={{
            left: trail.x,
            top: trail.y,
            backgroundColor: trail.color,
            opacity: 0.6
          }}
        />
      ))}

      {/* Top Bar with Stars, Level and Progress */}
      <div className={`bg-gradient-to-r from-${theme.primary} to-${theme.secondary} px-4 py-3 shadow-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl animate-bounce">{theme.mascot}</div>
            <div>
              <h3 className="text-white font-bold text-lg drop-shadow-md">{theme.title}</h3>
              <p className="text-white/90 text-xs font-medium">Lesson {currentSlide} of {totalSlides}</p>
            </div>
          </div>

          {/* Stars, Level and Progress */}
          <div className="flex items-center gap-3">
            {/* Level Badge */}
            <div className="hidden sm:flex flex-col items-center bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl">
              <span className="text-white/80 text-xs font-bold">LEVEL</span>
              <span className="text-white font-bold text-xl">{level}</span>
            </div>

            {/* Experience Bar */}
            <div className="hidden sm:flex flex-col items-center bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl min-w-[100px]">
              <div className="w-24 h-2 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-500"
                  style={{ width: `${(experience / (level * 100)) * 100}%` }}
                />
              </div>
              <span className="text-white/80 text-xs font-medium mt-1">XP: {experience}/{level * 100}</span>
            </div>

            {/* Stars Counter */}
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <Star className="text-yellow-300 fill-yellow-300 animate-pulse" size={24} />
              <span className="text-white font-bold text-xl">{stars}</span>
            </div>

            {/* Badges Button */}
            <button
              onClick={() => setShowBadges(!showBadges)}
              className="hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-xl hover:bg-white/30 transition-colors"
            >
              <Trophy className="text-yellow-300" size={20} />
              <span className="text-white font-bold">{badges.length}</span>
            </button>

            {/* Activity Button */}
            <button
              onClick={() => setShowActivityPanel(!showActivityPanel)}
              className="hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-xl hover:bg-white/30 transition-colors"
            >
              <RefreshCw className="text-white" size={20} />
              <span className="text-white font-bold text-xs">Activity</span>
            </button>

            {/* Progress Dots */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={onPrevSlide}
                disabled={currentSlide <= 1}
                className="p-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
              >
                <ChevronLeft size={20} className="text-white" />
              </button>
              <div className="flex gap-1">
                {[...Array(totalSlides)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all ${
                      i + 1 === currentSlide
                        ? 'bg-white scale-125 animate-pulse'
                        : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={onNextSlide}
                disabled={currentSlide >= totalSlides}
                className="p-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
              >
                <ChevronRight size={20} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fun Toolbar */}
      <div className="flex items-center gap-2 p-3 bg-white/95 backdrop-blur-sm border-b-4 border-blue-300 shadow-lg flex-wrap">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1.5 border-r-4 border-blue-200 pr-3">
          <ToolButton
            tool="pencil"
            icon={Pencil}
            label="Draw"
            active={currentTool === 'pencil'}
            onClick={() => setCurrentTool('pencil')}
            emoji=""
          />
          <ToolButton
            tool="highlighter"
            icon={Sparkles}
            label="Highlight"
            active={currentTool === 'highlighter'}
            onClick={() => setCurrentTool('highlighter')}
            emoji=""
          />
          <ToolButton
            tool="magic"
            icon={Zap}
            label="Magic"
            active={currentTool === 'magic'}
            onClick={() => setCurrentTool('magic')}
            emoji=""
          />
          <ToolButton
            tool="eraser"
            icon={Eraser}
            label="Erase"
            active={currentTool === 'eraser'}
            onClick={() => setCurrentTool('eraser')}
            emoji=""
          />
        </div>

        {/* Shapes */}
        <div className="flex items-center gap-1.5 border-r-4 border-purple-200 pr-3">
          <ToolButton
            tool="rectangle"
            icon={Square}
            label="Square"
            active={currentTool === 'rectangle'}
            onClick={() => setCurrentTool('rectangle')}
            emoji="⬜"
          />
          <ToolButton
            tool="circle"
            icon={Circle}
            label="Circle"
            active={currentTool === 'circle'}
            onClick={() => setCurrentTool('circle')}
            emoji="⭕"
          />
          <ToolButton
            tool="text"
            icon={Type}
            label="Text"
            active={currentTool === 'text'}
            onClick={() => setCurrentTool('text')}
            emoji=""
          />
        </div>

        {/* Fun Tools */}
        <div className="flex items-center gap-1.5 border-r-4 border-pink-200 pr-3">
          <ToolButton
            tool="sticker"
            icon={Award}
            label="Stickers"
            active={currentTool === 'sticker'}
            onClick={() => {
              setCurrentTool('sticker')
              setShowStickerPanel(!showStickerPanel)
            }}
            emoji=""
          />
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1.5 border-r-4 border-green-200 pr-3">
          {COLORS.map(({ color, name, icon }) => (
            <button
              key={color}
              onClick={() => {
                setCurrentColor(color)
              }}
              className={`w-9 h-9 rounded-full border-2 transition-all duration-200 hover:scale-125 ${
                currentColor === color
                  ? 'border-gray-800 shadow-lg scale-110 ring-2 ring-blue-400' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color }}
              title={name}
            >
              <span className="text-xs">{icon}</span>
            </button>
          ))}
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-2 border-r-4 border-orange-200 pr-3">
          <span className="text-xs font-bold text-gray-700">Size:</span>
          {[4, 7, 11, 16].map(size => (
            <button
              key={size}
              onClick={() => setLineWidth(size)}
              className={`rounded-full bg-gradient-to-br from-gray-700 to-gray-900 transition-all ${
                lineWidth === size 
                  ? 'scale-125 ring-2 ring-blue-400 shadow-lg' 
                  : 'opacity-60 hover:opacity-100 hover:scale-110'
              }`}
              style={{ width: size + 12, height: size + 12 }}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2.5 rounded-xl bg-white hover:bg-gray-50 border-2 border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105"
          >
            <Undo size={20} />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2.5 rounded-xl bg-white hover:bg-gray-50 border-2 border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105"
          >
            <Redo size={20} />
          </button>
          <button
            onClick={clearCanvas}
            className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border-2 border-red-200 transition-all hover:scale-105"
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={downloadCanvas}
            className="p-2.5 rounded-xl bg-green-50 hover:bg-green-100 text-green-600 border-2 border-green-200 transition-all hover:scale-105"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-3 p-3 overflow-hidden">
        {/* Lesson Panel - Left Side */}
        {showLesson && (
          <div className="w-1/3 min-w-[280px] bg-white rounded-2xl shadow-xl border-4 border-blue-200 overflow-hidden flex flex-col">
            {/* Lesson Header */}
            <div className={`bg-gradient-to-r from-${theme.primary} to-${theme.secondary} px-4 py-3`}>
              <div className="flex items-center justify-between">
                <h4 className="text-white font-bold text-sm flex items-center gap-2">
                  <BookOpen size={18} />
                  {currentLesson.title}
                </h4>
                <button
                  onClick={() => setShowLesson(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  
                </button>
              </div>
            </div>
            
            {/* Lesson Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 mb-3 border-2 border-yellow-300">
                <p className="text-sm font-medium text-gray-800 whitespace-pre-line leading-relaxed">
                  {currentLesson.content}
                </p>
              </div>

              <div className={`bg-gradient-to-br from-${theme.primary}-50 to-${theme.secondary}-50 rounded-xl p-4 border-2 border-${theme.primary}-300 mb-3`}>
                <div className="flex items-center gap-2 mb-2">
                  <Target size={16} className={`text-${theme.primary}-600`} />
                  <p className="text-xs font-bold text-gray-700">Your Mission:</p>
                </div>
                <p className="text-sm font-medium text-gray-800">{currentLesson.activity}</p>
              </div>

              {/* Reward Badge */}
              {currentLesson.reward && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Award size={16} className="text-purple-600" />
                    <p className="text-xs font-bold text-gray-700">Earn This Badge:</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl"></div>
                    <p className="text-sm font-bold text-purple-700">{currentLesson.reward}</p>
                  </div>
                </div>
              )}
              
              {/* Quick Load Templates */}
              <div className="mt-4">
                <p className="text-xs font-bold text-gray-600 mb-2">More Lessons:</p>
                <div className="grid grid-cols-2 gap-2">
                  {LESSON_TEMPLATES[tutorType].map((lesson, idx) => (
                    <button
                      key={idx}
                      onClick={() => loadLessonTemplate(idx)}
                      className={`p-2 rounded-lg text-xs font-medium transition-all hover:scale-105 ${
                        idx === currentSlide - 1
                          ? `bg-${theme.primary}-100 text-${theme.primary}-700 border-2 border-${theme.primary}-300`
                          : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {lesson.title.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Canvas Area - Right Side */}
        <div className={`flex-1 relative overflow-hidden bg-white rounded-2xl shadow-xl border-4 border-${theme.primary}-200`}>
          {/* Toggle Lesson Button */}
          {!showLesson && (
            <button
              onClick={() => setShowLesson(true)}
              className="absolute top-4 left-4 z-10 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:scale-105 transition-all font-bold text-sm flex items-center gap-2"
            >
              <BookOpen size={16} />
              Show Lesson
            </button>
          )}

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

          {/* Text Input Popup */}
          {textPosition && (
            <div
              className="absolute bg-white rounded-2xl shadow-2xl border-4 border-blue-400 p-4 flex gap-2 z-50 animate-in fade-in zoom-in duration-200"
              style={{ left: textPosition.x, top: textPosition.y }}
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addText()}
                placeholder="Write something..."
                className="border-2 border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 min-w-[200px]"
                autoFocus
              />
              <button
                onClick={addText}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 text-sm font-bold transition-all"
              >
                Add 
              </button>
              <button
                onClick={() => {
                  setTextPosition(null)
                  setTextInput('')
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Sticker Panel */}
          {showStickerPanel && (
            <div className="absolute top-4 right-4 bg-white rounded-2xl shadow-2xl border-4 border-purple-300 p-4 z-50 animate-in slide-in-from-right duration-300 max-w-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                  <Award size={20} className="text-yellow-500" />
                  Fun Stickers
                </h3>
                <button
                  onClick={() => setShowStickerPanel(false)}
                  className="p-2 hover:bg-purple-100 rounded-xl transition-colors"
                >
                  
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2 max-h-80 overflow-y-auto p-2 bg-purple-50 rounded-xl">
                {theme.stickers.map((sticker, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedSticker(sticker)
                      setCurrentTool('sticker')
                    }}
                    className={`p-3 rounded-xl text-3xl transition-all hover:scale-125 ${
                      selectedSticker === sticker
                        ? 'bg-purple-200 ring-2 ring-purple-400'
                        : 'bg-white hover:bg-purple-100'
                    }`}
                  >
                    {sticker}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3 text-center font-medium">
                 Click on canvas to place sticker!
              </p>
            </div>
          )}

          {/* Badges Panel */}
          {showBadges && (
            <div className="absolute top-4 right-4 bg-white rounded-2xl shadow-2xl border-4 border-yellow-400 p-4 z-50 animate-in slide-in-from-right duration-300 max-w-md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                  <Trophy size={20} className="text-yellow-500" />
                  My Badges ({badges.length})
                </h3>
                <button
                  onClick={() => setShowBadges(false)}
                  className="p-2 hover:bg-yellow-100 rounded-xl transition-colors"
                >
                  
                </button>
              </div>
              {badges.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2"></div>
                  <p className="text-sm text-gray-600 font-medium">Keep learning to earn badges!</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 bg-yellow-50 rounded-xl">
                  {badges.map((badge, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm border-2 border-yellow-200"
                    >
                      <div className="text-3xl mb-1"></div>
                      <p className="text-xs font-bold text-gray-700 text-center">{badge}</p>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-600 mt-3 text-center font-medium">
                Complete activities to earn badges!
              </p>
            </div>
          )}

          {/* Activity Log Panel */}
          {showActivityPanel && (
            <div className="absolute top-4 right-4 bg-white rounded-2xl shadow-2xl border-4 border-blue-400 p-4 z-50 animate-in slide-in-from-right duration-300 max-w-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                  <RefreshCw size={20} className="text-blue-500" />
                  Activity Log
                </h3>
                <button
                  onClick={() => setShowActivityPanel(false)}
                  className="p-2 hover:bg-blue-100 rounded-xl transition-colors"
                >
                  
                </button>
              </div>
              {activityLog.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2"></div>
                  <p className="text-sm text-gray-600 font-medium">No activity yet. Start learning!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto p-2 bg-blue-50 rounded-xl">
                  {activityLog.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm"
                    >
                      <span className="text-xl">{activity.icon}</span>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-800">{activity.text}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-600 mt-3 text-center font-medium">
                Your learning journey 
              </p>
            </div>
          )}

          {/* Encouragement Messages */}
          <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
            <div className="flex justify-center">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-3 rounded-full shadow-lg font-bold text-sm animate-bounce">
                {theme.encouragement[Math.floor(Math.random() * theme.encouragement.length)]} 
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Notes Panel */}
      {showTextBoard && (
        <div className="border-t-4 border-blue-200 bg-white/95 backdrop-blur-sm p-4 max-h-40 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
              <BookOpen size={20} />
              My Notes
            </h4>
            <div className="flex gap-2">
              <button
                onClick={() => setBoardText('')}
                className="text-xs text-red-600 hover:text-red-700 font-bold px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setShowTextBoard(false)}
                className="text-xs text-gray-600 hover:text-gray-700 font-bold px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Hide
              </button>
            </div>
          </div>
          <textarea
            value={boardText}
            onChange={(e) => setBoardText(e.target.value)}
            placeholder="Write your notes here..."
            className="w-full h-16 border-2 border-gray-200 rounded-xl p-3 text-sm resize-none focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all"
          />
          <div className="flex gap-2 mt-3 flex-wrap">
            {['', '', '', '', '⭐', ''].map(emoji => (
              <button
                key={emoji}
                onClick={() => setBoardText(prev => prev + emoji + ' ')}
                className="px-3 py-1.5 bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 text-gray-700 rounded-xl text-sm font-bold transition-all hover:scale-105 border-2 border-gray-200"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
