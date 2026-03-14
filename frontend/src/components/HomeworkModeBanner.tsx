'use client';

import React from 'react';
import { BookOpen, Lightbulb, Shield } from 'lucide-react';

interface HomeworkModeBannerProps {
  active?: boolean;
  message?: string;
  explanation?: string;
}

/**
 * Homework Mode Banner - Indicates when anti-cheating is active
 */
const HomeworkModeBanner: React.FC<HomeworkModeBannerProps> = ({
  active = true,
  message = "Learning Mode Active",
  explanation = "I'm here to help you learn, not to give answers. I'll show you similar examples and guide you step-by-step!"
}) => {
  if (!active) return null;

  return (
    <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200 p-3 sm:p-4">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm sm:text-base font-bold text-blue-900">
             {message}
          </h3>
          <p className="text-xs sm:text-sm text-blue-700 mt-1">
            {explanation}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-blue-600 bg-blue-100 px-3 py-1.5 rounded-full">
          <Shield className="w-4 h-4" />
          <span className="font-medium">Academic Integrity</span>
        </div>
      </div>
    </div>
  );
};

export default HomeworkModeBanner;
