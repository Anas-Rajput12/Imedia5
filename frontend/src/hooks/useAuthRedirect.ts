import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth'; // Using the updated auth lib that exports Clerk's useUser

// Custom hook to check authentication and redirect if not authenticated
export const useAuthRedirect = (redirectPath: string = '/auth/login') => {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) {
      router.push(redirectPath);
    }
  }, [user, isLoaded, router, redirectPath]);

  return { user, isLoaded };
};

// Custom hook to protect routes that should only be accessible when logged out
export const useGuestRedirect = (redirectPath: string = '/subjects') => {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) {
      router.push(redirectPath);
    }
  }, [user, isLoaded, router, redirectPath]);

  return { user, isLoaded };
};