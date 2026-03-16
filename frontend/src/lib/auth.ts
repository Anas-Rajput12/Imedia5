'use client'; // Ensure this file is treated as a Client Module

// Re-export Clerk hooks for Client Components
export { useUser, useAuth, useClerk } from '@clerk/nextjs';

// Client-side session hook
export interface SessionData {
  user: {
    id: string;
    email: string;
    name?: string;
  } | null;
}

export const useSession = () => {
  const { user, isSignedIn, isLoaded } = useUser();

  const sessionData =
    isLoaded && isSignedIn && user
      ? {
          user: {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress || '',
            name: user.fullName || user.username || undefined,
          },
        }
      : null;

  return {
    data: sessionData,
    isLoading: !isLoaded,
  };
};

// Mock sign in / sign up / sign out functions
export const signIn = {
  email: async (credentials: { email: string; password: string; callbackURL?: string }) => {
    console.warn("Using mock signIn function. Please use Clerk's components instead.");
    return { error: { message: "Please use Clerk's components for authentication" } };
  },
};

export const signUp = {
  email: async (userData: { email: string; password: string; name: string; callbackURL?: string }) => {
    console.warn("Using mock signUp function. Please use Clerk's components instead.");
    return { error: { message: "Please use Clerk's components for authentication" } };
  },
};

export const signOut = async () => {
  console.warn("Using mock signOut function. Please use Clerk's components instead.");
  return {};
};
