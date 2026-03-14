'use client'

import { useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'

interface Topic {
  id: string
  name: string
  description: string
  lessons: string[]
}

interface TopicSelectorProps {
  topics: Topic[]
  selectedTopic: string | null
  onSelectTopic: (topic: Topic) => void
  yearGroup?: string
}

export default function TopicSelector({
  topics,
  selectedTopic,
  onSelectTopic,
  yearGroup
}: TopicSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null)

  const filteredTopics = topics.filter(topic =>
    topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Select a Topic {yearGroup && `(Year ${yearGroup})`}
        </h3>
        <span className="text-sm text-gray-500">
          {filteredTopics.length} topics available
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search topics..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Topics List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredTopics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No topics found matching "{searchTerm}"</p>
          </div>
        ) : (
          filteredTopics.map((topic) => (
            <div
              key={topic.id}
              className={`border rounded-lg transition-all ${
                selectedTopic === topic.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Topic Header */}
              <div
                className="p-4 cursor-pointer flex items-center justify-between"
                onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{topic.name}</h4>
                  <p className="text-sm text-gray-600">{topic.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  {selectedTopic === topic.id && (
                    <span className="text-xs font-semibold text-blue-600">
                      Selected 
                    </span>
                  )}
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedTopic === topic.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Expanded Content */}
              {expandedTopic === topic.id && (
                <div className="px-4 pb-4 border-t border-gray-200 pt-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Lessons in this topic:
                  </h5>
                  <ul className="space-y-1">
                    {topic.lessons.map((lesson, index) => (
                      <li
                        key={index}
                        className="text-sm text-gray-600 flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        {lesson}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => onSelectTopic(topic)}
                    className={`mt-3 w-full py-2 rounded-lg font-medium transition-colors ${
                      selectedTopic === topic.id
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {selectedTopic === topic.id ? 'Selected' : 'Select This Topic'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
