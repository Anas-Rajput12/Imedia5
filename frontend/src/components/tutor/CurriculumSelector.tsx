'use client'

import React from 'react'
import * as ragService from '@/services/ragService'

interface CurriculumSelectorProps {
  type: string
  onTopicSelect: (subject: string, year: string, topic: string) => void
}

export default function CurriculumSelector({ type, onTopicSelect }: CurriculumSelectorProps) {
  const [subjects, setSubjects] = React.useState<string[]>([])
  const [years, setYears] = React.useState<string[]>([])
  const [topics, setTopics] = React.useState<ragService.CurriculumTopic[]>([])
  const [selectedSubject, setSelectedSubject] = React.useState<string>('')
  const [selectedYear, setSelectedYear] = React.useState<string>('')
  const [selectedTopic, setSelectedTopic] = React.useState<string>('')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    loadSubjects()
  }, [])

  React.useEffect(() => {
    if (selectedSubject) {
      loadYears(selectedSubject)
    }
  }, [selectedSubject])

  React.useEffect(() => {
    if (selectedSubject && selectedYear) {
      loadTopics(selectedSubject, selectedYear)
    }
  }, [selectedSubject, selectedYear])

  React.useEffect(() => {
    // Only notify parent when user explicitly selects a topic (not auto-select)
    if (selectedTopic && selectedSubject && selectedYear && topics.length > 0) {
      onTopicSelect(selectedSubject, selectedYear, selectedTopic)
    }
  }, [selectedTopic, selectedSubject, selectedYear, onTopicSelect])

  async function loadSubjects() {
    setLoading(true)
    try {
      const subjectList = await ragService.getSubjects()
      setSubjects(subjectList)
      
      // Map tutor type to subject - but DON'T auto-select
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      }
      const mapped = subjectMap[type] || 'Maths'
      // Only set if subjects exist, but don't trigger cascade
      if (subjectList.includes(mapped)) {
        // Don't auto-select - let user choose
      }
    } catch (error) {
      console.error('Error loading subjects:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadYears(subject: string) {
    try {
      const yearList = await ragService.getYears(subject)
      setYears(yearList)
      // Don't auto-select year - let user choose
    } catch (error) {
      console.error('Error loading years:', error)
    }
  }

  async function loadTopics(subject: string, keyStage: string) {
    try {
      const topicList = await ragService.getTopics(subject, keyStage)
      setTopics(topicList)
      // Don't auto-select topic - let user choose
    } catch (error) {
      console.error('Error loading topics:', error)
    }
  }

  function handleSubjectChange(subject: string) {
    setSelectedSubject(subject)
    setSelectedYear('')
    setSelectedTopic('')
  }

  function handleYearChange(year: string) {
    setSelectedYear(year)
    setSelectedTopic('')
  }

  function handleTopicChange(topic: string) {
    setSelectedTopic(topic)
    if (selectedSubject && selectedYear) {
      onTopicSelect(selectedSubject, selectedYear, topic)
    }
  }

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">📚 Curriculum:</span>
        </div>

        {/* Subject Selector */}
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={loading || subjects.length === 0}
        >
          <option value="">
            {loading && subjects.length === 0 ? 'Loading subjects...' : 'Select Subject'}
          </option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>

        {/* Year Selector */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={!selectedSubject || loading || years.length === 0}
        >
          <option value="">
            {!selectedSubject ? 'Select subject first' : loading ? 'Loading years...' : 'Select Year'}
          </option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        {/* Topic Selector */}
        <select
          value={selectedTopic}
          onChange={(e) => handleTopicChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1 min-w-[200px]"
          disabled={!selectedYear || loading || topics.length === 0}
        >
          <option value="">
            {!selectedYear ? 'Select year first' : loading ? 'Loading topics...' : 'Select Topic'}
          </option>
          {topics.map((t) => (
            <option key={t.topic} value={t.topic}>
              {t.topic} ({t.chunk_count} chunks)
            </option>
          ))}
        </select>

        {loading && (
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    </div>
  )
}
