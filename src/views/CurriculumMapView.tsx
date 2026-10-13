import React, { useEffect, useState } from 'react';
import {
  Map,
  BookOpen,
  Code2,
  Lock,
  Unlock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';
import type { Topic, Exercise } from '../types';

interface CurriculumMapViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const CurriculumMapView: React.FC<CurriculumMapViewProps> = ({ onNavigate }) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string>('mod_1');
  const [topicDetails, setTopicDetails] = useState<{ topic: Topic; lessons: any[]; exercises: Exercise[] } | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    setLoading(true);
    try {
      const res = await api.getTopics();
      setTopics(res.topics);
      if (res.topics.length > 0) {
        loadTopicDetails(res.topics[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTopicDetails = async (id: string) => {
    setSelectedTopic(id);
    setDetailsLoading(true);
    try {
      const res = await api.getTopic(id);
      setTopicDetails(res);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading Python curriculum map...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400">
          <Map className="w-4 h-4" />
          <span>Python Programming Learning Trajectory</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
          10-Module Curriculum Road Map
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Progress through the modules in sequence. Downstream modules unlock as you satisfy prerequisite readiness requirements (70% mastery).
        </p>
      </div>

      {/* Grid: Left Modules List, Right Selected Topic Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 10 Module Cards */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Curriculum Sequence
          </h2>

          <div className="space-y-2.5">
            {topics.map((t) => {
              const isSelected = selectedTopic === t.id;
              const isUnlocked = t.is_unlocked ?? true;
              const score = t.mastery_score ?? 0;

              return (
                <div
                  key={t.id}
                  onClick={() => loadTopicDetails(t.id)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/10'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  } ${!isUnlocked ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                        score >= 85
                          ? 'bg-emerald-500 text-slate-950'
                          : isUnlocked
                          ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                          : 'bg-slate-950 text-slate-600 border border-slate-850'
                      }`}>
                        {t.module_number}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-200 text-sm">{t.name}</h3>
                        <p className="text-[11px] text-slate-400 capitalize">{t.difficulty} level</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isUnlocked ? (
                        <span className="text-xs font-mono font-semibold text-emerald-400">
                          {score}%
                        </span>
                      ) : (
                        <Lock className="w-4 h-4 text-amber-500/80" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Topic Details */}
        <div className="lg:col-span-7">
          {detailsLoading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading topic information...
            </div>
          ) : topicDetails ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 space-y-6 shadow-xl">
              {/* Module Header */}
              <div className="space-y-2 border-b border-slate-800 pb-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Module {topicDetails.topic.module_number} of 10
                  </span>
                  {topicDetails.topic.is_unlocked ? (
                    <span className="flex items-center text-xs text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800">
                      <Unlock className="w-3 h-3 mr-1" />
                      Unlocked & Ready
                    </span>
                  ) : (
                    <span className="flex items-center text-xs text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-800">
                      <Lock className="w-3 h-3 mr-1" />
                      Prerequisite Locked (&lt; 70% Mastery in earlier modules)
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-bold text-slate-100">{topicDetails.topic.name}</h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {topicDetails.topic.description}
                </p>
              </div>

              {/* Learning Objectives */}
              {topicDetails.topic.learning_objectives?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Learning Objectives
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {topicDetails.topic.learning_objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lessons in this Topic */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  Instructional Lessons
                </h4>

                <div className="space-y-2">
                  {topicDetails.lessons.map((les) => (
                    <div
                      key={les.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <h5 className="font-semibold text-slate-200 text-sm">{les.title}</h5>
                        <p className="text-xs text-slate-400">{les.summary}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate('lesson', les.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                      >
                        Study Lesson
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exercises in this Topic */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-purple-400" />
                  Interactive Programming Exercises
                </h4>

                <div className="space-y-2">
                  {topicDetails.exercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h5 className="font-semibold text-slate-200 text-sm">{ex.title}</h5>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                            ex.difficulty === 'easy'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : ex.difficulty === 'medium'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}>
                            {ex.difficulty}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">{ex.problem_statement}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigate('coding', ex.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                      >
                        Open Editor
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
