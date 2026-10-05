import React from 'react';
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

          {/* Mobile language badge */}
          <div className="md:hidden flex items-center gap-1 text-[11px] font-mono text-cyan-400">
            <Globe className="w-3.5 h-3.5" />
            <span>{selectedLanguage.toUpperCase()}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => onSelectTab('visualizer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'visualizer'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
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
              <span className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-bold flex items-center justify-center">
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
            <span>Email</span>
            {unreadEmailCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-400 text-slate-950 text-[10px] font-bold flex items-center justify-center">
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

        {/* Global Agent Language Selector */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => onChangeLanguage('bn')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                selectedLanguage === 'bn' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              বাংলা
            </button>
            <button
              onClick={() => onChangeLanguage('en')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                selectedLanguage === 'en' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onChangeLanguage('hi')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
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
    </header>
  );
};
