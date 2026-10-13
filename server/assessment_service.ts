import { execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getExerciseById,
  getTestCasesByExerciseId,
  saveAttempt,
  completeRecommendationByTarget
} from './db_service';
import {
  recalculateTopicMastery,
  evaluatePedagogicalRules
} from './tutoring_engine';
import type { StudentAttempt } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SANDBOX_PATH = path.join(__dirname, 'sandbox.py');

export interface PlaygroundRequest {
  code: string;
  input_data?: string;
  timeout_seconds?: number;
}

export interface PlaygroundResponse {
  success: boolean;
  stdout: string;
  stderr: string;
  error_category: string | null;
  execution_time_ms: number;
}

export interface AssessmentRequest {
  student_id: string;
  exercise_id: string;
  code: string;
  hints_used?: number;
  revealed_solution?: boolean;
  time_spent_seconds?: number;
}

export interface AssessmentResult {
  attempt_id: string;
  syntax_valid: boolean;
  all_passed: boolean;
  score_percentage: number;
  passed_count: number;
  total_count: number;
  primary_error_category: string | null;
  diagnostic_feedback: string;
  test_results: Array<{
    id: string;
    passed: boolean;
    actual_output: string;
    expected_output: string;
    error_category: string | null;
    error_message?: string | null;
    remedial_advice?: string | null;
    execution_time_ms: number;
    is_hidden: boolean;
  }>;
  new_mastery_score?: number;
  new_mastery_category?: string;
  next_recommendation?: any;
  sandbox_metadata?: any;
}

/**
 * Execute arbitrary playground code without test cases in the isolated sandbox
 */
export async function runPlayground(req: PlaygroundRequest): Promise<PlaygroundResponse> {
  const payload = JSON.stringify({
    mode: 'playground',
    code: req.code,
    input_data: req.input_data || '',
    timeout_seconds: req.timeout_seconds || 2.0
  });

  return new Promise((resolve) => {
    execFile('python3', [SANDBOX_PATH, payload], { timeout: 4000 }, (err, stdout, stderr) => {
      if (err && !stdout) {
        return resolve({
          success: false,
          stdout: '',
          stderr: stderr || err.message,
          error_category: 'ExecutionError',
          execution_time_ms: 0
        });
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        resolve(parsed);
      } catch (parseErr) {
        resolve({
          success: false,
          stdout: '',
          stderr: `Output parsing error: ${stdout || stderr}`,
          error_category: 'InternalError',
          execution_time_ms: 0
        });
      }
    });
  });
}

/**
 * Automated assessment execution against configured test cases in isolated sandbox
 */
export async function submitAssessment(req: AssessmentRequest): Promise<AssessmentResult> {
  const exercise = await getExerciseById(req.exercise_id);
  if (!exercise) {
    throw new Error(`Exercise ${req.exercise_id} not found.`);
  }

  const testCases = await getTestCasesByExerciseId(req.exercise_id);
  if (testCases.length === 0) {
    throw new Error(`No test cases configured for exercise ${req.exercise_id}.`);
  }

  // Format test case objects for sandbox runner
  const formattedTestCases = testCases.map(tc => ({
    id: tc.id,
    input_data: tc.input_data,
    expected_output: tc.expected_output,
    function_call: tc.function_call,
    is_hidden: tc.is_hidden
  }));

  const payload = JSON.stringify({
    mode: 'assessment',
    code: req.code,
    test_cases: formattedTestCases,
    timeout_seconds: 2.0
  });

  const sandboxOutput: any = await new Promise((resolve, reject) => {
    execFile('python3', [SANDBOX_PATH, payload], { timeout: 8000 }, (err, stdout, stderr) => {
      if (err && !stdout) {
        return reject(new Error(`Sandbox execution failed: ${stderr || err.message}`));
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        resolve(parsed);
      } catch (e: any) {
        reject(new Error(`Sandbox output parse failure: ${stdout}`));
      }
    });
  });

  const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let execStatus: 'success' | 'failed' | 'timeout' | 'syntax_error' = 'success';
  if (!sandboxOutput.syntax_valid) {
    execStatus = 'syntax_error';
  } else if (sandboxOutput.primary_error_category === 'TimeLimitExceeded') {
    execStatus = 'timeout';
  } else if (!sandboxOutput.all_passed) {
    execStatus = 'failed';
  }

  const attemptRecord: StudentAttempt = {
    id: attemptId,
    student_id: req.student_id,
    exercise_id: req.exercise_id,
    topic_id: exercise.topic_id,
    submitted_code: req.code,
    score: sandboxOutput.score_percentage,
    passed_count: sandboxOutput.passed_count,
    total_count: sandboxOutput.total_count,
    all_passed: sandboxOutput.all_passed,
    syntax_valid: sandboxOutput.syntax_valid,
    execution_status: execStatus,
    error_category: sandboxOutput.primary_error_category,
    diagnostic_feedback: sandboxOutput.diagnostic_feedback,
    hints_used: req.hints_used || 0,
    revealed_solution: Boolean(req.revealed_solution),
    time_spent_seconds: req.time_spent_seconds || 0,
    timestamp: new Date().toISOString()
  };

  // Persist attempt and test case results
  await saveAttempt(attemptRecord, sandboxOutput.test_results);

  // If passed all test cases, mark active recommendation for this exercise completed
  if (sandboxOutput.all_passed) {
    await completeRecommendationByTarget(req.student_id, 'exercise', req.exercise_id);
  }

  // Recalculate topic mastery for student model
  const updatedMastery = await recalculateTopicMastery(req.student_id, exercise.topic_id);

  // Trigger tutoring engine to compute next personalized recommendation
  const nextRec = await evaluatePedagogicalRules(req.student_id);

  // Mask expected outputs for hidden test cases from student response
  const sanitizedResults = sandboxOutput.test_results.map((tr: any) => ({
    id: tr.id,
    passed: tr.passed,
    actual_output: tr.is_hidden ? (tr.passed ? '[Hidden Test Passed]' : '[Hidden Test Failed - Output Did Not Match Expected Values]') : tr.actual_output,
    expected_output: tr.is_hidden ? '[Hidden Test Case]' : tr.expected_output,
    error_category: tr.error_category,
    error_message: tr.is_hidden ? undefined : tr.error_message,
    remedial_advice: tr.remedial_advice,
    execution_time_ms: tr.execution_time_ms,
    is_hidden: tr.is_hidden
  }));

  return {
    attempt_id: attemptId,
    syntax_valid: sandboxOutput.syntax_valid,
    all_passed: sandboxOutput.all_passed,
    score_percentage: sandboxOutput.score_percentage,
    passed_count: sandboxOutput.passed_count,
    total_count: sandboxOutput.total_count,
    primary_error_category: sandboxOutput.primary_error_category,
    diagnostic_feedback: sandboxOutput.diagnostic_feedback,
    test_results: sanitizedResults,
    new_mastery_score: updatedMastery.mastery_score,
    new_mastery_category: updatedMastery.mastery_category,
    next_recommendation: nextRec,
    sandbox_metadata: sandboxOutput.sandbox_metadata
  };
}
