'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  BookOpen,
  Filter,
  ChevronRight,
  Star,
  Zap,
  Target,
  X,
  Sparkles,
  Brain,
  TrendingUp
} from 'lucide-react';

interface CurriculumTopic {
  topic_id: string;
  topic_name: string;
  subject: string;
  year_level: number;
  difficulty_level: number;
  relevance_score?: number;
  learning_objectives?: string[];
  prerequisites?: string[];
  exam_board?: string;
}

interface TopicSearchProps {
  onSelectTopic: (topic: CurriculumTopic) => void;
  selectedYearGroup?: string;
  selectedSubject?: string;
}

export default function TopicSearch({
  onSelectTopic,
  selectedYearGroup,
  selectedSubject,
}: TopicSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CurriculumTopic[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<CurriculumTopic | null>(null);
  const [filterSubject, setFilterSubject] = useState(selectedSubject || 'all');
  const [filterYear, setFilterYear] = useState(selectedYearGroup || 'all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const debounceTimer = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);

      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/teaching/topics/search?query=${encodeURIComponent(query)}&subject=${filterSubject !== 'all' ? filterSubject : ''}&year_level=${filterYear !== 'all' ? filterYear : ''}`
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
        setHasSearched(true);
      }
    } catch (error) {
      console.error('Error searching topics:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    searchInputRef.current?.focus();
  };

  const getDifficultyColor = (level: number) => {
    if (level <= 3) return 'text-green-600 bg-green-50';
    if (level <= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getDifficultyLabel = (level: number) => {
    if (level <= 3) return 'Beginner';
    if (level <= 6) return 'Intermediate';
    return 'Advanced';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Search Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-6 h-6 text-blue-600" />
          <h3 className="font-bold text-gray-900">Find a Topic</h3>
          <Sparkles className="w-4 h-4 text-purple-500 ml-auto" />
          <span className="text-xs text-purple-600 font-medium">AI-Powered Search</span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for topics (e.g., 'algebra', 'fractions', 'photosynthesis')..."
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 mt-3 text-sm text-gray-600 hover:text-gray-900 transition"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
          <ChevronRight className={`w-4 h-4 transition ${showFilters ? 'rotate-90' : ''}`} />
        </button>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3 pt-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                  <select
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Subjects</option>
                    <option value="maths">Maths</option>
                    <option value="science">Science</option>
                    <option value="english">English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Year Group</label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Years</option>
                    {[5, 6, 7, 8, 9, 10, 11].map((year) => (
                      <option key={year} value={year.toString()}>
                        Year {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Results */}
      <div className="max-h-[600px] overflow-y-auto">
        {isSearching && (
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isSearching && hasSearched && searchResults.length === 0 && (
          <div className="text-center p-8 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">No topics found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        )}

        {!isSearching && !hasSearched && (
          <div className="p-8 text-center text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
            <p className="font-medium">Search for topics</p>
            <p className="text-sm mt-1">
              Type to search our curriculum database
            </p>

            {/* Suggested Searches */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {['Algebra', 'Fractions', 'Equations', 'Geometry', 'Percentages'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setSearchQuery(suggestion.toLowerCase())}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-full hover:bg-blue-100 transition border border-blue-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {!isSearching && hasSearched && searchResults.length > 0 && (
          <div className="divide-y divide-gray-200">
            <div className="p-3 bg-gray-50 border-b border-gray-200">
              <p className="text-sm text-gray-600">
                Found <span className="font-semibold">{searchResults.length}</span> topics
              </p>
            </div>

            {searchResults.map((topic) => (
              <motion.div
                key={topic.topic_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 hover:bg-gray-50 cursor-pointer transition"
                onClick={() => setSelectedTopic(topic)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{topic.topic_name}</h4>
                      {topic.relevance_score && topic.relevance_score > 0.8 && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      Year {topic.year_level} • {topic.subject}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(topic.difficulty_level)}`}>
                        {getDifficultyLabel(topic.difficulty_level)}
                      </span>
                      {topic.exam_board && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {topic.exam_board}
                        </span>
                      )}
                      {topic.prerequisites && topic.prerequisites.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Target className="w-3 h-3" />
                          {topic.prerequisites.length} prerequisites
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                {topic.learning_objectives && topic.learning_objectives.length > 0 && (
                  <div className="mt-3 pl-3 border-l-2 border-blue-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">You'll learn:</p>
                    <ul className="text-xs text-gray-500 space-y-0.5">
                      {topic.learning_objectives.slice(0, 2).map((obj, idx) => (
                        <li key={idx}>• {obj}</li>
                      ))}
                      {topic.learning_objectives.length > 2 && (
                        <li className="text-blue-600">+{topic.learning_objectives.length - 2} more...</li>
                      )}
                    </ul>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Topic Detail Modal */}
      {selectedTopic && (
        <TopicDetailModal
          topic={selectedTopic}
          onClose={() => setSelectedTopic(null)}
          onSelect={() => {
            onSelectTopic(selectedTopic);
          }}
        />
      )}
    </div>
  );
}

// Topic Detail Modal
function TopicDetailModal({
  topic,
  onClose,
  onSelect,
}: {
  topic: CurriculumTopic;
  onClose: () => void;
  onSelect: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">{topic.topic_name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                Year {topic.year_level} • {topic.subject}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Difficulty</p>
              <p className={`text-lg font-bold ${getDifficultyColor(topic.difficulty_level).split(' ')[0]}`}>
                {getDifficultyLabel(topic.difficulty_level)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Exam Board</p>
              <p className="text-lg font-bold text-gray-900">
                {topic.exam_board || 'All'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Prerequisites</p>
              <p className="text-lg font-bold text-gray-900">
                {topic.prerequisites?.length || 0}
              </p>
            </div>
          </div>

          {/* Learning Objectives */}
          {topic.learning_objectives && topic.learning_objectives.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Learning Objectives
              </h4>
              <ul className="space-y-2">
                {topic.learning_objectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prerequisites */}
          {topic.prerequisites && topic.prerequisites.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Prerequisites
              </h4>
              <div className="flex flex-wrap gap-2">
                {topic.prerequisites.map((prereq, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-purple-50 text-purple-700 text-sm rounded-lg border border-purple-200"
                  >
                    {prereq}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Why study this?</h4>
                <p className="text-sm text-blue-700">
                  This topic is fundamental to {topic.subject} and builds essential skills
                  for more advanced concepts. Mastering this will help you in future topics
                  and examinations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onSelect}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-md font-semibold"
          >
            Start Learning This Topic
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Helper component
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
