import React from 'react';
import { AlertTriangle, Clock, Bug, HelpCircle, CheckCircle2 } from 'lucide-react';

interface ErrorDiagnosisCardProps {
  errorCategory: string | null;
  errorMessage?: string | null;
  remedialAdvice?: string | null;
  syntaxValid?: boolean;
}

export const ErrorDiagnosisCard: React.FC<ErrorDiagnosisCardProps> = ({
  errorCategory,
  errorMessage,
  remedialAdvice,
  syntaxValid = true
}) => {
  if (!errorCategory && syntaxValid) return null;

  const isTimeout = errorCategory === 'TimeLimitExceeded';
  const isSyntax = errorCategory === 'SyntaxError' || errorCategory === 'IndentationError';

  return (
    <div className={`rounded-xl border p-4 transition-all shadow-md ${
      isTimeout 
        ? 'bg-amber-950/30 border-amber-600/50 text-amber-200' 
        : isSyntax
        ? 'bg-rose-950/30 border-rose-600/50 text-rose-200'
        : 'bg-indigo-950/30 border-indigo-600/50 text-indigo-200'
    }`}>
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-lg shrink-0 ${
          isTimeout ? 'bg-amber-500/20 text-amber-400' : isSyntax ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'
        }`}>
          {isTimeout ? <Clock className="w-5 h-5" /> : isSyntax ? <AlertTriangle className="w-5 h-5" /> : <Bug className="w-5 h-5" />}
        </div>

        <div className="flex-1 space-y-1.5 text-xs md:text-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="font-bold flex items-center gap-1.5 tracking-wide text-sm">
              <span>Identified Diagnostic Issue:</span>
              <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${
                isTimeout ? 'bg-amber-500/20 text-amber-300' : isSyntax ? 'bg-rose-500/20 text-rose-300' : 'bg-indigo-500/20 text-indigo-300'
              }`}>
                {errorCategory || 'Syntax Issue'}
              </span>
            </h4>
            <span className="text-[11px] font-sans text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">
              Rule 8 Diagnostic Feedback
            </span>
          </div>

          {errorMessage && (
            <div className="font-mono text-xs bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 text-rose-300 whitespace-pre-wrap break-all">
              {errorMessage}
            </div>
          )}

          {remedialAdvice && (
            <div className="pt-1.5 flex items-start space-x-2 text-slate-300">
              <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-emerald-400">Pedagogical Advice: </span>
                <span className="text-slate-200">{remedialAdvice}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
