/**
 * PyTutor Explainable Rule-Based Intelligent Tutoring Engine
 *
 * Implements the Deterministic Student Model, Topic-Level Mastery Aggregation,
 * and Pedagogical Tutoring Rules with fully explainable recommendations.
 *
 * Requirements satisfied:
 * 1. Maintain topic-level mastery scores based on valid assessment evidence.
 * 2. Enforce prerequisite relationships.
 * 3. Distinguish insufficient evidence from demonstrated low mastery.
 * 4. Recommend remedial lessons when performance is poor.
 * 5. Recommend additional practice when mastery is developing.
 * 6. Recommend more challenging exercises when mastery is sufficiently high.
 * 7. Identify repeated error categories when classified reliably.
 * 8. Record the reason for every recommendation.
 * 9. Update the student model after each valid assessment attempt.
 * 10. Avoid recommending activities that are already completed unless revision is intended.
 * 11. Store a history of recommendations and learner responses to them.
 * 12. Keep the rules configurable and documented.
 *
 * Initial Mastery Bands (configurable design thresholds):
 * - 0–49%: Needs substantial support.
 * - 50–69%: Developing.
 * - 70–84%: Near mastery.
 * - 85–100%: Provisional mastery.
 *
 * Note: Under no circumstances does an LLM calculate mastery or silently determine
 * whether a student has learned a topic. All scores and recommendations are strictly
 * deterministic, evidence-based, and auditable.
 */

import {
  getAllTopics,
  getTopicById,
  getExercisesByTopicId,
  getTestCasesByExerciseId,
  getStudentMastery,
  getStudentMasteryForTopic,
  upsertStudentMastery,
  getStudentAttempts,
  getActiveRecommendation,
  saveRecommendation,
  getAssessmentResponse,
  getCompletedLessons
} from './db_service';
import type {
  Topic,
  Exercise,
  MasteryCategory,
  StudentMastery,
  Recommendation,
  StudentAttempt
} from './types';

/**
 * Configurable Tutoring Engine parameters.
 * These represent pedagogical design thresholds rather than immutable educational standards.
 */
export interface TutoringConfig {
  /** Minimum % mastery required in prerequisite topics before downstream topics unlock (default: 70.0%) */
  PREREQUISITE_THRESHOLD: number;
  /** Upper bound for demonstrated low mastery: [0, 50.0%) represents 'Needs Substantial Support' */
  LOW_MASTERY_THRESHOLD: number;
  /** Upper bound for developing mastery: [50.0%, 70.0%) represents 'Developing' */
  DEVELOPING_THRESHOLD: number;
  /** Upper bound for near mastery: [70.0%, 85.0%) represents 'Near Mastery' */
  NEAR_MASTERY_THRESHOLD: number;
  /** Lower bound for provisional mastery: [85.0%, 100.0%] represents 'Provisional Mastery' */
  PROVISIONAL_MASTERY_MIN: number;
  /** Number of consecutive identical error classifications triggering targeted remediation (default: 2) */
  REPEATED_ERROR_COUNT: number;
}

export const DEFAULT_TUTORING_CONFIG: TutoringConfig = {
  PREREQUISITE_THRESHOLD: 70.0,
  LOW_MASTERY_THRESHOLD: 50.0,
  DEVELOPING_THRESHOLD: 70.0,
  NEAR_MASTERY_THRESHOLD: 85.0,
  PROVISIONAL_MASTERY_MIN: 85.0,
  REPEATED_ERROR_COUNT: 2
};

export let TUTORING_CONFIG: TutoringConfig = { ...DEFAULT_TUTORING_CONFIG };

/**
 * Allows dynamic or experimental reconfiguration of the tutoring thresholds.
 */
export function configureTutoringEngine(newConfig: Partial<TutoringConfig>): TutoringConfig {
  TUTORING_CONFIG = { ...TUTORING_CONFIG, ...newConfig };
  return { ...TUTORING_CONFIG };
}

/**
 * Resets tutoring configuration to the documented baseline defaults.
 */
export function resetTutoringConfig(): TutoringConfig {
  TUTORING_CONFIG = { ...DEFAULT_TUTORING_CONFIG };
  return { ...TUTORING_CONFIG };
}

/**
 * Returns the current active configuration.
 */
export function getTutoringConfig(): TutoringConfig {
  return { ...TUTORING_CONFIG };
}

/**
 * Classifies a mastery score into one of five distinct pedagogical bands.
 * Explicitly distinguishes insufficient evidence ('unassessed') from demonstrated low mastery ('needs_support').
 *
 * Mastery bands:
 * - Insufficient evidence: 0 attempts -> 'unassessed'
 * - 0–49%: Needs substantial support -> 'needs_support'
 * - 50–69%: Developing -> 'developing'
 * - 70–84%: Near mastery -> 'near_mastery'
 * - 85–100%: Provisional mastery -> 'provisional_mastery'
 */
export function classifyMastery(score: number, hasAttempts: boolean): MasteryCategory {
  if (!hasAttempts) return 'unassessed';
  if (score < TUTORING_CONFIG.LOW_MASTERY_THRESHOLD) return 'needs_support';
  if (score < TUTORING_CONFIG.DEVELOPING_THRESHOLD) return 'developing';
  if (score < TUTORING_CONFIG.NEAR_MASTERY_THRESHOLD) return 'near_mastery';
  return 'provisional_mastery';
}

/**
 * Human-readable label for each pedagogical mastery band.
 */
export function getMasteryLabel(category: MasteryCategory): string {
  switch (category) {
    case 'unassessed':
      return 'Unassessed (Insufficient Evidence)';
    case 'needs_support':
      return 'Needs Substantial Support (0–49%)';
    case 'developing':
      return 'Developing (50–69%)';
    case 'near_mastery':
      return 'Near Mastery (70–84%)';
    case 'provisional_mastery':
      return 'Provisional Mastery (85–100%)';
  }
}

/**
 * Calculates topic mastery strictly based on valid assessment evidence.
 *
 * Deterministic aggregation method:
 * 1. For each exercise defined in the topic, inspects valid assessment attempts by this student.
 * 2. Selects the learner's best attempt per exercise (maximum checks passed).
 * 3. If an exercise has not yet been attempted, its expected test cases are included in the denominator
 *    so provisional mastery requires comprehensive exercise completion.
 * 4. Topic mastery = (sum of best passed checks / sum of applicable checks) * 100.
 * 5. If no attempts exist at all, score is 0 and category is 'unassessed' (insufficient evidence).
 */
export async function recalculateTopicMastery(studentId: string, topicId: string): Promise<StudentMastery> {
  const exercises = await getExercisesByTopicId(topicId);
  const attempts = await getStudentAttempts(studentId, 100);
  const topicAttempts = attempts.filter(a => a.topic_id === topicId);

  // Insufficient Evidence condition: no attempts submitted on this topic
  if (topicAttempts.length === 0 || exercises.length === 0) {
    const unassessed: StudentMastery = {
      student_id: studentId,
      topic_id: topicId,
      mastery_score: 0,
      mastery_category: 'unassessed',
      assessment_checks_passed: 0,
      assessment_checks_total: 0,
      attempt_count: 0,
      last_attempt_at: null,
      updated_at: new Date().toISOString()
    };
    await upsertStudentMastery(unassessed);
    return unassessed;
  }

  let totalChecksApplicable = 0;
  let totalChecksPassed = 0;

  for (const ex of exercises) {
    const exAttempts = topicAttempts.filter(a => a.exercise_id === ex.id);
    if (exAttempts.length > 0) {
      // Best attempt on this exercise (highest passed checks count)
      const best = exAttempts.reduce((max, cur) => cur.passed_count > max.passed_count ? cur : max, exAttempts[0]);
      totalChecksApplicable += best.total_count;
      totalChecksPassed += best.passed_count;
    } else {
      // Unattempted exercise: look up actual test cases count to ensure correct denominator
      const testCases = await getTestCasesByExerciseId(ex.id);
      totalChecksApplicable += (testCases.length > 0 ? testCases.length : 2);
    }
  }

  const rawScore = totalChecksApplicable > 0 ? (totalChecksPassed / totalChecksApplicable) * 100 : 0;
  const masteryScore = Math.min(100, Math.max(0, Math.round(rawScore * 10) / 10));
  const category = classifyMastery(masteryScore, true);
  const lastAttempt = topicAttempts[0]?.timestamp || new Date().toISOString();

  const record: StudentMastery = {
    student_id: studentId,
    topic_id: topicId,
    mastery_score: masteryScore,
    mastery_category: category,
    assessment_checks_passed: totalChecksPassed,
    assessment_checks_total: totalChecksApplicable,
    attempt_count: topicAttempts.length,
    last_attempt_at: lastAttempt,
    updated_at: new Date().toISOString()
  };

  await upsertStudentMastery(record);
  return record;
}

/**
 * Checks whether all prerequisite topics have satisfied the prerequisite threshold.
 * Returns failure details if any prerequisite is unfulfilled.
 */
export async function checkPrerequisitesSatisfied(
  studentId: string,
  topic: Topic,
  studentMasteryMap: Map<string, StudentMastery>
): Promise<{ satisfied: boolean; failedTopicId?: string; failedTopicName?: string; failedMastery?: number }> {
  if (!topic.prerequisite_topic_ids || topic.prerequisite_topic_ids.length === 0) {
    return { satisfied: true };
  }

  for (const prereqId of topic.prerequisite_topic_ids) {
    const mastery = studentMasteryMap.get(prereqId);
    const score = mastery?.mastery_score || 0;
    if (score < TUTORING_CONFIG.PREREQUISITE_THRESHOLD) {
      const prereqTopic = await getTopicById(prereqId);
      return {
        satisfied: false,
        failedTopicId: prereqId,
        failedTopicName: prereqTopic?.name || prereqId,
        failedMastery: score
      };
    }
  }

  return { satisfied: true };
}

/**
 * Evaluates the pedagogical rules to select the next personalized activity for a learner.
 * Every recommendation includes the explicit rule code, rule name, and plain-text pedagogical reason.
 *
 * Core Rules:
 * - RULE 1: Diagnostic Assessment (if pre-test uncompleted)
 * - RULE 7: Repeated Error Category Classification (consecutive errors)
 * - RULE 10: Curriculum Completion (summative post-test & usability evaluation)
 * - RULE 2: Prerequisite Readiness Enforced
 * - RULE 3: Low Mastery / Poor Performance (<50%) -> Recommend remedial lesson or scaffolded remedial exercise
 * - RULE 4: Developing Mastery (50–69%) -> Recommend additional practice exercise (prefer uncompleted)
 * - RULE 5: Near Mastery (70–84%) -> Recommend more challenging exercise (prefer uncompleted)
 * - RULE 6: Provisional Mastery (>=85%) -> Advance to next topic
 *
 * Avoids recommending activities already completed unless all exercises in that category are completed
 * and revision is explicitly intended.
 */
export async function evaluatePedagogicalRules(studentId: string): Promise<Recommendation> {
  // RULE 1: Diagnostic Assessment Recommendation
  const preTestResp = await getAssessmentResponse(studentId, 'pre_test');
  if (!preTestResp) {
    const rec: Recommendation = {
      id: `rec_diag_${Date.now()}`,
      student_id: studentId,
      rule_name: 'RULE 1: Diagnostic assessment',
      rule_code: 'RULE_1',
      target_type: 'diagnostic',
      target_id: 'pre_test',
      target_title: 'Diagnostic Pre-Assessment',
      reason: 'You have not yet completed the diagnostic pre-test. Completing this assessment establishes your initial learner model and enables personalized topic recommendations.',
      is_completed: false,
      created_at: new Date().toISOString()
    };
    await saveRecommendation(rec);
    return rec;
  }

  // Load curriculum topics and student mastery
  const topics = await getAllTopics();
  const masteryList = await getStudentMastery(studentId);
  const masteryMap = new Map<string, StudentMastery>();
  masteryList.forEach(m => masteryMap.set(m.topic_id, m));

  const recentAttempts = await getStudentAttempts(studentId, 100);
  const completedLessons = await getCompletedLessons(studentId);

  // Set of exercise IDs the student has successfully passed (all test cases passed)
  const completedExerciseIds = new Set<string>(
    recentAttempts.filter(a => a.all_passed).map(a => a.exercise_id)
  );

  // RULE 7: Repeated Error Category Identification
  if (recentAttempts.length >= TUTORING_CONFIG.REPEATED_ERROR_COUNT) {
    const lastErr = recentAttempts[0].error_category;
    const secondLastErr = recentAttempts[1].error_category;
    if (lastErr && lastErr === secondLastErr && lastErr !== 'OutputMismatch') {
      const currentTopic = await getTopicById(recentAttempts[0].topic_id);
      const exercises = await getExercisesByTopicId(recentAttempts[0].topic_id);
      // Select an uncompleted exercise or the first exercise for debugging practice
      const targetEx = exercises.find(e => !completedExerciseIds.has(e.id)) || exercises[0] || { id: 'ex_m1_1', title: 'Introductory Practice' };

      const rec: Recommendation = {
        id: `rec_err_${Date.now()}`,
        student_id: studentId,
        rule_name: 'RULE 7: Targeted error category remediation',
        rule_code: 'RULE_7',
        target_type: 'exercise',
        target_id: targetEx.id,
        target_title: `${targetEx.title} (${lastErr} Debugging)`,
        reason: `Repeated ${lastErr} detected across your last consecutive attempts on ${currentTopic?.name || 'this topic'}. Review the diagnostic advice on ${lastErr} handling and practice with exercise '${targetEx.title}'.`,
        is_completed: false,
        created_at: new Date().toISOString()
      };
      await saveRecommendation(rec);
      return rec;
    }
  }

  // RULE 10: Check curriculum completion
  let allMastered = true;
  for (const t of topics) {
    const m = masteryMap.get(t.id);
    if (!m || m.mastery_score < TUTORING_CONFIG.PREREQUISITE_THRESHOLD) {
      allMastered = false;
      break;
    }
  }

  if (allMastered) {
    const postTestResp = await getAssessmentResponse(studentId, 'post_test');
    if (!postTestResp) {
      const rec: Recommendation = {
        id: `rec_post_${Date.now()}`,
        student_id: studentId,
        rule_name: 'RULE 10: Curriculum completion and summative evaluation',
        rule_code: 'RULE_10',
        target_type: 'post_test',
        target_id: 'post_test',
        target_title: 'Summative Post-Assessment & Usability Survey',
        reason: 'Congratulations! You have satisfied mastery requirements across all 10 introductory Python modules. Complete the summative post-test and System Usability Scale (SUS) survey to finalize your research evaluation.',
        is_completed: false,
        created_at: new Date().toISOString()
      };
      await saveRecommendation(rec);
      return rec;
    }
  }

  // Iterate topics in pedagogical order (Module 1 through 10)
  for (const topic of topics) {
    // RULE 2: Prerequisite Readiness Enforced
    const prereqCheck = await checkPrerequisitesSatisfied(studentId, topic, masteryMap);
    if (!prereqCheck.satisfied) {
      continue; // Topic is locked pending prerequisite mastery
    }

    const mastery = masteryMap.get(topic.id);
    const score = mastery ? mastery.mastery_score : 0;
    const hasAttempts = mastery ? mastery.attempt_count > 0 : false;
    const exercises = await getExercisesByTopicId(topic.id);
    const lessonId = `les_${topic.id.replace('mod_', 'm')}`;
    const lessonCompleted = completedLessons.includes(lessonId);

    // Band 1: Insufficient Evidence / Unassessed (0 valid assessment attempts)
    if (!hasAttempts) {
      if (!lessonCompleted) {
        const rec: Recommendation = {
          id: `rec_les_${topic.id}_${Date.now()}`,
          student_id: studentId,
          rule_name: 'RULE 3: Foundational concept review',
          rule_code: 'RULE_3',
          target_type: 'lesson',
          target_id: lessonId,
          target_title: `${topic.name} (Lesson)`,
          reason: `You are ready to begin ${topic.name}. Study the introductory lesson before attempting exercises.`,
          is_completed: false,
          created_at: new Date().toISOString()
        };
        await saveRecommendation(rec);
        return rec;
      } else {
        // Find first uncompleted introductory exercise
        const firstUncompleted = exercises.find(e => !completedExerciseIds.has(e.id)) || exercises[0] || { id: 'ex_m1_1', title: 'Foundational Exercise' };
        const rec: Recommendation = {
          id: `rec_ex_${firstUncompleted.id}_${Date.now()}`,
          student_id: studentId,
          rule_name: 'RULE 3: Foundational exercise practice',
          rule_code: 'RULE_3',
          target_type: 'exercise',
          target_id: firstUncompleted.id,
          target_title: firstUncompleted.title,
          reason: `Lesson completed for ${topic.name}. Attempt introductory exercise '${firstUncompleted.title}' to establish your topic mastery.`,
          is_completed: false,
          created_at: new Date().toISOString()
        };
        await saveRecommendation(rec);
        return rec;
      }
    }

    // Band 2: Demonstrated Low Mastery / Poor Performance (0–49%)
    // Requirement 4: "Recommend remedial lessons when performance is poor."
    if (score < TUTORING_CONFIG.LOW_MASTERY_THRESHOLD) {
      if (!lessonCompleted) {
        const rec: Recommendation = {
          id: `rec_rem_les_${topic.id}_${Date.now()}`,
          student_id: studentId,
          rule_name: 'RULE 3: Poor performance remedial lesson',
          rule_code: 'RULE_3',
          target_type: 'lesson',
          target_id: lessonId,
          target_title: `${topic.name} (Remedial Lesson)`,
          reason: `Your performance in ${topic.name} is ${score}% (Needs substantial support: 0–49%). We recommend reviewing the foundational concepts in the remedial lesson '${topic.name}' before attempting further exercises.`,
          is_completed: false,
          created_at: new Date().toISOString()
        };
        await saveRecommendation(rec);
        return rec;
      } else {
        // If lesson was already reviewed, recommend easiest uncompleted exercise with scaffolding
        const easyUncompleted = exercises.find(e => e.difficulty === 'easy' && !completedExerciseIds.has(e.id));
        const targetEx = easyUncompleted || exercises.find(e => e.difficulty === 'easy') || exercises[0];
        const isRevision = completedExerciseIds.has(targetEx.id);

        const rec: Recommendation = {
          id: `rec_low_${topic.id}_${Date.now()}`,
          student_id: studentId,
          rule_name: isRevision ? 'RULE 3: Low mastery scaffolded revision' : 'RULE 3: Low mastery remediation',
          rule_code: 'RULE_3',
          target_type: 'exercise',
          target_id: targetEx.id,
          target_title: isRevision ? `${targetEx.title} (Scaffolded Revision)` : `${targetEx.title} (Scaffolded Practice)`,
          reason: isRevision
            ? `Your performance in ${topic.name} is ${score}% (Needs substantial support: 0–49%). Revision practice on '${targetEx.title}' is recommended using Level 1 & 2 scaffolding hints.`
            : `Your performance in ${topic.name} is ${score}% (Needs substantial support: 0–49%). Complete introductory exercise '${targetEx.title}' and use Level 1 & 2 scaffolding hints.`,
          is_completed: false,
          created_at: new Date().toISOString()
        };
        await saveRecommendation(rec);
        return rec;
      }
    }

    // Band 3: Developing Mastery (50–69%)
    // Requirement 5: "Recommend additional practice when mastery is developing."
    // Requirement 10: "Avoid recommending activities that are already completed unless revision is intended."
    if (score < TUTORING_CONFIG.DEVELOPING_THRESHOLD) {
      const uncompletedMed = exercises.find(e => e.difficulty === 'medium' && !completedExerciseIds.has(e.id));
      const uncompletedAny = exercises.find(e => !completedExerciseIds.has(e.id));
      const targetEx = uncompletedMed || uncompletedAny || exercises.find(e => e.difficulty === 'medium') || exercises[0];
      const isRevision = completedExerciseIds.has(targetEx.id);

      const rec: Recommendation = {
        id: `rec_dev_${topic.id}_${Date.now()}`,
        student_id: studentId,
        rule_name: isRevision ? 'RULE 4: Developing mastery revision practice' : 'RULE 4: Developing mastery practice',
        rule_code: 'RULE_4',
        target_type: 'exercise',
        target_id: targetEx.id,
        target_title: isRevision ? `${targetEx.title} (Revision Practice)` : targetEx.title,
        reason: isRevision
          ? `Your mastery in ${topic.name} is developing at ${score}% (Developing: 50–69%). All topic exercises have been completed; revision practice on '${targetEx.title}' is intended to reinforce retention and advance toward near mastery.`
          : `Your mastery in ${topic.name} is developing at ${score}% (Developing: 50–69%). Additional guided practice on exercise '${targetEx.title}' is recommended to strengthen your problem-solving skills.`,
        is_completed: false,
        created_at: new Date().toISOString()
      };
      await saveRecommendation(rec);
      return rec;
    }

    // Band 4: Near Mastery (70–84%)
    // Requirement 6: "Recommend more challenging exercises when mastery is sufficiently high."
    // Requirement 10: "Avoid recommending activities that are already completed unless revision is intended."
    if (score < TUTORING_CONFIG.NEAR_MASTERY_THRESHOLD) {
      const uncompletedHard = exercises.find(e => e.difficulty === 'hard' && !completedExerciseIds.has(e.id));
      const uncompletedAny = exercises.find(e => !completedExerciseIds.has(e.id));
      const targetEx = uncompletedHard || uncompletedAny || exercises.find(e => e.difficulty === 'hard') || exercises[exercises.length - 1];
      const isRevision = completedExerciseIds.has(targetEx.id);

      const rec: Recommendation = {
        id: `rec_near_${topic.id}_${Date.now()}`,
        student_id: studentId,
        rule_name: isRevision ? 'RULE 5: Near mastery challenge revision' : 'RULE 5: Near mastery challenge',
        rule_code: 'RULE_5',
        target_type: 'exercise',
        target_id: targetEx.id,
        target_title: isRevision ? `${targetEx.title} (Challenge Revision)` : `${targetEx.title} (Challenge)`,
        reason: isRevision
          ? `Your mastery in ${topic.name} is near mastery at ${score}% (Near mastery: 70–84%). Revision on advanced exercise '${targetEx.title}' is intended to achieve provisional mastery (>=85%).`
          : `You scored ${score}% in ${topic.name} (Near Mastery: 70–84%). Complete challenging exercise '${targetEx.title}' with reduced scaffolding to achieve provisional mastery (>=85%).`,
        is_completed: false,
        created_at: new Date().toISOString()
      };
      await saveRecommendation(rec);
      return rec;
    }

    // Band 5: Provisional Mastery (85–100%)
    // RULE 6: Provisional mastery satisfied for this topic -> Advance to next topic in loop!
  }

  // Fallback default recommendation when all current requirements are met
  const defaultRec: Recommendation = {
    id: `rec_default_${Date.now()}`,
    student_id: studentId,
    rule_name: 'RULE 6: Provisional mastery advancement',
    rule_code: 'RULE_6',
    target_type: 'post_test',
    target_id: 'post_test',
    target_title: 'Summative Assessment',
    reason: 'You have satisfied current module requirements across all accessible topics. Proceed to the post-assessment or review previous exercises.',
    is_completed: false,
    created_at: new Date().toISOString()
  };
  await saveRecommendation(defaultRec);
  return defaultRec;
}
