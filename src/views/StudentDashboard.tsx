import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Award,
  BookOpen,
  Code2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  HelpCircle,
  Lock,
  Layers,
  ClipboardList,
  History,
  Trophy,
  X
} from 'lucide-react';
import { api } from '../api';
import { ProgressBadges } from '../components/ProgressBadges';
import type { StudentDashboardData, Topic, MasteryCategory, Recommendation } from '../types';

interface StudentDashboardProps {
  onNavigate: (view: string, param?: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [recHistory, setRecHistory] = useState<Recommendation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const openHistoryModal = async () => {
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await api.getRecommendationHistory();
      setRecHistory(res.history || []);
    } catch (e) {
      console.error('Failed to load recommendation history:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleStartRecommendation = async (rec: Recommendation) => {
    try {
      await api.respondToRecommendation(rec.id, 'accepted');
    } catch (e) {
      // Non-blocking
    }
    if (rec.target_type === 'diagnostic') onNavigate('pre_test');
    else if (rec.target_type === 'post_test') onNavigate('post_test');
    else if (rec.target_type === 'lesson') onNavigate('lesson', rec.target_id);
    else if (rec.target_type === 'exercise') onNavigate('coding', rec.target_id);
  };

  const getMasteryBadge = (category: MasteryCategory, score: number) => {
    switch (category) {
      case 'provisional_mastery':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Provisional Mastery ({score}%)
          </span>
        );
      case 'near_mastery':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-teal-400" />
            Near Mastery ({score}%)
          </span>
        );
      case 'developing':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            Developing ({score}%)
          </span>
        );
      case 'needs_support':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            Needs Support ({score}%)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700/60">
            Unassessed (No Evidence)
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading student learning model...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-200 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <h3 className="font-bold text-lg">Unable to load student model</h3>
        <p className="text-xs">{error}</p>
        <button
          type="button"
          onClick={loadDashboard}
          className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs hover:bg-slate-700 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const activeRec = data.active_recommendation;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Welcome, {data.user.username}
            </h1>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
              {data.user.participant_id}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Personalised Intelligent Tutoring Dashboard • Introductory Python
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!data.pre_test_completed && (
            <button
              type="button"
              onClick={() => onNavigate('pre_test')}
              className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ClipboardList className="w-4 h-4 text-amber-400" />
              Complete Diagnostic Pre-Test
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate('leaderboard')}
            className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            Class Leaderboard
          </button>

          <button
            type="button"
            onClick={() => onNavigate('curriculum')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            Curriculum Map
          </button>
        </div>
      </div>

      {/* Active Pedagogical Recommendation Banner (RULE-BASED EXPLAINABILITY) */}
      {activeRec && (
        <div className="relative rounded-2xl border border-emerald-600/40 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 p-6 shadow-xl space-y-4 overflow-hidden">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Adaptive Tutoring Recommendation
              </span>
              <span className="text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                {activeRec.rule_name}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-sans">
              Tutoring Rule Engine v1.0
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Next Suggested Activity:</span>
              <span className="text-emerald-400 underline decoration-emerald-500/40">
                {activeRec.target_title}
              </span>
            </h2>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <span className="font-semibold text-emerald-400">Rule-Based Rationale: </span>
              {activeRec.reason}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={openHistoryModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Recommendation Audit History</span>
            </button>

            <button
              type="button"
              onClick={() => handleStartRecommendation(activeRec)}
              className="flex items-center px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wide shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <span>Start Recommended Activity</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Recommendation History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Recommendation Audit & History</h3>
                  <p className="text-xs text-slate-400">
                    Transparent rule-based pedagogical decisions and learner response log
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
              {historyLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400">Loading recommendation history...</p>
                </div>
              ) : recHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No recommendation records in history yet.
                </div>
              ) : (
                recHistory.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/50 space-y-2"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                          {item.rule_code}
                        </span>
                        <span className="font-semibold text-slate-200">{item.rule_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                          item.learner_response === 'completed'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                            : item.learner_response === 'accepted'
                            ? 'bg-blue-950/60 text-blue-300 border-blue-800'
                            : item.learner_response === 'superseded'
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-amber-950/60 text-amber-300 border-amber-800'
                        }`}>
                          Response: {item.learner_response || (item.is_completed ? 'Completed' : 'Pending')}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300">
                      <span className="text-slate-400 font-medium">Target: </span>
                      <span className="font-semibold text-emerald-300">{item.target_title}</span>
                      <span className="text-slate-500 text-[11px] ml-1.5">({item.target_type})</span>
                    </div>

                    <p className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-850 leading-relaxed">
                      <strong className="text-slate-300 font-medium">Rationale: </strong>
                      {item.reason}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overall Platform Mastery</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            {data.overall_average_mastery}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, data.overall_average_mastery)}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Modules Mastered (&ge;70%)</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            {data.topics_mastered_count} <span className="text-xs text-slate-500 font-normal">/ 10</span>
          </div>
          <p className="text-[11px] text-slate-400">Prerequisite threshold</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Diagnostic Pre-Test</span>
            <ClipboardList className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            {data.pre_test_completed ? `${data.pre_test_score}%` : 'Pending'}
          </div>
          <p className="text-[11px] text-slate-400">
            {data.pre_test_completed ? 'Baseline calibrated' : 'Action recommended'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Code Submissions</span>
            <Code2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            {data.total_attempts_count}
          </div>
          <p className="text-[11px] text-slate-400">Assessment attempts</p>
        </div>
      </div>

      {/* Progress & Achievement Badges */}
      <ProgressBadges topics={data.topics} dashboardData={data} />

      {/* Curriculum Topic Modules Status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-100">Curriculum Mastery Breakdown</h2>
          <span className="text-xs text-slate-400">10 Modules with prerequisite enforcement</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.topics.map((topic) => {
            const isUnlocked = topic.is_unlocked ?? true;
            const score = topic.mastery_score ?? 0;
            const category = topic.mastery_category ?? 'unassessed';

            return (
              <div
                key={topic.id}
                className={`rounded-2xl border p-5 transition-all shadow-md space-y-3.5 ${
                  !isUnlocked
                    ? 'border-slate-800/50 bg-slate-950/40 opacity-75'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        Module {topic.module_number}
                      </span>
                      {!isUnlocked && (
                        <span className="flex items-center text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                          <Lock className="w-2.5 h-2.5 mr-1" />
                          Prerequisite Locked
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-100 text-sm md:text-base">{topic.name}</h3>
                  </div>

                  <div>{getMasteryBadge(category, score)}</div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {topic.description}
                </p>

                {/* Mastery Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Evidence-based Mastery Score</span>
                    <span className="font-mono text-slate-200">{score}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        score >= 85 ? 'bg-emerald-500' : score >= 70 ? 'bg-teal-500' : score >= 50 ? 'bg-amber-500' : score > 0 ? 'bg-rose-500' : 'bg-transparent'
                      }`}
                      style={{ width: `${Math.min(100, score)}%` }}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => onNavigate('lesson', `les_${topic.id.replace('mod_', 'm')}`)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Study Lesson
                  </button>

                  <button
                    type="button"
                    disabled={!isUnlocked}
                    onClick={() => onNavigate('curriculum')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      isUnlocked
                        ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/40'
                        : 'bg-slate-800/40 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    Exercises
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Attempts History */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-100">Recent Assessment Submissions</h2>
        {data.recent_attempts.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-400 space-y-2">
            <Code2 className="w-8 h-8 text-slate-600 mx-auto" />
            <p>No code submissions recorded yet. Select a lesson or exercise to begin!</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                    <th className="py-3 px-4 font-semibold">Exercise</th>
                    <th className="py-3 px-4 font-semibold">Score</th>
                    <th className="py-3 px-4 font-semibold">Checks</th>
                    <th className="py-3 px-4 font-semibold">Diagnostic Classification</th>
                    <th className="py-3 px-4 font-semibold">Hints Used</th>
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.recent_attempts.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-850/50">
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {att.exercise_title || att.exercise_id}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span className={att.score >= 100 ? 'text-emerald-400' : att.score >= 50 ? 'text-amber-400' : 'text-rose-400'}>
                          {att.score}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {att.passed_count}/{att.total_count} passed
                      </td>
                      <td className="py-3 px-4">
                        {att.all_passed ? (
                          <span className="text-emerald-400 font-medium">All Passed</span>
                        ) : (
                          <span className="font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                            {att.error_category || 'Failed checks'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {att.hints_used} {att.revealed_solution && '(Solution viewed)'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(att.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
