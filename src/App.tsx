import React, { useState, useRef, useEffect } from 'react';
import {
  AgentStatus,
  LanguageCode,
  WhatsAppChat,
  EmailMessage,
  PhoneContact,
  AgentChatMessage,
} from './types/agent';
import { FullScreenVisualizer } from './components/FullScreenVisualizer';
import { VoiceController } from './components/VoiceController';
import { WhatsAppHub } from './components/WhatsAppHub';
import { EmailHub } from './components/EmailHub';
import { ContactsHub } from './components/ContactsHub';
import { ProblemSolverHub } from './components/ProblemSolverHub';
import { TopNav, ActiveTab } from './components/TopNav';
import { sendAgentChat, requestAgentTts } from './services/agentApi';
import {
  MessageSquare,
  Mail,
  Users,
  Brain,
  Radio,
  Sparkles,
  Bot,
  Volume2,
  CheckCircle2,
  Terminal,
} from 'lucide-react';

const INITIAL_CHATS: WhatsAppChat[] = [
  {
    id: 'chat_1',
    contactName: 'অনিন্দ্য সেন (Anindya Sen)',
    phone: '+91 98312 45678',
    avatar: 'অনিন্দ্য',
    unreadCount: 1,
    autoReplyEnabled: true,
    language: 'bn',
    statusMessage: 'Project Reviewer · Prefers Bengali communication',
    messages: [
      {
        id: 'm1_1',
        sender: 'contact',
        text: 'শুভ সকাল! কালকের প্রজেক্ট রিভিউ মিটিংটা কি সকাল ১১টায় কনফার্ম? ড্রাফট ফাইলটা একটু দেখে নেবেন।',
        time: '10:45 AM',
        language: 'bn',
      },
    ],
  },
  {
    id: 'chat_2',
    contactName: 'राहुल शर्मा (Rahul Sharma)',
    phone: '+91 98100 23456',
    avatar: 'राहुल',
    unreadCount: 1,
    autoReplyEnabled: true,
    language: 'hi',
    statusMessage: 'Client Manager · Prefers Hindi or English',
    messages: [
      {
        id: 'm2_1',
        sender: 'contact',
        text: 'नमस्ते मनीषंकर जी! क्या कल की क्लाइंट प्रेजेंटेशन की तैयारी हो गई है? एक बार अपडेट दे दें।',
        time: '10:12 AM',
        language: 'hi',
      },
    ],
  },
  {
    id: 'chat_3',
    contactName: 'David Miller',
    phone: '+1 415 555 0192',
    avatar: 'DM',
    unreadCount: 0,
    autoReplyEnabled: true,
    language: 'en',
    statusMessage: 'Cloud Architect Lead',
    messages: [
      {
        id: 'm3_1',
        sender: 'contact',
        text: 'Hey! The cloud deployment passed the security audit. Can we schedule a quick sync today?',
        time: 'Yesterday',
        language: 'en',
      },
      {
        id: 'm3_2',
        sender: 'agent',
        text: 'Hi David! Yes, looking good. I have put a 15-minute slot on the calendar for 3 PM.',
        time: 'Yesterday',
        language: 'en',
        isAiGenerated: true,
      },
    ],
  },
  {
    id: 'chat_4',
    contactName: 'প্রিয়া চক্রবর্তী (Priya)',
    phone: '+91 98305 67890',
    avatar: 'প্রিয়া',
    unreadCount: 1,
    autoReplyEnabled: true,
    language: 'bn',
    statusMessage: 'Marketing Lead',
    messages: [
      {
        id: 'm4_1',
        sender: 'contact',
        text: 'দাদা, আজকের প্রেস রিলিজের কপিটি হোয়াটসঅ্যাপে একটু পাঠিয়ে দেবেন দয়া করে?',
        time: '09:30 AM',
        language: 'bn',
      },
    ],
  },
];

const INITIAL_EMAILS: EmailMessage[] = [
  {
    id: 'em_1',
    sender: 'Cloud Security Operations',
    senderEmail: 'security-alerts@cloudplatform.com',
    subject: 'Action Required: Production SSL Certificate Renewal within 7 Days',
    body: 'Hello Administrator,\n\nThe SSL TLS certificate for your main web services domain is scheduled to expire in 7 days. Please verify the automated renewal pipeline or manually upload the updated certificate chain.',
    category: 'Urgent',
    priorityScore: 9,
    date: '10:15 AM',
    isRead: false,
    isStarred: true,
    aiSummary: 'Critical security notification: SSL certificate will expire in 7 days. Renewal verification required.',
  },
  {
    id: 'em_2',
    sender: 'Sarah Jenkins (Tech Ventures)',
    senderEmail: 'sarah.j@techventures.io',
    subject: 'AI Agent Collaboration & Bengali Language Integration Proposal',
    body: 'Hi Manishankar,\n\nWe were impressed by your autonomous multilingual AI agent demonstration. We would like to schedule a partnership call this week to discuss integrating your agent into our customer operations.',
    category: 'Work',
    priorityScore: 8,
    date: '09:40 AM',
    isRead: false,
    isStarred: true,
  },
  {
    id: 'em_3',
    sender: 'Global AI Summit 2026',
    senderEmail: 'keynote@aisummit.org',
    subject: 'Speaker Confirmation: Autonomous Multilingual Agents',
    body: 'Dear Manishankar,\n\nWe are pleased to invite you to present your keynote session on "Autonomous Voice-Reactive Agents with Multilingual Mastery" at the upcoming summit.',
    category: 'Personal',
    priorityScore: 6,
    date: 'Yesterday',
    isRead: true,
    isStarred: false,
  },
];

const INITIAL_CONTACTS: PhoneContact[] = [
  {
    id: 'c_1',
    name: 'অনিন্দ্য সেন (Anindya Sen)',
    phone: '+91 98312 45678',
    email: 'anindya.sen@corp.in',
    relationship: 'Project Director',
    preferredLanguage: 'bn',
    notes: 'মিটিং সংক্রান্ত সকল বার্তা বাংলায় পাঠাতে পছন্দ করেন।',
    lastContacted: 'Today',
    avatarColor: 'from-cyan-500 to-blue-600',
    starred: true,
  },
  {
    id: 'c_2',
    name: 'राहुल शर्मा (Rahul Sharma)',
    phone: '+91 98100 23456',
    email: 'rahul.sharma@techfirm.in',
    relationship: 'Enterprise Client Lead',
    preferredLanguage: 'hi',
    notes: 'व्हाट्सएप पर तत्काल रिप्लाई की उम्मीद रखते हैं।',
    lastContacted: 'Today',
    avatarColor: 'from-purple-500 to-indigo-600',
    starred: true,
  },
  {
    id: 'c_3',
    name: 'David Miller',
    phone: '+1 415 555 0192',
    email: 'david.miller@cloudops.net',
    relationship: 'Lead Cloud Architect',
    preferredLanguage: 'en',
    notes: 'Handles infrastructure, API pipelines, and deployments.',
    lastContacted: 'Yesterday',
    avatarColor: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'c_4',
    name: 'প্রিয়া চক্রবর্তী (Priya)',
    phone: '+91 98305 67890',
    email: 'priya.c@agency.in',
    relationship: 'Marketing Director',
    preferredLanguage: 'bn',
    notes: 'প্রেস রিলিজ ও কনটেন্ট স্ট্র্যাটেজি পার্টনার।',
    lastContacted: 'Today',
    avatarColor: 'from-rose-500 to-pink-600',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('visualizer');
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('bn');
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  const [recentActionLog, setRecentActionLog] = useState<string>(
    'AURA Agent online · WhatsApp auto-responder active · Email triage armed'
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Core Data
  const [chats, setChats] = useState<WhatsAppChat[]>(INITIAL_CHATS);
  const [emails, setEmails] = useState<EmailMessage[]>(INITIAL_EMAILS);
  const [contacts, setContacts] = useState<PhoneContact[]>(INITIAL_CONTACTS);
  const [chatLog, setChatLog] = useState<AgentChatMessage[]>([
    {
      id: 'init_msg',
      role: 'agent',
      text: 'নমস্কার! আমি MS Agent, আপনার সার্বক্ষণিক পার্সোনাল AI Agent। আমি আপনার হোয়াটসঅ্যাপ অ্যাকাউন্টের সাথে সরাসরি যুক্ত হয়ে প্রতিটি মেসেজের স্বয়ংক্রিয় উত্তর দিতে পারি (বাংলা, ইংরেজি ও হিন্দিতে), ইমেইল পরিচালনা করতে পারি, এবং যেকোনো জটিল সমস্যার সমাধান করতে পারি। আমাকে মুখে ভয়েস দিন অথবা লিখে নির্দেশ দিন!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: 'bn',
    },
  ]);

  // Audio Analyser for reactive visualizer
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [audioActive, setAudioActive] = useState(false);

  const unreadWhatsApp = chats.filter((c) => c.unreadCount > 0);
  const unreadEmails = emails.filter((e) => !e.isRead);

  const handleAudioStart = (analyser: AnalyserNode) => {
    setAnalyserNode(analyser);
    setAudioActive(true);
  };

  const handleAudioEnd = () => {
    setAudioActive(false);
  };

  // Main instruction dispatcher (Voice or Typed instruction)
  const handleProcessInstruction = async (
    instruction: string,
    isVoice: boolean
  ): Promise<string> => {
    const userMsg: AgentChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      text: instruction,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatLog((prev) => [...prev, userMsg]);

    try {
      const historyPayload = chatLog.slice(-5).map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const res = await sendAgentChat({
        message: instruction,
        history: historyPayload,
        contacts,
        unreadWhatsApp,
        unreadEmails,
        currentLanguage: selectedLanguage,
        voiceMode: isVoice,
      });

      const replyText = res.reply || 'নির্দেশ কার্যকর করা হয়েছে।';

      const agentMsg: AgentChatMessage = {
        id: 'agt_' + Date.now(),
        role: 'agent',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: res.languageDetected,
        actions: res.actions,
        reasoningSteps: res.reasoningSteps,
      };

      setChatLog((prev) => [...prev, agentMsg]);

      // Execute any autonomous actions returned by AI
      if (res.actions && Array.isArray(res.actions)) {
        for (const action of res.actions) {
          executeAiAction(action);
        }
      }

      return replyText;
    } catch (err: any) {
      console.error('Agent chat error:', err);
      const fallbackMsg =
        selectedLanguage === 'bn'
          ? 'দুঃখিত, সংযোগে সামান্য সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
          : selectedLanguage === 'hi'
          ? 'क्षमा करें, कनेक्शन में त्रुटि हुई। कृपया पुनः प्रयास करें।'
          : 'Sorry, there was a temporary connection error. Please try again.';

      setChatLog((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'agent',
          text: fallbackMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return fallbackMsg;
    }
  };

  const executeAiAction = (action: {
    type: string;
    target: string;
    content: string;
    subject?: string;
  }) => {
    if (action.type === 'whatsapp_reply' || action.type === 'whatsapp_send') {
      // Find matching chat or contact
      const chat = chats.find(
        (c) =>
          c.contactName.toLowerCase().includes(action.target.toLowerCase()) ||
          c.phone.includes(action.target)
      );

      if (chat) {
        const newMsg = {
          id: 'act_' + Date.now(),
          sender: 'agent' as const,
          text: action.content,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          language: chat.language,
          isAiGenerated: true,
        };

        setChats((prev) =>
          prev.map((c) =>
            c.id === chat.id
              ? {
                  ...c,
                  unreadCount: 0,
                  messages: [...c.messages, newMsg],
                }
              : c
          )
        );

        setRecentActionLog(
          `Autonomous WhatsApp reply dispatched to ${chat.contactName}: "${action.content.slice(0, 40)}..."`
        );
      }
    } else if (action.type === 'email_send' || action.type === 'email_reply') {
      const newMail: EmailMessage = {
        id: 'em_ai_' + Date.now(),
        sender: 'AURA Agent (for Owner)',
        senderEmail: 'manishankarmandal001@gmail.com',
        subject: action.subject || 'Follow-up regarding your message',
        body: action.content,
        category: 'Work',
        priorityScore: 7,
        date: 'Just now',
        isRead: true,
        isStarred: false,
      };

      setEmails((prev) => [newMail, ...prev]);
      setRecentActionLog(`Autonomous Email dispatched to ${action.target}`);
    } else if (action.type === 'contact_add') {
      const newC: PhoneContact = {
        id: 'c_' + Date.now(),
        name: action.target,
        phone: '+91 ' + Math.floor(9000000000 + Math.random() * 999999999),
        email: `${action.target.toLowerCase().replace(/\s+/g, '')}@example.com`,
        relationship: 'Associate',
        preferredLanguage: selectedLanguage === 'auto' ? 'bn' : selectedLanguage,
        notes: action.content,
        lastContacted: 'Today',
        avatarColor: 'from-cyan-500 to-blue-600',
      };
      setContacts((prev) => [newC, ...prev]);
      setRecentActionLog(`Autonomous Contact saved: ${newC.name}`);
    }
  };

  const appAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleSpeakText = async (text: string) => {
    // Teardown previous speech to prevent overlapping
    if (appAudioRef.current) {
      try {
        appAudioRef.current.pause();
        appAudioRef.current.src = '';
        appAudioRef.current.onended = null;
      } catch {}
      appAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    try {
      setAgentStatus('speaking');
      setCurrentSpeechText(text);
      const audioUrl = await requestAgentTts(text, 'Kore');
      const audio = new Audio(audioUrl);
      appAudioRef.current = audio;

      audio.onended = () => {
        setAgentStatus('idle');
        setCurrentSpeechText('');
        handleAudioEnd();
      };
      await audio.play();
    } catch {
      setAgentStatus('idle');
      setCurrentSpeechText('');
      handleAudioEnd();
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top HUD Navigation */}
      <TopNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        status={agentStatus}
        selectedLanguage={selectedLanguage}
        onChangeLanguage={setSelectedLanguage}
        unreadWhatsAppCount={unreadWhatsApp.length}
        unreadEmailCount={unreadEmails.length}
        recentActionLog={recentActionLog}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* TAB 1: Visualizer & Live Voice Interaction Center */}
        {activeTab === 'visualizer' && (
          <div className="flex flex-col gap-6">
            {/* Visualizer Hero Section */}
            <div
              className={`w-full transition-all duration-300 ${
                isFullscreen
                  ? 'fixed inset-0 z-50 p-6 bg-black flex flex-col'
                  : 'h-[440px] md:h-[500px]'
              }`}
            >
              <FullScreenVisualizer
                status={agentStatus}
                analyserNode={analyserNode}
                audioActive={audioActive}
                userSpeaking={agentStatus === 'listening'}
                agentName="MS Agent"
                currentSpeechText={currentSpeechText}
                language={selectedLanguage}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              />
            </div>

            {/* Voice & Text Command Center */}
            <VoiceController
              status={agentStatus}
              setStatus={setAgentStatus}
              onSendInstruction={handleProcessInstruction}
              onAudioStart={handleAudioStart}
              onAudioEnd={handleAudioEnd}
              selectedLanguage={selectedLanguage}
              onChangeLanguage={setSelectedLanguage}
              onSpeechTextUpdate={setCurrentSpeechText}
            />

            {/* Live Agent Conversation Feed & Reasoning Breakdown */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white font-mono">
                    Live Agent Dialogue & Autonomous Actions
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {chatLog.length} Interactions Recorded
                </span>
              </div>

              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {chatLog.map((item) => {
                  const isAgent = item.role === 'agent';

                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 shadow-md ${
                          isAgent
                            ? 'bg-slate-950/80 border border-slate-800 text-slate-100 rounded-tl-sm'
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-white/10 text-[11px] font-mono opacity-80">
                          <span className="font-semibold flex items-center gap-1.5">
                            {isAgent ? (
                              <>
                                <Bot className="w-3.5 h-3.5 text-cyan-400" /> AURA Agent
                              </>
                            ) : (
                              'You (Voice/Command)'
                            )}
                          </span>
                          <span>{item.timestamp}</span>
                        </div>

                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.text}</p>

                        {/* Reasoning steps if available */}
                        {item.reasoningSteps && item.reasoningSteps.length > 0 && (
                          <div className="mt-3 p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
                            <span className="font-mono text-[10px] text-purple-400 block mb-1">
                              Reasoning Engine:
                            </span>
                            <ul className="list-disc list-inside space-y-0.5">
                              {item.reasoningSteps.map((step, idx) => (
                                <li key={idx}>{step}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Autonomous actions executed */}
                        {item.actions && item.actions.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1.5">
                            {item.actions.map((act, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-500/30"
                              >
                                <CheckCircle2 className="w-3 h-3 shrink-0" />
                                <span>
                                  Action: <strong>{act.type}</strong> on "{act.target}"
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WhatsApp Manager Hub */}
        {activeTab === 'whatsapp' && (
          <WhatsAppHub
            chats={chats}
            onUpdateChats={setChats}
            onAgentActionLog={setRecentActionLog}
          />
        )}

        {/* TAB 3: Email Manager Hub */}
        {activeTab === 'email' && (
          <EmailHub
            emails={emails}
            onUpdateEmails={setEmails}
            onAgentActionLog={setRecentActionLog}
          />
        )}

        {/* TAB 4: Phone Contacts Hub */}
        {activeTab === 'contacts' && (
          <ContactsHub
            contacts={contacts}
            onUpdateContacts={setContacts}
            onOpenWhatsAppWithContact={(contact) => {
              setActiveTab('whatsapp');
              // Ensure chat exists
              let existing = chats.find((c) => c.phone === contact.phone);
              if (!existing) {
                const newC: WhatsAppChat = {
                  id: 'chat_' + Date.now(),
                  contactName: contact.name,
                  phone: contact.phone,
                  avatar: contact.name.slice(0, 2),
                  unreadCount: 0,
                  autoReplyEnabled: true,
                  language: contact.preferredLanguage,
                  messages: [
                    {
                      id: 'm_' + Date.now(),
                      sender: 'owner',
                      text: `Hi ${contact.name}! Let's connect on WhatsApp.`,
                      time: 'Just now',
                      language: contact.preferredLanguage,
                    },
                  ],
                };
                setChats([newC, ...chats]);
              }
            }}
            onOpenEmailWithContact={(contact) => {
              setActiveTab('email');
            }}
            onAgentActionLog={setRecentActionLog}
          />
        )}

        {/* TAB 5: Advanced Problem Solver */}
        {activeTab === 'solver' && (
          <ProblemSolverHub
            onSpeakSolution={handleSpeakText}
            onAgentActionLog={setRecentActionLog}
          />
        )}
      </main>
    </div>
  );
}
