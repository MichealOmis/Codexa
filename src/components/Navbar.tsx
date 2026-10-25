import React from 'react';
import {
  Code2,
  LayoutDashboard,
  Map,
  BookOpen,
  Award,
  Shield,
  LogOut,
  LogIn,
  FileText,
  ClipboardList,
  Trophy
} from 'lucide-react';
import type { User } from '../types';

interface NavbarProps {
  user: User | null;
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSwitchRole: (role: 'student' | 'administrator') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentView,
  onNavigate,
  onOpenAuth,
  onLogout,
  onSwitchRole
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      {/* Top Academic Context Banner */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-1 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-300">Final-Year Research Project:</span>
          <span className="hidden md:inline">Adaptive Intelligent Tutoring System for Python Programming</span>
        </div>
        <div className="flex items-center space-x-3">
          {user ? (
            <span className="font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
              {user.participant_id} ({user.role})
            </span>
          ) : (
            <span className="text-slate-400">Anonymous Visitor</span>
          )}

          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-amber-400/90 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Firebase Cloud
          </span>

          {/* Quick Demo Switcher */}
          <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-800">
            <button
              type="button"
              onClick={() => onSwitchRole('student')}
              className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              title="Quick demo switch to student profile"
            >
              Demo Student
            </button>
            <button
              type="button"
              onClick={() => onSwitchRole('administrator')}
              className="px-2 py-0.5 rounded text-[10px] bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/50 cursor-pointer"
              title="Quick demo switch to lecturer profile"
            >
              Demo Lecturer
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Code2 className="w-6 h-6 text-slate-950 font-black" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg text-slate-100 tracking-tight">Codexa</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                ITS Core
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Personalised Python Learning</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="hidden lg:flex items-center space-x-1 text-xs font-medium">
          {user && (
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
              Dashboard
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate('curriculum')}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              currentView === 'curriculum'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Map className="w-3.5 h-3.5 mr-1.5" />
            Curriculum Map
          </button>

          <button
            type="button"
            onClick={() => onNavigate('leaderboard')}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              currentView === 'leaderboard'
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            Leaderboard
          </button>

          {user && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('pre_test')}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  currentView === 'pre_test'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5 mr-1.5" />
                Diagnostic Pre-Test
              </button>

              <button
                type="button"
                onClick={() => onNavigate('post_test')}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  currentView === 'post_test'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Award className="w-3.5 h-3.5 mr-1.5" />
                Post-Test & Evaluation
              </button>

              <button
                type="button"
                onClick={() => onNavigate('sus')}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  currentView === 'sus'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Award className="w-3.5 h-3.5 mr-1.5" />
                SUS Usability Survey
              </button>
            </>
          )}

          {user?.role === 'administrator' && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                    : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40'
                }`}
              >
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                Lecturer Portal
              </button>

              <button
                type="button"
                onClick={() => onNavigate('architecture')}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  currentView === 'architecture'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                System Architecture
              </button>
            </>
          )}
        </nav>

        {/* Right Action */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-semibold text-slate-200">{user.username}</div>
                <div className="text-[10px] text-slate-400">{user.email}</div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 mr-1.5" />
              Sign In / Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
