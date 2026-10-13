import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Users,
  Award,
  AlertTriangle,
  Download,
  RotateCcw,
  BookOpen,
  Code2,
  FileSpreadsheet,
  CheckCircle2,
  BarChart3,
  BookMarked,
  Sparkles,
  HelpCircle,
  X
} from 'lucide-react';
import { api } from '../api';
import type { AdminAnalyticsData, Topic } from '../types';

interface AdminPortalViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({ onNavigate }) => {
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab: 'overview' | 'curriculum' | 'export'
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'export'>('overview');

  // Data dictionary modal
  const [showDataDict, setShowDataDict] = useState(false);
  const [dataDict, setDataDict] = useState<any[]>([]);

  // Demo reset state
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Curriculum editing
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('mod_1');
  const [topicDetails, setTopicDetails] = useState<any | null>(null);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [editingExercise, setEditingExercise] = useState<any | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [downloadingType, setDownloadingType] = useState<string | null>(null);

  const handleDownloadDataset = async (type: 'students' | 'attempts' | 'usability') => {
    setDownloadingType(type);
    try {
      await api.downloadResearchCSV(type);
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    } finally {
      setDownloadingType(null);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminOverview();
      setAnalytics(res.analytics);

      const topRes = await api.getTopics();
      setTopics(topRes.topics);
      if (topRes.topics.length > 0) {
        loadCurriculumDetails(topRes.topics[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load administrator portal.');
    } finally {
      setLoading(false);
    }
  };

  const loadCurriculumDetails = async (id: string) => {
    setSelectedTopicId(id);
    try {
      const res = await api.getTopic(id);
      setTopicDetails(res);
      setEditingLesson(res.lessons[0] || null);
      setEditingExercise(res.exercises[0] || null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDataDict = async () => {
    try {
      const res = await api.getDataDictionary();
      setDataDict(res.data_dictionary);
      setShowDataDict(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDemoData = async () => {
    if (!confirm('Are you sure you want to reset all evaluation data to pristine initial seed records?')) {
      return;
    }
    setResetting(true);
    try {
      const res = await api.resetDemoData();
      setResetMessage(res.message);
      await loadAnalytics();
      setTimeout(() => setResetMessage(null), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResetting(false);
    }
  };

  const handleSaveLesson = async () => {
    if (!editingLesson) return;
    try {
      await api.updateLesson(editingLesson.id, {
        title: editingLesson.title,
        summary: editingLesson.summary,
        content_markdown: editingLesson.content_markdown,
        is_published: true
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveExercise = async () => {
    if (!editingExercise) return;
    try {
      await api.updateExercise(editingExercise.id, {
        title: editingExercise.title,
        difficulty: editingExercise.difficulty,
        problem_statement: editingExercise.problem_statement,
        instructions: editingExercise.instructions,
        starter_code: editingExercise.starter_code,
        worked_solution: editingExercise.worked_solution || '',
        max_score: editingExercise.max_score || 100
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading administrator & evaluation portal...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-200 text-center space-y-3">
        <h3 className="font-bold text-lg">Administrator Access Required</h3>
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

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-indigo-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Undergraduate Research Project Evaluation & Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
            Lecturer / Administrator Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Class analytics, error taxonomy monitoring, curriculum content management, and research data export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={resetting}
            onClick={handleResetDemoData}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset demonstration data to clean state"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            {resetting ? 'Resetting...' : 'Reset Demo Data'}
          </button>
        </div>
      </div>

      {resetMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Cohort Metrics & Error Analytics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('curriculum')}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'curriculum'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          Curriculum Content Editor
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('export')}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'export'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Research Dataset CSV Export
        </button>
      </div>

      {/* TAB 1: OVERVIEW & ERROR ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5 shadow-md">
              <span className="text-xs text-slate-400">Total Students</span>
              <div className="text-2xl font-extrabold text-slate-100">{analytics.total_students}</div>
              <p className="text-[11px] text-slate-500">Registered cohorts</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5 shadow-md">
              <span className="text-xs text-slate-400">Code Submissions</span>
              <div className="text-2xl font-extrabold text-slate-100">{analytics.total_attempts}</div>
              <p className="text-[11px] text-slate-500">Recorded attempts</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5 shadow-md">
              <span className="text-xs text-slate-400">Mean Platform Mastery</span>
              <div className="text-2xl font-extrabold text-emerald-400">{analytics.avg_platform_mastery}%</div>
              <p className="text-[11px] text-slate-500">Across 10 modules</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5 shadow-md">
              <span className="text-xs text-slate-400">Pre / Post Test Means</span>
              <div className="text-2xl font-extrabold text-purple-400">
                {analytics.pre_test_avg}% / {analytics.post_test_avg}%
              </div>
              <p className="text-[11px] text-slate-500">Formative vs summative</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5 shadow-md">
              <span className="text-xs text-slate-400">Mean SUS Score</span>
              <div className="text-2xl font-extrabold text-teal-400">{analytics.sus_average_score}</div>
              <p className="text-[11px] text-slate-500">Benchmark: 68.0</p>
            </div>
          </div>

          {/* Error Taxonomy Distribution & Topic Mastery */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Error Category Breakdown */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Common Error Category Taxonomy
                </h3>
                <span className="text-[11px] text-slate-400">Failed Submissions</span>
              </div>

              {analytics.error_category_distribution.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-6 text-center">No failed attempts recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {analytics.error_category_distribution.map((err) => {
                    const totalErrors = analytics.error_category_distribution.reduce((acc, c) => acc + c.count, 0);
                    const pct = totalErrors > 0 ? Math.round((err.count / totalErrors) * 100) : 0;
                    return (
                      <div key={err.category} className="space-y-1 text-xs">
                        <div className="flex justify-between font-mono">
                          <span className="text-slate-300 font-semibold">{err.category}</span>
                          <span className="text-slate-400">{err.count} occurrences ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="bg-amber-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Topic Mastery Distribution */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  Class Mean Mastery by Module
                </h3>
                <span className="text-[11px] text-slate-400">10 Modules</span>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {analytics.topic_mastery_breakdown.map((t) => (
                  <div key={t.topic_id} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-300 font-medium truncate max-w-[220px]">{t.topic_name}</span>
                      <span className="font-mono text-emerald-400">{t.avg_mastery}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${t.avg_mastery}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-100 text-base">Registered Student Cohort</h3>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="py-3 px-4 font-semibold">Participant ID</th>
                    <th className="py-3 px-4 font-semibold">Username</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Pre-Test</th>
                    <th className="py-3 px-4 font-semibold">Post-Test</th>
                    <th className="py-3 px-4 font-semibold">Mean Mastery</th>
                    <th className="py-3 px-4 font-semibold">Submissions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {analytics.students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-850/50">
                      <td className="py-3 px-4 font-mono text-emerald-400 font-bold">{s.participant_id}</td>
                      <td className="py-3 px-4 text-slate-200">{s.username}</td>
                      <td className="py-3 px-4 text-slate-400">{s.email}</td>
                      <td className="py-3 px-4 font-mono">{s.pre_test_score !== null ? `${s.pre_test_score}%` : 'N/A'}</td>
                      <td className="py-3 px-4 font-mono">{s.post_test_score !== null ? `${s.post_test_score}%` : 'N/A'}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{s.avg_mastery}%</td>
                      <td className="py-3 px-4 text-slate-300">{s.attempts_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CURRICULUM CONTENT MANAGEMENT */}
      {activeTab === 'curriculum' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
            Administrators can modify lesson instructional text, code exercises, test specifications, and hints without modifying system source code.
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Module Selector */}
            <div className="lg:col-span-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Module</h4>
              <div className="space-y-1.5">
                {topics.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => loadCurriculumDetails(t.id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                      selectedTopicId === t.id
                        ? 'border-indigo-500 bg-indigo-950/40 text-indigo-200 font-bold'
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Module {t.module_number}: {t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Editor Form */}
            <div className="lg:col-span-8 space-y-6">
              {topicDetails && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6 shadow-xl">
                  {saveSuccess && (
                    <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
                      Changes successfully saved to SQLite database.
                    </div>
                  )}

                  {/* Edit Lesson */}
                  {editingLesson && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2 border-b border-slate-800 pb-2">
                        <BookOpen className="w-4 h-4 text-emerald-400" />
                        Edit Lesson: {editingLesson.title}
                      </h3>

                      <div className="space-y-2 text-xs">
                        <label className="text-slate-300 font-medium">Lesson Title</label>
                        <input
                          type="text"
                          value={editingLesson.title}
                          onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                        />
                      </div>

                      <div className="space-y-2 text-xs">
                        <label className="text-slate-300 font-medium">Lesson Summary</label>
                        <input
                          type="text"
                          value={editingLesson.summary}
                          onChange={(e) => setEditingLesson({ ...editingLesson, summary: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                        />
                      </div>

                      <div className="space-y-2 text-xs">
                        <label className="text-slate-300 font-medium">Content Markdown</label>
                        <textarea
                          rows={6}
                          value={editingLesson.content_markdown}
                          onChange={(e) => setEditingLesson({ ...editingLesson, content_markdown: e.target.value })}
                          className="w-full font-mono text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 leading-relaxed"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveLesson}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer"
                      >
                        Save Lesson Content
                      </button>
                    </div>
                  )}

                  {/* Edit Exercise */}
                  {editingExercise && (
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                      <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2 border-b border-slate-800 pb-2">
                        <Code2 className="w-4 h-4 text-purple-400" />
                        Edit Exercise: {editingExercise.title}
                      </h3>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="text-slate-300 font-medium">Exercise Title</label>
                          <input
                            type="text"
                            value={editingExercise.title}
                            onChange={(e) => setEditingExercise({ ...editingExercise, title: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-300 font-medium">Difficulty</label>
                          <select
                            value={editingExercise.difficulty}
                            onChange={(e) => setEditingExercise({ ...editingExercise, difficulty: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <label className="text-slate-300 font-medium">Problem Statement</label>
                        <textarea
                          rows={2}
                          value={editingExercise.problem_statement}
                          onChange={(e) => setEditingExercise({ ...editingExercise, problem_statement: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                        />
                      </div>

                      <div className="space-y-2 text-xs">
                        <label className="text-slate-300 font-medium">Starter Code</label>
                        <textarea
                          rows={3}
                          value={editingExercise.starter_code}
                          onChange={(e) => setEditingExercise({ ...editingExercise, starter_code: e.target.value })}
                          className="w-full font-mono bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-emerald-300"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveExercise}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer"
                      >
                        Save Exercise Configuration
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RESEARCH DATASET CSV EXPORT */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-lg">
            <div>
              <h3 className="font-bold text-slate-100 text-base">Export Anonymized Research Datasets</h3>
              <p className="text-xs text-slate-400 mt-1">
                Generates exportable CSV files formatted for statistical analysis (e.g. SPSS, R, Python pandas). Excludes personal identifiers and passwords.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3">
                <div className="font-semibold text-slate-200 text-sm">1. Students Evaluation Dataset</div>
                <p className="text-xs text-slate-400">
                  Pre-test score, post-test score, normalized gain (g), average topic mastery, modules mastered count, and SUS score.
                </p>
                <button
                  type="button"
                  disabled={downloadingType === 'students'}
                  onClick={() => handleDownloadDataset('students')}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className={`w-4 h-4 ${downloadingType === 'students' ? 'animate-bounce' : ''}`} />
                  {downloadingType === 'students' ? 'Generating CSV...' : 'Download Students CSV'}
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3">
                <div className="font-semibold text-slate-200 text-sm">2. Exercise Attempts Log</div>
                <p className="text-xs text-slate-400">
                  Timestamped code submissions, scores, error categories, test checks passed, hints used, and execution time.
                </p>
                <button
                  type="button"
                  disabled={downloadingType === 'attempts'}
                  onClick={() => handleDownloadDataset('attempts')}
                  className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className={`w-4 h-4 ${downloadingType === 'attempts' ? 'animate-bounce' : ''}`} />
                  {downloadingType === 'attempts' ? 'Generating CSV...' : 'Download Attempts CSV'}
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3">
                <div className="font-semibold text-slate-200 text-sm">3. System Usability Scale (SUS)</div>
                <p className="text-xs text-slate-400">
                  Raw 1-5 responses across all 10 Brooke (1996) items and computed final SUS scores per participant.
                </p>
                <button
                  type="button"
                  disabled={downloadingType === 'usability'}
                  onClick={() => handleDownloadDataset('usability')}
                  className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className={`w-4 h-4 ${downloadingType === 'usability' ? 'animate-bounce' : ''}`} />
                  {downloadingType === 'usability' ? 'Generating CSV...' : 'Download Usability CSV'}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleOpenDataDict}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                View Academic Data Dictionary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Dictionary Modal */}
      {showDataDict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                Research Evaluation Data Dictionary
              </h3>
              <button
                type="button"
                onClick={() => setShowDataDict(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {dataDict.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-800 bg-slate-950 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-emerald-400">{item.field}</span>
                    <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDataDict(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Close Dictionary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
