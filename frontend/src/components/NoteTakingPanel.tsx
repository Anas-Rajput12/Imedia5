'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Save, Download } from 'lucide-react';

interface NoteTakingPanelProps {
  prompt?: string;
  onSave?: (notes: string) => void;
  topicName?: string;
}

export default function NoteTakingPanel({
  prompt = "Pause and write down the key points...",
  onSave,
  topicName,
}: NoteTakingPanelProps) {
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (onSave) {
      onSave(notes);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([notes], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${topicName || 'notes'}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-white border-2 border-amber-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-5 h-5 text-amber-600" />
        <h3 className="font-bold text-gray-900">Note-Taking Panel</h3>
      </div>

      {prompt && (
        <p className="text-sm text-amber-700 mb-3 p-2 bg-amber-50 rounded-lg">
           {prompt}
        </p>
      )}

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Type your notes here..."
        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all min-h-[150px]"
      />

      <div className="flex gap-2 mt-3">
        <motion.button
          onClick={handleSave}
          disabled={!notes.trim()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all font-medium text-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : 'Save Notes'}
        </motion.button>
        
        <motion.button
          onClick={handleDownload}
          disabled={!notes.trim()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all font-medium text-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Download className="w-4 h-4" />
          Download
        </motion.button>
      </div>
    </div>
  );
}
