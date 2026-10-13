import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { GeminiChatbot } from './components/GeminiChatbot';
import { LandingView } from './views/LandingView';
import { StudentDashboard } from './views/StudentDashboard';
import { CurriculumMapView } from './views/CurriculumMapView';
import { LessonView } from './views/LessonView';
import { CodingWorkspaceView } from './views/CodingWorkspaceView';
import { AssessmentView } from './views/AssessmentView';
import { SUSSurveyView } from './views/SUSSurveyView';
import { AdminPortalView } from './views/AdminPortalView';
import { ArchitectureDocView } from './views/ArchitectureDocView';
import { LeaderboardView } from './views/LeaderboardView';
import { api, getStoredToken } from './api';
import type { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('landing');
  const [viewParam, setViewParam] = useState<string | undefined>(undefined);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    const token = getStoredToken();
    if (token) {
      try {
        const res = await api.getMe();
        setUser(res.user);
        setCurrentView('dashboard');
      } catch (err) {
        api.logout();
      }
    }
    setInitializing(false);
  };

  const handleNavigate = (view: string, param?: string) => {
    setCurrentView(view);
    setViewParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (authUser: User) => {
    setUser(authUser);
    if (authUser.role === 'administrator') {
      setCurrentView('admin');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setCurrentView('landing');
  };

  const handleSwitchRole = async (targetRole: 'student' | 'administrator') => {
    try {
      if (targetRole === 'student') {
        const res = await api.login('student@example.edu', 'password123');
        setUser(res.user);
        setCurrentView('dashboard');
      } else {
        const res = await api.login('lecturer@example.edu', 'adminpass123');
        setUser(res.user);
        setCurrentView('admin');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-3 font-sans">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono">Initializing PyTutor Intelligent Tutoring System...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Navigation Bar */}
      <Navbar
        user={user}
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={() => {
          setAuthInitialMode('login');
          setIsAuthOpen(true);
        }}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {currentView === 'landing' && (
          <LandingView
            onNavigate={handleNavigate}
            onOpenAuth={() => {
              setAuthInitialMode('register');
              setIsAuthOpen(true);
            }}
            onSwitchRole={handleSwitchRole}
          />
        )}

        {currentView === 'dashboard' && (
          <StudentDashboard onNavigate={handleNavigate} />
        )}

        {currentView === 'curriculum' && (
          <CurriculumMapView onNavigate={handleNavigate} />
        )}

        {currentView === 'lesson' && viewParam && (
          <LessonView lessonId={viewParam} onNavigate={handleNavigate} />
        )}

        {currentView === 'coding' && viewParam && (
          <CodingWorkspaceView exerciseId={viewParam} onNavigate={handleNavigate} />
        )}

        {currentView === 'pre_test' && (
          <AssessmentView assessmentType="pre_test" onNavigate={handleNavigate} />
        )}

        {currentView === 'post_test' && (
          <AssessmentView assessmentType="post_test" onNavigate={handleNavigate} />
        )}

        {currentView === 'sus' && (
          <SUSSurveyView onNavigate={handleNavigate} />
        )}

        {currentView === 'admin' && (
          <AdminPortalView onNavigate={handleNavigate} />
        )}

        {currentView === 'architecture' && (
          <ArchitectureDocView onNavigate={handleNavigate} />
        )}

        {currentView === 'leaderboard' && (
          <LeaderboardView onNavigate={handleNavigate} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <p className="font-semibold text-slate-400">
              PyTutor • Intelligent Tutoring System for Python Programming
            </p>
            <p className="text-[11px]">
              Undergraduate Final-Year Research Project in Educational Technology & Software Engineering.
            </p>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <button
              type="button"
              onClick={() => handleNavigate('leaderboard')}
              className="hover:text-amber-400 cursor-pointer"
            >
              Class Leaderboard
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleNavigate('architecture')}
              className="hover:text-slate-300 cursor-pointer"
            >
              Architecture & Rules
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleNavigate('curriculum')}
              className="hover:text-slate-300 cursor-pointer"
            >
              10-Module Curriculum
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleSwitchRole('administrator')}
              className="hover:text-indigo-400 cursor-pointer"
            >
              Lecturer Portal
            </button>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authInitialMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Multi-Turn Gemini AI Tutor Chatbot */}
      <GeminiChatbot />
    </div>
  );
}
