/**
 * Codexa Research Evaluation Service
 * 
 * Implements:
 * 1. Standard System Usability Scale (SUS) 10-item calculation
 * 2. Learning assessment metrics (pre/post gain)
 * 3. Anonymized research dataset CSV generation
 * 4. Academic Data Dictionary
 */

import { dbQuery } from './db_service';

export interface SUSCalculationResult {
  raw_responses: number[];
  odd_contributions: number[];
  even_contributions: number[];
  sum_contributions: number;
  sus_score: number;
  adjective_rating: string;
  grade_scale: string;
}

/**
 * Calculates SUS according to Brooke (1996) standard methodology:
 * - Odd items (1, 3, 5, 7, 9): contribution = response - 1
 * - Even items (2, 4, 6, 8, 10): contribution = 5 - response
 * - Total SUS score = sum of contributions * 2.5 (Range 0 - 100)
 */
export function calculateSUSScore(responses: number[]): SUSCalculationResult {
  if (responses.length !== 10) {
    throw new Error('SUS requires exactly 10 question responses.');
  }

  const oddContribs: number[] = [];
  const evenContribs: number[] = [];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    const val = Number(responses[i]);
    if (val < 1 || val > 5) {
      throw new Error(`SUS responses must be integers between 1 and 5. Received ${val} for item ${i + 1}.`);
    }

    if (i % 2 === 0) {
      // Odd numbered question (1st, 3rd, 5th, etc.)
      const c = val - 1;
      oddContribs.push(c);
      sum += c;
    } else {
      // Even numbered question (2nd, 4th, 6th, etc.)
      const c = 5 - val;
      evenContribs.push(c);
      sum += c;
    }
  }

  const score = Math.round(sum * 2.5 * 10) / 10;

  let adjective = 'Poor';
  let grade = 'F';
  if (score >= 85) {
    adjective = 'Excellent';
    grade = 'A+';
  } else if (score >= 80.3) {
    adjective = 'Excellent';
    grade = 'A';
  } else if (score >= 68) {
    adjective = 'Good (Above Benchmark Average)';
    grade = 'B/C';
  } else if (score >= 51) {
    adjective = 'OK';
    grade = 'D';
  }

  return {
    raw_responses: responses,
    odd_contributions: oddContribs,
    even_contributions: evenContribs,
    sum_contributions: sum,
    sus_score: score,
    adjective_rating: adjective,
    grade_scale: grade
  };
}

export const DATA_DICTIONARY = [
  { field: "participant_id", type: "String", description: "Pseudonymous student identifier generated upon registration for research ethics (e.g. PARTICIPANT-A82F1)." },
  { field: "evaluation_group", type: "String", description: "Research experimental condition label (e.g. 'ITS_Intervention' or 'Control_Baseline') enabling comparative between-group analysis." },
  { field: "registration_date", type: "ISO-8601 Timestamp", description: "Timestamp of participant enrollment." },
  { field: "pre_test_score", type: "Float", description: "Diagnostic pre-assessment percentage score (0.0 to 100.0) measured prior to lesson instruction." },
  { field: "post_test_score", type: "Float", description: "Summative post-assessment percentage score (0.0 to 100.0) measured after curriculum completion." },
  { field: "learning_gain_absolute", type: "Float", description: "Individual learning gain calculated strictly as (Post-test score - Pre-test score) on a consistent 0-100 scale. Note: Causal inference depends on comparative study design rather than individual gain alone." },
  { field: "normalized_gain_g", type: "Float", description: "Hake's normalized learning gain: (post - pre) / (100 - pre). Quantifies conceptual gain independent of baseline ceiling effects." },
  { field: "avg_topic_mastery", type: "Float", description: "Mean topic mastery percentage across all 10 introductory curriculum modules calculated by the student model." },
  { field: "modules_mastered", type: "Integer", description: "Count of curriculum modules where learner reached or exceeded the 70% threshold (0 to 10)." },
  { field: "total_attempts", type: "Integer", description: "Total number of code submissions across all programming exercises." },
  { field: "total_hints_requested", type: "Integer", description: "Total count of progressive hints requested by learner across all exercises." },
  { field: "sus_score", type: "Float", description: "System Usability Scale score (0.0 to 100.0) computed using standard Brooke (1996) formula. Never combined with Python knowledge scores." },
  { field: "error_category", type: "String", description: "Taxonomic category of execution or syntax error (e.g., SyntaxError, NameError, TypeError, IndexError, TimeLimitExceeded)." }
];

export async function exportResearchDatasetCSV(type: 'students' | 'attempts' | 'usability'): Promise<string> {
  if (type === 'students') {
    const students = await dbQuery<any>(`
      SELECT 
        u.participant_id,
        coalesce(u.evaluation_group, 'ITS_Intervention') as evaluation_group,
        u.created_at as registration_date,
        (SELECT percentage FROM assessment_responses WHERE student_id = u.id AND assessment_id = 'pre_test') as pre_test_score,
        (SELECT percentage FROM assessment_responses WHERE student_id = u.id AND assessment_id = 'post_test') as post_test_score,
        (SELECT sus_score FROM sus_surveys WHERE student_id = u.id LIMIT 1) as sus_score,
        (SELECT count(*) FROM student_attempts WHERE student_id = u.id) as total_attempts,
        (SELECT coalesce(sum(hints_used), 0) FROM student_attempts WHERE student_id = u.id) as total_hints_used,
        (SELECT coalesce(avg(mastery_score), 0.0) FROM student_mastery WHERE student_id = u.id) as avg_mastery,
        (SELECT count(*) FROM student_mastery WHERE student_id = u.id AND mastery_score >= 70.0) as modules_mastered
      FROM users u
      WHERE u.role = 'student'
      ORDER BY u.participant_id ASC
    `);

    let csv = "participant_id,evaluation_group,registration_date,pre_test_score,post_test_score,learning_gain_absolute,normalized_gain_g,avg_topic_mastery,modules_mastered,total_attempts,total_hints_used,sus_score\n";
    for (const s of students) {
      const pre = s.pre_test_score !== null ? Number(s.pre_test_score) : null;
      const post = s.post_test_score !== null ? Number(s.post_test_score) : null;
      let absGainStr = "N/A";
      let normGainStr = "N/A";
      if (pre !== null && post !== null) {
        const absGain = Math.round((post - pre) * 10) / 10;
        absGainStr = absGain.toFixed(1);
        if (pre < 100) {
          const g = (post - pre) / (100 - pre);
          normGainStr = (Math.round(g * 1000) / 1000).toString();
        } else {
          normGainStr = "1.000";
        }
      }

      csv += [
        s.participant_id,
        s.evaluation_group,
        s.registration_date,
        pre !== null ? pre.toFixed(1) : "N/A",
        post !== null ? post.toFixed(1) : "N/A",
        absGainStr,
        normGainStr,
        Number(s.avg_mastery || 0).toFixed(1),
        s.modules_mastered || 0,
        s.total_attempts || 0,
        s.total_hints_used || 0,
        s.sus_score !== null ? Number(s.sus_score).toFixed(1) : "N/A"
      ].join(",") + "\n";
    }
    return csv;
  }

  if (type === 'attempts') {
    const attempts = await dbQuery<any>(`
      SELECT 
        u.participant_id,
        sa.timestamp,
        t.name as module_name,
        sa.exercise_id,
        e.title as exercise_title,
        sa.score,
        sa.passed_count,
        sa.total_count,
        sa.execution_status,
        coalesce(sa.error_category, 'None') as error_category,
        sa.hints_used,
        sa.revealed_solution,
        sa.time_spent_seconds
      FROM student_attempts sa
      JOIN users u ON sa.student_id = u.id
      JOIN exercises e ON sa.exercise_id = e.id
      JOIN topics t ON sa.topic_id = t.id
      ORDER BY sa.timestamp DESC
    `);

    let csv = "participant_id,timestamp,module_name,exercise_id,exercise_title,score,passed_count,total_count,execution_status,error_category,hints_used,revealed_solution,time_spent_seconds\n";
    for (const a of attempts) {
      csv += [
        a.participant_id,
        a.timestamp,
        `"${a.module_name.replace(/"/g, '""')}"`,
        a.exercise_id,
        `"${a.exercise_title.replace(/"/g, '""')}"`,
        a.score,
        a.passed_count,
        a.total_count,
        a.execution_status,
        a.error_category,
        a.hints_used,
        a.revealed_solution ? 1 : 0,
        a.time_spent_seconds
      ].join(",") + "\n";
    }
    return csv;
  }

  if (type === 'usability') {
    const surveys = await dbQuery<any>(`
      SELECT participant_id, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, sus_score, created_at
      FROM sus_surveys
      ORDER BY created_at DESC
    `);

    let csv = "participant_id,created_at,q1_frequent_use,q2_complex,q3_easy_to_use,q4_need_support,q5_well_integrated,q6_inconsistency,q7_learn_quickly,q8_cumbersome,q9_confident,q10_need_to_learn_a_lot,final_sus_score\n";
    for (const s of surveys) {
      csv += [
        s.participant_id,
        s.created_at,
        s.q1, s.q2, s.q3, s.q4, s.q5, s.q6, s.q7, s.q8, s.q9, s.q10,
        s.sus_score
      ].join(",") + "\n";
    }
    return csv;
  }

  return "";
}
