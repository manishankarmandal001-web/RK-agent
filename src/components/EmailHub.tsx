import React, { useState } from 'react';
import { EmailMessage } from '../types/agent';
import { triageEmailMessage } from '../services/agentApi';
import {
  Mail,
  Send,
  Sparkles,
  Star,
  Clock,
  AlertCircle,
  Inbox,
  CheckCircle2,
  FileEdit,
  Trash2,
} from 'lucide-react';

interface EmailHubProps {
  emails: EmailMessage[];
  onUpdateEmails: (emails: EmailMessage[]) => void;
  onAgentActionLog?: (log: string) => void;
}

export const EmailHub: React.FC<EmailHubProps> = ({
  emails,
  onUpdateEmails,
  onAgentActionLog,
}) => {
  const [selectedEmailId, setSelectedEmailId] = useState<string>(emails[0]?.id || '');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isTriaging, setIsTriaging] = useState(false);
  const [draftReplyBody, setDraftReplyBody] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [newEmailTo, setNewEmailTo] = useState('');
  const [newEmailSubject, setNewEmailSubject] = useState('');
  const [newEmailBody, setNewEmailBody] = useState('');

  const activeEmail = emails.find((e) => e.id === selectedEmailId) || emails[0];

  const filteredEmails = emails.filter((e) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'starred') return e.isStarred;
    if (filterCategory === 'unread') return !e.isRead;
    return e.category.toLowerCase() === filterCategory.toLowerCase();
  });

  const handleSelectEmail = (email: EmailMessage) => {
    setSelectedEmailId(email.id);
    if (!email.isRead) {
      const updated = emails.map((e) => (e.id === email.id ? { ...e, isRead: true } : e));
      onUpdateEmails(updated);
    }
    setDraftReplyBody(email.draftReply?.body || '');
  };

  const handleToggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = emails.map((item) =>
      item.id === id ? { ...item, isStarred: !item.isStarred } : item
    );
    onUpdateEmails(updated);
  };

  const handleAiTriage = async () => {
    if (!activeEmail) return;
    setIsTriaging(true);
    try {
      const result = await triageEmailMessage({
        sender: activeEmail.sender,
        subject: activeEmail.subject,
        body: activeEmail.body,
      });

      const updated = emails.map((e) => {
        if (e.id === activeEmail.id) {
          return {
            ...e,
            category: (result.category as any) || e.category,
            priorityScore: result.priorityScore || e.priorityScore,
            aiSummary: result.summary || e.aiSummary,
            draftReply: result.suggestedDraft || e.draftReply,
          };
        }
        return e;
      });

      onUpdateEmails(updated);
      if (result.suggestedDraft?.body) {
        setDraftReplyBody(result.suggestedDraft.body);
      }
      onAgentActionLog?.(`Triaged email from ${activeEmail.sender} (Priority: ${result.priorityScore}/10)`);
    } catch (err) {
      console.error('Email triage failed:', err);
    } finally {
      setIsTriaging(false);
    }
  };

  const handleSendEmailReply = () => {
    if (!draftReplyBody.trim() || !activeEmail) return;

    const replyItem = {
      id: 'rep_' + Date.now(),
      sender: 'You (via AURA Agent)',
      body: draftReplyBody.trim(),
      date: 'Just now',
      isAiGenerated: true,
    };

    const updated = emails.map((e) => {
      if (e.id === activeEmail.id) {
        return {
          ...e,
          replies: [...(e.replies || []), replyItem],
        };
      }
      return e;
    });

    onUpdateEmails(updated);
    setDraftReplyBody('');
    onAgentActionLog?.(`Sent email reply to ${activeEmail.senderEmail}`);
  };

  const handleSendNewEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailTo.trim() || !newEmailSubject.trim()) return;

    const newMail: EmailMessage = {
      id: 'em_' + Date.now(),
      sender: 'Me',
      senderEmail: 'manishankarmandal001@gmail.com',
      subject: newEmailSubject,
      body: newEmailBody,
      category: 'Work',
      priorityScore: 7,
      date: 'Just now',
      isRead: true,
      isStarred: false,
    };

    onUpdateEmails([newMail, ...emails]);
    setShowCompose(false);
    setNewEmailTo('');
    setNewEmailSubject('');
    setNewEmailBody('');
    onAgentActionLog?.(`Composed & Sent email to ${newEmailTo}`);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[620px]">
      {/* Email Inbox List */}
      <div className="w-full md:w-80 border-r border-slate-800 flex flex-col bg-slate-950/60">
        {/* Header with Compose Button */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Email Inbox</h3>
                <p className="text-[11px] text-slate-400 font-mono">AI Triage & Responder</p>
              </div>
            </div>

            <button
              onClick={() => setShowCompose(!showCompose)}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Compose</span>
            </button>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            {['all', 'urgent', 'work', 'starred', 'unread'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-medium capitalize whitespace-nowrap transition-colors cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Email Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
          {filteredEmails.length === 0 ? (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <Mail className="w-8 h-8 text-slate-600" />
              <p className="text-xs">No emails in inbox.</p>
              <button
                onClick={() => setShowCompose(true)}
                className="mt-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer"
              >
                Compose Email
              </button>
            </div>
          ) : (
            filteredEmails.map((email) => {
              const isSelected = email.id === activeEmail?.id;

              return (
                <button
                  key={email.id}
                  onClick={() => handleSelectEmail(email)}
                  className={`w-full p-3 flex items-start gap-2.5 text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-950/40 border-l-2 border-blue-400' : 'hover:bg-slate-900/60'
                  } ${!email.isRead ? 'bg-slate-900/40 font-semibold' : ''}`}
                >
                  <button
                    type="button"
                    onClick={(e) => handleToggleStar(e, email.id)}
                    className="mt-0.5 text-slate-500 hover:text-amber-400 transition-colors"
                  >
                    <Star className={`w-3.5 h-3.5 ${email.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-slate-200 truncate">{email.sender}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{email.date}</span>
                    </div>

                    <h5 className="text-xs text-slate-100 truncate mb-1">{email.subject}</h5>

                    <p className="text-[11px] text-slate-400 line-clamp-1 font-normal">{email.body}</p>

                    <div className="flex items-center gap-2 mt-2 text-[10px]">
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono font-medium ${
                          email.category === 'Urgent'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                            : email.category === 'Work'
                            ? 'bg-blue-950/80 text-blue-300 border border-blue-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {email.category}
                      </span>

                      <span className="text-slate-400 font-mono">
                        Priority: <strong className="text-amber-400">{email.priorityScore}/10</strong>
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Email Reading & AI Responding Panel */}
      <div className="flex-1 flex flex-col bg-slate-900/90 overflow-y-auto">
        {showCompose ? (
          <form onSubmit={handleSendNewEmail} className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-base font-semibold text-white">Compose New Email</h4>
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">To Email:</label>
              <input
                type="email"
                required
                value={newEmailTo}
                onChange={(e) => setNewEmailTo(e.target.value)}
                placeholder="client@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Subject:</label>
              <input
                type="text"
                required
                value={newEmailSubject}
                onChange={(e) => setNewEmailSubject(e.target.value)}
                placeholder="Project update / Discussion"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Email Body:</label>
              <textarea
                rows={6}
                required
                value={newEmailBody}
                onChange={(e) => setNewEmailBody(e.target.value)}
                placeholder="Write message in English, Bengali, or Hindi..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium flex items-center gap-2"
              >
                <Send className="w-4 h-4" /> Send Email
              </button>
            </div>
          </form>
        ) : activeEmail ? (
          <div className="p-6 flex flex-col gap-5">
            {/* Header info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{activeEmail.subject}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">{activeEmail.sender}</span>
                  <span>&lt;{activeEmail.senderEmail}&gt;</span>
                  <span>·</span>
                  <span>{activeEmail.date}</span>
                </div>
              </div>

              {/* Triage action button */}
              <button
                onClick={handleAiTriage}
                disabled={isTriaging}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-medium flex items-center gap-2 shadow-lg transition-all cursor-pointer self-start md:self-auto"
              >
                <Sparkles className="w-4 h-4" />
                {isTriaging ? 'AI Analyzing & Drafting...' : 'AI Auto-Triage & Draft Reply'}
              </button>
            </div>

            {/* AI Summary Banner (if triaged) */}
            {activeEmail.aiSummary && (
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs">
                <div className="flex items-center gap-2 text-blue-400 font-mono font-semibold mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AURA Executive Summary & Priority Analysis</span>
                </div>
                <p className="text-slate-200 leading-relaxed">{activeEmail.aiSummary}</p>
              </div>
            )}

            {/* Email Body */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {activeEmail.body}
            </div>

            {/* Previous Replies in thread */}
            {activeEmail.replies && activeEmail.replies.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-xs font-mono uppercase text-slate-400">Conversation Thread:</h5>
                {activeEmail.replies.map((rep) => (
                  <div key={rep.id} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-200">
                    <div className="flex items-center justify-between mb-1 text-slate-400">
                      <span className="font-semibold text-cyan-300">{rep.sender}</span>
                      <span>{rep.date}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{rep.body}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Smart Response Box */}
            <div className="mt-2 p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Reply via AI Agent</span>
                </span>
                {activeEmail.draftReply && (
                  <button
                    onClick={() => setDraftReplyBody(activeEmail.draftReply?.body || '')}
                    className="text-[11px] text-blue-400 hover:text-blue-300 underline"
                  >
                    Insert AI Drafted Response
                  </button>
                )}
              </div>

              <textarea
                rows={4}
                value={draftReplyBody}
                onChange={(e) => setDraftReplyBody(e.target.value)}
                placeholder="Write your email reply, or click 'AI Auto-Triage & Draft Reply' above..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleSendEmailReply}
                  disabled={!draftReplyBody.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Send Reply
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400">
            <p>Select an email from the inbox to read and triage.</p>
          </div>
        )}
      </div>
    </div>
  );
};
