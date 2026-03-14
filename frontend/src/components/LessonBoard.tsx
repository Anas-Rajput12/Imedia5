'use client'

import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'

interface LessonBoardProps {
  tutorType: 'maths' | 'science' | 'homework'
  currentSlide: number
  totalSlides: number
  onNextSlide: () => void
  onPrevSlide: () => void
  boardText?: string
  lessonTitle?: string
  lessonContent?: string
}

export default function LessonBoard({
  tutorType = 'maths',
  currentSlide = 1,
  totalSlides = 5,
  onNextSlide,
  onPrevSlide,
  boardText = '',
  lessonTitle = '',
  lessonContent = ''
}: LessonBoardProps) {

  // Color schemes based on tutor type
  const colorSchemes = {
    maths: {
      primary: 'from-blue-500 via-indigo-500 to-purple-600',
      secondary: 'from-blue-50 to-indigo-50',
      accent: 'text-blue-600',
      bgAccent: 'bg-blue-50',
      border: 'border-blue-200',
    },
    science: {
      primary: 'from-emerald-500 via-green-500 to-teal-600',
      secondary: 'from-emerald-50 to-green-50',
      accent: 'text-emerald-600',
      bgAccent: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    homework: {
      primary: 'from-purple-500 via-pink-500 to-rose-600',
      secondary: 'from-purple-50 to-pink-50',
      accent: 'text-purple-600',
      bgAccent: 'bg-purple-50',
      border: 'border-purple-200',
    },
  }

  const colors = colorSchemes[tutorType]

  return (
    <div className="w-full h-full flex flex-col bg-white">

      {/* Top Bar - Shows Current Lesson Topic */}
      <div className={`bg-gradient-to-r ${colors.primary} px-6 py-4 shadow-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">📖</div>
            <div>
              <h1 className="text-white font-black text-xl drop-shadow-lg text-center">
                {lessonTitle || 'Lesson'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="text-white w-6 h-6 opacity-80" />
          </div>
        </div>
      </div>

      {/* Lesson Content Area - Full Screen with Navigation */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Main Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
          <style jsx>{`
            .lesson-content-scroll::-webkit-scrollbar {
              width: 8px;
            }
            .lesson-content-scroll::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 10px;
            }
            .lesson-content-scroll::-webkit-scrollbar-thumb {
              background: #888;
              border-radius: 10px;
            }
            .lesson-content-scroll::-webkit-scrollbar-thumb:hover {
              background: #555;
            }
          `}</style>

          <div className="max-w-4xl mx-auto">

            {/* BOARD TEXT - Display ONLY content from Qdrant */}
            {boardText && (
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
                {/* Display ONLY PDF content - no headers/footers */}
                <div className="lesson-content-scroll text-gray-800 font-sans text-base leading-relaxed whitespace-pre-wrap">
                  {boardText}
                </div>
              </div>
            )}

            {/* Fallback to lesson content if no boardText */}
            {!boardText && lessonContent && (
              <div className={`bg-gradient-to-r ${colors.secondary} rounded-2xl shadow-lg border-2 ${colors.border} p-6`}>
                <p className="text-lg text-gray-800 whitespace-pre-line leading-relaxed">
                  {lessonContent}
                </p>
              </div>
            )}

            {/* Empty State */}
            {!boardText && !lessonContent && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-gray-600 mb-2">No Content Yet</h3>
                <p className="text-gray-500">Select a topic from Qdrant to view complete content</p>
              </div>
            )}

          </div>
        </div>

        {/* Navigation Buttons - Fixed at Bottom */}
        <div className="border-t border-gray-200 bg-white px-6 py-4 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={onPrevSlide}
              disabled={currentSlide <= 1}
              className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${colors.primary} text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 disabled:hover:scale-100`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Previous Page</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-600">
                Page {currentSlide} of {totalSlides}
              </span>
            </div>

            <button
              onClick={onNextSlide}
              disabled={currentSlide >= totalSlides}
              className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 disabled:hover:scale-100`}
            >
              <span>Next Page</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
