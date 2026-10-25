import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import {
  getUserByEmail,
  getUserById,
  createUser,
  getAllTopics,
  getTopicById,
  getLessonsByTopicId,
  getLessonById,
  getExercisesByTopicId,
  getExerciseById,
  getTestCasesByExerciseId,
  getStudentMastery,
  getStudentMasteryForTopic,
  getStudentAttempts,
  getActiveRecommendation,
  getRecommendationHistory,
  recordLearnerResponse,
  completeRecommendationByTarget,
  markLessonCompleted,
  getCompletedLessons,
  getAssessment,
  getAssessmentResponse,
  saveAssessmentResponse,
  saveSUSSurvey,
  getStudentSUS,
  dbExecute,
  dbQuery,
  dbResetSeed
} from './server/db_service';

import {
  evaluatePedagogicalRules,
  checkPrerequisitesSatisfied,
  recalculateTopicMastery,
  classifyMastery
} from './server/tutoring_engine';

import {
  runPlayground,
  submitAssessment
} from './server/assessment_service';

import {
  generatePedagogicalExplanation,
  handleMultiTurnChat
} from './server/gemini_service';

import {
  calculateSUSScore,
  exportResearchDatasetCSV,
  DATA_DICTIONARY
} from './server/research_service';

import type { User, SafeUser } from './server/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = express();
app.use(express.json({ limit: '2mb' }));

// Simple in-memory session token mapping: token -> userId
const sessions = new Map<string, string>();

// Helper password hasher
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate session token
function createSession(userId: string): string {
  const token = `tok_${crypto.randomBytes(24).toString('hex')}`;
  sessions.set(token, userId);
  return token;
}

// Extend Request type
interface AuthRequest extends Request {
  user?: SafeUser;
}

// Authentication middleware
async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (token) {
    const userId = sessions.get(token);
    if (userId) {
      const user = await getUserById(userId);
      if (user) {
        req.user = user;
      }
    }
  }
  next();
}

app.use(authenticate as any);

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  next();
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  if (req.user.role !== 'administrator') {
    return res.status(403).json({ error: 'Forbidden: Administrator or Lecturer privileges required.' });
  }
  next();
}

/* ================= AUTHENTICATION ROUTES ================= */

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }
    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const assignedRole = (role === 'administrator') ? 'administrator' : 'student';
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const participantId = assignedRole === 'administrator' 
      ? `FACULTY-${randomHex}` 
      : `PARTICIPANT-${randomHex}`;

    const newUser = await createUser({
      id: userId,
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password_hash: hashPassword(password),
      role: assignedRole,
      participant_id: participantId,
      created_at: new Date().toISOString()
    });

    const token = createSession(newUser.id);
    return res.json({ user: newUser, token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = await getUserByEmail(email);
    if (!user || user.password_hash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const safeUser: SafeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      participant_id: user.participant_id,
      created_at: user.created_at
    };

    const token = createSession(user.id);
    return res.json({ user: safeUser, token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

app.post('/api/auth/firebase-login', async (req: Request, res: Response) => {
  try {
    const { email, displayName, firebaseUid } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required for Firebase login.' });
    }
    let user = await getUserByEmail(email);
    if (!user) {
      const username = (displayName || email.split('@')[0] || 'student').trim().substring(0, 100);
      const userId = `usr_fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
      const participantId = `PARTICIPANT-${randomHex}`;

      user = await createUser({
        id: userId,
        username,
        email: email.toLowerCase().trim(),
        password_hash: hashPassword(firebaseUid || 'firebase-oauth-token'),
        role: 'student',
        participant_id: participantId,
        created_at: new Date().toISOString()
      });
    }

    const safeUser: SafeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      participant_id: user.participant_id,
      created_at: user.created_at
    };

    const token = createSession(user.id);
    return res.json({ user: safeUser, token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Firebase login failed.' });
  }
});

app.get('/api/auth/me', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  return res.json({ user: req.user });
});

/* ================= CURRICULUM ROUTES ================= */

app.get('/api/curriculum/topics', async (req: AuthRequest, res: Response) => {
  try {
    const topics = await getAllTopics();
    const studentId = req.user?.id;

    if (!studentId) {
      return res.json({
        topics: topics.map((t, idx) => ({
          ...t,
          is_unlocked: idx === 0,
          mastery_score: 0,
          mastery_category: 'unassessed'
        }))
      });
    }

    const masteryList = await getStudentMastery(studentId);
    const masteryMap = new Map(masteryList.map(m => [m.topic_id, m]));

    const enriched = await Promise.all(
      topics.map(async (topic) => {
        const prereq = await checkPrerequisitesSatisfied(studentId, topic, masteryMap);
        const m = masteryMap.get(topic.id);
        const score = m ? m.mastery_score : 0;
        const category = m ? m.mastery_category : 'unassessed';

        return {
          ...topic,
          is_unlocked: prereq.satisfied,
          prereq_details: prereq,
          mastery_score: score,
          mastery_category: category
        };
      })
    );

    return res.json({ topics: enriched });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/curriculum/topics/:id', async (req: AuthRequest, res: Response) => {
  try {
    const topic = await getTopicById(req.params.id);
    if (!topic) return res.status(404).json({ error: 'Topic not found.' });

    const lessons = await getLessonsByTopicId(topic.id);
    const exercises = await getExercisesByTopicId(topic.id);

    let isUnlocked = true;
    let masteryInfo = null;

    if (req.user) {
      const masteryList = await getStudentMastery(req.user.id);
      const masteryMap = new Map(masteryList.map(m => [m.topic_id, m]));
      const prereq = await checkPrerequisitesSatisfied(req.user.id, topic, masteryMap);
      isUnlocked = prereq.satisfied;
      masteryInfo = masteryMap.get(topic.id) || null;
    }

    return res.json({
      topic: {
        ...topic,
        is_unlocked: isUnlocked,
        mastery_score: masteryInfo?.mastery_score || 0,
        mastery_category: masteryInfo?.mastery_category || 'unassessed'
      },
      lessons,
      exercises
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/curriculum/lessons/:id', async (req: AuthRequest, res: Response) => {
  try {
    const lesson = await getLessonById(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });

    const topic = await getTopicById(lesson.topic_id);
    if (!topic) return res.status(404).json({ error: 'Topic not found.' });

    // Check prerequisite readiness if student
    if (req.user && req.user.role === 'student') {
      const masteryList = await getStudentMastery(req.user.id);
      const masteryMap = new Map(masteryList.map(m => [m.topic_id, m]));
      const prereq = await checkPrerequisitesSatisfied(req.user.id, topic, masteryMap);
      if (!prereq.satisfied) {
        return res.status(403).json({
          error: `Prerequisite topic '${prereq.failedTopicName}' has not reached the 70% mastery threshold required to access this lesson.`,
          failedTopicId: prereq.failedTopicId
        });
      }
    }

    let isCompleted = false;
    if (req.user) {
      const completed = await getCompletedLessons(req.user.id);
      isCompleted = completed.includes(lesson.id);
    }

    return res.json({
      lesson: {
        ...lesson,
        is_completed: isCompleted
      },
      topic
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/curriculum/lessons/:id/complete', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const lesson = await getLessonById(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });

    await markLessonCompleted(req.user!.id, lesson.id, lesson.topic_id);
    await completeRecommendationByTarget(req.user!.id, 'lesson', lesson.id);

    // Recalculate recommendation
    const rec = await evaluatePedagogicalRules(req.user!.id);
    return res.json({ success: true, next_recommendation: rec });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/curriculum/exercises/:id', async (req: AuthRequest, res: Response) => {
  try {
    const exercise = await getExerciseById(req.params.id);
    if (!exercise) return res.status(404).json({ error: 'Exercise not found.' });

    const topic = await getTopicById(exercise.topic_id);
    if (!topic) return res.status(404).json({ error: 'Topic not found.' });

    // Enforce prerequisite check for students
    if (req.user && req.user.role === 'student') {
      const masteryList = await getStudentMastery(req.user.id);
      const masteryMap = new Map(masteryList.map(m => [m.topic_id, m]));
      const prereq = await checkPrerequisitesSatisfied(req.user.id, topic, masteryMap);
      if (!prereq.satisfied) {
        return res.status(403).json({
          error: `Prerequisite topic '${prereq.failedTopicName}' has not reached the 70% mastery threshold required to access this exercise.`,
          failedTopicId: prereq.failedTopicId
        });
      }
    }

    const testCases = await getTestCasesByExerciseId(exercise.id);

    // Mask hidden test cases from students
    const sanitizedTestCases = testCases.map(tc => ({
      id: tc.id,
      description: tc.description,
      input_data: tc.is_hidden ? '' : tc.input_data,
      expected_output: tc.is_hidden ? '[Hidden Test Case]' : tc.expected_output,
      function_call: tc.is_hidden ? undefined : tc.function_call,
      is_hidden: tc.is_hidden
    }));

    // Find student's best score and attempt count if logged in
    let bestScore = 0;
    let attemptCount = 0;
    let isPassed = false;
    if (req.user) {
      const attempts = await getStudentAttempts(req.user.id, 50);
      const exAttempts = attempts.filter(a => a.exercise_id === exercise.id);
      attemptCount = exAttempts.length;
      if (exAttempts.length > 0) {
        bestScore = Math.max(...exAttempts.map(a => a.score));
        isPassed = exAttempts.some(a => a.all_passed);
      }
    }

    return res.json({
      exercise: {
        ...exercise,
        worked_solution: undefined, // Solution protected on server
        test_cases: sanitizedTestCases,
        best_score: bestScore,
        attempt_count: attemptCount,
        is_passed: isPassed
      },
      topic
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/curriculum/exercises/:id/hint/:level', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const exercise = await getExerciseById(req.params.id);
    if (!exercise) return res.status(404).json({ error: 'Exercise not found.' });

    const requestedLevel = parseInt(req.params.level, 10);
    if (requestedLevel < 1 || requestedLevel > 3) {
      return res.status(400).json({ error: 'Hint level must be 1, 2, or 3.' });
    }

    const availableHints = exercise.hints.filter(h => h.level <= requestedLevel);
    return res.json({ hints: availableHints });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/curriculum/exercises/:id/solution', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const exercise = await getExerciseById(req.params.id);
    if (!exercise) return res.status(404).json({ error: 'Exercise not found.' });

    return res.json({
      solution: exercise.worked_solution,
      notice: 'Worked Example: Study this reference solution to understand the algorithm structure.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/* ================= ASSESSMENT & CODE EXECUTION ================= */

app.post('/api/assessment/playground', async (req: Request, res: Response) => {
  try {
    const { code, input_data } = req.body;
    if (typeof code !== 'string') {
      return res.status(400).json({ error: 'Code string is required.' });
    }

    const result = await runPlayground({ code, input_data });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/assessment/submit', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const { exercise_id, code, hints_used, revealed_solution, time_spent_seconds } = req.body;
    if (!exercise_id || typeof code !== 'string') {
      return res.status(400).json({ error: 'exercise_id and code string are required.' });
    }

    const result = await submitAssessment({
      student_id: req.user!.id,
      exercise_id,
      code,
      hints_used: Number(hints_used || 0),
      revealed_solution: Boolean(revealed_solution),
      time_spent_seconds: Number(time_spent_seconds || 0)
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/* ================= STUDENT DASHBOARD & MODEL ================= */

app.get('/api/student/dashboard', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const topics = await getAllTopics();
    const masteryList = await getStudentMastery(studentId);
    const masteryMap = new Map(masteryList.map(m => [m.topic_id, m]));
    const attempts = await getStudentAttempts(studentId, 20);

    const preTestResp = await getAssessmentResponse(studentId, 'pre_test');
    const postTestResp = await getAssessmentResponse(studentId, 'post_test');
    const susResp = await getStudentSUS(studentId);

    let activeRec = await getActiveRecommendation(studentId);
    if (!activeRec) {
      activeRec = await evaluatePedagogicalRules(studentId);
    }

    let sumMastery = 0;
    let countMastered = 0;

    const enrichedTopics = await Promise.all(
      topics.map(async (t) => {
        const prereq = await checkPrerequisitesSatisfied(studentId, t, masteryMap);
        const m = masteryMap.get(t.id);
        const score = m ? m.mastery_score : 0;
        const cat = m ? m.mastery_category : 'unassessed';
        sumMastery += score;
        if (score >= 70.0) countMastered++;

        const exList = await getExercisesByTopicId(t.id);
        return {
          ...t,
          mastery_score: score,
          mastery_category: cat,
          is_unlocked: prereq.satisfied,
          exercise_count: exList.length
        };
      })
    );

    const avgMastery = topics.length > 0 ? Math.round((sumMastery / topics.length) * 10) / 10 : 0;

    return res.json({
      user: req.user,
      pre_test_completed: Boolean(preTestResp),
      post_test_completed: Boolean(postTestResp),
      sus_completed: Boolean(susResp),
      pre_test_score: preTestResp?.percentage,
      post_test_score: postTestResp?.percentage,
      overall_average_mastery: avgMastery,
      topics_mastered_count: countMastered,
      total_attempts_count: attempts.length,
      active_recommendation: activeRec,
      topics: enrichedTopics,
      recent_attempts: attempts
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/student/mastery', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const list = await getStudentMastery(req.user!.id);
    return res.json({ mastery: list });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/student/attempts', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const attempts = await getStudentAttempts(req.user!.id, 50);
    return res.json({ attempts });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/student/recommendations', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const rec = await evaluatePedagogicalRules(req.user!.id);
    return res.json({ recommendation: rec });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/student/recommendations/history', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const history = await getRecommendationHistory(req.user!.id, 30);
    return res.json({ history });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/student/recommendations/:id/respond', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const { response } = req.body;
    if (!response || !['accepted', 'completed', 'dismissed', 'in_progress'].includes(response)) {
      return res.status(400).json({ error: 'Valid response required (accepted, completed, dismissed, in_progress)' });
    }
    await recordLearnerResponse(req.params.id, req.user!.id, response);
    return res.json({ success: true, recommendation_id: req.params.id, response });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/* ================= LEADERBOARD (ANONYMIZED OPT-IN) ================= */

app.get('/api/leaderboard', async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    let currentUserOptedIn = false;
    if (req.user) {
      currentUserOptedIn = Boolean(req.user.leaderboard_opt_in);
    }

    // Query all students who explicitly opted in
    const optedInStudents = await dbQuery<any>(`
      SELECT 
        u.id,
        u.participant_id,
        coalesce((SELECT count(*) FROM student_mastery WHERE student_id = u.id AND mastery_score >= 70.0), 0) as modules_mastered,
        coalesce((SELECT count(DISTINCT exercise_id) FROM student_attempts WHERE student_id = u.id AND all_passed = 1), 0) as exercises_passed,
        coalesce((SELECT avg(mastery_score) FROM student_mastery WHERE student_id = u.id), 0.0) as avg_mastery
      FROM users u
      WHERE u.role = 'student' AND u.leaderboard_opt_in = 1
    `);

    // Calculate Mastery Points for each opted-in student
    const rankedList = optedInStudents.map(s => {
      const modulesMastered = Number(s.modules_mastered || 0);
      const exercisesPassed = Number(s.exercises_passed || 0);
      const avgMastery = Math.round(Number(s.avg_mastery || 0) * 10) / 10;
      // Formula: 100 points per mastered module + 50 points per passed coding exercise + (avg_mastery * 5)
      const masteryPoints = (modulesMastered * 100) + (exercisesPassed * 50) + Math.round(avgMastery * 5);
      return {
        id: s.id,
        participant_id: s.participant_id, // Pseudonymous identifier
        mastery_points: masteryPoints,
        modules_mastered: modulesMastered,
        exercises_passed: exercisesPassed,
        avg_mastery: avgMastery,
        is_current_user: s.id === currentUserId
      };
    });

    // Sort descending by mastery points
    rankedList.sort((a, b) => b.mastery_points - a.mastery_points);

    // Assign rank
    const leaderboard = rankedList.map((entry, index) => ({
      rank: index + 1,
      participant_id: entry.participant_id,
      mastery_points: entry.mastery_points,
      modules_mastered: entry.modules_mastered,
      exercises_passed: entry.exercises_passed,
      avg_mastery: entry.avg_mastery,
      is_current_user: entry.is_current_user
    }));

    const userEntry = leaderboard.find(e => e.is_current_user) || null;

    return res.json({
      opted_in: currentUserOptedIn,
      leaderboard,
      current_user_standing: userEntry
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/leaderboard/opt-in', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const { opt_in } = req.body;
    const shouldOptIn = Boolean(opt_in);
    await dbExecute('UPDATE users SET leaderboard_opt_in = ? WHERE id = ?', [shouldOptIn ? 1 : 0, req.user!.id]);
    req.user!.leaderboard_opt_in = shouldOptIn;
    return res.json({ success: true, opted_in: shouldOptIn });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/* ================= RESEARCH ASSESSMENTS (PRE/POST) ================= */

app.get('/api/assessments/:type', async (req: AuthRequest, res: Response) => {
  try {
    const type = req.params.type as 'pre_test' | 'post_test';
    if (type !== 'pre_test' && type !== 'post_test') {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    const assessment = await getAssessment(type, false);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });

    let existingResp = null;
    if (req.user) {
      existingResp = await getAssessmentResponse(req.user.id, type);
    }

    return res.json({
      assessment,
      user_response: existingResp
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/assessments/submit', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const { assessment_id, answers } = req.body;
    if (assessment_id !== 'pre_test' && assessment_id !== 'post_test') {
      return res.status(400).json({ error: 'Invalid assessment_id.' });
    }
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Answers dictionary required.' });
    }

    // Retrieve questions with answer keys to score
    const assessment = await getAssessment(assessment_id, true);
    if (!assessment || !assessment.questions) {
      return res.status(500).json({ error: 'Could not load assessment questions.' });
    }

    let correctCount = 0;
    const questionsBreakdown: any[] = [];

    for (const q of assessment.questions) {
      const selected = answers[q.id];
      const isCorrect = selected !== undefined && Number(selected) === q.correct_index;
      if (isCorrect) correctCount++;
      questionsBreakdown.push({
        id: q.id,
        question_text: q.question_text,
        options: q.options,
        selected_index: selected,
        correct_index: q.correct_index,
        is_correct: isCorrect,
        explanation: q.explanation
      });
    }

    const total = assessment.questions.length;
    const percentage = Math.round((correctCount / total) * 100 * 10) / 10;
    const respId = `resp_${assessment_id}_${req.user!.id}`;

    await saveAssessmentResponse({
      id: respId,
      student_id: req.user!.id,
      assessment_id,
      score: correctCount,
      total_questions: total,
      percentage,
      answers,
      completed_at: new Date().toISOString()
    });

    // Mark active recommendation for diagnostic/post-test completed
    await completeRecommendationByTarget(
      req.user!.id,
      assessment_id === 'pre_test' ? 'diagnostic' : 'post_test',
      assessment_id
    );

    // Recalculate recommendation
    const nextRec = await evaluatePedagogicalRules(req.user!.id);

    return res.json({
      score: correctCount,
      total_questions: total,
      percentage,
      questions_breakdown: questionsBreakdown,
      next_recommendation: nextRec
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/* ================= SYSTEM USABILITY SCALE (SUS) ================= */

app.post('/api/survey/sus', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const { responses } = req.body; // array of 10 numbers [1..5]
    if (!Array.isArray(responses) || responses.length !== 10) {
      return res.status(400).json({ error: 'System Usability Scale requires responses to all 10 items.' });
    }

    const susCalc = calculateSUSScore(responses);
    const surveyId = `sus_${Date.now()}_${req.user!.id}`;

    await saveSUSSurvey({
      id: surveyId,
      student_id: req.user!.id,
      participant_id: req.user!.participant_id,
      q1: responses[0],
      q2: responses[1],
      q3: responses[2],
      q4: responses[3],
      q5: responses[4],
      q6: responses[5],
      q7: responses[6],
      q8: responses[7],
      q9: responses[8],
      q10: responses[9],
      sus_score: susCalc.sus_score,
      created_at: new Date().toISOString()
    });

    return res.json({
      success: true,
      sus_score: susCalc.sus_score,
      adjective_rating: susCalc.adjective_rating,
      grade_scale: susCalc.grade_scale,
      calculation_details: susCalc
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/survey/sus', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const sus = await getStudentSUS(req.user!.id);
    return res.json({ survey: sus });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/* ================= OPTIONAL AI EXPLANATION ROUTE ================= */

app.post('/api/ai/explain', async (req: Request, res: Response) => {
  try {
    const result = await generatePedagogicalExplanation(req.body);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/chat/message', async (req: Request, res: Response) => {
  try {
    const { messages, taskType, context } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }
    const result = await handleMultiTurnChat({ messages, taskType, context });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/* ================= ADMINISTRATOR / RESEARCHER PORTAL ================= */

app.get('/api/admin/overview', requireAdmin as any, async (req: Request, res: Response) => {
  try {
    const totalStudents = await dbQuery<{ count: number }>("SELECT count(*) as count FROM users WHERE role = 'student'");
    const totalAttempts = await dbQuery<{ count: number }>("SELECT count(*) as count FROM student_attempts");
    const avgMastery = await dbQuery<{ avg_score: number }>("SELECT avg(mastery_score) as avg_score FROM student_mastery");
    const preTestAvg = await dbQuery<{ avg_pct: number }>("SELECT avg(percentage) as avg_pct FROM assessment_responses WHERE assessment_id = 'pre_test'");
    const postTestAvg = await dbQuery<{ avg_pct: number }>("SELECT avg(percentage) as avg_pct FROM assessment_responses WHERE assessment_id = 'post_test'");
    const susAvg = await dbQuery<{ avg_sus: number }>("SELECT avg(sus_score) as avg_sus FROM sus_surveys");

    const errorDist = await dbQuery<{ category: string; count: number }>(`
      SELECT coalesce(error_category, 'OutputMismatch') as category, count(*) as count
      FROM student_attempts
      WHERE all_passed = 0
      GROUP BY category
      ORDER BY count DESC
    `);

    const topicBreakdown = await dbQuery<any>(`
      SELECT t.id as topic_id, t.name as topic_name, coalesce(avg(sm.mastery_score), 0.0) as avg_mastery, count(sa.id) as attempt_count
      FROM topics t
      LEFT JOIN student_mastery sm ON t.id = sm.topic_id
      LEFT JOIN student_attempts sa ON t.id = sa.topic_id
      GROUP BY t.id
      ORDER BY t.order_index ASC
    `);

    const students = await dbQuery<any>(`
      SELECT 
        u.id, u.username, u.email, u.participant_id, u.created_at,
        (SELECT percentage FROM assessment_responses WHERE student_id = u.id AND assessment_id = 'pre_test') as pre_test_score,
        (SELECT percentage FROM assessment_responses WHERE student_id = u.id AND assessment_id = 'post_test') as post_test_score,
        coalesce((SELECT avg(mastery_score) FROM student_mastery WHERE student_id = u.id), 0.0) as avg_mastery,
        (SELECT count(*) FROM student_attempts WHERE student_id = u.id) as attempts_count,
        (SELECT max(timestamp) FROM student_attempts WHERE student_id = u.id) as last_active
      FROM users u
      WHERE u.role = 'student'
      ORDER BY u.created_at DESC
    `);

    return res.json({
      analytics: {
        total_students: totalStudents[0]?.count || 0,
        total_attempts: totalAttempts[0]?.count || 0,
        avg_platform_mastery: Math.round((avgMastery[0]?.avg_score || 0) * 10) / 10,
        pre_test_avg: Math.round((preTestAvg[0]?.avg_pct || 0) * 10) / 10,
        post_test_avg: Math.round((postTestAvg[0]?.avg_pct || 0) * 10) / 10,
        sus_average_score: Math.round((susAvg[0]?.avg_sus || 0) * 10) / 10,
        error_category_distribution: errorDist,
        topic_mastery_breakdown: topicBreakdown.map(b => ({
          ...b,
          avg_mastery: Math.round(b.avg_mastery * 10) / 10
        })),
        students
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin Curriculum Management: update lesson
app.post('/api/admin/lessons/:id', requireAdmin as any, async (req: Request, res: Response) => {
  try {
    const { title, summary, content_markdown, is_published } = req.body;
    await dbExecute(
      'UPDATE lessons SET title = ?, summary = ?, content_markdown = ?, is_published = ? WHERE id = ?',
      [title, summary, content_markdown, is_published ? 1 : 0, req.params.id]
    );
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin Curriculum Management: update exercise
app.post('/api/admin/exercises/:id', requireAdmin as any, async (req: Request, res: Response) => {
  try {
    const { title, difficulty, problem_statement, instructions, starter_code, worked_solution, max_score } = req.body;
    await dbExecute(
      `UPDATE exercises SET 
        title = ?, difficulty = ?, problem_statement = ?, instructions = ?,
        starter_code = ?, worked_solution = ?, max_score = ?
       WHERE id = ?`,
      [title, difficulty, problem_statement, instructions, starter_code, worked_solution, max_score || 100, req.params.id]
    );
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin Evaluation CSV Export
app.get('/api/admin/export/:type', requireAdmin as any, async (req: Request, res: Response) => {
  try {
    const type = req.params.type as 'students' | 'attempts' | 'usability' | 'dictionary';
    if (type === 'dictionary') {
      return res.json({ data_dictionary: DATA_DICTIONARY });
    }

    if (type !== 'students' && type !== 'attempts' && type !== 'usability') {
      return res.status(400).json({ error: 'Valid export types: students, attempts, usability, dictionary' });
    }

    const csvContent = await exportResearchDatasetCSV(type);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="codexa_evaluation_${type}_${Date.now()}.csv"`);
    return res.send(csvContent);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Reset demonstration data
app.post('/api/admin/reset-demo', requireAdmin as any, async (req: Request, res: Response) => {
  try {
    await dbResetSeed();
    return res.json({ success: true, message: 'Demonstration database reset to pristine seed state.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/* ================= STATIC & DEV SERVER VITE MOUNT ================= */

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Codexa Intelligent Tutoring System running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
