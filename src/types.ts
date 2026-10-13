export type UserRole = 'student' | 'administrator';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  participant_id: string;
  leaderboard_opt_in?: boolean | number;
  evaluation_group?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  participant_id: string; // Anonymized display
  mastery_points: number;
  modules_mastered: number;
  exercises_passed: number;
  avg_mastery: number;
  is_current_user: boolean;
}

export type MasteryCategory = 
  | 'unassessed' 
  | 'needs_support' 
  | 'developing' 
  | 'near_mastery' 
  | 'provisional_mastery';

export interface Topic {
  id: string;
  module_number: number;
  name: string;
  description: string;
  learning_objectives: string[];
  prerequisite_topic_ids: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  mastery_threshold: number;
  order_index: number;
  is_unlocked?: boolean;
  mastery_score?: number;
  mastery_category?: MasteryCategory;
  exercise_count?: number;
}

export interface CodeExample {
  title: string;
  code: string;
  explanation: string;
}

export interface QuickCheckQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  topic_id: string;
  title: string;
  summary: string;
  content_markdown: string;
  code_examples: CodeExample[];
  quick_check_questions: QuickCheckQuestion[];
  is_published: boolean;
  is_completed?: boolean;
}

export interface HintItem {
  level: 1 | 2 | 3;
  text: string;
}

export interface ExerciseTestCase {
  id: string;
  description: string;
  input_data: string;
  expected_output: string;
  function_call?: string;
  is_hidden: boolean;
}

export interface Exercise {
  id: string;
  topic_id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  exercise_type: 'programming' | 'multiple_choice' | 'code_completion';
  problem_statement: string;
  instructions: string;
  starter_code: string;
  hints: HintItem[];
  worked_solution?: string;
  common_error_categories: string[];
  max_score: number;
  is_active: boolean;
  test_cases?: ExerciseTestCase[];
  best_score?: number;
  attempt_count?: number;
  is_passed?: boolean;
}

export interface StudentMastery {
  student_id: string;
  topic_id: string;
  topic_name?: string;
  module_number?: number;
  mastery_score: number;
  mastery_category: MasteryCategory;
  assessment_checks_passed: number;
  assessment_checks_total: number;
  attempt_count: number;
  last_attempt_at: string | null;
  updated_at: string;
}

export interface AttemptTestResult {
  id: string;
  passed: boolean;
  actual_output: string;
  expected_output: string;
  error_category: string | null;
  error_message?: string;
  remedial_advice?: string;
  execution_time_ms: number;
  is_hidden: boolean;
}

export interface StudentAttempt {
  id: string;
  student_id: string;
  exercise_id: string;
  exercise_title?: string;
  topic_id: string;
  submitted_code: string;
  score: number;
  passed_count: number;
  total_count: number;
  all_passed: boolean;
  syntax_valid: boolean;
  execution_status: 'success' | 'failed' | 'timeout' | 'syntax_error';
  error_category: string | null;
  diagnostic_feedback: string;
  hints_used: number;
  revealed_solution: boolean;
  time_spent_seconds: number;
  timestamp: string;
  test_results?: AttemptTestResult[];
}

export interface Recommendation {
  id: string;
  student_id: string;
  rule_name: string;
  rule_code: string;
  target_type: 'diagnostic' | 'lesson' | 'exercise' | 'post_test';
  target_id: string;
  target_title: string;
  reason: string;
  is_completed: boolean;
  learner_response?: 'accepted' | 'completed' | 'dismissed' | 'in_progress' | 'superseded' | null;
  responded_at?: string | null;
  created_at: string;
}

export interface AssessmentQuestion {
  id: string;
  assessment_id: string;
  topic_id: string;
  question_text: string;
  options: string[];
  correct_index?: number;
  explanation?: string;
}

export interface Assessment {
  id: 'pre_test' | 'post_test';
  title: string;
  description: string;
  total_questions: number;
  questions?: AssessmentQuestion[];
}

export interface StudentDashboardData {
  user: User;
  pre_test_completed: boolean;
  post_test_completed: boolean;
  sus_completed: boolean;
  pre_test_score?: number;
  post_test_score?: number;
  overall_average_mastery: number;
  topics_mastered_count: number;
  total_attempts_count: number;
  active_recommendation: Recommendation | null;
  topics: Topic[];
  recent_attempts: StudentAttempt[];
}

export interface AdminAnalyticsData {
  total_students: number;
  total_attempts: number;
  avg_platform_mastery: number;
  pre_test_avg: number;
  post_test_avg: number;
  sus_average_score: number;
  error_category_distribution: { category: string; count: number }[];
  topic_mastery_breakdown: { topic_id: string; topic_name: string; avg_mastery: number; attempt_count: number }[];
  students: {
    id: string;
    username: string;
    email: string;
    participant_id: string;
    pre_test_score: number | null;
    post_test_score: number | null;
    avg_mastery: number;
    attempts_count: number;
    last_active: string | null;
  }[];
}
