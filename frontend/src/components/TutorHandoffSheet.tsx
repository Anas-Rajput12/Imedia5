'use client';

import { motion } from 'framer-motion';
import { Mail, FileText, Calendar, AlertCircle } from 'lucide-react';

interface TutorHandoffSheetProps {
  studentName: string;
  topicName: string;
  masteryPercent: number;
  attemptsCount: number;
  errorPatterns: string[];
  adaptationsTried: string[];
  recommendation: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  onSend?: () => void;
}

export default function TutorHandoffSheet({
  studentName,
  topicName,
  masteryPercent,
  attemptsCount,
  errorPatterns,
  adaptationsTried,
  recommendation,
  urgency,
  onSend,
}: TutorHandoffSheetProps) {
  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Tutor Handoff Sheet
            </h2>
            <p className="text-purple-100 mt-1">Student needs additional support</p>
          </div>
          <div className={`px-4 py-2 rounded-full font-bold text-sm ${getUrgencyColor(urgency)}`}>
            {urgency.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Student Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Student</p>
            <p className="font-bold text-gray-900">{studentName}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Topic</p>
            <p className="font-bold text-gray-900">{topicName}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Current Mastery</p>
            <p className={`font-bold text-2xl ${
              masteryPercent >= 70 ? 'text-green-600' :
              masteryPercent >= 50 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {masteryPercent}%
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Total Attempts</p>
            <p className="font-bold text-gray-900">{attemptsCount}</p>
          </div>
        </div>

        {/* Error Patterns */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Error Patterns Detected
          </h3>
          <div className="flex flex-wrap gap-2">
            {errorPatterns.map((pattern, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium"
              >
                {pattern}
              </span>
            ))}
          </div>
        </div>

        {/* Adaptations Tried */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3">Adaptations Already Tried</h3>
          <div className="grid grid-cols-2 gap-2">
            {adaptationsTried.map((adaptation, index) => (
              <div
                key={index}
                className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800"
              >
                 {adaptation}
              </div>
            ))}
          </div>
        </div>

        {/* Recommendation */}
        <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl">
          <h3 className="font-bold text-purple-900 mb-2">AI Tutor Recommendation</h3>
          <p className="text-purple-800 leading-relaxed">{recommendation}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={onSend}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold shadow-md"
          >
            <Mail className="w-5 h-5" />
            Send to Human Tutor
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold">
            <Calendar className="w-5 h-5" />
            Schedule Session
          </button>
        </div>
      </div>
    </div>
  );
}
