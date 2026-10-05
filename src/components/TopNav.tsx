import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Mail,
  Users,
  Brain,
  Radio,
  Sparkles,
  Bot,
  Activity,
  Globe,
  Maximize2,
  KeyRound,
  Check,
  ExternalLink,
} from 'lucide-react';
import { AgentStatus, LanguageCode } from '../types/agent';

export type ActiveTab = 'visualizer' | 'whatsapp' | 'email' | 'contacts' | 'solver';

interface TopNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  status: AgentStatus;
  selectedLanguage: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  unreadWhatsAppCount: number;
  unreadEmailCount: number;
  recentActionLog?: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  status,
  selectedLanguage,
  onChangeLanguage,
  unreadWhatsAppCount,
  unreadEmailCount,
  recentActionLog,
}) => {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const existing = localStorage.getItem('ms_agent_gemini_key');
      if (existing) setApiKeyInput(existing);
    }
  }, []);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      if (apiKeyInput.trim()) {
        localStorage.setItem('ms_agent_gemini_key', apiKeyInput.trim());
      } else {
        localStorage.removeItem('ms_agent_gemini_key');
      }
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setShowKeyModal(false);
      }, 1200);
    }
  };

  return (
    <header className="w-full bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & AI Status Badge */}
        <div className="flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-white font-mono">
                  MS Agent <span className="text-cyan-400 font-sans font-normal">AI Personal Manager</span>
                </h1>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                WhatsApp Linked · Multilingual Autonomous Assistant
              </p>
            </div>
          </div>

          {/* Mobile language badge & Key button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setShowKeyModal(true)}
              className="p-1 rounded bg-slate-800 text-cyan-400 text-xs flex items-center gap-1 cursor-pointer"
              title="Configure API Key"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-400">
              <Globe className="w-3.5 h-3.5" />
              <span>{selectedLanguage.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => onSelectTab('visualizer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'visualizer'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Voice & Visualizer</span>
          </button>

          <button
            onClick={() => onSelectTab('whatsapp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer relative ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
            {unreadWhatsAppCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-cyan-400 text-slate-950 font-bold text-[9px] flex items-center justify-center">
                {unreadWhatsAppCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('email')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer relative ${
              activeTab === 'email'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Emails</span>
            {unreadEmailCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-cyan-400 text-slate-950 font-bold text-[9px] flex items-center justify-center">
                {unreadEmailCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('contacts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'contacts'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Contacts</span>
          </button>

          <button
            onClick={() => onSelectTab('solver')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'solver'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Problem Solver</span>
          </button>
        </nav>

        {/* Global Agent Language Selector & API Key Settings */}
        <div className="hidden md:flex items-center gap-2">
          {/* Vercel / Gemini Key Button */}
          <button
            onClick={() => setShowKeyModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-cyan-400 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Configure Gemini API Key / Vercel Settings"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>API Key</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => onChangeLanguage('bn')}
              className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                selectedLanguage === 'bn' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              বাংলা
            </button>
            <button
              onClick={() => onChangeLanguage('en')}
              className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                selectedLanguage === 'en' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onChangeLanguage('hi')}
              className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                selectedLanguage === 'hi' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>
      </div>

      {/* Autonomous Action Activity Ticker Banner */}
      {recentActionLog && (
        <div className="bg-cyan-950/30 border-t border-cyan-500/20 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-cyan-300">
          <div className="flex items-center gap-2 truncate">
            <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
            <span className="text-slate-400 uppercase">Agent Activity:</span>
            <span className="truncate">{recentActionLog}</span>
          </div>
          <span className="text-[10px] text-slate-500 shrink-0">Real-time Autonomous Event</span>
        </div>
      )}

      {/* API Key & Vercel Settings Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Gemini API Key / Vercel Configuration</h4>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 space-y-1.5 leading-relaxed">
                <p className="font-semibold text-cyan-300">Vercel-এ স্থাপনের নিয়ম (Deployment Guide):</p>
                <p>
                  1. Vercel ড্যাশবোর্ডে গিয়ে আপনার প্রজেক্টের <strong>Settings &gt; Environment Variables</strong>-এ যান।
                </p>
                <p>
                  2. Name হিসেবে দিন: <code className="text-emerald-400 font-mono">GEMINI_API_KEY</code>
                </p>
                <p>
                  3. অথবা আপনি নিচে সরাসরি আপনার API Key টি পেস্ট করে ব্রাউজারে সেভ করতে পারেন:
                </p>
              </div>

              <form onSubmit={handleSaveKey} className="space-y-3">
                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">
                    Enter Gemini API Key (starts with AIzaSy...):
                  </label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    Get Free Gemini API Key <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {savedSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" /> Saved!
                      </>
                    ) : (
                      'Save Key'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
