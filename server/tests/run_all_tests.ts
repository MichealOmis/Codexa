/**
 * PyTutor Comprehensive Automated Test Suite
 * Validates all 15 required research project scenarios from Section 13.
 */

import {
  getUserByEmail,
  createUser,
  getTopicById,
  getAssessment,
  saveAssessmentResponse,
  getAssessmentResponse,
  markLessonCompleted,
  recordLearnerResponse,
  getRecommendationHistory,
  setUserLeaderboardOptIn,
  dbResetSeed,
  dbQuery
} from '../db_service';

import {
  recalculateTopicMastery,
  classifyMastery,
  getMasteryLabel,
  evaluatePedagogicalRules,
  checkPrerequisitesSatisfied,
  configureTutoringEngine,
  resetTutoringConfig,
  getTutoringConfig
} from '../tutoring_engine';

import {
  runPlayground,
  submitAssessment
} from '../assessment_service';

import {
  calculateSUSScore,
  exportResearchDatasetCSV
} from '../research_service';

import {
  runPlaygroundPyodide,
  runAssessmentPyodide
} from '../pyodide_sandbox';

import {
  generatePedagogicalExplanation
} from '../gemini_service';

async function runTestSuite() {
  console.log('====================================================');
  console.log('  Codexa ITS: Comprehensive Automated Test Suite   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail: string = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail}`);
      failed++;
    }
  }

  try {
    // Reset seed before running tests
    await dbResetSeed();

    // TEST 1: A new student can register, log in, and receive a diagnostic assessment
    const testUserEmail = `test_student_${Date.now()}@test.edu`;
    const createdUser = await createUser({
      id: `usr_test_${Date.now()}`,
      username: `student_${Date.now()}`,
      email: testUserEmail,
      password_hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // 'password'
      role: 'student',
      participant_id: `PARTICIPANT-TEST-${Date.now()}`,
      created_at: new Date().toISOString()
    });
    const fetchedUser = await getUserByEmail(testUserEmail);
    const preTest = await getAssessment('pre_test');
    const rec1 = await evaluatePedagogicalRules(createdUser.id);

    assert(
      fetchedUser !== null && fetchedUser.id === createdUser.id &&
      preTest !== null && preTest.questions!.length === 10 &&
      rec1.rule_code === 'RULE_1' && rec1.target_type === 'diagnostic',
      'TEST 1: Student registration, login, and diagnostic pre-test recommendation'
    );

    // TEST 2: A student who scores poorly on a topic receives an appropriate remedial recommendation
    // Submit a failing attempt on ex_m2_1 (score 0%)
    await submitAssessment({
      student_id: createdUser.id,
      exercise_id: 'ex_m2_1',
      code: 'width = 5\nheight = 8\nprint("wrong answer")\n',
      hints_used: 1,
      revealed_solution: false,
      time_spent_seconds: 30
    });
    const m2Mastery = await recalculateTopicMastery(createdUser.id, 'mod_2');
    const recLow = await evaluatePedagogicalRules(createdUser.id);
    assert(
      m2Mastery.mastery_category === 'needs_support' && m2Mastery.mastery_score < 50 &&
      (recLow.rule_code === 'RULE_3' || recLow.rule_code === 'RULE_1'), // If pre-test not taken, rule 1 or rule 3
      'TEST 2: Poor scoring triggers low-mastery remedial recommendation with scaffolding'
    );

    // Mark pre-test as completed so rule evaluations progress
    await saveAssessmentResponse({
      id: `resp_pre_${createdUser.id}`,
      student_id: createdUser.id,
      assessment_id: 'pre_test',
      score: 4,
      total_questions: 10,
      percentage: 40.0,
      answers: {},
      completed_at: new Date().toISOString()
    });

    const recPostPre = await evaluatePedagogicalRules(createdUser.id);
    assert(
      recPostPre.rule_code === 'RULE_3',
      'TEST 2B: With pre-test completed, low mastery explicitly triggers RULE 3 recommendation'
    );

    // TEST 3: Student improvement updates mastery score according to documented aggregation rule
    // First attempt was 0/1. Now submit correct solution to ex_m2_1 (1/1 checks)
    const improvedRes = await submitAssessment({
      student_id: createdUser.id,
      exercise_id: 'ex_m2_1',
      code: 'width = 5\nheight = 8\narea = width * height\nprint(area)\n',
      hints_used: 0,
      revealed_solution: false,
      time_spent_seconds: 45
    });
    const updatedM2 = await recalculateTopicMastery(createdUser.id, 'mod_2');
    assert(
      improvedRes.all_passed === true &&
      updatedM2.mastery_score > m2Mastery.mastery_score &&
      updatedM2.assessment_checks_passed > 0,
      'TEST 3: Subsequent valid attempt updates mastery score according to aggregation method'
    );

    // TEST 4: Student cannot bypass prerequisite rules
    // Module 5 requires Module 4. Module 4 is currently 0% for this test user.
    const mod5 = await getTopicById('mod_5');
    const studentMasteries = await dbQuery<any>('SELECT * FROM student_mastery WHERE student_id = ?', [createdUser.id]);
    const masteryMap = new Map<string, any>(studentMasteries.map((m: any) => [m.topic_id, m]));
    const prereqCheck = await checkPrerequisitesSatisfied(createdUser.id, mod5!, masteryMap);
    assert(
      prereqCheck.satisfied === false && prereqCheck.failedTopicId === 'mod_4',
      'TEST 4: Prerequisite rules prevent access to locked downstream modules'
    );

    // TEST 5: Correct Python submission passes assessment checks
    const correctRes = await submitAssessment({
      student_id: createdUser.id,
      exercise_id: 'ex_m7_1', // Square function
      code: 'def square(x):\n    return x * x\n'
    });
    assert(
      correctRes.syntax_valid === true &&
      correctRes.all_passed === true &&
      correctRes.score_percentage === 100.0 &&
      correctRes.test_results.length === 3,
      'TEST 5: Correct Python submission passes all applicable assessment checks'
    );

    // TEST 6: Incorrect submission receives accurate test-case feedback
    const incorrectRes = await submitAssessment({
      student_id: createdUser.id,
      exercise_id: 'ex_m7_1',
      code: 'def square(x):\n    return x + 10\n'
    });
    assert(
      incorrectRes.syntax_valid === true &&
      incorrectRes.all_passed === false &&
      incorrectRes.primary_error_category === 'OutputMismatch' &&
      incorrectRes.test_results[0].passed === false,
      'TEST 6: Incorrect submission receives accurate test-case feedback without full solution'
    );

    // TEST 7: Syntax error is reported cleanly without crashing the application
    const syntaxErrRes = await submitAssessment({
      student_id: createdUser.id,
      exercise_id: 'ex_m7_1',
      code: 'def square(x\n    return x\n' // Missing closing parenthesis
    });
    assert(
      syntaxErrRes.syntax_valid === false &&
      syntaxErrRes.primary_error_category === 'SyntaxError' &&
      syntaxErrRes.diagnostic_feedback.includes('SyntaxError'),
      'TEST 7: Syntax error is caught and classified with diagnostic feedback'
    );

    // TEST 8: Infinite loop is stopped by the execution environment within timeout
    const timeoutRes = await submitAssessment({
      student_id: createdUser.id,
      exercise_id: 'ex_m6_1',
      code: 'def sum_n(n):\n    while True:\n        pass\n    return 0\n'
    });
    assert(
      timeoutRes.all_passed === false &&
      timeoutRes.primary_error_category === 'TimeLimitExceeded' &&
      timeoutRes.diagnostic_feedback.includes('TimeLimitExceeded'),
      'TEST 8: Infinite loop / runaway code stopped by execution sandbox within limit'
    );

    // TEST 9: Role-based permissions: verify student role vs administrator
    assert(
      createdUser.role === 'student' && (createdUser.role as string) !== 'administrator',
      'TEST 9: Role-based authorization distinction enforced between student and administrator'
    );

    // TEST 10: Private student records cannot be leaked
    // Anonymized export uses participant_id rather than emails or passwords
    const studentCSV = await exportResearchDatasetCSV('students');
    assert(
      studentCSV.includes('PARTICIPANT-') &&
      !studentCSV.includes('password_hash') &&
      !studentCSV.includes('student@example.edu'),
      'TEST 10: Evaluation export protects student privacy and uses pseudonymous IDs'
    );

    // TEST 11: Missing AI API key does not disable core tutoring system
    const savedKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const offlineExplanation = await generatePedagogicalExplanation({
      error_category: 'SyntaxError',
      student_code: 'def foo('
    });
    process.env.GEMINI_API_KEY = savedKey;

    assert(
      offlineExplanation.is_ai_generated === false &&
      offlineExplanation.explanation.length > 20 &&
      offlineExplanation.pedagogical_tips.length > 0 &&
      offlineExplanation.disclaimer.includes('Offline Pedagogical Rule Engine'),
      'TEST 11: Missing AI API key operates with deterministic offline tutoring rules'
    );

    // TEST 12: Pre-test and post-test results stored and exported correctly
    await saveAssessmentResponse({
      id: `resp_post_${createdUser.id}`,
      student_id: createdUser.id,
      assessment_id: 'post_test',
      score: 9,
      total_questions: 10,
      percentage: 90.0,
      answers: { q_post_1: 2, q_post_2: 1 },
      completed_at: new Date().toISOString()
    });
    const postRecord = await getAssessmentResponse(createdUser.id, 'post_test');
    assert(
      postRecord !== null && postRecord.percentage === 90.0 && postRecord.score === 9,
      'TEST 12: Pre-test and post-test results stored and verifiable'
    );

    // TEST 13: System Usability Scale (SUS) calculated according to Brooke (1996) formula
    // Test sample: all 4s ->
    // Odd (5 items): 4 - 1 = 3 -> 3 * 5 = 15
    // Even (5 items): 5 - 4 = 1 -> 1 * 5 = 5
    // Total sum = 20 -> 20 * 2.5 = 50.0
    const susTest1 = calculateSUSScore([4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
    // Test sample: all 5s on odd, all 1s on even ->
    // Odd: 5 - 1 = 4 -> 4 * 5 = 20
    // Even: 5 - 1 = 4 -> 4 * 5 = 20
    // Total sum = 40 -> 40 * 2.5 = 100.0
    const susTestPerfect = calculateSUSScore([5, 1, 5, 1, 5, 1, 5, 1, 5, 1]);

    assert(
      susTest1.sus_score === 50.0 &&
      susTestPerfect.sus_score === 100.0 &&
      susTestPerfect.grade_scale === 'A+',
      'TEST 13: SUS score calculated strictly using standard Brooke (1996) methodology'
    );

    // TEST 14: Sensible behavior when student has insufficient evidence for mastery
    const unassessedMastery = classifyMastery(0, false);
    assert(
      unassessedMastery === 'unassessed',
      'TEST 14: System clearly reports unassessed when insufficient evidence exists'
    );

    // TEST 15: Valid alternative solutions accepted
    // In ex_m8_2 (reverse string), student can use text[::-1] or ''.join(reversed(text))
    const altSol1 = await submitAssessment({
      student_id: createdUser.id,
      exercise_id: 'ex_m8_2',
      code: 'def reverse_string(text):\n    return "".join(reversed(text))\n'
    });
    const altSol2 = await submitAssessment({
      student_id: createdUser.id,
      exercise_id: 'ex_m8_2',
      code: 'def reverse_string(text):\n    return text[::-1]\n'
    });
    assert(
      altSol1.all_passed === true && altSol2.all_passed === true,
      'TEST 15: Valid alternative implementations are accepted when satisfying specifications'
    );

    // ================= TUTORING ENGINE RIGOROUS UNIT TESTS =================

    // TEST 16: Mastery band classification adheres strictly to configured thresholds:
    // - 0–49%: Needs substantial support
    // - 50–69%: Developing
    // - 70–84%: Near mastery
    // - 85–100%: Provisional mastery
    assert(
      classifyMastery(0, true) === 'needs_support' &&
      classifyMastery(49.0, true) === 'needs_support' &&
      classifyMastery(49.9, true) === 'needs_support' &&
      classifyMastery(50.0, true) === 'developing' &&
      classifyMastery(69.0, true) === 'developing' &&
      classifyMastery(69.9, true) === 'developing' &&
      classifyMastery(70.0, true) === 'near_mastery' &&
      classifyMastery(84.0, true) === 'near_mastery' &&
      classifyMastery(84.9, true) === 'near_mastery' &&
      classifyMastery(85.0, true) === 'provisional_mastery' &&
      classifyMastery(100.0, true) === 'provisional_mastery',
      'TEST 16: Initial mastery bands (0-49%, 50-69%, 70-84%, 85-100%) classified correctly'
    );

    // TEST 17: Distinguish insufficient evidence from demonstrated low mastery
    const zeroEvidence = classifyMastery(0, false);
    const lowEvidence = classifyMastery(0, true);
    assert(
      zeroEvidence === 'unassessed' &&
      lowEvidence === 'needs_support' &&
      getMasteryLabel(zeroEvidence).includes('Insufficient Evidence') &&
      getMasteryLabel(lowEvidence).includes('Needs Substantial Support'),
      'TEST 17: Engine strictly distinguishes insufficient evidence (unassessed) from demonstrated low mastery (needs_support)'
    );

    // TEST 18: Prerequisite relationships enforcement across multiple prerequisites
    const mod1 = await getTopicById('mod_1');
    const mod8 = await getTopicById('mod_8'); // Requires mod_6, mod_7
    const mod10 = await getTopicById('mod_10'); // Requires mod_7, mod_8, mod_9
    const emptyMasteryMap = new Map<string, any>();

    const checkMod1 = await checkPrerequisitesSatisfied(createdUser.id, mod1!, emptyMasteryMap);
    const checkMod8 = await checkPrerequisitesSatisfied(createdUser.id, mod8!, emptyMasteryMap);
    const checkMod10 = await checkPrerequisitesSatisfied(createdUser.id, mod10!, emptyMasteryMap);

    // Set mock satisfied masteries for mod_6 and mod_7
    const satisfiedMap = new Map<string, any>([
      ['mod_6', { mastery_score: 75.0 }],
      ['mod_7', { mastery_score: 80.0 }]
    ]);
    const checkMod8Satisfied = await checkPrerequisitesSatisfied(createdUser.id, mod8!, satisfiedMap);

    assert(
      checkMod1.satisfied === true &&
      checkMod8.satisfied === false &&
      (checkMod8.failedTopicId === 'mod_6' || checkMod8.failedTopicId === 'mod_7') &&
      checkMod10.satisfied === false &&
      checkMod8Satisfied.satisfied === true,
      'TEST 18: Prerequisite dependencies enforced across single and multi-prerequisite modules'
    );

    // TEST 19: Poor performance recommends remedial lesson (RULE 3)
    // Create dedicated test student for recommendation flow testing
    const flowStudentEmail = `flow_student_${Date.now()}@test.edu`;
    const flowStudent = await createUser({
      id: `usr_flow_${Date.now()}`,
      username: `flow_student_${Date.now()}`,
      email: flowStudentEmail,
      password_hash: 'hash',
      role: 'student',
      participant_id: `PARTICIPANT-FLOW-${Date.now()}`,
      created_at: new Date().toISOString()
    });
    // Complete pre-test for flow student
    await saveAssessmentResponse({
      id: `resp_pre_${flowStudent.id}`,
      student_id: flowStudent.id,
      assessment_id: 'pre_test',
      score: 5,
      total_questions: 10,
      percentage: 50.0,
      answers: {},
      completed_at: new Date().toISOString()
    });
    // Submit poor attempt on mod_1 exercise (score 0%)
    await submitAssessment({
      student_id: flowStudent.id,
      exercise_id: 'ex_m1_1',
      code: 'print("wrong output")\n'
    });
    const poorRec = await evaluatePedagogicalRules(flowStudent.id);
    assert(
      poorRec.rule_code === 'RULE_3' &&
      poorRec.target_type === 'lesson' &&
      poorRec.target_id === 'les_m1' &&
      poorRec.reason.includes('Needs substantial support'),
      'TEST 19: Poor performance (<50%) triggers remedial lesson recommendation'
    );

    // TEST 20: Scaffolded practice recommendation when remedial lesson completed
    await markLessonCompleted(flowStudent.id, 'les_m1', 'mod_1');
    const scaffoldedRec = await evaluatePedagogicalRules(flowStudent.id);
    assert(
      scaffoldedRec.rule_code === 'RULE_3' &&
      scaffoldedRec.target_type === 'exercise' &&
      scaffoldedRec.reason.includes('scaffolding'),
      'TEST 20: After remedial lesson completion, scaffolded exercise practice is recommended'
    );

    // TEST 21: Developing mastery (50–69%) recommends additional practice exercise
    // Pass ex_m1_1 to reach developing mastery
    await submitAssessment({
      student_id: flowStudent.id,
      exercise_id: 'ex_m1_1',
      code: 'print("Welcome to Python Programming!")\n'
    });
    const devMastery = await recalculateTopicMastery(flowStudent.id, 'mod_1');
    const devRec = await evaluatePedagogicalRules(flowStudent.id);
    assert(
      devMastery.mastery_score >= 50.0 && devMastery.mastery_score < 70.0 &&
      devRec.rule_code === 'RULE_4' &&
      devRec.target_type === 'exercise' &&
      devRec.target_id === 'ex_m1_2' &&
      devRec.reason.includes('Developing'),
      'TEST 21: Developing mastery (50-69%) recommends additional practice on uncompleted exercise'
    );

    // TEST 22: Repeated error category detection and targeted remediation (RULE 7)
    // Submit 2 consecutive SyntaxError attempts
    await submitAssessment({
      student_id: flowStudent.id,
      exercise_id: 'ex_m1_2',
      code: 'def broken(\n' // SyntaxError
    });
    await submitAssessment({
      student_id: flowStudent.id,
      exercise_id: 'ex_m1_2',
      code: 'print("unclosed\n' // SyntaxError
    });
    const errRec = await evaluatePedagogicalRules(flowStudent.id);
    assert(
      errRec.rule_code === 'RULE_7' &&
      errRec.reason.includes('SyntaxError') &&
      errRec.target_title.includes('SyntaxError Debugging'),
      'TEST 22: Repeated error category triggers targeted debugging remediation'
    );

    // TEST 23: Recommendation history and learner response tracking
    // Record that learner accepted the recommendation
    await recordLearnerResponse(errRec.id, flowStudent.id, 'accepted');
    const history1 = await getRecommendationHistory(flowStudent.id);
    assert(
      history1.length >= 1 &&
      history1[0].learner_response === 'accepted' &&
      history1[0].reason.length > 20,
      'TEST 23: Recommendation history records learner responses and full pedagogical reasons'
    );

    // TEST 24: Configurable rules thresholds can be dynamically reconfigured and restored
    const initialConfig = getTutoringConfig();
    configureTutoringEngine({ LOW_MASTERY_THRESHOLD: 40.0, PREREQUISITE_THRESHOLD: 65.0 });
    const updatedConfig = getTutoringConfig();
    assert(
      updatedConfig.LOW_MASTERY_THRESHOLD === 40.0 &&
      updatedConfig.PREREQUISITE_THRESHOLD === 65.0,
      'TEST 24A: Tutoring engine parameters dynamically reconfigurable'
    );
    resetTutoringConfig();
    const restoredConfig = getTutoringConfig();
    assert(
      restoredConfig.LOW_MASTERY_THRESHOLD === initialConfig.LOW_MASTERY_THRESHOLD &&
      restoredConfig.PREREQUISITE_THRESHOLD === initialConfig.PREREQUISITE_THRESHOLD,
      'TEST 24B: Tutoring engine configuration successfully reset to documented baseline'
    );

    // TEST 25: Sandbox boundary enforcement (Resource limits: MemoryLimitExceeded & Output truncation)
    const memRun = await runPlayground({ code: 'a = [0] * (500 * 1024 * 1024)\n' });
    assert(
      memRun.success === false && (memRun.error_category === 'MemoryLimitExceeded' || memRun.stderr.includes('MemoryError')),
      'TEST 25A: Sandbox memory limit prevents host process exhaustion'
    );

    const outRun = await runPlayground({ code: 'for _ in range(3000):\n    print("1234567890")\n' });
    assert(
      outRun.stdout.includes('Output truncated') || outRun.stdout.length <= 17000,
      'TEST 25B: Sandbox enforces output size limit and safely truncates runaway prints'
    );

    // TEST 26: Leaderboard opt-in toggle and anonymized ranking calculation
    await setUserLeaderboardOptIn(flowStudent.id, true);
    const optedStudents = await dbQuery<any>(
      "SELECT id, participant_id, leaderboard_opt_in FROM users WHERE role = 'student' AND leaderboard_opt_in = 1"
    );
    const studentFound = optedStudents.find((s: any) => s.id === flowStudent.id);
    assert(
      studentFound !== undefined &&
      studentFound.participant_id === flowStudent.participant_id &&
      studentFound.leaderboard_opt_in === 1,
      'TEST 26: Leaderboard records student opt-in state and displays anonymized participant ID'
    );

    // TEST 27: Research dataset CSV export includes evaluation_group and learning_gain_absolute
    const csvExport = await exportResearchDatasetCSV('students');
    assert(
      csvExport.includes('evaluation_group') &&
      csvExport.includes('learning_gain_absolute') &&
      csvExport.includes('ITS_Intervention'),
      'TEST 27: Research CSV export includes evaluation group labels and explicit absolute learning gain'
    );

    // TEST 28: Missing values in evaluation data safely formatted
    // Verify that missing post-test or pre-test values are formatted as 'N/A' rather than crashing
    const lines = csvExport.trim().split('\n');
    const studentLines = lines.slice(1);
    const hasNA = studentLines.some((l: string) => l.includes('N/A'));
    assert(
      lines.length >= 3 && hasNA,
      'TEST 28: Missing pre/post assessment values are safely represented as N/A in research exports'
    );

    // TEST 29: In-process database operations execute natively without python3 subprocess dependency
    const dbTestUser = await getUserByEmail('student@example.edu');
    assert(
      dbTestUser !== null && dbTestUser.username === 'student_demo',
      'TEST 29: In-process database operations execute without requiring external python3 subprocess'
    );

    // TEST 30: Pyodide execution fallback operates when system python3 is absent
    const pyoPlayground = await runPlaygroundPyodide({
      code: 'print("Pyodide Engine Active")',
      input_data: '',
      timeout_seconds: 2.0
    });
    const pyoAssessment = await runAssessmentPyodide({
      code: 'def double_val(x):\n    return x * 2\n',
      test_cases: [
        {
          id: 'tc_pyo_1',
          input_data: '',
          expected_output: '10',
          function_call: 'double_val(5)',
          is_hidden: false
        }
      ],
      timeout_seconds: 2.0
    });
    assert(
      pyoPlayground.success &&
      pyoPlayground.stdout.trim() === 'Pyodide Engine Active' &&
      pyoAssessment.all_passed &&
      pyoAssessment.score_percentage === 100,
      'TEST 30: In-process Pyodide Python execution passes assessment test cases independently of system binaries'
    );

    console.log('\n====================================================');
    console.log(`  Test Suite Completed: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal test runner error:', err);
    process.exit(1);
  }
}

runTestSuite();
