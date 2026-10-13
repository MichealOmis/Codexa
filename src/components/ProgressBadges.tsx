import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  Lock,
  CheckCircle2,
  Trophy,
  Code2,
  Repeat,
  Binary,
  Layers,
  Compass,
  FileCode,
  Flame,
  Zap,
  Star
} from 'lucide-react';
import type { Topic, StudentDashboardData } from '../types';

export interface Badge {
  id: string;
  title: string;
  category: 'module' | 'mastery' | 'milestone';
  description: string;
  criteria: string;
  rarity: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  icon: React.ReactNode;
  isEarned: boolean;
  earnedDate?: string;
  progressPercentage: number;
}

interface ProgressBadgesProps {
  topics: Topic[];
  dashboardData: StudentDashboardData;
}

export const ProgressBadges: React.FC<ProgressBadgesProps> = ({
  topics,
  dashboardData
}) => {
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // Helper to check topic score
  const getTopicScore = (modNum: number): number => {
    const t = topics.find(topic => topic.module_number === modNum);
    return t?.mastery_score || 0;
  };

  const isModuleMastered = (modNum: number): boolean => {
    return getTopicScore(modNum) >= 70.0;
  };

  // Define badges based on completed modules and learning achievements
  const badges: Badge[] = [
    {
      id: 'badge_novice',
      title: 'Python Novice',
      category: 'module',
      description: 'Mastered basic syntax, execution model, comments, and print() in Module 1.',
      criteria: 'Reach >= 70% mastery in Module 1: Introduction to Python',
      rarity: 'Bronze',
      icon: <Code2 className="w-5 h-5 text-emerald-400" />,
      isEarned: isModuleMastered(1),
      progressPercentage: Math.min(100, Math.round((getTopicScore(1) / 70) * 100))
    },
    {
      id: 'badge_types',
      title: 'Type Master',
      category: 'module',
      description: 'Proficient in Python primitives (int, float, str, bool) and explicit type casting.',
      criteria: 'Reach >= 70% mastery in Module 2: Variables & Data Types',
      rarity: 'Bronze',
      icon: <Binary className="w-5 h-5 text-teal-400" />,
      isEarned: isModuleMastered(2),
      progressPercentage: Math.min(100, Math.round((getTopicScore(2) / 70) * 100))
    },
    {
      id: 'badge_expressions',
      title: 'Expression Wizard',
      category: 'module',
      description: 'Fluent in arithmetic operators, precedence rules, and boolean relational logic.',
      criteria: 'Reach >= 70% mastery in Module 3: Operators & Expressions',
      rarity: 'Bronze',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      isEarned: isModuleMastered(3),
      progressPercentage: Math.min(100, Math.round((getTopicScore(3) / 70) * 100))
    },
    {
      id: 'badge_io',
      title: 'I/O Specialist',
      category: 'module',
      description: 'Comfortable capturing terminal input and formatting clean output with f-strings.',
      criteria: 'Reach >= 70% mastery in Module 4: Input & Output',
      rarity: 'Silver',
      icon: <FileCode className="w-5 h-5 text-cyan-400" />,
      isEarned: isModuleMastered(4),
      progressPercentage: Math.min(100, Math.round((getTopicScore(4) / 70) * 100))
    },
    {
      id: 'badge_branching',
      title: 'Logic Commander',
      category: 'module',
      description: 'Navigates multi-branch conditional statements (if-elif-else) and guard clauses.',
      criteria: 'Reach >= 70% mastery in Module 5: Conditional Statements',
      rarity: 'Silver',
      icon: <Compass className="w-5 h-5 text-blue-400" />,
      isEarned: isModuleMastered(5),
      progressPercentage: Math.min(100, Math.round((getTopicScore(5) / 70) * 100))
    },
    {
      id: 'badge_loop_expert',
      title: 'Loop Expert',
      category: 'module',
      description: 'Mastered iteration with for loops, range(), while loops, and termination safeguards.',
      criteria: 'Reach >= 70% mastery in Module 6: Loops',
      rarity: 'Silver',
      icon: <Repeat className="w-5 h-5 text-purple-400" />,
      isEarned: isModuleMastered(6),
      progressPercentage: Math.min(100, Math.round((getTopicScore(6) / 70) * 100))
    },
    {
      id: 'badge_functions',
      title: 'Function Architect',
      category: 'module',
      description: 'Designs reusable modular functions with return statements and clean parameter scope.',
      criteria: 'Reach >= 70% mastery in Module 7: Functions',
      rarity: 'Gold',
      icon: <Layers className="w-5 h-5 text-indigo-400" />,
      isEarned: isModuleMastered(7),
      progressPercentage: Math.min(100, Math.round((getTopicScore(7) / 70) * 100))
    },
    {
      id: 'badge_collections',
      title: 'Sequence Alchemist',
      category: 'module',
      description: 'Indexes, slices, and iterates over list and string sequence structures safely.',
      criteria: 'Reach >= 70% mastery in Module 8: Lists & Strings',
      rarity: 'Gold',
      icon: <Flame className="w-5 h-5 text-orange-400" />,
      isEarned: isModuleMastered(8),
      progressPercentage: Math.min(100, Math.round((getTopicScore(8) / 70) * 100))
    },
    {
      id: 'badge_dictionaries',
      title: 'Map Navigator',
      category: 'module',
      description: 'Understands associative key-value dictionaries and safe key access with get().',
      criteria: 'Reach >= 70% mastery in Module 9: Dictionaries',
      rarity: 'Gold',
      icon: <Star className="w-5 h-5 text-yellow-400" />,
      isEarned: isModuleMastered(9),
      progressPercentage: Math.min(100, Math.round((getTopicScore(9) / 70) * 100))
    },
    {
      id: 'badge_algorithms',
      title: 'Algorithm Solver',
      category: 'module',
      description: 'Decomposes multi-step programming challenges and synthesizes comprehensive code.',
      criteria: 'Reach >= 70% mastery in Module 10: Problem-Solving',
      rarity: 'Diamond',
      icon: <Trophy className="w-5 h-5 text-emerald-300" />,
      isEarned: isModuleMastered(10),
      progressPercentage: Math.min(100, Math.round((getTopicScore(10) / 70) * 100))
    },
    {
      id: 'badge_diagnostic',
      title: 'Diagnostic Pioneer',
      category: 'milestone',
      description: 'Completed the baseline 10-item diagnostic pre-test to calibrate recommendations.',
      criteria: 'Complete the Diagnostic Pre-Assessment',
      rarity: 'Bronze',
      icon: <Sparkles className="w-5 h-5 text-amber-300" />,
      isEarned: Boolean(dashboardData.pre_test_completed),
      progressPercentage: dashboardData.pre_test_completed ? 100 : 0
    },
    {
      id: 'badge_scholar',
      title: 'Python Scholar',
      category: 'mastery',
      description: 'Demonstrated provisional mastery (>= 85%) across at least 5 curriculum modules.',
      criteria: 'Achieve provisional mastery (>= 85%) in 5 or more modules',
      rarity: 'Diamond',
      icon: <Award className="w-5 h-5 text-pink-400" />,
      isEarned: topics.filter(t => (t.mastery_score || 0) >= 85).length >= 5,
      progressPercentage: Math.min(100, Math.round((topics.filter(t => (t.mastery_score || 0) >= 85).length / 5) * 100))
    }
  ];

  const earnedBadgesCount = badges.filter(b => b.isEarned).length;
  const filteredBadges = badges.filter(b => {
    if (filter === 'earned') return b.isEarned;
    if (filter === 'locked') return !b.isEarned;
    return true;
  });

  const getRarityBadge = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'Diamond':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60';
      case 'Gold':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
      case 'Silver':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      default:
        return 'bg-orange-950/60 text-orange-300 border-orange-800/60';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-100">Learner Progress & Achievement Badges</h2>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                {earnedBadgesCount} / {badges.length} Unlocked
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Badges awarded based on demonstrated module mastery and formative assessment evidence.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-medium ${
              filter === 'all' ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({badges.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('earned')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-medium ${
              filter === 'earned' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Unlocked ({earnedBadgesCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('locked')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-medium ${
              filter === 'locked' ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Locked ({badges.length - earnedBadgesCount})
          </button>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredBadges.map((badge) => {
          return (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`rounded-xl border p-4 transition-all cursor-pointer flex flex-col justify-between space-y-3 relative group ${
                badge.isEarned
                  ? 'border-emerald-600/40 bg-gradient-to-b from-slate-900 to-slate-950/90 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10'
                  : 'border-slate-850 bg-slate-950/50 opacity-70 hover:opacity-90 hover:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl border ${
                  badge.isEarned
                    ? 'bg-slate-900 border-slate-700/80 shadow'
                    : 'bg-slate-950 border-slate-850 text-slate-600'
                }`}>
                  {badge.icon}
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getRarityBadge(badge.rarity)}`}>
                    {badge.rarity}
                  </span>
                  {badge.isEarned ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className={`font-bold text-sm tracking-tight ${
                  badge.isEarned ? 'text-slate-100 group-hover:text-emerald-300' : 'text-slate-400'
                }`}>
                  {badge.title}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {badge.description}
                </p>
              </div>

              {/* Progress bar towards badge */}
              <div className="space-y-1 pt-1 border-t border-slate-850">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{badge.isEarned ? 'Requirement Fulfilled' : 'Progress'}</span>
                  <span className="font-mono">{badge.progressPercentage}%</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      badge.isEarned ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                    style={{ width: `${badge.progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-400">
                  {selectedBadge.icon}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-lg text-slate-100">{selectedBadge.title}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getRarityBadge(selectedBadge.rarity)}`}>
                      {selectedBadge.rarity}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 capitalize">{selectedBadge.category} Achievement</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-2">
              <div>
                <strong className="text-slate-200">Achievement Description:</strong>
                <p className="mt-1 text-slate-400">{selectedBadge.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/60">
                <strong className="text-emerald-400">Mastery Requirement:</strong>
                <p className="mt-1 text-slate-300 font-mono text-[11px]">{selectedBadge.criteria}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span>Status:</span>
                <span className={`font-bold ${selectedBadge.isEarned ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {selectedBadge.isEarned ? 'Unlocked & Recorded ✓' : `In Progress (${selectedBadge.progressPercentage}%)`}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
