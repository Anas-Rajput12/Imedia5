import ChatInterface from '@/components/ChatInterface';

export default function ChatPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800">AI Tutor Session</h1>
        <p className="text-gray-600 mt-2">Get personalized help with your curriculum-aligned studies</p>
      </div>
      
      <ChatInterface />
    </div>
  );
}