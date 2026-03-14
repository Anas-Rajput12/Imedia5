'use client';

import { useState, useRef, useEffect } from 'react';
import io from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  sender: 'student' | 'tutor';
  timestamp: Date;
}

interface ChatProps {
  studentId?: string;
}

const ChatInterface = ({ studentId }: ChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    // In a real implementation, this would connect to your backend
    // const newSocket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001');
    // setSocket(newSocket);

    // For now, we'll simulate the connection
    console.log('Connecting to chat service...');
    
    // Cleanup function
    return () => {
      // newSocket?.close();
    };
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Add user message to the chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'student',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // In a real implementation, this would send the message to the backend
      // and receive a response via WebSocket or API call
      // For now, we'll simulate a response after a delay
      setTimeout(() => {
        const tutorResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: `I understand you're asking about "${inputValue}". Let me guide you through this step by step. Instead of giving you the direct answer, I'll help you think through the problem. What do you already know about this topic?`,
          sender: 'tutor',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, tutorResponse]);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an issue processing your request. Please try again.',
        sender: 'tutor',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  return (
    <div className="flex flex-col chat-container max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Chat header */}
      <div className="bg-indigo-600 text-white p-4">
        <h2 className="text-xl font-semibold">AI Tutor Session</h2>
        <p className="text-indigo-200 text-sm">Aligned with UK Curriculum for Years 5-9</p>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-lg">Start a conversation with your AI tutor</p>
            <p className="mt-2 text-center max-w-md">
              Ask questions about your curriculum, get guided help with problems, 
              and improve your understanding step by step.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'student' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.sender === 'student'
                      ? 'bg-indigo-500 text-white rounded-tr-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div
                    className={`text-xs mt-1 ${
                      message.sender === 'student' ? 'text-indigo-200' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 text-gray-800 rounded-2xl px-4 py-2 rounded-tl-none max-w-[80%]">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="input-area">
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask your AI tutor a question..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={`px-6 rounded-full font-medium ${
              inputValue.trim() && !isLoading
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            Send
          </button>
        </form>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Remember: Ask curriculum-related questions. The AI tutor will guide you through problems without giving direct answers.
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;




// {showClassModal && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4">
//           <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
//             <div className={`bg-gradient-to-r ${currentTutor.gradient} px-4 sm:px-8 py-4 sm:py-6 rounded-t-2xl sm:rounded-t-3xl`}>
//               <div className="flex items-center gap-3 sm:gap-4">
//                 <div className="text-3xl sm:text-5xl">{currentTutor.name}</div>
//                 <div>
//                   <h1 className="text-xl sm:text-3xl font-bold text-white">Welcome to {currentTutor.name}'s Class!</h1>
//                   <p className="text-white/90 mt-1 text-sm sm:text-base">Select your year group and topic to begin</p>
//                 </div>
//               </div>
//             </div>

//             <div className="p-4 sm:p-8">
//               {/* Note: Curriculum selector is now shown at the top of the page */}
//               {/* Year and topic selection handled by CurriculumSelector component */}
              
//               {selectedQdrantTopic && (
//                 <div className="mb-6">
//                   <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">📚 Current Topic</h2>
//                   <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <p className="text-sm text-gray-600 font-medium">Selected Topic</p>
//                         <h3 className="text-2xl font-bold text-gray-900 mt-1">{selectedQdrantTopic}</h3>
//                         <p className="text-sm text-gray-600 mt-2">
//                           {type} • {selectedYear}
//                         </p>
//                       </div>
//                       <div className="text-right">
//                         <div className="text-3xl mb-2">📖</div>
//                         <p className="text-xs text-gray-500">
//                           {availableTopics.find(t => t.topic === selectedQdrantTopic)?.chunk_count || 0} chunks available
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}