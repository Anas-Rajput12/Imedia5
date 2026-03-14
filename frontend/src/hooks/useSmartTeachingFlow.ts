/**
 * SMART Teaching Flow - Frontend Hook
 * 
 * Manages:
 * - Slide-by-slide teaching
 * - Teacher explanations
 * - Question prompts
 * - Student chat questions
 * - Continue to next slide
 */

import { useState, useEffect } from 'react';

export interface Slide {
  slideNumber: number;
  title: string;
  content: string;
  keyPoints: string[];
  teacherScript: string;
  checkQuestion: string;
}

export interface TeachingState {
  currentSlide: number;
  totalSlides: number;
  isExplaining: boolean;
  waitingForQuestions: boolean;
  hasAnsweredQuestions: boolean;
  isComplete: boolean;
}

export function useSmartTeachingFlow(topicId: string, topicName: string) {
  const [state, setState] = useState<TeachingState>({
    currentSlide: 1,
    totalSlides: 3,
    isExplaining: true,
    waitingForQuestions: false,
    hasAnsweredQuestions: false,
    isComplete: false,
  });

  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState<Slide | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{
    role: 'teacher' | 'student';
    text: string;
    timestamp: Date;
  }>>([]);

  // Initialize teaching session
  useEffect(() => {
    async function initSession() {
      // Generate slides from topic content
      const generatedSlides: Slide[] = [
        {
          slideNumber: 1,
          title: `Introduction to ${topicName}`,
          content: 'Welcome to this lesson! Today we will learn the key concepts...',
          keyPoints: ['Main idea 1', 'Main idea 2', 'Main idea 3'],
          teacherScript: `Welcome! Today we're learning about ${topicName}. Let me start by explaining the basics...`,
          checkQuestion: 'Do you have any questions about this introduction?',
        },
        {
          slideNumber: 2,
          title: 'Main Concepts',
          content: 'Now let\'s dive deeper into the subject...',
          keyPoints: ['Key detail 1', 'Key detail 2', 'Important formula'],
          teacherScript: 'Now let\'s look at the main concepts in more detail...',
          checkQuestion: 'Is everything clear so far? Any questions?',
        },
        {
          slideNumber: 3,
          title: 'Examples & Practice',
          content: 'Let me show you some worked examples...',
          keyPoints: ['Example 1', 'Example 2', 'Common mistakes'],
          teacherScript: 'Let me walk you through some examples to help you understand better...',
          checkQuestion: 'Do you have any questions about these examples?',
        },
      ];

      setSlides(generatedSlides);
      setCurrentSlide(generatedSlides[0]);
    }

    initSession();
  }, [topicId, topicName]);

  /**
   * Teacher explains current slide
   */
  const explainSlide = () => {
    if (!currentSlide) return;

    setState(prev => ({
      ...prev,
      isExplaining: true,
      waitingForQuestions: false,
    }));

    // Add teacher explanation to chat
    addTeacherMessage(currentSlide.teacherScript);
  };

  /**
   * Ask if student has questions
   */
  const askForQuestions = () => {
    if (!currentSlide) return;

    setState(prev => ({
      ...prev,
      isExplaining: false,
      waitingForQuestions: true,
      hasAnsweredQuestions: false,
    }));

    // Add teacher question to chat
    addTeacherMessage(currentSlide.checkQuestion);
  };

  /**
   * Handle student question
   */
  const handleStudentQuestion = async (question: string) => {
    // Add student question to chat
    addStudentMessage(question);

    // TODO: Call backend API to get answer
    // For now, use placeholder
    const answer = await getAnswerFromBackend(question);
    addTeacherMessage(answer);

    setState(prev => ({
      ...prev,
      hasAnsweredQuestions: true,
    }));
  };

  /**
   * Continue to next slide
   */
  const nextSlide = () => {
    const nextNum = state.currentSlide + 1;

    if (nextNum > state.totalSlides) {
      // Teaching complete - move to mastery check
      setState(prev => ({
        ...prev,
        isComplete: true,
      }));
      addTeacherMessage('Excellent! You\'ve completed all the slides. Now let\'s check your understanding with a quick quiz!');
      return;
    }

    const nextSlideData = slides[nextNum - 1];
    setCurrentSlide(nextSlideData);

    setState(prev => ({
      ...prev,
      currentSlide: nextNum,
      isExplaining: true,
      waitingForQuestions: false,
      hasAnsweredQuestions: false,
    }));

    // Auto-explain next slide
    setTimeout(() => {
      explainSlide();
    }, 1000);
  };

  /**
   * Add teacher message to chat
   */
  const addTeacherMessage = (text: string) => {
    setChatMessages(prev => [
      ...prev,
      {
        role: 'teacher',
        text,
        timestamp: new Date(),
      },
    ]);
  };

  /**
   * Add student message to chat
   */
  const addStudentMessage = (text: string) => {
    setChatMessages(prev => [
      ...prev,
      {
        role: 'student',
        text,
        timestamp: new Date(),
      },
    ]);
  };

  /**
   * Get answer from backend (placeholder)
   */
  const getAnswerFromBackend = async (question: string): Promise<string> => {
    // TODO: Call backend API
    // const response = await fetch('/api/teaching/question', {
    //   method: 'POST',
    //   body: JSON.stringify({ question }),
    // });

    return 'Great question! Let me explain that more clearly...';
  };

  return {
    state,
    currentSlide,
    slides,
    chatMessages,
    explainSlide,
    askForQuestions,
    handleStudentQuestion,
    nextSlide,
    addTeacherMessage,
    addStudentMessage,
  };
}
