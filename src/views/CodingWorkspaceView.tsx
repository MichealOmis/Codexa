import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Code2,
  Play,
  Send,
  RotateCcw,
  Sparkles,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  BrainCircuit,
  Lightbulb,
  Terminal,
  AlertCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';
import { CodeEditor } from '../components/CodeEditor';
import { ErrorDiagnosisCard } from '../components/ErrorDiagnosisCard';
import { HintPanel } from '../components/HintPanel';
import { AiExplainerModal } from '../components/AiExplainerModal';
import type { Exercise, Topic, Recommendation } from '../types';

interface CodingWorkspaceViewProps {
  exerciseId: string;
  onNavigate: (view: string, param?: string) => void;
}

export const CodingWorkspaceView: React.FC<CodingWorkspaceViewProps> = ({
  exerciseId,
  onNavigate
}) => {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [runningPlayground, setRunningPlayground] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Left tab: 'instructions' | 'hints'
  const [leftTab, setLeftTab] = useState<'instructions' | 'hints'>('instructions');

  // Hints state
  const [hintsUsed, setHintsUsed] = useState(0);
  const [solutionRevealed, setSolutionRevealed] = useState(false);
  const [workedSolution, setWorkedSolution] = useState<string | undefined>(undefined);

  // Results state
  const [assessmentResult, setAssessmentResult] = useState<any | null>(null);
  const [playgroundOutput, setPlaygroundOutput] = useState<{ stdout: string; stderr: string; execution_time_ms: number } | null>(null);

  // Optional AI modal
  const [showAiModal, setShowAiModal] = useState(false);

  // Timer tracking
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    loadExercise();
  }, [exerciseId]);

  const loadExercise = async () => {
    setLoading(true);
    setError(null);
    setAssessmentResult(null);
    setPlaygroundOutput(null);
    setHintsUsed(0);
    setSolutionRevealed(false);
    startTimeRef.current = Date.now();

    try {
      const res = await api.getExercise(exerciseId);
      setExercise(res.exercise);
      setTopic(res.topic);
      setCode(res.exercise.starter_code || '# Write your Python code here\n');
    } catch (err: any) {
      setError(err.message || 'Failed to load exercise.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetCode = () => {
    if (exercise?.starter_code) {
      setCode(exercise.starter_code);
    }
  };

  const handleUnlockHint = async (level: number) => {
    if (level > hintsUsed) {
      setHintsUsed(level);
    }
  };

  const handleRevealSolution = async () => {
    try {
      const res = await api.getSolution(exerciseId);
      setWorkedSolution(res.solution);
      setSolutionRevealed(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunPlayground = async () => {
    setRunningPlayground(true);
    setAssessmentResult(null);
    try {
      const res = await api.runPlayground(code);
      setPlaygroundOutput({
        stdout: res.stdout,
        stderr: res.stderr,
        execution_time_ms: res.execution_time_ms
      });
    } catch (err: any) {
      setPlaygroundOutput({
        stdout: '',
        stderr: err.message || 'Execution failed',
        execution_time_ms: 0
      });
    } finally {
      setRunningPlayground(false);
    }
  };

  const handleSubmitAssessment = async () => {
    setEvaluating(true);
    setPlaygroundOutput(null);
    const elapsedSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    try {
      const res = await api.submitAssessment({
        exercise_id: exerciseId,
        code,
        hints_used: hintsUsed,
        revealed_solution: solutionRevealed,
        time_spent_seconds: elapsedSeconds
      });

      setAssessmentResult(res);

      if (res.all_passed) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err: any) {
      setError(err.message || 'Assessment submission failed.');
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading interactive coding workspace...</p>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-200 text-center space-y-4">
        <h3 className="font-bold text-lg">Prerequisite or Access Limitation</h3>
        <p className="text-xs">{error}</p>
        <button
          type="button"
          onClick={() => onNavigate('curriculum')}
          className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs hover:bg-slate-700 cursor-pointer"
        >
          Return to Curriculum Map
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header / Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => onNavigate('curriculum')}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Back to curriculum"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-emerald-400">
                {topic?.name}
              </span>
              <span className="text-slate-600">•</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                exercise.difficulty === 'easy'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : exercise.difficulty === 'medium'
                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                  : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}>
                {exercise.difficulty}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
              {exercise.title}
            </h1>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-2">
          {topic && (
            <button
              type="button"
              onClick={() => onNavigate('lesson', `les_${topic.id.replace('mod_', 'm')}`)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Review Lesson
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            className="px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-700/50 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Optional AI pedagogical explanation"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
            AI Explainer
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Instructions/Hints, Right Code Editor & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Instructions and Progressive Hints */}
        <div className="lg:col-span-5 space-y-4">
          {/* Tab Selector */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setLeftTab('instructions')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                leftTab === 'instructions'
                  ? 'bg-slate-800 text-slate-100 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Problem & Requirements
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('hints')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                leftTab === 'hints'
                  ? 'bg-slate-800 text-slate-100 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              Scaffolding Hints {hintsUsed > 0 && `(${hintsUsed}/3)`}
            </button>
          </div>

          {leftTab === 'instructions' ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4 shadow-lg text-xs sm:text-sm">
              <div className="space-y-2">
                <h3 className="font-bold text-slate-200 text-sm">Problem Statement</h3>
                <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  {exercise.problem_statement}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-200 text-sm">Instructions</h3>
                <p className="text-slate-300 leading-relaxed">
                  {exercise.instructions}
                </p>
              </div>

              {/* Assessment Test Specifications */}
              {exercise.test_cases && exercise.test_cases.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider text-slate-400">
                    Test Specifications ({exercise.test_cases.length} checks)
                  </h3>
                  <div className="space-y-2">
                    {exercise.test_cases.map((tc, idx) => (
                      <div
                        key={tc.id || idx}
                        className="rounded-xl border border-slate-850 bg-slate-950/60 p-3 font-mono text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span>Check #{idx + 1}: {tc.description}</span>
                          {tc.is_hidden ? (
                            <span className="text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40 text-[10px]">
                              Hidden Test
                            </span>
                          ) : (
                            <span className="text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40 text-[10px]">
                              Visible Test
                            </span>
                          )}
                        </div>
                        {!tc.is_hidden && (
                          <div className="text-slate-300">
                            {tc.function_call && (
                              <div><span className="text-slate-500">Call: </span>{tc.function_call}</div>
                            )}
                            {tc.input_data && (
                              <div><span className="text-slate-500">Input: </span>{tc.input_data}</div>
                            )}
                            <div><span className="text-slate-500">Expected: </span><span className="text-emerald-300">{tc.expected_output}</span></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <HintPanel
              hints={exercise.hints || []}
              hintsUsed={hintsUsed}
              onUnlockHint={handleUnlockHint}
              onRevealSolution={handleRevealSolution}
              solutionRevealed={solutionRevealed}
              workedSolution={workedSolution}
            />
          )}
        </div>

        {/* Right Column: Code Editor, Control Buttons, Execution Output, and Assessment Breakdown */}
        <div className="lg:col-span-7 space-y-4">
          {/* Interactive Code Editor */}
          <CodeEditor
            value={code}
            onChange={setCode}
            starterCode={exercise.starter_code}
            onReset={handleResetCode}
            minHeight="360px"
          />

          {/* Action Control Buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={runningPlayground || evaluating}
                onClick={handleRunPlayground}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                {runningPlayground ? 'Executing Sandbox...' : 'Run in Sandbox'}
              </button>
            </div>

            <button
              type="button"
              disabled={evaluating || runningPlayground}
              onClick={handleSubmitAssessment}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold tracking-wide shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {evaluating ? 'Evaluating Checks...' : 'Submit for Automated Assessment'}
            </button>
          </div>

          {/* Playground Run Output */}
          {playgroundOutput && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2 font-mono text-xs shadow-inner">
              <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-slate-800">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  Standard Output (Sandbox Console)
                </span>
                <span>Execution time: {playgroundOutput.execution_time_ms} ms</span>
              </div>
              {playgroundOutput.stdout && (
                <pre className="text-emerald-300 whitespace-pre-wrap">{playgroundOutput.stdout}</pre>
              )}
              {playgroundOutput.stderr && (
                <pre className="text-rose-400 whitespace-pre-wrap">{playgroundOutput.stderr}</pre>
              )}
              {!playgroundOutput.stdout && !playgroundOutput.stderr && (
                <p className="text-slate-500 italic">Program finished cleanly with no output.</p>
              )}
            </div>
          )}

          {/* Assessment Results Section */}
          {assessmentResult && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-xl text-xs sm:text-sm">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className={`w-3 h-3 rounded-full ${
                    assessmentResult.all_passed ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`} />
                  <h3 className="font-bold text-slate-100 text-base">
                    Assessment Result: {assessmentResult.score_percentage}%
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 font-mono text-xs">
                    {assessmentResult.passed_count}/{assessmentResult.total_count} checks passed
                  </span>
                  {assessmentResult.all_passed && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 text-xs">
                      Passed ✓
                    </span>
                  )}
                </div>
              </div>

              {/* Feedback Message */}
              <p className="text-slate-200 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 leading-relaxed">
                {assessmentResult.diagnostic_feedback}
              </p>

              {/* Error Diagnosis Card if issues detected */}
              {assessmentResult.primary_error_category && (
                <ErrorDiagnosisCard
                  errorCategory={assessmentResult.primary_error_category}
                  syntaxValid={assessmentResult.syntax_valid}
                />
              )}

              {/* Individual Test Cases Result Breakdown */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider">
                  Individual Test Results
                </h4>

                <div className="space-y-2">
                  {assessmentResult.test_results?.map((tr: any, idx: number) => (
                    <div
                      key={tr.id || idx}
                      className={`p-3 rounded-xl border font-mono text-xs transition-all ${
                        tr.passed
                          ? 'border-emerald-800/50 bg-emerald-950/20 text-emerald-200'
                          : 'border-rose-800/50 bg-rose-950/20 text-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5">
                          {tr.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          )}
                          Test Case #{idx + 1} {tr.is_hidden && '(Hidden)'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-sans">
                          {tr.execution_time_ms} ms
                        </span>
                      </div>

                      <div className="mt-2 space-y-1 text-slate-300 text-[11px]">
                        <div>
                          <span className="text-slate-500">Expected: </span>
                          <span className="text-emerald-300">{tr.expected_output}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Actual: </span>
                          <span className={tr.passed ? 'text-emerald-300' : 'text-rose-300'}>
                            {tr.actual_output}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Recommendation Trigger if updated */}
              {assessmentResult.next_recommendation && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 to-slate-950 border border-emerald-700/50 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Updated Tutoring Recommendation: {assessmentResult.next_recommendation.rule_name}
                    </span>
                  </div>
                  <p className="text-slate-300">
                    {assessmentResult.next_recommendation.reason}
                  </p>
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onNavigate('dashboard')}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Learner Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Optional AI Explainer Modal */}
      <AiExplainerModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        topicTitle={topic?.name}
        studentCode={code}
        errorCategory={assessmentResult?.primary_error_category}
        errorMessage={assessmentResult?.diagnostic_feedback}
      />
    </div>
  );
};
