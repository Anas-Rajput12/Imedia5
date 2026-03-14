'use client';

import { motion } from 'framer-motion';
import { Target, CheckCircle } from 'lucide-react';

interface LearningObjective {
  id: string;
  text: string;
  completed: boolean;
}

interface LearningObjectivesDisplayProps {
  objectives: LearningObjective[];
  topicName: string;
  yearGroup: string;
  onObjectiveComplete?: (id: string, completed: boolean) => void;
}

export default function LearningObjectivesDisplay({
  objectives,
  topicName,
  yearGroup,
  onObjectiveComplete,
}: LearningObjectivesDisplayProps) {
  const completedCount = objectives.filter(o => o.completed).length;
  const totalCount = objectives.length;
  const progress = (completedCount / totalCount) * 100;

  const handleObjectiveClick = (id: string, currentStatus: boolean) => {
    if (onObjectiveComplete) {
      onObjectiveComplete(id, !currentStatus)
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-5 h-5 text-blue-600" />
        <h3 className="font-bold text-blue-900">Learning Objectives</h3>
      </div>

      <p className="text-sm text-blue-700 mb-3">
        <strong>Topic:</strong> {topicName} • <strong>Year {yearGroup}</strong>
      </p>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-blue-700 mb-1">
          <span>Progress</span>
          <span>{completedCount}/{totalCount} complete</span>
        </div>
        <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Objectives List */}
      <div className="space-y-2">
        {objectives.map((objective, index) => (
          <motion.div
            key={objective.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleObjectiveClick(objective.id, objective.completed)}
            className={`flex items-start gap-3 p-3 rounded-lg transition-all cursor-pointer hover:shadow-md ${
              objective.completed
                ? 'bg-green-50 border border-green-200'
                : 'bg-white border border-blue-100 hover:border-blue-300'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex-shrink-0 mt-0.5">
              {objective.completed ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-blue-300 bg-blue-50 group-hover:bg-blue-100 transition-colors" />
              )}
            </div>
            <p className={`text-sm flex-1 ${
              objective.completed ? 'text-green-800 line-through' : 'text-blue-800'
            }`}>
              {objective.text}
            </p>
            <span className="text-xs text-gray-400">
              {objective.completed ? ' Done' : 'Click to complete'}
            </span>
          </motion.div>
        ))}
      </div>

      <p className="text-xs text-blue-600 mt-3 text-center">
         Click on each objective to mark it as complete
      </p>
    </div>
  );
}
