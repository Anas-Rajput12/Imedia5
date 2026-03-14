// Re-export Clerk hooks for backward compatibility
export { useUser, useAuth, useClerk } from '@clerk/nextjs';
export { currentUser } from '@clerk/nextjs/server';

// Create a mock session interface for backward compatibility
export interface SessionData {
  user: {
    id: string;
    email: string;
    name?: string;
  } | null;
}

// Create a mock useSession hook for backward compatibility
export const useSession = () => {
  const { user, isSignedIn, isLoaded } = useUser();
  
  const sessionData = isLoaded && isSignedIn && user ? {
    user: {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress || '',
      name: user.fullName || user.username || undefined,
    }
  } : null;

  return {
    data: sessionData,
    isLoading: !isLoaded,
  };
};

// Mock sign in function for backward compatibility
export const signIn = {
  email: async (credentials: { email: string; password: string; callbackURL?: string }) => {
    console.warn("Using mock signIn function. Please use Clerk's components instead.");
    return { error: { message: "Please use Clerk's components for authentication" } };
  }
};

// Mock sign up function for backward compatibility
export const signUp = {
  email: async (userData: { email: string; password: string; name: string; callbackURL?: string }) => {
    console.warn("Using mock signUp function. Please use Clerk's components instead.");
    return { error: { message: "Please use Clerk's components for authentication" } };
  }
};

// Mock sign out function for backward compatibility
export const signOut = async () => {
  console.warn("Using mock signOut function. Please use Clerk's components instead.");
  return {};
};