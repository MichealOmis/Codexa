import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  Code2,
  BookOpen,
  ArrowRight,
  Info,
  Sparkles
} from 'lucide-react';
import { api } from '../api';
import type { LeaderboardEntry } from '../types';

interface LeaderboardViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onNavigate }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [optedIn, setOptedIn] = useState<boolean>(false);
  const [myStanding, setMyStanding] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toggling, setToggling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getLeaderboard();
      setLeaderboard(res.leaderboard || []);
      setOptedIn(Boolean(res.opted_in));
      setMyStanding(res.current_user_standing);
    } catch (err: any) {
      setError(err.message || 'Failed to load leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOptIn = async (newVal: boolean) => {
    setToggling(true);
    try {
      const res = await api.toggleLeaderboardOptIn(newVal);
      setOptedIn(res.opted_in);
      await loadLeaderboard();
    } catch (err: any) {
      alert(`Could not update preference: ${err.message}`);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading anonymized class leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-amber-400">
            <Trophy className="w-4 h-4" />
            <span>Opt-In Relative Standing & Gamified Mastery</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
            Anonymized Class Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track your relative progress based on earned Mastery Points from Python module completions and coding exercises.
          </p>
        </div>

        {/* Opt-in / Opt-out control button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={toggling}
            onClick={() => handleToggleOptIn(!optedIn)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              optedIn
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
            }`}
          >
            {optedIn ? (
              <>
                <EyeOff className="w-4 h-4 text-slate-400" />
                <span>Opt Out of Leaderboard</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span>Opt In to Leaderboard</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Privacy Guarantee & Scoring Methodology Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400">
            <Shield className="w-4 h-4" />
            <span>Strict Privacy & Anonymity Guarantee</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Participation is 100% voluntary. Only your pseudonymous research ID (e.g. <code className="text-emerald-400 font-mono">PARTICIPANT-XXXXX</code>) is shown. Personal names, student IDs, and email addresses are never disclosed to other learners.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>Mastery Points Formula</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Points = <span className="font-semibold text-slate-100">100 pts</span> per module mastered (&ge;70%) + <span className="font-semibold text-slate-100">50 pts</span> per exercise passed + <span className="font-semibold text-slate-100">5 pts</span> per percentage point of average mastery.
          </p>
        </div>
      </div>

      {/* Student's Current Opt-In Standing Banner */}
      {optedIn ? (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-sm">
              #{myStanding?.rank || '-'}
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Your Current Standing</div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>{myStanding?.participant_id || 'You'}</span>
                <span className="text-xs font-mono text-emerald-400">({myStanding?.mastery_points || 0} Mastery Points)</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-xs text-slate-300">
            <div>
              <span className="text-slate-400">Modules: </span>
              <span className="font-bold text-slate-100">{myStanding?.modules_mastered || 0}/10</span>
            </div>
            <div>
              <span className="text-slate-400">Exercises: </span>
              <span className="font-bold text-slate-100">{myStanding?.exercises_passed || 0}</span>
            </div>
            <div>
              <span className="text-slate-400">Avg Mastery: </span>
              <span className="font-bold text-emerald-400">{myStanding?.avg_mastery || 0}%</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <Info className="w-5 h-5 text-amber-400" />
            <p className="text-xs text-amber-200">
              You are currently <strong>opted out</strong> of the leaderboard. Click &ldquo;Opt In to Leaderboard&rdquo; to share your anonymized participant points and see your class standing.
            </p>
          </div>
          <button
            type="button"
            disabled={toggling}
            onClick={() => handleToggleOptIn(true)}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 cursor-pointer"
          >
            Join Leaderboard
          </button>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-slate-100 text-base flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Class Rankings</span>
          </h2>
          <span className="text-xs text-slate-400">
            {leaderboard.length} student{leaderboard.length === 1 ? '' : 's'} opted in
          </span>
        </div>

        {leaderboard.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-2">
            <Trophy className="w-8 h-8 text-slate-600 mx-auto" />
            <p>No students have opted into the leaderboard yet.</p>
            <p className="text-slate-500">Be the first to join and show your progress!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Rank</th>
                  <th className="py-3 px-4 font-semibold">Participant Identifier</th>
                  <th className="py-3 px-4 font-semibold text-right">Mastery Points</th>
                  <th className="py-3 px-4 font-semibold text-center">Modules Mastered</th>
                  <th className="py-3 px-4 font-semibold text-center">Exercises Passed</th>
                  <th className="py-3 px-4 font-semibold text-right">Avg Mastery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leaderboard.map((entry) => {
                  const isTop1 = entry.rank === 1;
                  const isTop2 = entry.rank === 2;
                  const isTop3 = entry.rank === 3;

                  return (
                    <tr
                      key={entry.participant_id}
                      className={`transition-colors ${
                        entry.is_current_user
                          ? 'bg-emerald-950/40 border-l-4 border-l-emerald-500 text-emerald-200'
                          : 'hover:bg-slate-800/40 text-slate-300'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <div className="flex items-center gap-1.5">
                          {isTop1 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center text-xs">
                              🥇
                            </span>
                          ) : isTop2 ? (
                            <span className="w-6 h-6 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 flex items-center justify-center text-xs">
                              🥈
                            </span>
                          ) : isTop3 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-400 border border-amber-700/40 flex items-center justify-center text-xs">
                              🥉
                            </span>
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-xs">
                              #{entry.rank}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium">
                        <div className="flex items-center gap-2">
                          <span>{entry.participant_id}</span>
                          {entry.is_current_user && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              You
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-amber-300 text-sm">
                        {entry.mastery_points.toLocaleString()} pts
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono">
                          {entry.modules_mastered} / 10
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono">
                          {entry.exercises_passed}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-200">
                        {entry.avg_mastery}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
