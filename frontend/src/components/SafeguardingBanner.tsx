'use client';

import React, { useState } from 'react';
import { Heart, Phone, X } from 'lucide-react';

interface SafeguardingBannerProps {
  severity?: 'low' | 'medium' | 'high' | 'critical';
  message?: string;
  helpline?: string;
  helplineNumber?: string;
  additionalResources?: string[];
  onClose?: () => void;
  persistent?: boolean;
}

/**
 * Safeguarding Banner - Displays supportive message when safeguarding concern detected
 * 
 * Features:
 * - Supportive, non-alarming design
 * - Helpline numbers (clickable)
 * - Encouragement to seek help
 * - Dismissible (unless persistent)
 */
const SafeguardingBanner: React.FC<SafeguardingBannerProps> = ({
  severity = 'medium',
  message = "I'm concerned about you and I want you to know that you're not alone.",
  helpline = "Childline",
  helplineNumber = "0800 1111",
  additionalResources = [
    "Talk to a trusted adult - parent, teacher, or school counselor",
    "You matter and your feelings are important",
    "These feelings are temporary and help is available"
  ],
  onClose,
  persistent = false
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const getSeverityColor = () => {
    switch (severity) {
      case 'critical':
        return 'bg-purple-900 border-purple-700';
      case 'high':
        return 'bg-purple-800 border-purple-600';
      case 'medium':
        return 'bg-purple-700 border-purple-500';
      case 'low':
        return 'bg-purple-600 border-purple-400';
      default:
        return 'bg-purple-700 border-purple-500';
    }
  };

  const handleClose = () => {
    if (!persistent) {
      setIsVisible(false);
      onClose?.();
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`w-full ${getSeverityColor()} text-white p-4 sm:p-6 border-b-2 shadow-lg`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-pink-300 fill-pink-300" />
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                I'm here for you 
              </h3>
              <p className="text-xs sm:text-sm text-purple-100 mt-1">
                Your wellbeing is the most important thing
              </p>
            </div>
          </div>
          
          {!persistent && (
            <button
              onClick={handleClose}
              className="text-purple-200 hover:text-white transition-colors p-1"
              title="Close (we'll still be here if you need us)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Message */}
        <p className="text-sm sm:text-base mb-4 leading-relaxed">
          {message}
        </p>

        {/* Helpline */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-pink-300" />
            <span className="text-sm font-semibold">Free, Confidential Support:</span>
          </div>
          <a 
            href={`tel:${helplineNumber}`}
            className="text-lg sm:text-xl font-bold text-pink-300 hover:text-pink-200 transition-colors block"
          >
            {helpline}: {helplineNumber}
          </a>
          <p className="text-xs text-purple-100 mt-1">
            Available 24/7. Free from mobiles and landlines.
          </p>
        </div>

        {/* Additional Resources */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {additionalResources.map((resource, index) => (
            <div 
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-xs sm:text-sm"
            >
              <div className="flex items-start gap-2">
                <span className="text-pink-300 mt-0.5"></span>
                <p className="text-purple-50">{resource}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-xs text-purple-200 mt-4 text-center italic">
          You are valuable. You are important. You deserve support. 
        </p>
      </div>
    </div>
  );
};

export default SafeguardingBanner;
