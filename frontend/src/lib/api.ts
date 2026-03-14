/**
 * API Client for SMART AI Teacher Backend (Express.js)
 * Centralized API calls with error handling
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
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

/**
 * Get auth token from Clerk
 */
async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try to get token from Clerk
    const { getToken } = await import('@clerk/nextjs/server');
    const token = await getToken({ template: 'default' });
    return token;
  } catch {
    // Fallback: try to get from localStorage
    return localStorage.getItem('clerk_token');
  }
}

/**
 * Make authenticated request
 */
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  } as HeadersInit;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}

// ==================== Dashboard API ====================

export async function getDashboardData(studentId: string) {
  const response = await fetch(`${API_BASE_URL}/api/unified/dashboard/${studentId}`);
  return handleResponse(response);
}

export async function getRecommendations(studentId: string) {
  const response = await fetch(`${API_BASE_URL}/api/unified/recommendations/${studentId}`);
  return handleResponse(response);
}

export async function getDailySummary(studentId: string) {
  const response = await fetch(`${API_BASE_URL}/api/daily/summary/${studentId}`);
  return handleResponse(response);
}

export async function getDailyMissions(studentId: string) {
  const response = await fetch(`${API_BASE_URL}/api/daily/missions/${studentId}`);
  return handleResponse(response);
}

export async function getMasteryData(studentId: string) {
  const response = await fetch(`${API_BASE_URL}/api/unified/mastery/${studentId}`);
  return handleResponse(response);
}

// ==================== Tutor API ====================

export async function getCurriculumTopics(subject: string, yearGroup?: string) {
  const params = new URLSearchParams({ subject });
  if (yearGroup) params.append('year_group', yearGroup);
  
  const response = await fetch(`${API_BASE_URL}/api/teaching/curriculum/topics?${params}`);
  return handleResponse(response);
}

export async function startTeachingSession(data: {
  student_id: string;
  topic_id: string;
  topic_name: string;
  year_group: string;
  subject: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/teaching/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function processStudentMessage(data: {
  student_id: string;
  session_id: string;
  message: string;
  topic_id?: string;
  student_working?: string;
  correct_answer?: string;
  student_answer?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/teaching/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function getDiagnosticQuestions(topicId: string, limit = 3) {
  const response = await fetch(
    `${API_BASE_URL}/api/teaching/diagnostic/${topicId}?limit=${limit}`
  );
  return handleResponse(response);
}

export async function submitDiagnosticAnswers(data: {
  session_id: string;
  topic_id: string;
  answers: Array<{
    question_id: string;
    answer: string;
    is_correct: boolean;
  }>;
}) {
  const response = await fetch(`${API_BASE_URL}/api/teaching/diagnostic/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

// ==================== Teacher Dashboard API ====================

export async function getTeacherClassProgress(classId: string) {
  const response = await fetch(`${API_BASE_URL}/api/teacher/class/${classId}/progress`);
  return handleResponse(response);
}

export async function getSafeguardingAlerts(severity?: string, status?: string) {
  const params = new URLSearchParams();
  if (severity) params.append('severity', severity);
  if (status) params.append('status', status);
  
  const response = await fetch(`${API_BASE_URL}/api/teacher/safeguarding/alerts?${params}`);
  return handleResponse(response);
}

export async function getIntegrityFlags(classId?: string, limit = 100) {
  const params = new URLSearchParams();
  if (classId) params.append('class_id', classId);
  params.append('limit', limit.toString());
  
  const response = await fetch(`${API_BASE_URL}/api/teacher/integrity/flags?${params}`);
  return handleResponse(response);
}

export async function getStudentAttempts(studentId: string, limit = 50) {
  const response = await fetch(`${API_BASE_URL}/api/teacher/student/${studentId}/attempts?limit=${limit}`);
  return handleResponse(response);
}

// ==================== Video API ====================

export async function getApprovedVideos(topicId: string, subject: string, yearLevel: number) {
  const params = new URLSearchParams({ topic_id: topicId, subject, year_level: yearLevel.toString() });
  const response = await fetch(`${API_BASE_URL}/api/videos/approved?${params}`);
  return handleResponse(response);
}

export async function logVideoView(data: {
  video_id: string;
  student_id: string;
  session_id: string;
  watched_duration: number;
  completed: boolean;
}) {
  const response = await fetch(`${API_BASE_URL}/api/videos/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

// ==================== Error Analysis API ====================

export async function analyseStudentWorking(data: {
  student_id: string;
  topic_id: string;
  question: string;
  student_working: string;
  correct_answer?: string;
  student_answer?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/teaching/error/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

// ==================== Mastery Tracking API ====================

export async function updateMastery(data: {
  student_id: string;
  topic_id: string;
  is_correct: boolean;
  error_tags?: string[];
}) {
  const response = await fetch(`${API_BASE_URL}/api/unified/mastery/${data.student_id}/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

// ==================== Utility Functions ====================

export function getYouTubeEmbedUrl(youtubeId: string) {
  return `https://www.youtube.com/embed/${youtubeId}`;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function getMasteryStatus(percent: number): 'secure' | 'developing' | 'at_risk' {
  if (percent >= 85) return 'secure';
  if (percent >= 50) return 'developing';
  return 'at_risk';
}

export function getMasteryColor(status: string): string {
  switch (status) {
    case 'secure': return 'text-green-600 bg-green-100';
    case 'developing': return 'text-yellow-600 bg-yellow-100';
    case 'at_risk': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}
