import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../api';

const SUS_QUESTIONS = [
  "I think that I would like to use this Intelligent Tutoring System frequently.",
  "I found the system unnecessarily complex.",
  "I thought the system was easy to use.",
  "I think that I would need the support of a technical person to be able to use this system.",
  "I found the various functions in this system were well integrated.",
  "I thought there was too much inconsistency in this system.",
  "I would imagine that most people would learn to use this system very quickly.",
  "I found the system very cumbersome to use.",
  "I felt very confident using the system.",
  "I needed to learn a lot of things before I could get going with this system."
];

interface SUSSurveyViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const SUSSurveyView: React.FC<SUSSurveyViewProps> = ({ onNavigate }) => {
  const [responses, setResponses] = useState<number[]>(Array(10).fill(0));
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkExisting();
  }, []);

  const checkExisting = async () => {
    setLoading(true);
    try {
      const res = await api.getSUS();
      if (res.survey) {
        setSubmitted(true);
        setResult({
          sus_score: res.survey.sus_score,
          adjective_rating: res.survey.sus_score >= 85 ? 'Excellent' : res.survey.sus_score >= 68 ? 'Good' : 'Needs Improvement',
          grade_scale: res.survey.sus_score >= 80 ? 'A' : res.survey.sus_score >= 68 ? 'B' : 'C'
        });
        setResponses([
          res.survey.q1, res.survey.q2, res.survey.q3, res.survey.q4, res.survey.q5,
          res.survey.q6, res.survey.q7, res.survey.q8, res.survey.q9, res.survey.q10
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (questionIndex: number, value: number) => {
    if (submitted) return;
    const next = [...responses];
    next[questionIndex] = value;
    setResponses(next);
  };

  const handleSubmit = async () => {
    const unselected = responses.findIndex(r => r === 0);
    if (unselected !== -1) {
      alert(`Please respond to item #${unselected + 1} before submitting.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.submitSUS(responses);
      setResult(res);
      setSubmitted(true);

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      setError(err.message || 'Survey submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading System Usability Scale questionnaire...</p>
      </div>
    );
  }

  const answeredCount = responses.filter(r => r > 0).length;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-mono text-purple-400">
          <Award className="w-4 h-4" />
          <span>Usability & Human-Computer Interaction Evaluation</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
          System Usability Scale (SUS)
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Standardized 10-item instrument for measuring software usability (Brooke, 1996). Responses are scored on a 5-point Likert scale (1 = Strongly Disagree to 5 = Strongly Agree).
        </p>
      </div>

      {/* Methodology documentation notice */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400 space-y-1.5">
        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
          Academic Scoring Methodology
        </div>
        <p>
          Odd numbered items contribute (Score - 1), while even numbered items contribute (5 - Score). Total score is multiplied by 2.5 to yield a 0–100 scale. Benchmark score across industrial software is 68.0.
        </p>
      </div>

      {/* Submitted Result Card */}
      {submitted && result && (
        <div className="rounded-2xl border border-purple-600/50 bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                Official Usability Result
              </span>
              <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
                SUS Score: {result.sus_score} / 100
              </h2>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 text-xs">
                Rating: {result.adjective_rating || 'Good'} (Grade {result.grade_scale || 'B'})
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 relative">
            <div
              className="bg-gradient-to-r from-emerald-500 to-purple-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, result.sus_score)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">
            Industry Benchmark Average is 68.0. Your evaluation has been saved to the anonymous research study dataset.
          </p>

          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Questionnaire Form */}
      <div className="space-y-6">
        {SUS_QUESTIONS.map((q, idx) => {
          const selected = responses[idx];
          return (
            <div
              key={idx}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-3.5 shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-slate-200 text-xs sm:text-sm">
                  <span className="font-mono text-purple-400 mr-2">{idx + 1}.</span>
                  {q}
                </h3>
              </div>

              {/* 5-point Likert scale options */}
              <div className="grid grid-cols-5 gap-2 pt-1 text-center">
                {[1, 2, 3, 4, 5].map((val) => {
                  const isSelected = selected === val;
                  const label = val === 1 ? 'Strongly Disagree' : val === 5 ? 'Strongly Agree' : val.toString();

                  return (
                    <button
                      key={val}
                      type="button"
                      disabled={submitted}
                      onClick={() => handleSelect(idx, val)}
                      className={`p-2.5 rounded-xl border text-xs transition-all flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'border-purple-500 bg-purple-950/60 text-purple-200 font-bold shadow'
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-400'
                      } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span className="font-mono text-sm">{val}</span>
                      <span className="text-[10px] hidden sm:block truncate max-w-full">
                        {val === 1 ? 'Strongly Disagree' : val === 2 ? 'Disagree' : val === 3 ? 'Neutral' : val === 4 ? 'Agree' : 'Strongly Agree'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      {!submitted && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Responded: <strong className="text-purple-400">{answeredCount}</strong> of 10 items
          </span>
          <button
            type="button"
            disabled={submitting || answeredCount < 10}
            onClick={handleSubmit}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs tracking-wide shadow-md transition-all flex items-center gap-1.5 ${
              answeredCount === 10
                ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>{submitting ? 'Calculating...' : 'Submit Usability Responses'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};
