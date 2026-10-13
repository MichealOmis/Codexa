import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ClipboardList,
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { api } from '../api';
import type { Assessment, AssessmentQuestion } from '../types';

interface AssessmentViewProps {
  assessmentType: 'pre_test' | 'post_test';
  onNavigate: (view: string, param?: string) => void;
}

export const AssessmentView: React.FC<AssessmentViewProps> = ({
  assessmentType,
  onNavigate
}) => {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssessment();
  }, [assessmentType]);

  const loadAssessment = async () => {
    setLoading(true);
    setError(null);
    setAnswers({});
    setSubmitted(false);
    setResult(null);

    try {
      const res = await api.getAssessment(assessmentType);
      setAssessment(res.assessment);
      if (res.user_response) {
        setSubmitted(true);
        setAnswers(res.user_response.answers || {});
        setResult({
          score: res.user_response.score,
          total_questions: res.user_response.total_questions,
          percentage: res.user_response.percentage
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load assessment.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    if (!assessment || !assessment.questions) return;
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < assessment.questions.length) {
      if (!confirm(`You have answered ${answeredCount} of ${assessment.questions.length} questions. Do you want to submit anyway?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await api.submitAssessmentQuestions(assessmentType, answers);
      setResult(res);
      setSubmitted(true);

      if (res.percentage >= 70) {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    } catch (err: any) {
      setError(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading assessment questionnaire...</p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-200 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <h3 className="font-bold text-lg">Assessment Unavailable</h3>
        <p className="text-xs">{error}</p>
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs hover:bg-slate-700 cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isPreTest = assessmentType === 'pre_test';
  const answeredCount = Object.keys(answers).length;
  const totalCount = assessment.questions?.length || 10;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400">
          {isPreTest ? <ClipboardList className="w-4 h-4 text-amber-400" /> : <Award className="w-4 h-4 text-purple-400" />}
          <span>{isPreTest ? 'Diagnostic Baseline Assessment' : 'Summative Learning Evaluation'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
          {assessment.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {assessment.description}
        </p>
      </div>

      {/* Progress & Result Banner */}
      {submitted && result ? (
        <div className="rounded-2xl border border-emerald-600/50 bg-gradient-to-r from-emerald-950/60 to-slate-900 p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-bold text-lg text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Assessment Completed: {result.score} / {result.total_questions} ({result.percentage}%)
            </span>
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              Recorded in Student Model
            </span>
          </div>
          <p className="text-xs text-slate-300">
            {isPreTest
              ? 'Your baseline assessment results have calibrated your topic recommendations. Proceed to your learner dashboard.'
              : 'Your summative post-assessment has been recorded. Please complete the System Usability Scale (SUS) questionnaire to finalize your evaluation.'}
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
            </button>
            {!isPreTest && (
              <button
                type="button"
                onClick={() => onNavigate('sus')}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                Complete SUS Usability Survey
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <span className="text-slate-400">
            Answered: <strong className="text-emerald-400">{answeredCount}</strong> of {totalCount} questions
          </span>
          <span className="text-slate-500 font-mono">10 Competencies Evaluated</span>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {assessment.questions?.map((q, idx) => {
          const selected = answers[q.id];
          const isAnswered = selected !== undefined;
          const breakdown = result?.questions_breakdown?.find((b: any) => b.id === q.id);

          return (
            <div
              key={q.id}
              className={`rounded-2xl border p-5 space-y-4 transition-all shadow-md ${
                submitted && breakdown
                  ? breakdown.is_correct
                    ? 'border-emerald-800/60 bg-emerald-950/20'
                    : 'border-rose-800/60 bg-rose-950/20'
                  : 'border-slate-800 bg-slate-900/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-slate-100 text-sm md:text-base leading-snug">
                  <span className="font-mono text-emerald-400 mr-2">Q{idx + 1}.</span>
                  {q.question_text}
                </h3>
                {submitted && breakdown && (
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${
                    breakdown.is_correct ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {breakdown.is_correct ? 'Correct ✓' : 'Incorrect ✗'}
                  </span>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2">
                {q.options.map((opt, optIdx) => {
                  const isSelected = selected === optIdx;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={submitted}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 font-semibold'
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-850 text-slate-300'
                      } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                          isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Feedback explanation if submitted */}
              {submitted && breakdown && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="font-semibold text-emerald-400">Explanation & Diagnostic Rationale:</div>
                  <p>{breakdown.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Action Bar */}
      {!submitted && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Ensure you have answered all questions prior to final evaluation submission.
          </span>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>{submitting ? 'Submitting...' : 'Submit Assessment Answers'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};
