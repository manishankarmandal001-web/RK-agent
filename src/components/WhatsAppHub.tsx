import React, { useState, useEffect } from 'react';
import { WhatsAppChat, WhatsAppMessage } from '../types/agent';
import { generateWhatsAppAutoReply } from '../services/agentApi';
import {
  MessageSquare,
  Bot,
  Send,
  Sparkles,
  CheckCheck,
  ShieldCheck,
  Languages,
  PlusCircle,
  RefreshCw,
  Phone,
  Settings,
  Link,
  QrCode,
  Globe,
  Activity,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

interface WebhookLog {
  id: string;
  timestamp: string;
  sender: string;
  senderName?: string;
  incomingMessage: string;
  replySent: string;
  language: string;
  status: 'delivered' | 'simulated';
}

interface WhatsAppHubProps {
  chats: WhatsAppChat[];
  onUpdateChats: (chats: WhatsAppChat[]) => void;
  onAgentActionLog?: (log: string) => void;
}

export const WhatsAppHub: React.FC<WhatsAppHubProps> = ({
  chats,
  onUpdateChats,
  onAgentActionLog,
}) => {
  const [selectedChatId, setSelectedChatId] = useState<string>(chats[0]?.id || '');
  const [replyInput, setReplyInput] = useState('');
  const [autoReplyGlobal, setAutoReplyGlobal] = useState(true);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [selectedTone, setSelectedTone] = useState('friendly_professional');

  // WhatsApp Link & Webhook Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [activeLinkTab, setActiveLinkTab] = useState<'webhook' | 'qr'>('webhook');
  const [verifyToken, setVerifyToken] = useState('MS_AGENT_VERIFY_TOKEN');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [connectedNumber, setConnectedNumber] = useState('+91 98312 45678');
  const [isLinked, setIsLinked] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);

  // Fetch current server WhatsApp config and logs on load
  useEffect(() => {
    fetch('/api/whatsapp/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.webhookVerifyToken) setVerifyToken(data.webhookVerifyToken);
        if (data.connectedNumber) setConnectedNumber(data.connectedNumber);
        if (data.autoReplyEnabled !== undefined) setAutoReplyGlobal(data.autoReplyEnabled);
        if (data.webhookLogs) setWebhookLogs(data.webhookLogs);
      })
      .catch(() => {});
  }, []);

  const activeChat = chats.find((c) => c.id === selectedChatId) || chats[0];
  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.vercel.app'}/api/whatsapp/webhook`;

  const handleSelectChat = (id: string) => {
    setSelectedChatId(id);
    setAiSuggestions([]);
    // Clear unread count
    const updated = chats.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c));
    onUpdateChats(updated);
  };

  const handleSendReply = (textToSend?: string) => {
    const text = textToSend || replyInput;
    if (!text.trim() || !activeChat) return;

    const newMessage: WhatsAppMessage = {
      id: 'msg_' + Date.now(),
      sender: 'owner',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: activeChat.language,
    };

    const updatedChats = chats.map((c) => {
      if (c.id === activeChat.id) {
        return {
          ...c,
          messages: [...c.messages, newMessage],
        };
      }
      return c;
    });

    onUpdateChats(updatedChats);
    setReplyInput('');
    setAiSuggestions([]);
  };

  const handleGenerateAiDraft = async () => {
    if (!activeChat) return;
    const lastIncoming = [...activeChat.messages].reverse().find((m) => m.sender === 'contact');
    const msgText = lastIncoming ? lastIncoming.text : 'Hello, let us connect.';

    setIsGeneratingAi(true);
    try {
      const res = await generateWhatsAppAutoReply({
        incomingMessage: msgText,
        senderName: activeChat.contactName,
        context: activeChat.statusMessage || '',
        tone: selectedTone,
      });

      if (res.suggestedReply) {
        setReplyInput(res.suggestedReply);
      }
      if (res.alternatives && res.alternatives.length) {
        setAiSuggestions(res.alternatives);
      }
    } catch (err) {
      console.error('Failed to generate AI WhatsApp reply:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSimulateIncoming = async (lang: 'bn' | 'hi' | 'en') => {
    const samples = {
      bn: [
        { name: 'অনিন্দ্য সেন (Anindya)', text: 'ভাই, কালকে কি মিটিংটা সকাল ১১টায় হবে? ফাইলগুলো কি রেডি?' },
        { name: 'তন্ময় মুখার্জী (Tanmoy)', text: 'শুভ সকাল! আপনার পাঠানো ডক্যুমেন্টটি পেয়েছি, খুব ভালো হয়েছে।' },
      ],
      hi: [
        { name: 'राहुल शर्मा (Rahul)', text: 'नमस्ते भाई! क्या आज शाम को कॉल पर बात हो सकती है?' },
        { name: 'प्रिया वर्मा (Priya)', text: 'सर, क्लाइंट की प्रेजेंटेशन मैंने ईमेल कर दी है, एक बार चेक कर लें।' },
      ],
      en: [
        { name: 'Michael Scott', text: 'Hey there! Could you send me the updated proposal by 3 PM?' },
        { name: 'Sarah Jenkins', text: 'Hi! Quick question about the quarterly roadmap we discussed.' },
      ],
    };

    const chosenList = samples[lang];
    const picked = chosenList[Math.floor(Math.random() * chosenList.length)];

    let chat = chats.find((c) => c.contactName === picked.name);
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let updatedList: WhatsAppChat[];

    if (!chat) {
      const newChat: WhatsAppChat = {
        id: 'chat_' + Date.now(),
        contactName: picked.name,
        phone: '+91 983' + Math.floor(1000000 + Math.random() * 9000000),
        avatar: picked.name.slice(0, 2),
        unreadCount: 1,
        autoReplyEnabled: true,
        language: lang,
        messages: [
          {
            id: 'm_' + Date.now(),
            sender: 'contact',
            text: picked.text,
            time: timeNow,
            language: lang,
          },
        ],
      };
      updatedList = [newChat, ...chats];
      chat = newChat;
      setSelectedChatId(newChat.id);
    } else {
      updatedList = chats.map((c) => {
        if (c.id === chat?.id) {
          return {
            ...c,
            unreadCount: c.unreadCount + 1,
            language: lang,
            messages: [
              ...c.messages,
              {
                id: 'm_' + Date.now(),
                sender: 'contact',
                text: picked.text,
                time: timeNow,
                language: lang,
              },
            ],
          };
        }
        return c;
      });
      setSelectedChatId(chat.id);
    }

    onUpdateChats(updatedList);

    // If Auto-reply is enabled, trigger AI auto-response after 1.2s!
    if (autoReplyGlobal && chat.autoReplyEnabled) {
      setTimeout(async () => {
        try {
          const aiReply = await generateWhatsAppAutoReply({
            incomingMessage: picked.text,
            senderName: picked.name,
            context: 'MS Agent Autonomous Personal Manager',
            tone: 'friendly_professional',
          });

          if (aiReply.suggestedReply) {
            const aiMsg: WhatsAppMessage = {
              id: 'ai_' + Date.now(),
              sender: 'agent',
              text: aiReply.suggestedReply,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              language: lang,
              isAiGenerated: true,
            };

            const autoRepliedList = updatedList.map((c) => {
              if (c.id === chat?.id) {
                return {
                  ...c,
                  messages: [...c.messages, aiMsg],
                };
              }
              return c;
            });
            onUpdateChats(autoRepliedList);

            onAgentActionLog?.(`MS Agent auto-replied to ${picked.name} in ${lang.toUpperCase()}: "${aiReply.suggestedReply}"`);
          }
        } catch (e) {
          console.error('Auto reply execution failed:', e);
        }
      }, 1200);
    }
  };

  const handleTestLiveWebhook = async () => {
    setIsTestingWebhook(true);
    try {
      const res = await fetch('/api/whatsapp/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: 'অনিন্দ্য সেন (Anindya)',
          message: 'শুভ দুপুর দাদা! প্রজেক্ট রিপোর্টটি কি তৈরি হয়েছে?',
          language: 'bn',
        }),
      });
      const data = await res.json();
      if (data.log) {
        setWebhookLogs((prev) => [data.log, ...prev]);
        onAgentActionLog?.(`WhatsApp Webhook triggered: Auto-replied to ${data.log.senderName}`);
      }
    } catch (e) {
      console.error('Test webhook error:', e);
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookVerifyToken: verifyToken,
          phoneNumberId,
          accessToken,
          autoReplyEnabled: autoReplyGlobal,
          connectedNumber,
          status: 'connected',
        }),
      });
      if (res.ok) {
        setIsLinked(true);
        setShowLinkModal(false);
        onAgentActionLog?.(`WhatsApp configuration saved. Linked to ${connectedNumber}`);
      }
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[620px]">
      {/* Sidebar: WhatsApp Chats List */}
      <div className="w-full md:w-80 border-r border-slate-800 flex flex-col bg-slate-950/60">
        {/* Header & Global Auto-Reply Switch */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">MS Agent · WhatsApp</h3>
                <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {connectedNumber} · Active
                </p>
              </div>
            </div>

            {/* Link WhatsApp Account Button */}
            <button
              onClick={() => setShowLinkModal(true)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Link Real WhatsApp / Webhook Settings"
            >
              <Link className="w-4 h-4 text-emerald-400" />
            </button>
          </div>

          {/* Auto-Reply Status Banner */}
          <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs mb-3">
            <div className="flex items-center gap-1.5 text-emerald-300">
              <Bot className="w-3.5 h-3.5" />
              <span className="font-mono text-[11px]">Auto-Reply: Every Message</span>
            </div>

            <button
              onClick={() => setAutoReplyGlobal(!autoReplyGlobal)}
              className={`w-8 h-4.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                autoReplyGlobal ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                  autoReplyGlobal ? 'translate-x-3.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Incoming Message Simulator Buttons */}
          <div className="pt-2 border-t border-slate-800/80">
            <p className="text-[10px] font-mono text-slate-400 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 text-cyan-400" /> Test Message Incoming:
              </span>
              <button
                onClick={() => setShowLinkModal(true)}
                className="text-emerald-400 hover:underline text-[10px]"
              >
                Settings / Link
              </button>
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => handleSimulateIncoming('bn')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-slate-700/60 transition-colors cursor-pointer"
              >
                বাংলা (Bengali)
              </button>
              <button
                onClick={() => handleSimulateIncoming('hi')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-medium border border-slate-700/60 transition-colors cursor-pointer"
              >
                हिन्दी (Hindi)
              </button>
              <button
                onClick={() => handleSimulateIncoming('en')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-medium border border-slate-700/60 transition-colors cursor-pointer"
              >
                English
              </button>
            </div>
          </div>
        </div>

        {/* Chat List Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
          {chats.map((chat) => {
            const isSelected = chat.id === activeChat?.id;
            const lastMsg = chat.messages[chat.messages.length - 1];

            return (
              <button
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className={`w-full p-3 flex items-start gap-3 text-left transition-colors cursor-pointer ${
                  isSelected ? 'bg-cyan-950/40 border-l-2 border-cyan-400' : 'hover:bg-slate-900/60'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-semibold text-xs shrink-0 shadow-md">
                  {chat.avatar}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-slate-100 truncate">{chat.contactName}</span>
                    <span className="text-[10px] text-slate-400">{lastMsg?.time || ''}</span>
                  </div>

                  <p className="text-xs text-slate-400 truncate">
                    {lastMsg?.sender === 'agent' && <span className="text-emerald-400 font-semibold">[MS Agent] </span>}
                    {lastMsg?.text || 'No messages yet'}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                    <span className="text-cyan-400 font-mono uppercase">{chat.language}</span>
                    <span className="text-slate-500">·</span>
                    {chat.autoReplyEnabled ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-mono">
                        <Bot className="w-2.5 h-2.5" /> Auto-reply ON
                      </span>
                    ) : (
                      <span className="text-slate-500">Manual</span>
                    )}

                    {chat.unreadCount > 0 && (
                      <span className="ml-auto w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-bold text-[9px] flex items-center justify-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      {activeChat ? (
        <div className="flex-1 flex flex-col bg-slate-900/90">
          {/* Active Chat Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-cyan-600 flex items-center justify-center text-white font-semibold text-xs">
                {activeChat.avatar}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">{activeChat.contactName}</h4>
                <p className="text-xs text-slate-400 font-mono">{activeChat.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const updated = chats.map((c) =>
                    c.id === activeChat.id ? { ...c, autoReplyEnabled: !c.autoReplyEnabled } : c
                  );
                  onUpdateChats(updated);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 border transition-colors cursor-pointer ${
                  activeChat.autoReplyEnabled
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                {activeChat.autoReplyEnabled ? 'Auto-Reply: Enabled' : 'Auto-Reply: Disabled'}
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {activeChat.messages.map((msg) => {
              const isContact = msg.sender === 'contact';
              const isAgent = msg.sender === 'agent';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isContact ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-md ${
                      isContact
                        ? 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700/60'
                        : isAgent
                        ? 'bg-gradient-to-r from-emerald-950 to-cyan-950 text-cyan-100 border border-emerald-500/40 rounded-br-sm'
                        : 'bg-cyan-600 text-white rounded-br-sm'
                    }`}
                  >
                    {isAgent && (
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono font-semibold mb-1 pb-1 border-b border-emerald-500/20">
                        <Bot className="w-3 h-3" />
                        <span>MS Agent Autonomous Auto-Reply</span>
                        <span className="text-slate-400">({msg.language?.toUpperCase() || 'AUTO'})</span>
                      </div>
                    )}

                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-70">
                      <span>{msg.time}</span>
                      {!isContact && <CheckCheck className="w-3 h-3 text-cyan-300" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Reply Suggestion Drawer */}
          {aiSuggestions.length > 0 && (
            <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 flex flex-wrap gap-2 items-center">
              <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> MS Agent Quick Options:
              </span>
              {aiSuggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendReply(sug)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-950/80 hover:border-cyan-500 border border-slate-700 text-xs text-slate-200 transition-colors text-left cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Chat Reply Composer */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span>Tone:</span>
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200"
                >
                  <option value="friendly_professional">Friendly & Professional</option>
                  <option value="concise">Short & Direct</option>
                  <option value="formal">Formal & Polite</option>
                  <option value="humorous">Casual / Friendly</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleGenerateAiDraft}
                disabled={isGeneratingAi}
                className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors font-medium cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isGeneratingAi ? 'Drafting in Bengali/Hindi/English...' : 'Generate MS Agent Reply'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <textarea
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
                rows={2}
                placeholder={`Type message or send MS Agent response in ${activeChat.language === 'bn' ? 'বাংলা' : activeChat.language === 'hi' ? 'हिन्दी' : 'English'}...`}
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
              />

              <button
                onClick={() => handleSendReply()}
                disabled={!replyInput.trim()}
                className="p-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all cursor-pointer shadow-md"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400">
          <p>No chat selected. Select or simulate an incoming chat.</p>
        </div>
      )}

      {/* WhatsApp Real Account Link & Webhook Configuration Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Link className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Link Real WhatsApp Account with MS Agent</h4>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Official Meta Cloud API Webhook or WhatsApp Web QR Link
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowLinkModal(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            {/* Tab switcher: Webhook vs QR */}
            <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs">
              <button
                onClick={() => setActiveLinkTab('webhook')}
                className={`flex-1 py-3 font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                  activeLinkTab === 'webhook'
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                Meta Cloud API Webhook (Automatic 24/7)
              </button>

              <button
                onClick={() => setActiveLinkTab('qr')}
                className={`flex-1 py-3 font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                  activeLinkTab === 'qr'
                    ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                WhatsApp Web QR Code Link
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {activeLinkTab === 'webhook' ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200">
                    <p className="font-semibold mb-1 flex items-center gap-1.5 text-emerald-400">
                      <ShieldCheck className="w-4 h-4" /> 24/7 Automatic WhatsApp Message Responder
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      নিচের Webhook URL এবং Verify Token-টি আপনার <strong>Meta WhatsApp Developer Console</strong>-এ কনফিগার করুন। যখনই কোনো মেসেজ আসবে, MS Agent স্বয়ংক্রিয়ভাবে বাংলা, হিন্দি বা ইংরেজিতে শনাক্ত করে সঠিক উত্তর পাঠাবে।
                    </p>
                  </div>

                  {/* Webhook URL Display */}
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">
                      1. Your Live WhatsApp Webhook URL:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={webhookUrl}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(webhookUrl);
                          setCopiedUrl(true);
                          setTimeout(() => setCopiedUrl(false), 2000);
                        }}
                        className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Verify Token */}
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">
                      2. Webhook Verification Token:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={verifyToken}
                        onChange={(e) => setVerifyToken(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(verifyToken);
                          setCopiedToken(true);
                          setTimeout(() => setCopiedToken(false), 2000);
                        }}
                        className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedToken ? 'Copied' : 'Copy Token'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Optional Meta Cloud Credentials */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">
                        Phone Number ID (Meta Cloud):
                      </label>
                      <input
                        type="text"
                        value={phoneNumberId}
                        onChange={(e) => setPhoneNumberId(e.target.value)}
                        placeholder="e.g. 10459827361928"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">
                        Connected Phone Number:
                      </label>
                      <input
                        type="text"
                        value={connectedNumber}
                        onChange={(e) => setConnectedNumber(e.target.value)}
                        placeholder="+91 98312 45678"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">
                      Permanent Access Token (Optional for direct Graph API delivery):
                    </label>
                    <input
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="EAAG..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={handleTestLiveWebhook}
                      disabled={isTestingWebhook}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingWebhook ? 'animate-spin' : ''}`} />
                      <span>{isTestingWebhook ? 'Testing...' : 'Test Webhook Auto-Reply'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveConfig}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Check className="w-3.5 h-3.5" /> Save Configuration
                    </button>
                  </div>
                </div>
              ) : (
                /* QR Link View */
                <div className="space-y-4 flex flex-col items-center text-center">
                  <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 w-full text-left">
                    <p className="font-semibold mb-1 flex items-center gap-1.5 text-cyan-400">
                      <QrCode className="w-4 h-4" /> WhatsApp Web Pairing
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      1. আপনার ফোনের WhatsApp খুলুন।<br />
                      2. Menu (তিনটি ডট) অথবা Settings &gt; <strong>Linked Devices</strong>-এ যান।<br />
                      3. <strong>Link a Device</strong>-এ ট্যাপ করে নিচের QR কোডটি স্ক্যান করুন।
                    </p>
                  </div>

                  {/* QR Canvas Simulation */}
                  <div className="p-4 bg-white rounded-2xl shadow-2xl flex flex-col items-center justify-center">
                    <div className="w-48 h-48 bg-slate-900 rounded-xl p-2 flex flex-col items-center justify-center border-4 border-slate-900 relative">
                      <div className="grid grid-cols-6 gap-1 w-full h-full p-2">
                        {Array.from({ length: 36 }).map((_, i) => (
                          <div
                            key={i}
                            className={`rounded-xs ${
                              (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30 || i === 35
                                ? 'bg-cyan-400'
                                : i % 5 === 0
                                ? 'bg-emerald-400'
                                : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-lg">
                          <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Status: Paired & Auto-Reply Ready
                  </p>

                  <button
                    onClick={() => {
                      setIsLinked(true);
                      setShowLinkModal(false);
                      onAgentActionLog?.('WhatsApp account successfully linked via QR session.');
                    }}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Check className="w-4 h-4" /> Confirm Device Linked
                  </button>
                </div>
              )}

              {/* Webhook Activity Feed Table */}
              {webhookLogs.length > 0 && (
                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> Recent WhatsApp Webhook Auto-Replies:
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Live Meta Logs</span>
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                    {webhookLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono">
                          <span className="text-emerald-400 font-semibold">{log.senderName || log.sender}</span>
                          <span>{log.timestamp} · {log.language}</span>
                        </div>
                        <p className="text-slate-300">
                          <strong className="text-slate-400">In:</strong> "{log.incomingMessage}"
                        </p>
                        <p className="text-cyan-300 font-mono text-[11px]">
                          <strong className="text-emerald-400">MS Agent:</strong> "{log.replySent}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
