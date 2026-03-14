'use client';

import { motion } from 'framer-motion';
import { Lightbulb, Sparkles } from 'lucide-react';

interface Analogy {
  type: 'visual' | 'real_world' | 'simplified';
  title: string;
  description: string;
  icon?: string;
}

interface AnalogyDisplayProps {
  analogy: Analogy;
  topicName?: string;
}

export default function AnalogyDisplay({
  analogy,
  topicName,
}: AnalogyDisplayProps) {
  const getAnalogyColor = (type: string) => {
    switch (type) {
      case 'visual': return 'from-blue-500 to-indigo-500 bg-blue-50 border-blue-200 text-blue-800';
      case 'real_world': return 'from-green-500 to-emerald-500 bg-green-50 border-green-200 text-green-800';
      case 'simplified': return 'from-amber-500 to-orange-500 bg-amber-50 border-amber-200 text-amber-800';
      default: return 'from-gray-500 to-gray-600 bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (analogy.type) {
      case 'visual': return '';
      case 'real_world': return '';
      case 'simplified': return '';
      default: return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br border-2 rounded-xl p-4 ${getAnalogyColor(analogy.type)}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5" />
        <h3 className="font-bold text-lg">{analogy.title}</h3>
        <span className="text-2xl">{getIcon()}</span>
      </div>

      <p className="text-sm leading-relaxed mb-3">
        {analogy.description}
      </p>

      {topicName && (
        <div className="flex items-center gap-2 text-xs opacity-75">
          <Sparkles className="w-3 h-3" />
          <span>Helps understand: {topicName}</span>
        </div>
      )}
    </motion.div>
  );
}
