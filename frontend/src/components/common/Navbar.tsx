'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { useState } from 'react';

const Navbar = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Define which pages are accessible to authenticated users
  const authLinks = [
    // { name: 'Dashboard', path: '/dashboard' },
    // { name: 'Subjects', path: '/subjects' },
    //{ name: 'Progress', path: '/progress' },
    //{ name: 'Resources', path: '/resources' },
  ];

  // Define which pages are accessible to unauthenticated users
  const publicLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/#features' },
    { name: 'Testimonials', path: '/#testimonials' },
    { name: 'Pricing', path: '/#pricing' },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent hover:scale-105 transition-transform">
                SGA AI Tutor
              </Link>
            </div>
            <div className="hidden md:ml-10 md:flex md:space-x-2">
              {(pathname === '/' || pathname.startsWith('/auth'))
                ? publicLinks.map((link) => (
                    <Link
                      key={link.path}
                      href={link.path}
                      className={`${
                        pathname === link.path
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      } px-3 py-2 rounded-md text-sm font-medium capitalize transition-colors`}
                    >
                      {link.name}
                    </Link>
                  ))
                : authLinks.map((link) => (
                    <Link
                      key={link.path}
                      href={link.path}
                      className={`${
                        pathname === link.path
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      } px-3 py-2 rounded-md text-sm font-medium capitalize transition-colors`}
                    >
                      {link.name}
                    </Link>
                  ))}
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center space-x-4">
              {pathname !== '/' && !pathname.startsWith('/auth') && (
                <>
                  {/* <Link
                    href="/dashboard"
                    className="text-gray-700 hover:bg-gray-50 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium hidden md:block transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/subjects"
                    className="text-gray-700 hover:bg-gray-50 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium hidden md:block transition-colors"
                  >
                    Subjects
                  </Link> */}
                </>
              )}
              {(pathname === '/' || pathname.startsWith('/auth')) ? (
                <div className="hidden md:block">
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-all duration-300 shadow-sm"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all duration-300 shadow-md ml-2"
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <UserButton afterSignOutUrl="/" />
              )}
            </div>

            {/* Mobile menu button - shown only on small screens */}
            {/* Mobile menu button - only mobile */}
<div className="md:hidden">


  <button
    onClick={toggleMobileMenu}
    className="text-gray-700 hover:text-gray-900 focus:outline-none"
    aria-label="Toggle menu"
  >
    {mobileMenuOpen ? (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ) : (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    )}
  </button>
</div>

          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {(pathname === '/' || pathname.startsWith('/auth'))
              ? (
                <>
                  {publicLinks.map((link) => (
                    <Link
                      key={link.path}
                      href={link.path}
                      className={`${
                        pathname === link.path
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      } block px-3 py-2 rounded-md text-base font-medium capitalize`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  ))}
                  <div className="pt-2 pb-3 space-y-2 border-t border-gray-200">
                    <Link
                      href="/auth/login"
                      className="block w-full text-center px-4 py-2 border border-slate-300 text-base font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-all duration-300 shadow-sm"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="block w-full text-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-base font-medium rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all duration-300 shadow-md"
                    >
                      Sign Up
                    </Link>
                  </div>
                </>
              )
              : (
                <>
                  {authLinks.map((link) => (
                    <Link
                      key={link.path}
                      href={link.path}
                      className={`${
                        pathname === link.path
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      } block px-3 py-2 rounded-md text-base font-medium capitalize`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  ))}
                  <div className="pt-4 pb-3 border-t border-gray-200">
                    <div className="flex items-center px-5">
                      <div className="flex-shrink-0">
                        <UserButton afterSignOutUrl="/" />
                      </div>
                    </div>
                  </div>
                </>
              )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;