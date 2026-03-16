// This is server-only and can safely import Clerk server helpers
import { currentUser as clerkCurrentUser } from '@clerk/nextjs/server';

export const getCurrentUser = async () => {
  return await clerkCurrentUser();
};
