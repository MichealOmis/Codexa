import { execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  User,
  SafeUser,
  Topic,
  Lesson,
  Exercise,
  ExerciseTestCase,
  StudentAttempt,
  StudentMastery,
  Recommendation,
  Assessment,
  AssessmentQuestion,
  AssessmentResponse,
  SUSSurvey
} from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BRIDGE_PATH = path.join(__dirname, 'db_bridge.py');

/**
 * Execute parameterized query via Python SQLite bridge
 */
export async function dbQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const payload = JSON.stringify({ action: 'query', sql, params });
  return new Promise((resolve, reject) => {
    execFile('python3', [BRIDGE_PATH, payload], { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(`DB Bridge error: ${stderr || err.message}`));
      }
      try {
        const res = JSON.parse(stdout.trim());
        if (res.status === 'error') {
          return reject(new Error(res.message));
        }
        resolve(res.rows || []);
      } catch (parseErr: any) {
        reject(new Error(`Failed to parse DB bridge output: ${stdout}`));
      }
    });
  });
}

/**
 * Execute modifying statement (INSERT, UPDATE, DELETE)
 */
export async function dbExecute(sql: string, params: any[] = []): Promise<{ changes: number; lastrowid: number }> {
  const payload = JSON.stringify({ action: 'execute', sql, params });
  return new Promise((resolve, reject) => {
    execFile('python3', [BRIDGE_PATH, payload], (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(`DB Bridge error: ${stderr || err.message}`));
      }
      try {
        const res = JSON.parse(stdout.trim());
        if (res.status === 'error') {
          return reject(new Error(res.message));
        }
        resolve({ changes: res.changes, lastrowid: res.lastrowid });
      } catch (parseErr: any) {
        reject(new Error(`Failed to parse DB bridge execute: ${stdout}`));
      }
    });
  });
}

/**
 * Reset database to pristine seed state
 */
export async function dbResetSeed(): Promise<void> {
  const payload = JSON.stringify({ action: 'reset_seed' });
  return new Promise((resolve, reject) => {
    execFile('python3', [BRIDGE_PATH, payload], (err, stdout, stderr) => {
      if (err) return reject(new Error(`Reset error: ${stderr || err.message}`));
      try {
        const res = JSON.parse(stdout.trim());
        if (res.status === 'error') return reject(new Error(res.message));
        resolve();
      } catch (e: any) {
        reject(e);
      }
    });
  });
}

/* ================= USER SERVICES ================= */

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await dbQuery<User>('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  return rows[0] || null;
}

export async function getUserById(id: string): Promise<SafeUser | null> {
  const rows = await dbQuery<any>('SELECT id, username, email, role, participant_id, leaderboard_opt_in, evaluation_group, created_at FROM users WHERE id = ?', [id]);
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    id: r.id,
    username: r.username,
    email: r.email,
    role: r.role,
    participant_id: r.participant_id,
    leaderboard_opt_in: Boolean(r.leaderboard_opt_in),
    evaluation_group: r.evaluation_group || 'ITS_Intervention',
    created_at: r.created_at
  };
}

export async function createUser(user: {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: 'student' | 'administrator';
  participant_id: string;
  leaderboard_opt_in?: boolean | number;
  evaluation_group?: string;
  created_at: string;
}): Promise<SafeUser> {
  const optIn = user.leaderboard_opt_in ? 1 : 0;
  const group = user.evaluation_group || 'ITS_Intervention';
  await dbExecute(
    'INSERT INTO users (id, username, email, password_hash, role, participant_id, leaderboard_opt_in, evaluation_group, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [user.id, user.username, user.email.toLowerCase().trim(), user.password_hash, user.role, user.participant_id, optIn, group, user.created_at]
  );
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    participant_id: user.participant_id,
    leaderboard_opt_in: Boolean(optIn),
    evaluation_group: group,
    created_at: user.created_at
  };
}

export async function setUserLeaderboardOptIn(userId: string, optIn: boolean): Promise<void> {
  await dbExecute('UPDATE users SET leaderboard_opt_in = ? WHERE id = ?', [optIn ? 1 : 0, userId]);
}

/* ================= CURRICULUM SERVICES ================= */

export async function getAllTopics(): Promise<Topic[]> {
  const rows = await dbQuery<any>('SELECT * FROM topics ORDER BY order_index ASC');
  return rows.map(r => ({
    ...r,
    learning_objectives: JSON.parse(r.learning_objectives || '[]'),
    prerequisite_topic_ids: JSON.parse(r.prerequisite_topic_ids || '[]')
  }));
}

export async function getTopicById(id: string): Promise<Topic | null> {
  const rows = await dbQuery<any>('SELECT * FROM topics WHERE id = ?', [id]);
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    ...r,
    learning_objectives: JSON.parse(r.learning_objectives || '[]'),
    prerequisite_topic_ids: JSON.parse(r.prerequisite_topic_ids || '[]')
  };
}

export async function getLessonsByTopicId(topicId: string): Promise<Lesson[]> {
  const rows = await dbQuery<any>('SELECT * FROM lessons WHERE topic_id = ? ORDER BY id ASC', [topicId]);
  return rows.map(r => ({
    ...r,
    is_published: Boolean(r.is_published),
    code_examples: JSON.parse(r.code_examples || '[]'),
    quick_check_questions: JSON.parse(r.quick_check_questions || '[]')
  }));
}

export async function getLessonById(id: string): Promise<Lesson | null> {
  const rows = await dbQuery<any>('SELECT * FROM lessons WHERE id = ?', [id]);
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    ...r,
    is_published: Boolean(r.is_published),
    code_examples: JSON.parse(r.code_examples || '[]'),
    quick_check_questions: JSON.parse(r.quick_check_questions || '[]')
  };
}

export async function getExercisesByTopicId(topicId: string): Promise<Exercise[]> {
  const rows = await dbQuery<any>('SELECT * FROM exercises WHERE topic_id = ? AND is_active = 1 ORDER BY difficulty ASC, id ASC', [topicId]);
  return rows.map(r => ({
    ...r,
    hints: JSON.parse(r.hints || '[]'),
    common_error_categories: JSON.parse(r.common_error_categories || '[]'),
    is_active: Boolean(r.is_active)
  }));
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  const rows = await dbQuery<any>('SELECT * FROM exercises WHERE id = ?', [id]);
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    ...r,
    hints: JSON.parse(r.hints || '[]'),
    common_error_categories: JSON.parse(r.common_error_categories || '[]'),
    is_active: Boolean(r.is_active)
  };
}

export async function getTestCasesByExerciseId(exerciseId: string): Promise<ExerciseTestCase[]> {
  const rows = await dbQuery<any>('SELECT * FROM exercise_test_cases WHERE exercise_id = ? ORDER BY is_hidden ASC, id ASC', [exerciseId]);
  return rows.map(r => ({
    ...r,
    is_hidden: Boolean(r.is_hidden)
  }));
}

/* ================= STUDENT MODEL & ATTEMPTS ================= */

export async function getStudentMastery(studentId: string): Promise<StudentMastery[]> {
  return await dbQuery<StudentMastery>(
    `SELECT sm.*, t.name as topic_name, t.module_number 
     FROM student_mastery sm
     JOIN topics t ON sm.topic_id = t.id
     WHERE sm.student_id = ?
     ORDER BY t.order_index ASC`,
    [studentId]
  );
}

export async function getStudentMasteryForTopic(studentId: string, topicId: string): Promise<StudentMastery | null> {
  const rows = await dbQuery<StudentMastery>(
    'SELECT * FROM student_mastery WHERE student_id = ? AND topic_id = ?',
    [studentId, topicId]
  );
  return rows[0] || null;
}

export async function upsertStudentMastery(m: {
  student_id: string;
  topic_id: string;
  mastery_score: number;
  mastery_category: string;
  assessment_checks_passed: number;
  assessment_checks_total: number;
  attempt_count: number;
  last_attempt_at: string | null;
  updated_at: string;
}): Promise<void> {
  await dbExecute(
    `INSERT INTO student_mastery (
      student_id, topic_id, mastery_score, mastery_category,
      assessment_checks_passed, assessment_checks_total, attempt_count,
      last_attempt_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(student_id, topic_id) DO UPDATE SET
      mastery_score = excluded.mastery_score,
      mastery_category = excluded.mastery_category,
      assessment_checks_passed = excluded.assessment_checks_passed,
      assessment_checks_total = excluded.assessment_checks_total,
      attempt_count = excluded.attempt_count,
      last_attempt_at = excluded.last_attempt_at,
      updated_at = excluded.updated_at`,
    [
      m.student_id,
      m.topic_id,
      m.mastery_score,
      m.mastery_category,
      m.assessment_checks_passed,
      m.assessment_checks_total,
      m.attempt_count,
      m.last_attempt_at,
      m.updated_at
    ]
  );
}

export async function saveAttempt(attempt: StudentAttempt, testResults: any[]): Promise<void> {
  await dbExecute(
    `INSERT INTO student_attempts (
      id, student_id, exercise_id, topic_id, submitted_code,
      score, passed_count, total_count, all_passed, syntax_valid,
      execution_status, error_category, diagnostic_feedback,
      hints_used, revealed_solution, time_spent_seconds, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      attempt.id,
      attempt.student_id,
      attempt.exercise_id,
      attempt.topic_id,
      attempt.submitted_code,
      attempt.score,
      attempt.passed_count,
      attempt.total_count,
      attempt.all_passed ? 1 : 0,
      attempt.syntax_valid ? 1 : 0,
      attempt.execution_status,
      attempt.error_category,
      attempt.diagnostic_feedback,
      attempt.hints_used,
      attempt.revealed_solution ? 1 : 0,
      attempt.time_spent_seconds,
      attempt.timestamp
    ]
  );

  for (const tr of testResults) {
    await dbExecute(
      `INSERT INTO attempt_test_results (
        id, attempt_id, test_case_id, passed, actual_output,
        expected_output, error_category, execution_time_ms, is_hidden
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `atr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        attempt.id,
        tr.id,
        tr.passed ? 1 : 0,
        tr.actual_output,
        tr.expected_output,
        tr.error_category || null,
        tr.execution_time_ms || 0,
        tr.is_hidden ? 1 : 0
      ]
    );
  }
}

export async function getStudentAttempts(studentId: string, limit: number = 30): Promise<StudentAttempt[]> {
  const rows = await dbQuery<any>(
    `SELECT sa.*, e.title as exercise_title 
     FROM student_attempts sa
     JOIN exercises e ON sa.exercise_id = e.id
     WHERE sa.student_id = ?
     ORDER BY sa.timestamp DESC
     LIMIT ?`,
    [studentId, limit]
  );
  return rows.map(r => ({
    ...r,
    all_passed: Boolean(r.all_passed),
    syntax_valid: Boolean(r.syntax_valid),
    revealed_solution: Boolean(r.revealed_solution)
  }));
}

export async function getActiveRecommendation(studentId: string): Promise<Recommendation | null> {
  const rows = await dbQuery<any>(
    'SELECT * FROM recommendations WHERE student_id = ? AND is_completed = 0 ORDER BY created_at DESC LIMIT 1',
    [studentId]
  );
  if (!rows[0]) return null;
  return {
    ...rows[0],
    is_completed: Boolean(rows[0].is_completed),
    learner_response: rows[0].learner_response || null,
    responded_at: rows[0].responded_at || null
  };
}

export async function getRecommendationHistory(studentId: string, limit: number = 25): Promise<Recommendation[]> {
  const rows = await dbQuery<any>(
    'SELECT * FROM recommendations WHERE student_id = ? ORDER BY created_at DESC LIMIT ?',
    [studentId, limit]
  );
  return rows.map(r => ({
    ...r,
    is_completed: Boolean(r.is_completed),
    learner_response: r.learner_response || null,
    responded_at: r.responded_at || null
  }));
}

export async function recordLearnerResponse(
  recommendationId: string,
  studentId: string,
  response: 'accepted' | 'completed' | 'dismissed' | 'in_progress'
): Promise<void> {
  const now = new Date().toISOString();
  const isCompleted = response === 'completed' || response === 'dismissed' ? 1 : 0;
  await dbExecute(
    `UPDATE recommendations 
     SET learner_response = ?, responded_at = ?, is_completed = CASE WHEN ? = 1 THEN 1 ELSE is_completed END
     WHERE id = ? AND student_id = ?`,
    [response, now, isCompleted, recommendationId, studentId]
  );
}

export async function completeRecommendationByTarget(
  studentId: string,
  targetType: string,
  targetId: string
): Promise<void> {
  const now = new Date().toISOString();
  await dbExecute(
    `UPDATE recommendations
     SET is_completed = 1, learner_response = 'completed', responded_at = ?
     WHERE student_id = ? AND target_type = ? AND target_id = ? AND is_completed = 0`,
    [now, studentId, targetType, targetId]
  );
}

export async function saveRecommendation(rec: {
  id: string;
  student_id: string;
  rule_name: string;
  rule_code: string;
  target_type: string;
  target_id: string;
  target_title: string;
  reason: string;
  learner_response?: string | null;
  responded_at?: string | null;
}): Promise<void> {
  // Archive old uncompleted recommendations for this student and mark superseded if not responded
  await dbExecute(
    `UPDATE recommendations 
     SET is_completed = 1, 
         learner_response = COALESCE(learner_response, 'superseded')
     WHERE student_id = ? AND is_completed = 0`,
    [rec.student_id]
  );
  await dbExecute(
    `INSERT INTO recommendations (
      id, student_id, rule_name, rule_code, target_type, target_id, target_title, reason, is_completed, learner_response, responded_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
    [
      rec.id,
      rec.student_id,
      rec.rule_name,
      rec.rule_code,
      rec.target_type,
      rec.target_id,
      rec.target_title,
      rec.reason,
      rec.learner_response || null,
      rec.responded_at || null,
      new Date().toISOString()
    ]
  );
}

/* ================= LESSON COMPLETIONS ================= */

export async function markLessonCompleted(studentId: string, lessonId: string, topicId: string): Promise<void> {
  await dbExecute(
    `INSERT OR IGNORE INTO lesson_completions (student_id, lesson_id, topic_id, completed_at)
     VALUES (?, ?, ?, ?)`,
    [studentId, lessonId, topicId, new Date().toISOString()]
  );
}

export async function getCompletedLessons(studentId: string): Promise<string[]> {
  const rows = await dbQuery<{ lesson_id: string }>('SELECT lesson_id FROM lesson_completions WHERE student_id = ?', [studentId]);
  return rows.map(r => r.lesson_id);
}

/* ================= ASSESSMENTS (PRE/POST) ================= */

export async function getAssessment(id: 'pre_test' | 'post_test', includeAnswers: boolean = false): Promise<Assessment | null> {
  const meta = await dbQuery<any>('SELECT * FROM assessments WHERE id = ?', [id]);
  if (!meta[0]) return null;
  const questions = await dbQuery<any>('SELECT * FROM assessment_questions WHERE assessment_id = ? ORDER BY id ASC', [id]);
  
  return {
    id,
    title: meta[0].title,
    description: meta[0].description,
    total_questions: meta[0].total_questions,
    questions: questions.map(q => ({
      id: q.id,
      assessment_id: q.assessment_id,
      topic_id: q.topic_id,
      question_text: q.question_text,
      options: JSON.parse(q.options || '[]'),
      correct_index: includeAnswers ? q.correct_index : undefined,
      explanation: includeAnswers ? q.explanation : undefined
    }))
  };
}

export async function getAssessmentResponse(studentId: string, assessmentId: string): Promise<AssessmentResponse | null> {
  const rows = await dbQuery<any>(
    'SELECT * FROM assessment_responses WHERE student_id = ? AND assessment_id = ?',
    [studentId, assessmentId]
  );
  if (!rows[0]) return null;
  return {
    ...rows[0],
    answers: JSON.parse(rows[0].answers || '{}')
  };
}

export async function saveAssessmentResponse(resp: {
  id: string;
  student_id: string;
  assessment_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  answers: Record<string, number>;
  completed_at: string;
}): Promise<void> {
  await dbExecute(
    `INSERT INTO assessment_responses (id, student_id, assessment_id, score, total_questions, percentage, answers, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET score=excluded.score, percentage=excluded.percentage, answers=excluded.answers`,
    [resp.id, resp.student_id, resp.assessment_id, resp.score, resp.total_questions, resp.percentage, JSON.stringify(resp.answers), resp.completed_at]
  );
}

/* ================= SUS SURVEY ================= */

export async function saveSUSSurvey(survey: SUSSurvey): Promise<void> {
  await dbExecute(
    `INSERT INTO sus_surveys (id, student_id, participant_id, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, sus_score, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      survey.id, survey.student_id, survey.participant_id,
      survey.q1, survey.q2, survey.q3, survey.q4, survey.q5,
      survey.q6, survey.q7, survey.q8, survey.q9, survey.q10,
      survey.sus_score, survey.created_at
    ]
  );
}

export async function getStudentSUS(studentId: string): Promise<SUSSurvey | null> {
  const rows = await dbQuery<SUSSurvey>('SELECT * FROM sus_surveys WHERE student_id = ?', [studentId]);
  return rows[0] || null;
}
