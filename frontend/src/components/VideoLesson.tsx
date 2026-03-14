'use client';

import { motion } from 'framer-motion';
import { BookOpen, Video, Pause, Play } from 'lucide-react';

interface VideoLessonProps {
  videoUrl: string;
  videoTitle: string;
  duration: string;
  onPause?: () => void;
  onResume?: () => void;
  isPaused?: boolean;
}

export default function VideoLesson({
  videoUrl,
  videoTitle,
  duration,
  onPause,
  onResume,
  isPaused = false,
}: VideoLessonProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
        <div className="flex items-center gap-3">
          <Video className="w-6 h-6" />
          <div>
            <h3 className="font-bold text-lg">{videoTitle}</h3>
            <p className="text-sm text-blue-100">Duration: {duration}</p>
          </div>
        </div>
      </div>

      {/* Video Player Placeholder */}
      <div className="relative bg-black aspect-video">
        <iframe
          src={videoUrl}
          title={videoTitle}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        
        {/* Pause Overlay */}
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/70 flex items-center justify-center"
          >
            <div className="text-center text-white">
              <Pause className="w-16 h-16 mx-auto mb-4" />
              <p className="text-xl font-bold mb-2">Video Paused</p>
              <p className="text-sm text-gray-300">Take notes, then resume when ready</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex items-center justify-between">
          {/* Note-Taking Prompt */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BookOpen className="w-4 h-4" />
            <span>Pause and write down key points</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {onPause && !isPaused && (
              <button
                onClick={onPause}
                className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition font-medium text-sm"
              >
                <Pause className="w-4 h-4" />
                Pause for Notes
              </button>
            )}
            {onResume && isPaused && (
              <button
                onClick={onResume}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
              >
                <Play className="w-4 h-4" />
                Resume Lesson
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Note-Taking Area */}
      <div className="p-4 border-t">
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          Your Notes
        </h4>
        <textarea
          placeholder="Write down what you learned from this video..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={4}
        />
      </div>
    </div>
  );
}
