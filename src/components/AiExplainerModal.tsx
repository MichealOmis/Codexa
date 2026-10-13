import React, { useState } from 'react';
import { Sparkles, X, BrainCircuit, HelpCircle, Lightbulb, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

interface AiExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicTitle?: string;
  studentCode?: string;
  errorCategory?: string | null;
  errorMessage?: string | null;
}

export const AiExplainerModal: React.FC<AiExplainerModalProps> = ({
  isOpen,
  onClose,
  topicTitle,
  studentCode,
  errorCategory,
  errorMessage
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    explanation: string;
    pedagogical_tips: string[];
    suggested_debug_question: string;
    is_ai_generated: boolean;
    disclaimer: string;
  } | null>(null);

  const fetchExplanation = async () => {
    setLoading(true);
    try {
      const res = await api.getAiExplanation({
        topic_title: topicTitle,
        student_code: studentCode,
        error_category: errorCategory || undefined,
        error_message: errorMessage || undefined
      });
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      fetchExplanation();
    } else {
      setData(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                Supplementary Pedagogical Explainer
                <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-700/50">
                  Optional AI Module
                </span>
              </h3>
              <p className="text-xs text-slate-400">Conceptual scaffolding for introductory Python</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Sparkles className="w-8 h-8 text-purple-400 animate-spin" />
            <p className="text-sm text-slate-400">Analyzing code structure & pedagogical guidance...</p>
          </div>
        ) : data ? (
          <div className="space-y-4 text-xs md:text-sm">
            {/* Disclaimer notice */}
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <span className="font-semibold text-purple-300">Pedagogical Boundary: </span>
              {data.disclaimer}
            </div>

            {/* Explanation box */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-400">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Conceptual Explanation
              </h4>
              <p className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-slate-200 leading-relaxed">
                {data.explanation}
              </p>
            </div>

            {/* Pedagogical Tips */}
            {data.pedagogical_tips && data.pedagogical_tips.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Targeted Learning Tips
                </h4>
                <ul className="space-y-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  {data.pedagogical_tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300">
                      <span className="text-emerald-400 font-bold shrink-0">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reflective Debugging Question */}
            {data.suggested_debug_question && (
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-400">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  Self-Reflection Question
                </h4>
                <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/50 text-cyan-200 italic">
                  "{data.suggested_debug_question}"
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            Close Explainer
          </button>
        </div>
      </div>
    </div>
  );
};
