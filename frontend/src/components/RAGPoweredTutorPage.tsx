'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Mic,
  StopCircle,
  BookOpen,
  Brain,
  Target,
  ChevronRight,
  Volume2,
  VolumeX,
  Sparkles,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  GraduationCap,
  FileText
} from 'lucide-react';
import AvatarTeacher from './AvatarTeacher';

interface Message {
  id: string;
  sender: 'student' | 'teacher';
  text: string;
  timestamp: Date;
  boardText?: string;
  metadata?: any;
}

interface CurriculumTopic {
  topic_id: string;
  topic_name: string;
  subject: string;
  year_level: number;
  difficulty_level: number;
  learning_objectives?: string[];
  prerequisites?: string[];
  exam_board?: string;
  content?: string;
}

interface ChatSession {
  session_id: string;
  topic_id?: string;
  topic_name?: string;
  subject: string;
  year_group: string;
}

export default function RAGPoweredTutorPage() {
  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // State
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [boardText, setBoardText] = useState('');
  const [avatarMode, setAvatarMode] = useState<'explaining' | 'writing' | 'pointing' | 'idle'>('idle');
  
  // Selection state - ALL FROM DATABASE
  const [subjects, setSubjects] = useState<string[]>([]);
  const [yearGroups, setYearGroups] = useState<number[]>([]);
  const [topics, setTopics] = useState<CurriculumTopic[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<CurriculumTopic | null>(null);
  
  // UI state
  const [showTopicSelector, setShowTopicSelector] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [teachingStep, setTeachingStep] = useState<number>(1);
  const [conversationContext, setConversationContext] = useState<any[]>([]);

  // Load curriculum data from database on mount
  useEffect(() => {
    if (user) {
      loadCurriculumData();
    }
  }, [user]);

  const loadCurriculumData = async () => {
    try {
      // Load subjects (from curriculum topics)
      const subjectsResponse = await fetch('http://localhost:8000/api/teaching/curriculum/topics');
      if (subjectsResponse.ok) {
        const data = await subjectsResponse.json();
        const uniqueSubjects = Array.from(new Set(data.topics.map((t: any) => t.subject)));
        setSubjects(uniqueSubjects);
        
        // Auto-select first subject if available
        if (uniqueSubjects.length > 0 && !selectedSubject) {
          setSelectedSubject(uniqueSubjects[0]);
          loadYearGroups(uniqueSubjects[0]);
        }
      }

      // Load year groups (5-11)
      setYearGroups([5, 6, 7, 8, 9, 10, 11]);
    } catch (error) {
      console.error('Error loading curriculum data:', error);
    }
  };

  const loadYearGroups = async (subject: string) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/teaching/curriculum/topics?subject=${subject}`
      );
      if (response.ok) {
        const data = await response.json();
        const uniqueYears = Array.from(new Set(data.topics.map((t: any) => t.year_level)));
        setYearGroups(uniqueYears.sort());
      }
    } catch (error) {
      console.error('Error loading year groups:', error);
    }
  };

  const loadTopics = async (subject: string, year: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/teaching/curriculum/topics?subject=${subject}&year_group=${year}`
      );
      if (response.ok) {
        const data = await response.json();
        setTopics(data.topics || []);
      }
    } catch (error) {
      console.error('Error loading topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    setSelectedYear('');
    setSelectedTopic(null);
    setTopics([]);
    loadYearGroups(subject);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setSelectedTopic(null);
    if (selectedSubject) {
      loadTopics(selectedSubject, year);
    }
  };

  const handleTopicSelect = async (topic: CurriculumTopic) => {
    setSelectedTopic(topic);
    await startChatSession(topic);
  };

  const startChatSession = async (topic: CurriculumTopic) => {
    if (!user) return;

    try {
      const response = await fetch('http://localhost:8000/api/rag-chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.id,
          topic_id: topic.topic_id,
          subject: topic.subject,
          year_group: topic.year_level.toString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id);
        setShowTopicSelector(false);

        // Add welcome message
        const welcomeMessage: Message = {
          id: 'welcome',
          sender: 'teacher',
          text: data.message,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
        setConversationContext([{ role: 'assistant', content: data.message }]);

        // Set board text with topic info
        setBoardText(`${topic.subject.toUpperCase()} • Year ${topic.year_level}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n ${topic.topic_name}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${topic.content || topic.topic_name}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n Step 1: Introduction\n\nLet's begin!`);
        
        setAvatarMode('explaining');
        
        // Speak welcome message if not muted
        if (!isMuted) {
          speakResponse(data.message);
        }
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const sendMessage = async (message: string) => {
    if (!sessionId || !user || !message.trim()) return;

    setIsLoading(true);

    try {
      // Add student message
      const studentMessage: Message = {
        id: `student_${Date.now()}`,
        sender: 'student',
        text: message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, studentMessage]);
      setConversationContext(prev => [...prev, { role: 'user', content: message }]);

      // Send to RAG chatbot API with conversation history
      const response = await fetch('http://localhost:8000/api/rag-chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          student_id: user.id,
          message: message,
          topic_id: selectedTopic?.topic_id,
          include_working: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Add tutor response
        const tutorMessage: Message = {
          id: `tutor_${Date.now()}`,
          sender: 'teacher',
          text: data.response,
          timestamp: new Date(),
          metadata: data,
        };
        setMessages(prev => [...prev, tutorMessage]);
        setConversationContext(prev => [...prev, { role: 'assistant', content: data.response }]);

        // Update board text if provided
        if (data.board_text) {
          setBoardText(data.board_text);
        }

        // Update avatar mode
        if (data.avatar_mode) {
          setAvatarMode(data.avatar_mode as any);
        }

        // Update teaching step
        if (data.teaching_step) {
          setTeachingStep(data.teaching_step);
        }

        // Speak response if not muted
        if (!isMuted && data.response) {
          speakResponse(data.response);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        sender: 'teacher',
        text: "Sorry, I encountered an error. Please try again!",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakResponse = (text: string) => {
    if (typeof window === 'undefined') return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find British English voice
    const voices = window.speechSynthesis.getVoices();
    const britishVoice = voices.find(voice =>
      voice.lang.includes('en-GB') || voice.lang.includes('en_UK')
    );
    if (britishVoice) {
      utterance.voice = britishVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const formatMessageText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  const restartSession = () => {
    setSessionId('');
    setMessages([]);
    setConversationContext([]);
    setShowTopicSelector(true);
    setSelectedTopic(null);
    setBoardText('');
    setTeachingStep(1);
  };

  // Topic Selector Modal
  if (showTopicSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Brain className="w-10 h-10 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">AI Tutor</h1>
              <Sparkles className="w-6 h-6 text-purple-500" />
            </div>
            <p className="text-gray-600">Select your learning topic to begin</p>
          </div>

          {/* Selection Cards */}
          <div className="space-y-6">
            {/* Subject Selection */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <GraduationCap className="w-4 h-4 inline mr-2" />
                Select Subject
              </label>
              <div className="grid grid-cols-3 gap-3">
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => handleSubjectChange(subject)}
                    className={`p-4 rounded-xl border-2 transition ${
                      selectedSubject === subject
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <span className="text-lg font-semibold capitalize">{subject}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Year Group Selection */}
            {selectedSubject && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
              >
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Select Year Group
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {yearGroups.map((year) => (
                    <button
                      key={year}
                      onClick={() => handleYearChange(year.toString())}
                      className={`p-3 rounded-xl border-2 transition ${
                        selectedYear === year.toString()
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <span className="font-semibold">Year {year}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Topic Selection */}
            {selectedSubject && selectedYear && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
              >
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <BookOpen className="w-4 h-4 inline mr-2" />
                  Select Topic (from database)
                </label>
                
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-gray-500">Loading topics...</p>
                  </div>
                ) : topics.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No topics found for this selection</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {topics.map((topic) => (
                      <button
                        key={topic.topic_id}
                        onClick={() => handleTopicSelect(topic)}
                        className="p-4 rounded-xl border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition text-left"
                      >
                        <h3 className="font-semibold text-gray-900 mb-2">{topic.topic_name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="capitalize">{topic.subject}</span>
                          <span>•</span>
                          <span>Year {topic.year_level}</span>
                          <span>•</span>
                          <span>Difficulty: {topic.difficulty_level}/10</span>
                        </div>
                        {topic.learning_objectives && (
                          <ul className="mt-2 text-xs text-gray-600 space-y-1">
                            {topic.learning_objectives.slice(0, 2).map((obj, idx) => (
                              <li key={idx}>• {obj}</li>
                            ))}
                          </ul>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 text-sm">Real Curriculum Data</h4>
                <p className="text-xs text-blue-700 mt-1">
                  All topics are loaded from the database and aligned with the UK curriculum.
                  Topics include learning objectives, prerequisites, and difficulty levels.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Tutor Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Session Info */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-blue-600" />
                <h1 className="text-lg font-bold text-gray-900">AI Tutor</h1>
                <Sparkles className="w-4 h-4 text-purple-500" />
              </div>

              {selectedTopic && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">{selectedTopic.topic_name}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="capitalize">{selectedSubject}</span>
                <span>•</span>
                <span>Year {selectedYear}</span>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={restartSession}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="New Session"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto p-4 h-[calc(100vh-80px)]">
        <div className="grid grid-cols-12 gap-4 h-full">
          {/* Left: Avatar & Whiteboard */}
          <div className="col-span-8 flex flex-col gap-4">
            {/* Avatar and Whiteboard Section */}
            <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-2 h-full">
                {/* Avatar Side */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 border-r border-gray-200">
                  <div className="h-full flex flex-col">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-blue-600" />
                      AI Teacher
                    </h3>
                    <div className="flex-1 relative">
                      <AvatarTeacher
                        emotion={avatarMode === 'pointing' ? 'concerned' : avatarMode === 'writing' ? 'focused' : 'happy'}
                        isSpeaking={isSpeaking}
                        teachingMode={avatarMode}
                      />
                    </div>
                    {teachingStep && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Teaching Step:</span>
                          <span className="font-semibold text-blue-600">
                            Step {teachingStep}/7
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all"
                            style={{ width: `${(teachingStep / 7) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Whiteboard Side */}
                <div className="bg-white p-4 overflow-hidden">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    Whiteboard
                  </h3>
                  <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-300 p-4 overflow-y-auto">
                    {boardText ? (
                      <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                        {boardText}
                      </pre>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center">
                          <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Board content will appear here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Section */}
            <div className="h-[350px] bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col">
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  Chat (RAG-Powered)
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {isLoading ? (
                    <>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                      <span>AI is thinking...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                      <span>Ready</span>
                    </>
                  )}
                </div>
              </div>

              {/* Chat Messages */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === 'student' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.sender === 'student'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p
                        className="text-sm"
                        dangerouslySetInnerHTML={{ __html: formatMessageText(message.text) }}
                      />
                      <p className={`text-xs mt-1 ${message.sender === 'student' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputMessage)}
                    placeholder="Ask a question or type your answer..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />

                  <button
                    onClick={() => {
                      if (inputMessage.trim()) {
                        sendMessage(inputMessage);
                        setInputMessage('');
                      }
                    }}
                    disabled={isLoading || !inputMessage.trim()}
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Info Panel */}
          <div className="col-span-4 space-y-4">
            {/* Session Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Session Info
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Topic:</span>
                  <span className="font-medium text-blue-600 truncate max-w-[200px]">
                    {selectedTopic?.topic_name || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subject:</span>
                  <span className="font-medium capitalize">{selectedSubject}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Year:</span>
                  <span className="font-medium">Year {selectedYear}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Messages:</span>
                  <span className="font-medium">{messages.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Session ID:</span>
                  <span className="font-mono text-xs truncate max-w-[150px]">{sessionId}</span>
                </div>
              </div>
            </div>

            {/* RAG Info */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-4">
              <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                RAG-Powered Learning
              </h3>
              <ul className="text-xs text-purple-700 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>AI responses use real curriculum data from database</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Conversation context is maintained for natural dialogue</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>All conversations are saved to database</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Topics aligned with UK curriculum standards</span>
                </li>
              </ul>
            </div>

            {/* Safeguarding Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 text-sm">Safe Learning</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    This AI tutor follows safeguarding guidelines and curriculum lock.
                    All conversations are monitored and saved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple MessageCircle icon component
function MessageCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
