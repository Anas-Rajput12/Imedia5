'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, HelpCircle } from 'lucide-react';

interface ConfidenceInputProps {
  onSubmit: (confidence: number) => void;
  question?: string;
}

export default function ConfidenceInput({ onSubmit, question }: ConfidenceInputProps) {
  const [selectedConfidence, setSelectedConfidence] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const confidenceLevels = [
    { value: 1, label: 'Not confident', color: 'bg-red-100 border-red-300 text-red-700', emoji: '' },
    { value: 2, label: 'Somewhat unsure', color: 'bg-orange-100 border-orange-300 text-orange-700', emoji: '' },
    { value: 3, label: 'Neutral', color: 'bg-yellow-100 border-yellow-300 text-yellow-700', emoji: '' },
    { value: 4, label: 'Mostly confident', color: 'bg-blue-100 border-blue-300 text-blue-700', emoji: '' },
    { value: 5, label: 'Very confident', color: 'bg-green-100 border-green-300 text-green-700', emoji: '' },
  ];

  const handleSubmit = () => {
    if (selectedConfidence === null) return;
    onSubmit(selectedConfidence);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <p className="text-green-800 font-medium"> Confidence recorded!</p>
        <p className="text-sm text-green-600 mt-1">
          I'll use this to help tailor future lessons.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">How confident do you feel?</h3>
      </div>

      {question && (
        <p className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg">
          {question}
        </p>
      )}

      <div className="grid grid-cols-5 gap-2 mb-4">
        {confidenceLevels.map((level) => (
          <motion.button
            key={level.value}
            onClick={() => setSelectedConfidence(level.value)}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedConfidence === level.value
                ? level.color + ' shadow-md scale-105'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-2xl mb-1">{level.emoji}</div>
            <div className="text-xs font-medium">{level.label}</div>
          </motion.button>
        ))}
      </div>

      <motion.button
        onClick={handleSubmit}
        disabled={selectedConfidence === null}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-md"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Submit Confidence
      </motion.button>
    </div>
  );
}
