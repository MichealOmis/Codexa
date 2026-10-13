import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Copy, Check, Terminal } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  onReset?: () => void;
  starterCode?: string;
  readOnly?: boolean;
  minHeight?: string;
  placeholder?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  onReset,
  starterCode,
  readOnly = false,
  minHeight = '320px',
  placeholder = '# Write your Python code here...'
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);

  // Split lines for line numbers
  const lines = value.split('\n');
  const lineCount = Math.max(lines.length, 1);

  // Handle Tab key (indent 4 spaces) and Enter (preserve indentation)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    const target = e.currentTarget;
    const { selectionStart, selectionEnd } = target;

    if (e.key === 'Tab') {
      e.preventDefault();
      const spaces = '    ';
      const newValue = value.substring(0, selectionStart) + spaces + value.substring(selectionEnd);
      onChange(newValue);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = selectionStart + 4;
          textareaRef.current.selectionEnd = selectionStart + 4;
        }
      }, 0);
    } else if (e.key === 'Enter') {
      // Auto-indent: check indent of previous line
      const currentLine = value.substring(0, selectionStart).split('\n').pop() || '';
      const matchIndent = currentLine.match(/^\s*/);
      const indent = matchIndent ? matchIndent[0] : '';
      const extraIndent = currentLine.trim().endsWith(':') ? '    ' : '';

      if (indent || extraIndent) {
        e.preventDefault();
        const insert = '\n' + indent + extraIndent;
        const newValue = value.substring(0, selectionStart) + insert + value.substring(selectionEnd);
        onChange(newValue);

        setTimeout(() => {
          if (textareaRef.current) {
            const nextPos = selectionStart + insert.length;
            textareaRef.current.selectionStart = nextPos;
            textareaRef.current.selectionEnd = nextPos;
          }
        }, 0);
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl font-mono text-sm">
      {/* Editor top toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="flex items-center text-slate-300 font-semibold tracking-wide">
            <Terminal className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            solution.py
          </span>
          <span className="text-slate-500 text-[11px] font-sans">Python 3.10 Sandbox</span>
        </div>

        <div className="flex items-center space-x-1.5">
          {starterCode && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer text-[11px]"
              title="Reset code to original starter template"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset Code
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer text-[11px]"
            title="Copy Python code"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 mr-1 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="flex relative bg-slate-900/90" style={{ minHeight }}>
        {/* Line Numbers Column */}
        <div
          className="select-none py-3 px-3 text-right text-slate-600 bg-slate-950/60 border-r border-slate-800/60 font-mono text-xs w-12 shrink-0 leading-6"
          aria-hidden="true"
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i + 1}>{i + 1}</div>
          ))}
        </div>

        {/* Textarea Input */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            placeholder={placeholder}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="w-full h-full min-h-[inherit] py-3 px-4 bg-transparent text-emerald-100/90 font-mono text-xs md:text-sm leading-6 resize-none focus:outline-none selection:bg-emerald-500/30 selection:text-emerald-200"
            style={{ tabSize: 4 }}
          />
        </div>
      </div>

      {/* Editor Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-t border-slate-800/60 text-[11px] text-slate-500">
        <div>
          <span>Lines: {lineCount}</span>
          <span className="mx-2">•</span>
          <span>Characters: {value.length}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>UTF-8</span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-400 font-medium">Ready</span>
        </div>
      </div>
    </div>
  );
};
