import type {
  User,
  Topic,
  Lesson,
  Exercise,
  StudentDashboardData,
  AdminAnalyticsData,
  Assessment,
  Recommendation
} from './types';

const TOKEN_KEY = 'codexa_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('pytutor_auth_token');
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('pytutor_auth_token');
  }
}

async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetchApi<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setStoredToken(res.token);
    return res;
  },

  async register(username: string, email: string, password: string, role: string = 'student'): Promise<{ user: User; token: string }> {
    const res = await fetchApi<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, role })
    });
    setStoredToken(res.token);
    return res;
  },

  async firebaseLogin(payload: { email: string; displayName?: string | null; firebaseUid?: string }): Promise<{ user: User; token: string }> {
    const res = await fetchApi<{ user: User; token: string }>('/api/auth/firebase-login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    return fetchApi<{ user: User }>('/api/auth/me');
  },

  logout() {
    setStoredToken(null);
  },

  // Curriculum
  async getTopics(): Promise<{ topics: Topic[] }> {
    return fetchApi<{ topics: Topic[] }>('/api/curriculum/topics');
  },

  async getTopic(id: string): Promise<{ topic: Topic; lessons: Lesson[]; exercises: Exercise[] }> {
    return fetchApi(`/api/curriculum/topics/${id}`);
  },

  async getLesson(id: string): Promise<{ lesson: Lesson; topic: Topic }> {
    return fetchApi(`/api/curriculum/lessons/${id}`);
  },

  async markLessonComplete(id: string): Promise<{ success: boolean; next_recommendation: Recommendation }> {
    return fetchApi(`/api/curriculum/lessons/${id}/complete`, { method: 'POST' });
  },

  async getExercise(id: string): Promise<{ exercise: Exercise; topic: Topic }> {
    return fetchApi(`/api/curriculum/exercises/${id}`);
  },

  async getHints(exerciseId: string, level: number): Promise<{ hints: Array<{ level: number; text: string }> }> {
    return fetchApi(`/api/curriculum/exercises/${exerciseId}/hint/${level}`);
  },

  async getSolution(exerciseId: string): Promise<{ solution: string; notice: string }> {
    return fetchApi(`/api/curriculum/exercises/${exerciseId}/solution`);
  },

  // Assessment & Code execution
  async runPlayground(code: string, inputData: string = ''): Promise<{
    success: boolean;
    stdout: string;
    stderr: string;
    error_category: string | null;
    execution_time_ms: number;
  }> {
    return fetchApi('/api/assessment/playground', {
      method: 'POST',
      body: JSON.stringify({ code, input_data: inputData })
    });
  },

  async submitAssessment(payload: {
    exercise_id: string;
    code: string;
    hints_used?: number;
    revealed_solution?: boolean;
    time_spent_seconds?: number;
  }): Promise<any> {
    return fetchApi('/api/assessment/submit', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Student Dashboard & Mastery
  async getDashboard(): Promise<StudentDashboardData> {
    return fetchApi<StudentDashboardData>('/api/student/dashboard');
  },

  async getStudentMastery(): Promise<{ mastery: any[] }> {
    return fetchApi('/api/student/mastery');
  },

  async getStudentAttempts(): Promise<{ attempts: any[] }> {
    return fetchApi('/api/student/attempts');
  },

  async getRecommendationHistory(): Promise<{ history: Recommendation[] }> {
    return fetchApi('/api/student/recommendations/history');
  },

  async respondToRecommendation(id: string, response: 'accepted' | 'completed' | 'dismissed' | 'in_progress'): Promise<any> {
    return fetchApi(`/api/student/recommendations/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response })
    });
  },

  // Diagnostic Pre/Post Tests
  async getAssessment(type: 'pre_test' | 'post_test'): Promise<{ assessment: Assessment; user_response: any }> {
    return fetchApi(`/api/assessments/${type}`);
  },

  async submitAssessmentQuestions(assessmentId: string, answers: Record<string, number>): Promise<any> {
    return fetchApi('/api/assessments/submit', {
      method: 'POST',
      body: JSON.stringify({ assessment_id: assessmentId, answers })
    });
  },

  // System Usability Scale
  async submitSUS(responses: number[]): Promise<any> {
    return fetchApi('/api/survey/sus', {
      method: 'POST',
      body: JSON.stringify({ responses })
    });
  },

  async getSUS(): Promise<{ survey: any }> {
    return fetchApi('/api/survey/sus');
  },

  // AI Explainer (Optional)
  async getAiExplanation(payload: {
    topic_title?: string;
    concept_name?: string;
    student_code?: string;
    error_category?: string;
    error_message?: string;
  }): Promise<{
    explanation: string;
    pedagogical_tips: string[];
    suggested_debug_question: string;
    is_ai_generated: boolean;
    disclaimer: string;
  }> {
    return fetchApi('/api/ai/explain', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Admin Portal
  async getAdminOverview(): Promise<{ analytics: AdminAnalyticsData }> {
    return fetchApi('/api/admin/overview');
  },

  async updateLesson(id: string, payload: { title: string; summary: string; content_markdown: string; is_published: boolean }): Promise<any> {
    return fetchApi(`/api/admin/lessons/${id}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateExercise(id: string, payload: {
    title: string;
    difficulty: string;
    problem_statement: string;
    instructions: string;
    starter_code: string;
    worked_solution: string;
    max_score: number;
  }): Promise<any> {
    return fetchApi(`/api/admin/exercises/${id}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async resetDemoData(): Promise<any> {
    return fetchApi('/api/admin/reset-demo', { method: 'POST' });
  },

  async getDataDictionary(): Promise<{ data_dictionary: any[] }> {
    return fetchApi('/api/admin/export/dictionary');
  },

  // Leaderboard
  async getLeaderboard(): Promise<{
    opted_in: boolean;
    leaderboard: import('./types').LeaderboardEntry[];
    current_user_standing: import('./types').LeaderboardEntry | null;
  }> {
    return fetchApi('/api/leaderboard');
  },

  async toggleLeaderboardOptIn(opt_in: boolean): Promise<{ success: boolean; opted_in: boolean }> {
    return fetchApi('/api/leaderboard/opt-in', {
      method: 'POST',
      body: JSON.stringify({ opt_in })
    });
  },

  async downloadResearchCSV(type: 'students' | 'attempts' | 'usability'): Promise<void> {
    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`/api/admin/export/${type}`, { headers });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Export failed with HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codexa_evaluation_${type}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  // Multi-Turn Gemini Chatbot
  async sendChatMessage(payload: {
    messages: Array<{ role: 'user' | 'model'; content: string }>;
    taskType?: 'general' | 'fast' | 'complex';
    context?: { topicName?: string; currentCode?: string };
  }): Promise<{
    message: string;
    modelUsed: string;
    isAiGenerated: boolean;
  }> {
    return fetchApi('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
