'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Message {
  id: string;
  content: string;
  sender: 'student' | 'tutor';
}

const TUTOR_DATA: Record<string, { name: string; subject: string }> = {
  math: { name: 'Dr. Sarah Mitchell', subject: 'Mathematics' },
  science: { name: 'Prof. Emma Rodriguez', subject: 'Physics' },
  computer_science: { name: 'Dr. Jessica Taylor', subject: 'Computer Science' },
  english: { name: 'Ms. Olivia Johnson', subject: 'English Literature' },
  history: { name: 'Prof. Michael Chen', subject: 'World History' },
  geography: { name: 'Dr. Amelia Foster', subject: 'Geography' },
  french: { name: 'Madame Sophie Dubois', subject: 'French' },
  german: { name: 'Herr Klaus Weber', subject: 'German' },
  spanish: { name: 'Prof. Carmen Rodriguez', subject: 'Spanish' }
};

export default function TutorPage() {
  const params = useParams();
  const router = useRouter();

  const subjectId =
    typeof params?.subjectId === 'string'
      ? params.subjectId
      : 'math';

  const [tutorInfo, setTutorInfo] = useState(
    TUTOR_DATA[subjectId] || TUTOR_DATA.math
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Update tutor when subject changes
  useEffect(() => {
    setTutorInfo(TUTOR_DATA[subjectId] || TUTOR_DATA.math);
  }, [subjectId]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speech Recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setListening(false);
        };

        recognition.onend = () => setListening(false);

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const startListening = () => {
    recognitionRef.current?.start();
    setListening(true);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'student'
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');

    setTimeout(() => {
      const tutorReply: Message = {
        id: 'tutor-' + Date.now(),
        content: `Let me help you with ${tutorInfo.subject}.`,
        sender: 'tutor'
      };

      setMessages((prev) => [...prev, tutorReply]);
    }, 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileMessage: Message = {
      id: Date.now().toString(),
      content: ` Uploaded file: ${file.name}`,
      sender: 'student'
    };

    setMessages((prev) => [...prev, fileMessage]);
  };

  return (
    <div className="flex justify-center bg-gray-100">
      <div className="flex flex-col w-full max-w-3xl h-[100dvh] bg-white shadow-md">

        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white">
          <button onClick={() => router.push('/subjects')}>
            ←
          </button>

          <div className="text-center">
            <h2 className="font-semibold text-sm sm:text-base">
              {tutorInfo.name}
            </h2>
            <p className="text-xs opacity-80">
              {tutorInfo.subject}
            </p>
          </div>

          <div className="w-6" />
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === 'student'
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >
              <div
                className={`px-4 py-2 text-sm sm:text-base rounded-2xl break-words
                max-w-[85%] sm:max-w-[70%]
                ${
                  msg.sender === 'student'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-white shadow rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* INPUT BAR */}
        <form
          onSubmit={sendMessage}
          className="flex items-center gap-2 px-3 py-3 border-t bg-white"
        >
          {/* Attach Icon */}
          <label className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-gray-100 transition cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#555"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M21 15V7a5 5 0 00-10 0v9a3 3 0 006 0V8" />
            </svg>
            <input type="file" hidden onChange={handleFileUpload} />
          </label>

          {/* Text Input */}
          <input
  value={input}
  onChange={(e) => setInput(e.target.value)}
  placeholder={`Ask ${tutorInfo.subject}...`}
  className="
    flex-1
    border
    rounded-full
    px-3 sm:px-4
    py-1.5 sm:py-2
    text-xs sm:text-base
    focus:outline-none
    focus:ring-2
    focus:ring-indigo-400
  "
/>


          {/* Mic Button - ChatGPT Style */}
          <button
            type="button"
            onClick={startListening}
            className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-300 ${
              listening
                ? 'bg-black text-white animate-pulse'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke={listening ? "white" : "#333"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <rect x="9" y="2" width="6" height="11" rx="3" />
              <path d="M5 10v1a7 7 0 0014 0v-1" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </button>

          {/* Send */}
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition"
          >
            
          </button>
        </form>
      </div>
    </div>
  );
}
