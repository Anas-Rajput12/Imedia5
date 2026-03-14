'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, SignInButton, SignedIn, SignedOut, useAuth } from '@clerk/nextjs';
import { signOut } from '@clerk/nextjs';

const Navbar = () => {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  // Don't show navbar on auth pages
  if (pathname?.startsWith('/auth')) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut({
        redirectUrl: '/'
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-indigo-600 font-bold text-xl">SGA AI Tutor</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <SignedIn>
                <Link href="/subjects" className={`${pathname === '/subjects' ? 'text-gray-900 border-indigo-500' : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Subjects
                </Link>
                <Link href="/dashboard" className={`${pathname === '/dashboard' ? 'text-gray-900 border-indigo-500' : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Dashboard
                </Link>
              </SignedIn>
            </div>
          </div>
          <div className="flex items-center">
            <SignedIn>
              <UserButton 
                afterSignOutUrl="/" 
                signInUrl="/auth/sign-in"
                signUpUrl="/auth/sign-up"
              />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;