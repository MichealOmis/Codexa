import React from 'react';
import {
  Code2,
  BookOpen,
  Cpu,
  BrainCircuit,
  Target,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

interface LandingViewProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: () => void;
  onSwitchRole: (role: 'student' | 'administrator') => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onNavigate,
  onOpenAuth,
  onSwitchRole
}) => {
  return (
    <div className="space-y-16 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 p-8 sm:p-12 lg:p-16 shadow-2xl overflow-hidden text-center sm:text-left">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Undergraduate Final-Year Research Project</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100 leading-tight">
            Personalised Python Learning through an <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Intelligent Tutoring System</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            An academic software system combining structured introductory Python curriculum, automated isolated code assessment, a Bayesian-informed student mastery model, and transparent rule-based pedagogical recommendations.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onSwitchRole('student')}
              className="flex items-center px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Launch Student Demo
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>

            <button
              type="button"
              onClick={() => onSwitchRole('administrator')}
              className="flex items-center px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 mr-2 text-indigo-400" />
              Lecturer Management Portal
            </button>

            <button
              type="button"
              onClick={() => onNavigate('architecture')}
              className="flex items-center px-4 py-3 rounded-xl bg-transparent hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              System Architecture & Evaluation Protocol
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core ITS Architecture Components */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
            Intelligent Tutoring System Architecture
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Codexa strictly implements the four classical ITS architectural modules documented in educational technology literature.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-100 text-base">1. Domain Knowledge</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Curriculum database with 10 structured modules, prerequisite dependency trees, learning objectives, lessons, and multi-difficulty exercises.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-100 text-base">2. Student Model</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tracks topic mastery scores from valid assessment attempts, logs error categories, records progressive hint counts, and prevents superficial mastery claims.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-100 text-base">3. Tutoring Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transparent, explainable pedagogical rules (Rules 1-10). Every recommendation outputs an explicit reason based on mastery thresholds and prerequisites.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-100 text-base">4. Assessment Sandbox</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hardened, isolated Python 3 subprocess execution worker with 2.0s time limits, sanitized environment variables, and automated error categorization.
            </p>
          </div>
        </div>
      </div>

      {/* 10-Module Python Curriculum Breakdown */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-xl text-slate-100">Introductory Python Curriculum</h3>
            <p className="text-xs text-slate-400">10 sequential instructional units with strict prerequisite enforcement</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('curriculum')}
            className="flex items-center text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
          >
            Explore Interactive Topic Map
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {[
            { num: 1, name: "Introduction to Python", focus: "Runtime, print(), comments" },
            { num: 2, name: "Variables & Types", focus: "int, float, str, casting" },
            { num: 3, name: "Operators & Expressions", focus: "Arithmetic & logic ops" },
            { num: 4, name: "Input & Output", focus: "input() & f-strings" },
            { num: 5, name: "Conditional Statements", focus: "if-elif-else branching" },
            { num: 6, name: "Loops", focus: "for, while, range()" },
            { num: 7, name: "Functions", focus: "def, arguments, return" },
            { num: 8, name: "Lists & Strings", focus: "Indexing, slicing, methods" },
            { num: 9, name: "Dictionaries", focus: "Key-value mapping & get()" },
            { num: 10, name: "Problem-Solving", focus: "Algorithmic synthesis" }
          ].map((m) => (
            <div key={m.num} className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/70 space-y-1.5">
              <span className="text-[10px] font-mono text-emerald-400 font-bold">Module {m.num}</span>
              <h4 className="font-semibold text-slate-200">{m.name}</h4>
              <p className="text-[11px] text-slate-400">{m.focus}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Research Methodology & Academic Evaluation Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
          <div className="p-2 w-fit rounded-lg bg-teal-500/10 text-teal-400">
            <Target className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-100 text-sm">Diagnostic & Summative Assessment</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Comparable 10-item pre-test and parallel post-test measuring identical introductory concepts. Computes normalized learning gain without subjective bias.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
          <div className="p-2 w-fit rounded-lg bg-indigo-500/10 text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-100 text-sm">Standard System Usability Scale (SUS)</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Full administration of Brooke's 10-item SUS instrument. Computes standard SUS score (0-100) and adjective ratings independently from learning scores.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
          <div className="p-2 w-fit rounded-lg bg-amber-500/10 text-amber-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-100 text-sm">Transparent Research Dataset Export</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Generates deanonymized CSV exports with pseudonymous participant IDs, attempt logs, error distributions, and comprehensive data dictionary for academic defense.
          </p>
        </div>
      </div>
    </div>
  );
};
