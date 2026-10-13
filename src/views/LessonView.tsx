import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Code2,
  Sparkles,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../api';
import type { Lesson, Topic } from '../types';

interface LessonViewProps {
  lessonId: string;
  onNavigate: (view: string, param?: string) => void;
}

export const LessonView: React.FC<LessonViewProps> = ({ lessonId, onNavigate }) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [marking, setMarking] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const loadLesson = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getLesson(lessonId);
      setLesson(res.lesson);
      setTopic(res.topic);
      setIsCompleted(Boolean(res.lesson.is_completed));
    } catch (err: any) {
      setError(err.message || 'Failed to load lesson.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!lesson) return;
    setMarking(true);
    try {
      await api.markLessonComplete(lesson.id);
      setIsCompleted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setMarking(false);
    }
  };

  const handleSelectQuiz = (qIndex: number, optionIndex: number) => {
    setQuizAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
  };

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(idx);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading lesson content...</p>
      </div>
    );
  }

  if (error || !lesson) {
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
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate('curriculum')}
          className="flex items-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Curriculum Map
        </button>

        {isCompleted ? (
          <span className="flex items-center text-xs text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Lesson Completed
          </span>
        ) : (
          <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            In Progress
          </span>
        )}
      </div>

      {/* Lesson Header */}
      <div className="border-b border-slate-800 pb-6 space-y-2">
        <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
          {topic?.name}
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
          {lesson.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {lesson.summary}
        </p>
      </div>

      {/* Structured Instructional Markdown Body */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 space-y-6 text-sm text-slate-300 leading-relaxed shadow-lg">
        <div className="prose prose-invert max-w-none space-y-4">
          {lesson.content_markdown.split('\n\n').map((paragraph, idx) => {
            if (paragraph.startsWith('# ')) {
              return <h2 key={idx} className="text-xl font-bold text-slate-100 pt-2 border-b border-slate-800 pb-2">{paragraph.replace('# ', '')}</h2>;
            }
            if (paragraph.startsWith('## ')) {
              return <h3 key={idx} className="text-lg font-bold text-emerald-400 pt-2">{paragraph.replace('## ', '')}</h3>;
            }
            if (paragraph.startsWith('```python')) {
              const code = paragraph.replace('```python\n', '').replace('```', '');
              return (
                <div key={idx} className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-300 overflow-x-auto shadow-inner">
                  <pre>{code}</pre>
                </div>
              );
            }
            return <p key={idx}>{paragraph}</p>;
          })}
        </div>
      </div>

      {/* Code Examples Section */}
      {lesson.code_examples && lesson.code_examples.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            Practical Code Demonstrations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lesson.code_examples.map((eg, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-200 text-sm">{eg.title}</h4>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(eg.code, idx)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    title="Copy code"
                  >
                    {copiedCodeIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-emerald-200 overflow-x-auto">
                  <pre>{eg.code}</pre>
                </div>

                <p className="text-xs text-slate-400">{eg.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Quick-Check Questions */}
      {lesson.quick_check_questions && lesson.quick_check_questions.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <HelpCircle className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="font-bold text-base text-slate-100">Check Your Understanding</h3>
              <p className="text-xs text-slate-400">Low-stakes formative check to reinforce key concepts</p>
            </div>
          </div>

          <div className="space-y-6">
            {lesson.quick_check_questions.map((q, qIdx) => {
              const selectedOpt = quizAnswers[qIdx];
              const isAnswered = selectedOpt !== undefined;
              const isCorrect = selectedOpt === q.correct_index;

              return (
                <div key={qIdx} className="space-y-3 rounded-xl border border-slate-850 bg-slate-950/60 p-4">
                  <h4 className="font-semibold text-slate-200 text-xs sm:text-sm">
                    {qIdx + 1}. {q.question}
                  </h4>

                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isOptionSelected = selectedOpt === optIdx;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectQuiz(qIdx, optIdx)}
                          className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                            isOptionSelected
                              ? optIdx === q.correct_index
                                ? 'border-emerald-600 bg-emerald-950/40 text-emerald-200'
                                : 'border-rose-600 bg-rose-950/40 text-rose-200'
                              : 'border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <span>{opt}</span>
                          {isOptionSelected && (
                            <span className="font-bold font-mono text-[11px]">
                              {optIdx === q.correct_index ? 'Correct ✓' : 'Incorrect ✗'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && (
                    <div className={`p-3 rounded-lg text-xs leading-relaxed ${
                      isCorrect ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60' : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}>
                      <span className="font-semibold">Explanation: </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completion & Next Exercise Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-200 text-sm">Finished studying this lesson?</h4>
          <p className="text-xs text-slate-400">
            Marking complete updates your student model and updates adaptive recommendations.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!isCompleted ? (
            <button
              type="button"
              disabled={marking}
              onClick={handleMarkComplete}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {marking ? 'Saving...' : 'Mark Lesson Completed'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('curriculum')}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Practice Topic Exercises</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
