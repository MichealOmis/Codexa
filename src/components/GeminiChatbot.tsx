import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  Zap,
  Brain,
  Code2,
  ChevronDown
} from 'lucide-react';
import { api } from '../api';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export const GeminiChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [taskType, setTaskType] = useState<'general' | 'fast' | 'complex'>('general');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'msg_init',
      role: 'model',
      content: "Hello! I am your PyTutor AI Coach. Ask me about Python concepts, loop conditions, data types, or error diagnosis. How can I help your learning today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessageItem = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);

    try {
      // Send entire conversation history for true multi-turn context
      const formatted = nextHistory.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.sendChatMessage({
        messages: formatted,
        taskType
      });

      const botMsg: ChatMessageItem = {
        id: `bot_${Date.now()}`,
        role: 'model',
        content: res.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessageItem = {
        id: `err_${Date.now()}`,
        role: 'model',
        content: `Error: ${err.message || 'Unable to communicate with AI service. You can still test code in the sandbox!'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `msg_${Date.now()}`,
        role: 'model',
        content: "Conversation history cleared. Ready for your next Python question!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const getModelBadge = () => {
    switch (taskType) {
      case 'complex':
        return { label: 'gemini-3.1-pro-preview', title: 'Deep Code Reviewer', icon: <Brain className="w-3.5 h-3.5 text-purple-400" /> };
      case 'fast':
        return { label: 'gemini-3.1-flash-lite', title: 'Quick Syntax Helper', icon: <Zap className="w-3.5 h-3.5 text-amber-400" /> };
      default:
        return { label: 'gemini-3.5-flash', title: 'Socratic Tutor', icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> };
    }
  };

  const currentBadge = getModelBadge();

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center space-x-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-2xl shadow-emerald-500/30 border border-emerald-400/30 transition-all hover:scale-105 cursor-pointer"
          >
            <Bot className="w-5 h-5 text-emerald-200" />
            <span>Ask PyTutor AI Coach</span>
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
          </button>
        )}
      </div>

      {/* Slide-out / Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-lg h-[620px] max-h-[88vh] rounded-3xl border border-slate-700 bg-slate-900/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md">
                <Bot className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm text-slate-100">PyTutor AI Coach</h3>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-850 text-slate-300 border border-slate-750">
                    Multi-Turn
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                  {currentBadge.icon}
                  <span>{currentBadge.title} ({currentBadge.label})</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={handleClearHistory}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                title="Reset conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Role / Model Switcher Tabs */}
          <div className="px-3 py-2 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between gap-1 text-[11px]">
            <span className="text-slate-500 font-medium shrink-0">Role Mode:</span>
            <div className="flex space-x-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setTaskType('general')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer truncate ${
                  taskType === 'general'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
                title="General tasks: gemini-3.5-flash"
              >
                Socratic (3.5-flash)
              </button>
              <button
                type="button"
                onClick={() => setTaskType('fast')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer truncate ${
                  taskType === 'fast'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
                title="Fast tasks: gemini-3.1-flash-lite"
              >
                Fast Syntax (3.1-lite)
              </button>
              <button
                type="button"
                onClick={() => setTaskType('complex')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer truncate ${
                  taskType === 'complex'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
                title="Complex tasks: gemini-3.1-pro-preview"
              >
                Deep Review (3.1-pro)
              </button>
            </div>
          </div>

          {/* Scrollable Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs leading-relaxed">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex items-start space-x-2.5 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                    isUser
                      ? 'bg-emerald-600 text-slate-950 font-bold'
                      : 'bg-slate-800 text-emerald-400 border border-slate-700'
                  }`}>
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className={`max-w-[82%] rounded-2xl p-3.5 shadow-sm space-y-1 ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}>
                    <div className="whitespace-pre-wrap font-sans">
                      {m.content}
                    </div>
                    <div className={`text-[10px] ${isUser ? 'text-emerald-200 text-right' : 'text-slate-500'}`}>
                      {m.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-start space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center shrink-0 border border-slate-700">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl rounded-tl-none p-3 text-slate-400 text-xs flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] font-mono text-slate-500 pl-1">Thinking ({currentBadge.label})...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt chips suggestions */}
          <div className="px-3 py-1.5 bg-slate-950/60 border-t border-slate-850 flex items-center space-x-1.5 overflow-x-auto text-[11px]">
            <span className="text-slate-500 text-[10px] shrink-0">Try:</span>
            {[
              "Why does '5' + 2 fail?",
              "print() vs return difference",
              "How to write while loop?"
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(chip)}
                className="px-2 py-0.5 rounded-full bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-750 shrink-0 transition-colors cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-slate-950 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Python concepts, syntax, loops..."
                disabled={loading}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  input.trim() && !loading
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                    : 'bg-slate-850 text-slate-600 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
