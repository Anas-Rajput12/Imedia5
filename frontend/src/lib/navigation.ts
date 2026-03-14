/**
 * Navigation utilities for SMART AI Teacher
 */

import { useRouter } from 'next/navigation';

export function useNavigation() {
  const router = useRouter();

  const navigateToDashboard = () => {
    router.push('/dashboard');
  };

  const navigateToTutor = (type: 'maths' | 'science' | 'homework') => {
    router.push(`/tutor?type=${type}`);
  };

  const navigateToTeacherDashboard = () => {
    router.push('/teacher');
  };

  const navigateToTopic = (topicId: string, type: string) => {
    router.push(`/tutor?type=${type}&topic=${topicId}`);
  };

  return {
    navigateToDashboard,
    navigateToTutor,
    navigateToTeacherDashboard,
    navigateToTopic,
  };
}

export function getTutorUrl(type: 'maths' | 'science' | 'homework', topicId?: string) {
  let url = `/tutor?type=${type}`;
  if (topicId) {
    url += `&topic=${topicId}`;
  }
  return url;
}

export function getDashboardUrl() {
  return '/dashboard';
}

export function getTeacherDashboardUrl() {
  return '/teacher';
}
