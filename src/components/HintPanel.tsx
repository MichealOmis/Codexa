import React, { useState } from 'react';
import { Lightbulb, ChevronRight, Lock, Eye, AlertCircle, BookOpen } from 'lucide-react';
import type { HintItem } from '../types';

interface HintPanelProps {
  hints: HintItem[];
  hintsUsed: number;
  onUnlockHint: (level: number) => void;
  onRevealSolution: () => void;
  solutionRevealed: boolean;
  workedSolution?: string;
}

export const HintPanel: React.FC<HintPanelProps> = ({
  hints,
  hintsUsed,
  onUnlockHint,
  onRevealSolution,
  solutionRevealed,
  workedSolution
}) => {
  const [confirmSolution, setConfirmSolution] = useState(false);

  const getHintTitle = (level: number) => {
    switch (level) {
      case 1: return 'Level 1: Concept Clarification';
      case 2: return 'Level 2: Target & Likely Error';
      case 3: return 'Level 3: Debugging Strategy & Example';
      default: return `Hint Level ${level}`;
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-4 shadow-lg text-sm">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Progressive Hint Scaffolding</h3>
            <p className="text-[11px] text-slate-400">3-level structured assistance</p>
          </div>
        </div>
        <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-300 font-mono">
          Unlocked: {Math.min(hintsUsed, 3)}/3
        </span>
      </div>

      {/* Progressive hint levels */}
      <div className="space-y-3">
        {[1, 2, 3].map((lvl) => {
          const isUnlocked = hintsUsed >= lvl;
          const hintData = hints.find(h => h.level === lvl);

          return (
            <div
              key={lvl}
              className={`rounded-lg border p-3 transition-all ${
                isUnlocked
                  ? 'bg-slate-950/70 border-slate-700/80 text-slate-200'
                  : 'bg-slate-950/30 border-slate-800/50 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isUnlocked ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {lvl}
                  </span>
                  {getHintTitle(lvl)}
                </span>

                {!isUnlocked && (
                  <button
                    type="button"
                    onClick={() => onUnlockHint(lvl)}
                    className="flex items-center text-xs font-medium text-amber-400 hover:text-amber-300 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 transition-colors cursor-pointer"
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    Unlock Hint {lvl}
                  </button>
                )}
              </div>

              {isUnlocked && hintData && (
                <div className="mt-2.5 pt-2 border-t border-slate-800 text-xs leading-relaxed text-slate-300 pl-6">
                  {hintData.text}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Worked Solution Section */}
      <div className="pt-2 border-t border-slate-800">
        {!solutionRevealed ? (
          <div>
            {!confirmSolution ? (
              <button
                type="button"
                onClick={() => setConfirmSolution(true)}
                className="w-full py-2 px-3 rounded-lg border border-slate-700 bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                Request Worked Reference Solution
              </button>
            ) : (
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-700/50 space-y-2 text-xs">
                <div className="flex items-start gap-2 text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p>
                    Viewing the reference solution will mark it as a worked example in your learning model attempt record. Are you sure you want to proceed?
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setConfirmSolution(false)}
                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmSolution(false);
                      onRevealSolution();
                    }}
                    className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer"
                  >
                    Confirm & Reveal Solution
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/20 p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-emerald-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Worked Example (Reference Solution)
              </span>
              <span className="text-[10px] bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/40">
                Study Only
              </span>
            </div>
            {workedSolution && (
              <pre className="font-mono text-xs bg-slate-950 p-3 rounded border border-slate-800 text-emerald-200 overflow-x-auto whitespace-pre-wrap">
                {workedSolution}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
