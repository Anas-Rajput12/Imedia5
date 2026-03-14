'use client';

import { useSession } from '@/lib/auth';

export default function TestAuthPage() {
  const { data: session, isLoading } = useSession();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Authentication Test</h1>
        
        {isLoading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : session ? (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-green-800">Authenticated</h2>
              <p className="text-green-700">User: {session.user.name || session.user.email}</p>
              <p className="text-green-700">Email: {session.user.email}</p>
              <p className="text-green-700">ID: {session.user.id}</p>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-red-800">Not Authenticated</h2>
            <p className="text-red-700">Please sign in to access this page.</p>
          </div>
        )}
        
        <div className="mt-8 text-center">
          <a 
            href="/auth/login" 
            className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    </div>
  );
}