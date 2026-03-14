/**
 * SMART AI Teacher Component
 * 
 * Implements the complete 7-step SMART teaching flow:
 * 1. Confirm year group + topic
 * 2. Diagnostic micro-check (1-3 questions)
 * 3. Teach in small chunk
 * 4. Guided example
 * 5. Student attempt
 * 6. Feedback
 * 7. Mastery check before moving on
 * 
 * Supports 3 tutor personas:
 * - Prof. Mathew (Maths)
 * - Dr. Science (Science)
 * - Teacher Alex (Homework)
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Lightbulb,
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Award,
  TrendingUp,
  MessageSquare,
  Send,
  Loader,
  Shield,
  Target,
  FileText,
  Video,
  Brain,
  Heart,
} from 'lucide-react';
import smartAiTeacherService, {
  DiagnosticQuestion,
  TeachingChunk,
  WorkedExample,
  Feedback,
  ProgressMetrics,
  SafeguardingAlert,
} from '@/services/smartAiTeacher.service';

interface SmartAiTeacherProps {
  topicId: string;
  topicName: string;
  tutorType: 'maths' | 'science' | 'homework';
  yearGroup?: string;
  examBoard?: string;
  studentId: string;
}

type TeachingStep =
  | 'confirm'
  | 'diagnostic'
  | 'submit_diagnostic'
  | 'teach'
  | 'example'
  | 'attempt'
  | 'feedback'
  | 'mastery'
  | 'complete';

export default function SmartAiTeacher({
  topicId,
  topicName,
  tutorType,
  yearGroup,
  examBoard,
  studentId,
}: SmartAiTeacherProps) {
  // State management
  const [currentStep, setCurrentStep] = useState<TeachingStep>('confirm');
  const [sessionId, setSessionId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Teaching content
  const [diagnosticQuestions, setDiagnosticQuestions] = useState<DiagnosticQuestion[]>([]);
  const [teachingChunk, setTeachingChunk] = useState<TeachingChunk | null>(null);
  const [workedExample, setWorkedExample] = useState<WorkedExample | null>(null);
  const [masteryQuestions, setMasteryQuestions] = useState<DiagnosticQuestion[]>([]);

  // Student responses
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);

  // Feedback & progress
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [progress, setProgress] = useState<ProgressMetrics | null>(null);
  const [safeguardingAlert, setSafeguardingAlert] = useState<SafeguardingAlert | null>(null);

  // UI state
  const [showVideo, setShowVideo] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; text: string; timestamp: Date }>>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tutor personas
  const tutorPersonas = {
    maths: {
      name: 'Prof. Mathew',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: BookOpen,
      description: 'Exam-board approved methods, step-by-step working',
    },
    science: {
      name: 'Dr. Science',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      icon: Lightbulb,
      description: 'Concept-based, interactive, question-led teaching',
    },
    homework: {
      name: 'Teacher Alex',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      icon: FileText,
      description: 'Guided help only, anti-cheating enforced',
    },
  };

  const currentTutor = tutorPersonas[tutorType];

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize session
  useEffect(() => {
    if (topicId && currentStep === 'confirm') {
      startSession();
    }
  }, [topicId]);

  /**
   * START SESSION - Step 1: Confirm
   */
  const startSession = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await smartAiTeacherService.startSession(topicId, tutorType, yearGroup);

      if (!response.success || !response.curriculum_lock.locked) {
        // Curriculum lock failed
        setError(response.curriculum_lock.message);
        setCurrentStep('confirm');
        return;
      }

      setSessionId(response.session_id);
      setDiagnosticQuestions(response.diagnostic_questions);
      addMessage('teacher', response.welcome_message);
      setCurrentStep('diagnostic');
    } catch (err: any) {
      setError(err.message || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  /**
   * SUBMIT DIAGNOSTIC - Step 2 → 3
   */
  const submitDiagnostic = async () => {
    setLoading(true);
    setError(null);

    try {
      const answers = diagnosticQuestions.map((q) => ({
        question: q.question,
        answer: diagnosticAnswers[q.id] || '',
      }));

      const response = await smartAiTeacherService.submitDiagnostic(
        sessionId,
        answers,
        topicId,
        tutorType,
        yearGroup
      );

      setTeachingChunk(response.teaching_chunk);
      addMessage('teacher', response.message);
      setCurrentStep('teach');
    } catch (err: any) {
      setError(err.message || 'Failed to submit diagnostic');
    } finally {
      setLoading(false);
    }
  };

  /**
   * GET WORKED EXAMPLE - Step 4
   */
  const getWorkedExample = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await smartAiTeacherService.getWorkedExample(
        sessionId,
        topicId,
        tutorType,
        yearGroup
      );

      setWorkedExample(response.worked_example);
      setCurrentStep('attempt');
    } catch (err: any) {
      setError(err.message || 'Failed to load example');
    } finally {
      setLoading(false);
    }
  };

  /**
   * SUBMIT ATTEMPT - Step 5 → 6
   */
  const submitAttempt = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await smartAiTeacherService.submitAttempt(
        sessionId,
        currentAnswer,
        topicId,
        tutorType,
        yearGroup,
        attempts
      );

      setFeedback(response.feedback);
      setProgress(response.progress);

      // Check for safeguarding alert
      if (response.safeguarding) {
        setSafeguardingAlert(response.safeguarding);
        addMessage('teacher', response.safeguarding.response);
      }

      // Check for integrity violation
      if (response.integrity_violation) {
        addMessage('teacher', response.integrity_violation.response);
        if (response.similar_example) {
          setWorkedExample(response.similar_example);
        }
      }

      // Handle personalisation adaptation
      if (response.personalisation) {
        if (response.personalisation.visual_analogy) {
          addMessage('teacher', `💡 ${response.personalisation.visual_analogy}`);
        }
        if (response.personalisation.scaffolded_steps) {
          addMessage(
            'teacher',
            `Let me break this down:\n${response.personalisation.scaffolded_steps.join('\n')}`
          );
        }
      }

      addMessage('teacher', response.feedback.message);
      setCurrentStep('feedback');
    } catch (err: any) {
      setError(err.message || 'Failed to submit attempt');
    } finally {
      setLoading(false);
    }
  };

  /**
   * GENERATE MASTERY CHECK - Step 7
   */
  const generateMasteryCheck = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await smartAiTeacherService.generateMasteryCheck(
        sessionId,
        topicId,
        tutorType,
        yearGroup
      );

      setMasteryQuestions(response.mastery_check.questions);
      setCurrentStep('mastery');
    } catch (err: any) {
      setError(err.message || 'Failed to generate mastery check');
    } finally {
      setLoading(false);
    }
  };

  /**
   * COMPLETE SESSION
   */
  const completeSession = async (passed: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const response = await smartAiTeacherService.completeSession(
        sessionId,
        passed,
        topicId,
        tutorType
      );

      setProgress(response.progress);
      addMessage('teacher', response.next_steps);
      setCurrentStep('complete');
    } catch (err: any) {
      setError(err.message || 'Failed to complete session');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add message to chat
   */
  const addMessage = (role: string, text: string) => {
    setMessages((prev) => [...prev, { role, text, timestamp: new Date() }]);
  };

  /**
   * Render teaching step indicator
   */
  const renderStepIndicator = () => {
    const steps = [
      { id: 'confirm', label: 'Confirm', icon: Target },
      { id: 'diagnostic', label: 'Check', icon: HelpCircle },
      { id: 'teach', label: 'Learn', icon: BookOpen },
      { id: 'example', label: 'Example', icon: Lightbulb },
      { id: 'attempt', label: 'Try', icon: FileText },
      { id: 'feedback', label: 'Feedback', icon: MessageSquare },
      { id: 'mastery', label: 'Mastery', icon: Award },
    ];

    const currentStepIndex = steps.findIndex((s) => s.id === currentStep.split('_')[0]);

    return (
      <div className="flex items-center justify-between mb-6 px-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                  isActive
                    ? `${currentTutor.bgColor} ${currentTutor.borderColor} ${currentTutor.color}`
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                } ${isCurrent ? 'ring-2 ring-offset-2 ring-blue-400' : ''}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 h-0.5 mx-2 ${
                    index < currentStepIndex ? currentTutor.color : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  /**
   * Render safeguarding alert
   */
  const renderSafeguardingAlert = () => {
    if (!safeguardingAlert) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-lg mb-4 ${
          safeguardingAlert.severity === 'critical'
            ? 'bg-red-50 border-2 border-red-300'
            : safeguardingAlert.severity === 'high'
            ? 'bg-orange-50 border-2 border-orange-300'
            : 'bg-yellow-50 border-2 border-yellow-300'
        }`}
      >
        <div className="flex items-start gap-3">
          <Heart className={`w-6 h-6 ${currentTutor.color} mt-1`} />
          <div className="flex-1">
            <h3 className={`font-semibold ${currentTutor.color} mb-2`}>
              {safeguardingAlert.type === 'self_harm'
                ? 'I\'m Here for You'
                : 'I Can See This is Challenging'}
            </h3>
            <p className="text-gray-700 mb-3">{safeguardingAlert.response}</p>
            <p className="text-sm text-gray-600 italic">{safeguardingAlert.trusted_adult_prompt}</p>
            {safeguardingAlert.escalate && (
              <div className="mt-3 flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Additional support recommended</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  /**
   * Render diagnostic questions
   */
  const renderDiagnosticQuestions = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <HelpCircle className={`w-5 h-5 ${currentTutor.color}`} />
        Quick Check - Let's See What You Know
      </h3>

      {diagnosticQuestions.map((question, index) => (
        <div key={question.id} className="p-4 bg-white rounded-lg border border-gray-200">
          <p className="font-medium text-gray-800 mb-3">
            Question {index + 1}: {question.question}
          </p>
          <textarea
            value={diagnosticAnswers[question.id] || ''}
            onChange={(e) =>
              setDiagnosticAnswers({ ...diagnosticAnswers, [question.id]: e.target.value })
            }
            placeholder="Type your answer here..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            rows={3}
          />
        </div>
      ))}

      <button
        onClick={submitDiagnostic}
        disabled={loading || Object.keys(diagnosticAnswers).length === 0}
        className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${
          loading || Object.keys(diagnosticAnswers).length === 0
            ? 'bg-gray-400 cursor-not-allowed'
            : `${currentTutor.color.replace('text', 'bg')} hover:opacity-90`
        }`}
      >
        {loading ? 'Submitting...' : 'Submit Answers →'}
      </button>
    </div>
  );

  /**
   * Render teaching chunk
   */
  const renderTeachingChunk = () => {
    if (!teachingChunk) return null;

    return (
      <div className="space-y-6">
        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">{teachingChunk.title}</h3>
          <p className="text-gray-700 whitespace-pre-line mb-4">{teachingChunk.content}</p>

          <div className="space-y-2 mb-4">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Key Points:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {teachingChunk.key_points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>

          {teachingChunk.analogies.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4" />
                Think of it like:
              </h4>
              <p className="text-blue-700">{teachingChunk.analogies[0]}</p>
            </div>
          )}

          {teachingChunk.video_suggestion && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Video className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-purple-800">Video Explanation</h4>
              </div>
              <p className="text-purple-700 mb-3">{teachingChunk.video_suggestion.description}</p>
              <button
                onClick={() => setShowVideo(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Watch Video ({teachingChunk.video_suggestion.duration})
              </button>
            </div>
          )}
        </div>

        <button
          onClick={getWorkedExample}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white ${currentTutor.color.replace('text', 'bg')} hover:opacity-90`}
        >
          Show Worked Example →
        </button>
      </div>
    );
  };

  /**
   * Render worked example
   */
  const renderWorkedExample = () => {
    if (!workedExample) return null;

    return (
      <div className="space-y-4">
        <div className="p-6 bg-white rounded-lg border-2 border-blue-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Worked Example
          </h3>

          <div className="p-4 bg-gray-50 rounded-lg mb-4">
            <p className="font-medium text-gray-800 mb-2">Problem:</p>
            <p className="text-gray-700">{workedExample.problem}</p>
          </div>

          <div className="space-y-3">
            <p className="font-semibold text-gray-800">Step-by-Step Solution:</p>
            {workedExample.steps.map((step, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <p className="text-gray-700 flex-1">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="font-semibold text-green-800">Final Answer:</p>
            <p className="text-green-700">{workedExample.final_answer}</p>
          </div>

          {workedExample.method_notes && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="font-semibold text-yellow-800 flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4" />
                Method Notes:
              </p>
              <p className="text-yellow-700">{workedExample.method_notes}</p>
            </div>
          )}

          {workedExample.exam_tips.length > 0 && (
            <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="font-semibold text-purple-800 flex items-center gap-2 mb-2">
                <Award className="w-4 h-4" />
                Exam Tips:
              </p>
              <ul className="list-disc list-inside space-y-1 text-purple-700">
                {workedExample.exam_tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setCurrentAnswer('');
            setAttempts(0);
          }}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white ${currentTutor.color.replace('text', 'bg')} hover:opacity-90`}
        >
          Now You Try!
        </button>
      </div>
    );
  };

  /**
   * Render student attempt
   */
  const renderAttempt = () => (
    <div className="space-y-4">
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Turn</h3>
        <p className="text-gray-600 mb-4">
          Show your working step-by-step. Remember to explain your thinking!
        </p>
        <textarea
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          placeholder="Type your answer and working here..."
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          rows={6}
        />
      </div>

      {attempts > 0 && (
        <div className="text-sm text-gray-600">
          Attempt {attempts + 1}
          {attempts >= 2 && (
            <p className="text-orange-600 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              Let me know if you need help!
            </p>
          )}
        </div>
      )}

      <button
        onClick={submitAttempt}
        disabled={loading || !currentAnswer.trim()}
        className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${
          loading || !currentAnswer.trim()
            ? 'bg-gray-400 cursor-not-allowed'
            : `${currentTutor.color.replace('text', 'bg')} hover:opacity-90`
        }`}
      >
        {loading ? 'Checking...' : 'Submit Answer →'}
      </button>
    </div>
  );

  /**
   * Render feedback
   */
  const renderFeedback = () => {
    if (!feedback) return null;

    return (
      <div className="space-y-4">
        <div
          className={`p-6 rounded-lg border-2 ${
            feedback.is_correct
              ? 'bg-green-50 border-green-300'
              : 'bg-orange-50 border-orange-300'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            {feedback.is_correct ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-orange-600" />
            )}
            <h3
              className={`text-lg font-bold ${
                feedback.is_correct ? 'text-green-800' : 'text-orange-800'
              }`}
            >
              {feedback.is_correct ? 'Excellent Work!' : 'Let\'s Learn from This'}
            </h3>
          </div>

          <p className="text-gray-700 mb-4">{feedback.message}</p>

          {feedback.error_type && (
            <div className="mb-4 p-3 bg-white rounded-lg border">
              <p className="text-sm text-gray-600">
                Error type: <span className="font-medium">{feedback.error_type}</span>
              </p>
            </div>
          )}

          <p className="font-semibold text-gray-800 mb-2">Next Step:</p>
          <p className="text-gray-700">{feedback.next_step}</p>

          <p className="mt-4 text-sm text-green-700 font-medium">{feedback.encouragement}</p>
        </div>

        <div className="flex gap-3">
          {!feedback.is_correct ? (
            <>
              <button
                onClick={() => {
                  setCurrentAnswer('');
                  setAttempts(attempts + 1);
                  setCurrentStep('attempt');
                }}
                className="flex-1 py-3 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Try Again
              </button>
              <button
                onClick={generateMasteryCheck}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Skip to Mastery Check
              </button>
            </>
          ) : (
            <button
              onClick={generateMasteryCheck}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white ${currentTutor.color.replace('text', 'bg')} hover:opacity-90`}
            >
              Continue to Mastery Check →
            </button>
          )}
        </div>
      </div>
    );
  };

  /**
   * Render mastery check
   */
  const renderMasteryCheck = () => (
    <div className="space-y-4">
      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h3 className="text-lg font-semibold text-purple-800 flex items-center gap-2 mb-2">
          <Award className="w-5 h-5" />
          Mastery Check
        </h3>
        <p className="text-purple-700 text-sm">
          Answer these questions to show you understand the topic.
        </p>
      </div>

      {masteryQuestions.map((question, index) => (
        <div key={question.id} className="p-4 bg-white rounded-lg border border-gray-200">
          <p className="font-medium text-gray-800 mb-3">
            Question {index + 1}: {question.question}
          </p>
          <textarea
            placeholder="Type your answer..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
            rows={3}
          />
        </div>
      ))}

      <div className="flex gap-3">
        <button
          onClick={() => completeSession(false)}
          className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Need More Practice
        </button>
        <button
          onClick={() => completeSession(true)}
          className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          I've Mastered This!
        </button>
      </div>
    </div>
  );

  /**
   * Render completion
   */
  const renderComplete = () => (
    <div className="text-center space-y-6">
      <div className="inline-block p-6 bg-green-50 rounded-full">
        <Award className="w-16 h-16 text-green-600" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Complete!</h2>
        <p className="text-gray-600">Great effort today!</p>
      </div>

      {progress && (
        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4">Your Progress</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{progress.mastery_percent}%</p>
              <p className="text-sm text-gray-600">Mastery</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{progress.attempts_count}</p>
              <p className="text-sm text-gray-600">Attempts</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-lg font-bold text-purple-600 capitalize">{progress.status}</p>
              <p className="text-sm text-gray-600">Status</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-lg font-bold text-orange-600 capitalize">{progress.trend}</p>
              <p className="text-sm text-gray-600">Trend</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Start New Topic
      </button>
    </div>
  );

  /**
   * Main render
   */
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className={`p-6 rounded-t-lg ${currentTutor.bgColor} border-b ${currentTutor.borderColor}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full bg-white ${currentTutor.color}`}>
            <currentTutor.icon className="w-8 h-8" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${currentTutor.color}`}>{currentTutor.name}</h1>
            <p className="text-gray-600">{currentTutor.description}</p>
            <p className="text-sm text-gray-500 mt-1">
              Topic: <span className="font-medium">{topicName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Main Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 min-h-[500px]">
        {renderSafeguardingAlert()}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 'diagnostic' && renderDiagnosticQuestions()}
            {currentStep === 'teach' && renderTeachingChunk()}
            {currentStep === 'example' && renderWorkedExample()}
            {currentStep === 'attempt' && renderAttempt()}
            {currentStep === 'feedback' && renderFeedback()}
            {currentStep === 'mastery' && renderMasteryCheck()}
            {currentStep === 'complete' && renderComplete()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Messages Panel */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4 max-h-64 overflow-y-auto">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Teacher Messages
        </h3>
        <div className="space-y-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                msg.role === 'teacher' ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
              }`}
            >
              <p className="text-sm text-gray-700">{msg.text}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
