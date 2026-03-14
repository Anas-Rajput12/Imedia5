'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface ExamBoardSelectorProps {
  selectedBoard: string;
  onSelect: (board: string) => void;
  yearGroup: string;
}

const EXAM_BOARDS = {
  '5': ['UK KS2', 'General'],
  '6': ['UK KS2', 'General'],
  '7': ['UK KS3', 'AQA', 'Edexcel', 'OCR', 'General'],
  '8': ['UK KS3', 'AQA', 'Edexcel', 'OCR', 'General'],
  '9': ['UK KS3', 'AQA', 'Edexcel', 'OCR', 'General'],
  '10': ['AQA', 'Edexcel', 'OCR', 'Cambridge', 'General'],
  '11': ['AQA', 'Edexcel', 'OCR', 'Cambridge', 'General'],
};

export default function ExamBoardSelector({
  selectedBoard,
  onSelect,
  yearGroup,
}: ExamBoardSelectorProps) {
  const availableBoards = EXAM_BOARDS[yearGroup as keyof typeof EXAM_BOARDS] || ['General'];

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-blue-600" />
        Select Exam Board
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        This ensures we use the correct methods for your school
      </p>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {availableBoards.map((board) => (
          <motion.button
            key={board}
            onClick={() => onSelect(board)}
            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
              selectedBoard === board
                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md'
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {board}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
