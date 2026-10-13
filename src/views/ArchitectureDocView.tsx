import React from 'react';
import {
  FileText,
  Layers,
  Database,
  Cpu,
  ShieldCheck,
  Award,
  BookOpen,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Terminal,
  BrainCircuit
} from 'lucide-react';

interface ArchitectureDocViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const ArchitectureDocView: React.FC<ArchitectureDocViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-12">
      {/* Title */}
      <div className="border-b border-slate-800 pb-6 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400">
          <FileText className="w-4 h-4" />
          <span>Undergraduate Research Project Documentation & Academic Defence Reference</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
          System Architecture, Data Model & Pedagogical Rules
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Title: <em>"Design, Development and Evaluation of an Intelligent Tutoring System for Personalised Learning of Python Programming"</em>
        </p>
      </div>

      {/* 1. ARCHITECTURE DIAGRAM */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          1. System Architecture Diagram
        </h2>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4 font-mono text-xs shadow-xl overflow-x-auto">
          <pre className="text-emerald-300 leading-relaxed">
{`+-----------------------------------------------------------------------------------+
|                           REACT 19 SPA CLIENT (VITE)                              |
|  - Topic Map   - Interactive Coding Workspace   - Pre/Post Assessments   - SUS    |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / JSON REST API
                                           v
+-----------------------------------------------------------------------------------+
|                         NODE.JS / EXPRESS 4 SERVICE LAYER                         |
|  - Session Auth & RBAC (Student / Admin)   - Prerequisite Guard Middleware        |
|  - Research Data Export (CSV)              - Optional AI Explainer (Non-grading)  |
+---------------------+-----------------------------------+-------------------------+
                      |                                   |
                      v                                   v
+-------------------------------------+   +-----------------------------------------+
|   RELATIONAL DATABASE (SQLITE 3)    |   |     RULE-BASED TUTORING ENGINE          |
|  - Users (Pseudonymous IDs)         |   |  - Formula: (Passed / Applicable) * 100 |
|  - Topics (10 Modules) & Lessons    |   |  - Student Model & Mastery Categorizer  |
|  - Exercises & Hidden Test Cases    |   |  - Prerequisite Readiness (>= 70%)      |
|  - Student Attempts & SUS Surveys   |   |  - Rules 1 - 10 Explainable Reasoner    |
+-------------------------------------+   +-----------------------------------------+
                                                          |
                                                          v
                                  +-------------------------------------------------+
                                  |     ISOLATED PYTHON 3 SANDBOX WORKER (SUBPROC)  |
                                  |  - CPU & Wall Clock Timeout Limit: 2.0s         |
                                  |  - Sanitized Environment (No Leaked Host Secrets|
                                  |  - AST Syntax & Indentation Pre-compile Check   |
                                  |  - Error Taxonomy Classifier & Hidden Test Mask |
                                  +-------------------------------------------------+`}
          </pre>
        </div>
      </section>

      {/* 2. THE 10 ADAPTIVE TUTORING RULES */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-purple-400" />
          2. Transparent Tutoring Rules (Rules 1 - 10)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {[
            {
              rule: "RULE 1: Diagnostic Assessment",
              condition: "No recorded diagnostic result in student model",
              action: "Recommend Diagnostic Pre-Test to establish initial learner baseline."
            },
            {
              rule: "RULE 2: Prerequisite Readiness",
              condition: "Prerequisite topic mastery < 70%",
              action: "Lock downstream module and direct student to master prerequisite first."
            },
            {
              rule: "RULE 3: Low Mastery (< 50%)",
              condition: "Mastery score is between 0% and 49%",
              action: "Recommend reviewing the lesson, attempt introductory exercise with Level 1-2 hints."
            },
            {
              rule: "RULE 4: Developing Mastery (50 - 69%)",
              condition: "Mastery score is between 50% and 69%",
              action: "Recommend intermediate practice exercise with guided hints."
            },
            {
              rule: "RULE 5: Near Mastery (70 - 84%)",
              condition: "Mastery score is between 70% and 84%",
              action: "Recommend challenge exercise with reduced scaffolding to reach full mastery."
            },
            {
              rule: "RULE 6: Provisional Mastery (>= 85%)",
              condition: "Mastery score meets or exceeds 85%",
              action: "Recommend advancing to the next unlocked curriculum module or transfer exercise."
            },
            {
              rule: "RULE 7: Repeated Error Remediation",
              condition: "2+ consecutive attempts with identical error taxonomy (e.g. IndexError)",
              action: "Trigger targeted diagnostic explanation on the specific error and assign debugging exercise."
            },
            {
              rule: "RULE 8: Incorrect Assessment Feedback",
              condition: "Submitted code fails test checks",
              action: "Identify failed checks and provide diagnostic guidance without revealing full solution."
            },
            {
              rule: "RULE 9: Demonstrated Improvement",
              condition: "New valid attempt logged",
              action: "Recalculate topic mastery aggregation and immediately refresh recommended activity."
            },
            {
              rule: "RULE 10: Curriculum Completion",
              condition: "All 10 modules meet or exceed 70% threshold",
              action: "Recommend summative post-test and System Usability Scale (SUS) survey."
            }
          ].map((r, i) => (
            <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5">
              <span className="font-bold text-emerald-400 font-mono">{r.rule}</span>
              <div><strong className="text-slate-300">Condition: </strong><span className="text-slate-400">{r.condition}</span></div>
              <div><strong className="text-slate-300">Action: </strong><span className="text-slate-400">{r.action}</span></div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. RELATIONAL DATA MODEL */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Database className="w-5 h-5 text-teal-400" />
          3. Relational Database Schema (15 Entities)
        </h2>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="py-2.5 px-4 font-semibold">Entity Table</th>
                <th className="py-2.5 px-4 font-semibold">Primary Key</th>
                <th className="py-2.5 px-4 font-semibold">Foreign Keys</th>
                <th className="py-2.5 px-4 font-semibold">Purpose & Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
              <tr>
                <td className="py-2.5 px-4 text-emerald-400 font-bold">users</td>
                <td className="py-2.5 px-4">id</td>
                <td className="py-2.5 px-4 text-slate-500">None</td>
                <td className="py-2.5 px-4 font-sans text-xs">Learner & faculty records, role (student/admin), pseudonymous participant_id</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-emerald-400 font-bold">topics</td>
                <td className="py-2.5 px-4">id</td>
                <td className="py-2.5 px-4 text-slate-500">None</td>
                <td className="py-2.5 px-4 font-sans text-xs">10 curriculum modules, objectives, prerequisite JSON array, mastery threshold</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-emerald-400 font-bold">lessons</td>
                <td className="py-2.5 px-4">id</td>
                <td className="py-2.5 px-4">topic_id</td>
                <td className="py-2.5 px-4 font-sans text-xs">Instructional markdown, code examples, formative quick-check items</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-emerald-400 font-bold">exercises</td>
                <td className="py-2.5 px-4">id</td>
                <td className="py-2.5 px-4">topic_id</td>
                <td className="py-2.5 px-4 font-sans text-xs">Coding problems, difficulty, starter code, 3-level hints, worked solution</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-emerald-400 font-bold">exercise_test_cases</td>
                <td className="py-2.5 px-4">id</td>
                <td className="py-2.5 px-4">exercise_id</td>
                <td className="py-2.5 px-4 font-sans text-xs">Visible & hidden test inputs, expected output, function call wrappers</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-emerald-400 font-bold">student_attempts</td>
                <td className="py-2.5 px-4">id</td>
                <td className="py-2.5 px-4">student_id, exercise_id</td>
                <td className="py-2.5 px-4 font-sans text-xs">Submission code, score, passed/total checks, error category, hints used, time</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-emerald-400 font-bold">student_mastery</td>
                <td className="py-2.5 px-4">(student_id, topic_id)</td>
                <td className="py-2.5 px-4">student_id, topic_id</td>
                <td className="py-2.5 px-4 font-sans text-xs">Aggregated topic score (0-100), category (Needs Support, Developing, Near, Provisional)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-emerald-400 font-bold">recommendations</td>
                <td className="py-2.5 px-4">id</td>
                <td className="py-2.5 px-4">student_id</td>
                <td className="py-2.5 px-4 font-sans text-xs">Rule-based recommendations with explicit justification text (Rule reason)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-emerald-400 font-bold">assessments</td>
                <td className="py-2.5 px-4">id</td>
                <td className="py-2.5 px-4 text-slate-500">None</td>
                <td className="py-2.5 px-4 font-sans text-xs">Pre-test and Post-test specifications (10 items each)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-emerald-400 font-bold">assessment_responses</td>
                <td className="py-2.5 px-4">id</td>
                <td className="py-2.5 px-4">student_id, assessment_id</td>
                <td className="py-2.5 px-4 font-sans text-xs">Student answers, score, percentage, completion timestamp</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-emerald-400 font-bold">sus_surveys</td>
                <td className="py-2.5 px-4">id</td>
                <td className="py-2.5 px-4">student_id</td>
                <td className="py-2.5 px-4 font-sans text-xs">10 Brooke (1996) Likert items, computed SUS score (0-100)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. CODE EXECUTION SANDBOX SECURITY BOUNDARIES */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          4. Isolated Code Execution Sandbox Security Boundaries
        </h2>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Untrusted student Python code is treated as strictly insecure and executed in a dedicated, isolated subprocess worker (<code className="text-emerald-400 font-mono">server/sandbox.py</code>) using POSIX process isolation and resource limits.
          </p>
          <ul className="space-y-2 list-disc pl-5 text-slate-400 text-xs">
            <li><strong className="text-slate-200">Execution Timeout: </strong>A strict 2.0-second timeout halts any potential infinite loops (<code className="font-mono">while True: pass</code>) or runaway recursion with <code className="font-mono text-amber-400">TimeLimitExceeded</code>.</li>
            <li><strong className="text-slate-200">Memory Allocation Limits (RLIMIT_AS): </strong>Virtual memory is capped at 256MB via POSIX rlimits. Runaway list or dictionary allocations trigger an immediate <code className="font-mono text-rose-400">MemoryLimitExceeded</code> without crashing the host application.</li>
            <li><strong className="text-slate-200">Output-Size Limits: </strong>Standard output and error streams are capped at 16KB. Rapid printing inside loops triggers <code className="font-mono text-amber-400">OutputLimitExceeded</code> and safe truncation to prevent buffer overflow.</li>
            <li><strong className="text-slate-200">Environment Sanitization: </strong>Environment variables are scrubbed; no application secrets, database paths, or host tokens are accessible to child processes. The <code className="font-mono">-I</code> flag isolates user site-packages.</li>
            <li><strong className="text-slate-200">AST Syntax Pre-compilation: </strong>Syntax and Indentation errors are identified safely in the parser before execution, preventing arbitrary runtime crashes.</li>
            <li><strong className="text-slate-200">Hidden Test Masking: </strong>Hidden test inputs and expected outputs are evaluated in the sandbox, with only passed/failed outcomes returned to the client.</li>
            <li><strong className="text-slate-200">Production Sandbox Architecture Notice: </strong>For cloud production multi-tenant environments, this process isolation boundary is designed to interface with containerized microVMs (e.g. gVisor, Docker runc with seccomp, or AWS Firecracker microVMs) to enforce kernel syscall isolation.</li>
          </ul>
        </div>
      </section>

      {/* 5. DEFENCE DEMONSTRATION WALKTHROUGH */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-400" />
          5. University Project Defence Walkthrough Guide
        </h2>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 text-xs text-slate-300">
          <p className="text-slate-200 font-semibold">
            Recommended sequence for presentation examiners:
          </p>
          <ol className="space-y-3 list-decimal pl-5 leading-relaxed text-slate-400">
            <li>
              <strong className="text-slate-200">Demonstrate Student Registration & Pre-Test: </strong>Click "Demo Student" in the top bar. Show the active recommendation ("RULE 1: Diagnostic Assessment"). Complete the 10-question pre-test and observe recommendations calibrate.
            </li>
            <li>
              <strong className="text-slate-200">Demonstrate Prerequisite Enforcement: </strong>In the Curriculum Map, show that downstream modules (e.g. Loops, Functions) are locked until earlier modules reach &ge; 70% mastery.
            </li>
            <li>
              <strong className="text-slate-200">Demonstrate Code Assessment Sandbox & Error Diagnosis: </strong>Open Module 2 or Module 7 exercise. Submit an intentional error (e.g. missing parenthesis for SyntaxError, or while loop for TimeLimitExceeded). Show real-time taxonomic diagnosis.
            </li>
            <li>
              <strong className="text-slate-200">Demonstrate Progressive Scaffolding Hints: </strong>Unlock Level 1 (Concept), Level 2 (Target), and Level 3 (Debugging strategy). Show that hint usage is persisted in the student model without punitive bias.
            </li>
            <li>
              <strong className="text-slate-200">Demonstrate Student Model & Mastery Recalculation: </strong>Submit a correct solution. Observe topic mastery score updating and triggering RULE 6 (Provisional Mastery advancement).
            </li>
            <li>
              <strong className="text-slate-200">Demonstrate Lecturer / Research Management: </strong>Switch to "Demo Lecturer" in the top bar. Inspect class error distribution, student mastery roster, edit curriculum content, and download research CSV exports.
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
};
