'use client';

import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>
          
          <SignIn 
            path="/auth/login" 
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
            Don't have an account?{' '}
            <Link href="/auth/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}