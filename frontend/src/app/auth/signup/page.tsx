'use client';

import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
            <p className="text-gray-600 mt-2">Join us today to start learning</p>
          </div>
          
          <SignUp 
            path="/auth/signup" 
            routing="path" 
            appearance={{
              elements: {
                card: 'shadow-none',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                footer: 'hidden',
                formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white font-medium',
                socialButtonsBlockButton: 'border border-gray-300 hover:bg-gray-50',
                dividerLine: 'bg-gray-200',
                formFieldInput: 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
              }
            }}
          />
          
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}