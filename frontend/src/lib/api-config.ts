/**
 * API Configuration
 * Centralized API base URL for the frontend
 */

export const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_BASE_URL || 
  'http://localhost:5000';

export const WS_BASE_URL = 
  process.env.NEXT_PUBLIC_WS_URL || 
  'ws://localhost:5000';

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH_ME: '/auth/me',
  AUTH_VERIFY: '/auth/verify',
  
  // Teaching
  TEACHING_START: '/api/teaching/start',
  TEACHING_MESSAGE: '/api/teaching/message',
  TEACHING_SESSION: (sessionId: string) => `/api/teaching/session/${sessionId}`,
  TEACHING_MASTERY: (studentId: string) => `/api/teaching/mastery/${studentId}`,
  TEACHING_ERROR_ANALYZE: '/api/teaching/error/analyze',
  TEACHING_TOPICS_SEARCH: '/api/teaching/topics/search',
  TEACHING_CURRICULUM_TOPICS: '/api/teaching/curriculum/topics',
  
  // Dashboard
  DASHBOARD: (studentId: string) => `/api/dashboard/${studentId}`,
  DASHBOARD_RECOMMENDATIONS: (studentId: string) => `/api/dashboard/recommendations/${studentId}`,
  DASHBOARD_STREAK: (studentId: string) => `/api/dashboard/streak/${studentId}`,
  
  // Chatbot
  CHATBOT_MESSAGE: '/api/chatbot/message',
  CHATBOT_SESSION: (sessionId: string) => `/api/chatbot/session/${sessionId}`,
  
  // Tutor Chat
  TUTOR_CHAT_MESSAGE: '/api/tutor/chat/message',
  TUTOR_CHAT_START: '/api/tutor/chat/start',
  TUTOR_CHAT_SESSION: (sessionId: string) => `/api/tutor/chat/session/${sessionId}`,
  
  // Progress
  PROGRESS: (studentId: string) => `/api/progress/${studentId}`,
  PROGRESS_TOPICS: (studentId: string) => `/api/progress/${studentId}/topics`,
  PROGRESS_HISTORY: (studentId: string) => `/api/progress/${studentId}/history`,
  PROGRESS_WEAKNESSES: (studentId: string) => `/api/progress/${studentId}/weaknesses`,
  
  // Daily Missions
  DAILY_MISSIONS: (studentId: string) => `/api/daily-missions/${studentId}`,
  DAILY_MISSIONS_STREAK: (studentId: string) => `/api/daily-missions/${studentId}/streak`,
  DAILY_MISSIONS_CLAIM: (studentId: string) => `/api/daily-missions/${studentId}/claim`,
  
  // Legacy endpoints (for backward compatibility)
  UNIFIED_DASHBOARD: (studentId: string) => `/api/unified/dashboard/${studentId}`,
  UNIFIED_RECOMMENDATIONS: (studentId: string) => `/api/unified/recommendations/${studentId}`,
  UNIFIED_MASTERY: (studentId: string) => `/api/unified/mastery/${studentId}`,
  DAILY_SUMMARY: (studentId: string) => `/api/daily/summary/${studentId}`,
} as const;

/**
 * Get full URL for an endpoint
 */
export function getApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`;
}

/**
 * Fetch wrapper with authentication
 */
export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = getApiUrl(endpoint);
  
  // Get token from Clerk or localStorage
  let token: string | null = null;
  try {
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('clerk_token');
    }
  } catch {
    // Ignore errors
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}

/**
 * API response handler
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      error: { message: 'Unknown error' } 
    }));
    return {
      error: errorData.error?.message || errorData.detail || 'An error occurred',
      status: response.status,
    };
  }

  const responseData = await response.json();
  // Express backend returns { success: true, data: {...} }
  const data = responseData.data || responseData;
  return { data, status: response.status };
}
