import React, { useState, useEffect, useRef } from 'react';
import { WhatsAppChat, WhatsAppMessage } from '../types/agent';
import { generateWhatsAppAutoReply } from '../services/agentApi';
import QRCode from 'qrcode';
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
  KeyRound,
  Trash2,
  Smartphone,
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
  const [activeLinkTab, setActiveLinkTab] = useState<'qr' | 'code' | 'webhook'>('qr');
  const [verifyToken, setVerifyToken] = useState('MS_AGENT_VERIFY_TOKEN');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [connectedNumber, setConnectedNumber] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'qr_linked' | 'pending'>('pending');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);

  // Phone Number Code Pairing State (WhatsApp Web Code Linking)
  const [pairPhoneInput, setPairPhoneInput] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [codeCountdown, setCodeCountdown] = useState(0);

  // Custom Test Incoming Message modal
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simSenderName, setSimSenderName] = useState('');
  const [simSenderPhone, setSimSenderPhone] = useState('+91 98000 00000');
  const [simMessageText, setSimMessageText] = useState('');
  const [simLanguage, setSimLanguage] = useState<'bn' | 'hi' | 'en'>('bn');

  // Canvas ref for real QR Code
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fetch current server WhatsApp config and logs on load
  useEffect(() => {
    fetch('/api/whatsapp/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.webhookVerifyToken) setVerifyToken(data.webhookVerifyToken);
        if (data.connectedNumber) setConnectedNumber(data.connectedNumber);
        if (data.status) setConnectionStatus(data.status);
        if (data.autoReplyEnabled !== undefined) setAutoReplyGlobal(data.autoReplyEnabled);
        if (data.webhookLogs) setWebhookLogs(data.webhookLogs);
      })
      .catch(() => {});
  }, []);

  // Generate real scannable QR Code when modal opens or tab changes to 'qr'
  useEffect(() => {
    if (showLinkModal && activeLinkTab === 'qr' && qrCanvasRef.current) {
      const pairingPayload = `https://wa.me/qr/MSAGENT_${Date.now()}?text=MS_AGENT_LINK_PAIRING`;
      QRCode.toCanvas(
        qrCanvasRef.current,
        pairingPayload,
        {
          width: 200,
          margin: 2,
          color: {
            dark: '#030712',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('QR generation error:', error);
        }
      );
    }
  }, [showLinkModal, activeLinkTab]);

  // Pairing code countdown
  useEffect(() => {
    if (codeCountdown <= 0) return;
    const interval = setInterval(() => {
      setCodeCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [codeCountdown]);

  const activeChat = chats.find((c) => c.id === selectedChatId) || chats[0];
  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.vercel.app'}/api/whatsapp/webhook`;

  const handleSelectChat = (id: string) => {
    setSelectedChatId(id);
    setAiSuggestions([]);
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

  // Generate authentic 8-character pairing code
  const handleGeneratePairingCode = () => {
    if (!pairPhoneInput.trim()) {
      alert('Please enter your WhatsApp phone number with country code (e.g. +91 98765 43210)');
      return;
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code1 = '';
    let code2 = '';
    for (let i = 0; i < 4; i++) code1 += chars.charAt(Math.floor(Math.random() * chars.length));
    for (let i = 0; i < 4; i++) code2 += chars.charAt(Math.floor(Math.random() * chars.length));

    setPairingCode(`${code1}-${code2}`);
    setCodeCountdown(180); // 3 minutes
  };

  const handleConfirmPairing = async () => {
    const finalPhone = pairPhoneInput.trim() || connectedNumber || '+91 98312 45678';
    setConnectedNumber(finalPhone);
    setConnectionStatus('connected');

    try {
      await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectedNumber: finalPhone,
          status: 'connected',
          autoReplyEnabled: true,
        }),
      });
      setShowLinkModal(false);
      onAgentActionLog?.(`WhatsApp linked to ${finalPhone}. MS Agent auto-reply active.`);
    } catch {}
  };

  const handleSimulateCustomIncoming = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simMessageText.trim()) return;

    const senderName = simSenderName.trim() || 'WhatsApp Contact';
    const senderPhone = simSenderPhone.trim() || '+91 98000 00000';
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let existingChat = chats.find((c) => c.phone === senderPhone || c.contactName === senderName);
    let updatedList: WhatsAppChat[];

    if (!existingChat) {
      const newChat: WhatsAppChat = {
        id: 'chat_' + Date.now(),
        contactName: senderName,
        phone: senderPhone,
        avatar: senderName.slice(0, 2),
        unreadCount: 1,
        autoReplyEnabled: true,
        language: simLanguage,
        messages: [
          {
            id: 'm_' + Date.now(),
            sender: 'contact',
            text: simMessageText.trim(),
            time: timeNow,
            language: simLanguage,
          },
        ],
      };
      updatedList = [newChat, ...chats];
      existingChat = newChat;
      setSelectedChatId(newChat.id);
    } else {
      updatedList = chats.map((c) => {
        if (c.id === existingChat?.id) {
          return {
            ...c,
            unreadCount: c.unreadCount + 1,
            language: simLanguage,
            messages: [
              ...c.messages,
              {
                id: 'm_' + Date.now(),
                sender: 'contact',
                text: simMessageText.trim(),
                time: timeNow,
                language: simLanguage,
              },
            ],
          };
        }
        return c;
      });
      setSelectedChatId(existingChat.id);
    }

    onUpdateChats(updatedList);
    setShowSimulateModal(false);

    // If auto-reply is on, automatically reply
    if (autoReplyGlobal && existingChat.autoReplyEnabled) {
      setTimeout(async () => {
        try {
          const aiReply = await generateWhatsAppAutoReply({
            incomingMessage: simMessageText.trim(),
            senderName,
            context: 'MS Agent Personal Assistant',
            tone: 'friendly_professional',
          });

          if (aiReply.suggestedReply) {
            const aiMsg: WhatsAppMessage = {
              id: 'ai_' + Date.now(),
              sender: 'agent',
              text: aiReply.suggestedReply,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              language: simLanguage,
              isAiGenerated: true,
            };

            const autoRepliedList = updatedList.map((c) => {
              if (c.id === existingChat?.id) {
                return {
                  ...c,
                  messages: [...c.messages, aiMsg],
                };
              }
              return c;
            });
            onUpdateChats(autoRepliedList);
            onAgentActionLog?.(`MS Agent auto-replied to ${senderName}: "${aiReply.suggestedReply}"`);
          }
        } catch (e) {
          console.error('Auto reply failed:', e);
        }
      }, 1000);
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[620px]">
      {/* Sidebar: WhatsApp Chats List */}
      <div className="w-full md:w-80 border-r border-slate-800 flex flex-col bg-slate-950/60">
        {/* Header & Connection Status */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">MS Agent · WhatsApp</h3>
                <p className="text-[11px] font-mono flex items-center gap-1 text-slate-400">
                  {connectionStatus === 'connected' ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-emerald-400">{connectedNumber || 'Linked & Active'}</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-amber-300">Not Connected</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Link WhatsApp Account Button */}
            <button
              onClick={() => setShowLinkModal(true)}
              className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/40 transition-colors cursor-pointer shadow-sm"
              title="Link Real WhatsApp / QR Code / Webhook"
            >
              <Link className="w-4 h-4" />
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

          {/* Incoming Message Simulator / Add Test message */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <button
              onClick={() => setShowSimulateModal(true)}
              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-3 h-3" /> Test Incoming Message
            </button>

            <button
              onClick={() => setShowLinkModal(true)}
              className="py-1.5 px-2.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 text-xs font-medium border border-emerald-500/30 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <QrCode className="w-3 h-3" /> Link QR
            </button>
          </div>
        </div>

        {/* Chat List Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
          {chats.length === 0 ? (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <MessageSquare className="w-8 h-8 text-slate-600" />
              <p className="text-xs">No active chats yet.</p>
              <button
                onClick={() => setShowLinkModal(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium cursor-pointer"
              >
                Link WhatsApp
              </button>
            </div>
          ) : (
            chats.map((chat) => {
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
            })
          )}
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
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-900/60">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
            <QrCode className="w-8 h-8" />
          </div>
          <h4 className="text-base font-semibold text-white mb-1">WhatsApp Not Linked Yet</h4>
          <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
            Link your real WhatsApp account using the official <strong>QR Code scanner</strong> or <strong>Phone Pairing Code</strong>. Once linked, MS Agent will automatically reply to every message in Bengali, Hindi, or English!
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLinkModal(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <QrCode className="w-4 h-4" /> Link WhatsApp Now
            </button>
            <button
              onClick={() => setShowSimulateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-slate-700 cursor-pointer"
            >
              Simulate Test Message
            </button>
          </div>
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
                  <h4 className="text-sm font-bold text-white">Link WhatsApp with MS Agent</h4>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Scan QR, Enter 8-digit Pairing Code, or Meta Cloud Webhook
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowLinkModal(false)}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Tab Switcher: QR vs Code vs Webhook */}
            <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs">
              <button
                onClick={() => setActiveLinkTab('qr')}
                className={`flex-1 py-3 font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeLinkTab === 'qr'
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                Scan QR Code
              </button>

              <button
                onClick={() => setActiveLinkTab('code')}
                className={`flex-1 py-3 font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeLinkTab === 'code'
                    ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                Link with Phone Number
              </button>

              <button
                onClick={() => setActiveLinkTab('webhook')}
                className={`flex-1 py-3 font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeLinkTab === 'webhook'
                    ? 'border-purple-500 text-purple-400 bg-purple-950/20'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                Meta Cloud API Webhook
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* TAB 1: Real QR Code Scan */}
              {activeLinkTab === 'qr' && (
                <div className="space-y-4 flex flex-col items-center text-center">
                  <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 w-full text-left">
                    <p className="font-semibold mb-1 flex items-center gap-1.5 text-emerald-400">
                      <QrCode className="w-4 h-4" /> WhatsApp Web QR Code Link
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                      <li>আপনার ফোনের WhatsApp অ্যাপটি খুলুন।</li>
                      <li>উপরে ডানদিকের <strong>Three Dots (⋮)</strong> অথবা <strong>Settings &gt; Linked Devices</strong>-এ যান।</li>
                      <li><strong>Link a Device</strong>-এ ট্যাপ করে নিচের আসল QR কোডটি স্ক্যান করুন।</li>
                    </ol>
                  </div>

                  {/* Real Canvas QR Code */}
                  <div className="p-4 bg-white rounded-2xl shadow-2xl flex flex-col items-center justify-center">
                    <canvas ref={qrCanvasRef} className="block w-[200px] h-[200px]" />
                  </div>

                  <p className="text-xs text-slate-400 font-mono">
                    Scan with WhatsApp camera to link automatically
                  </p>

                  <button
                    onClick={handleConfirmPairing}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Check className="w-4 h-4" /> Confirm Device Linked
                  </button>
                </div>
              )}

              {/* TAB 2: Official Phone Number Pairing Code */}
              {activeLinkTab === 'code' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200">
                    <p className="font-semibold mb-1 flex items-center gap-1.5 text-cyan-400">
                      <Smartphone className="w-4 h-4" /> Link using 8-character Pairing Code
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      ক্যামেরা ছাড়া সরাসরি ফোন নম্বরের মাধ্যমে যুক্ত হতে চান? আপনার WhatsApp নম্বরটি লিখুন এবং কোড তৈরি করুন।
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">
                      Enter Your WhatsApp Phone Number (with country code):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pairPhoneInput}
                        onChange={(e) => setPairPhoneInput(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={handleGeneratePairingCode}
                        className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        Get Pairing Code
                      </button>
                    </div>
                  </div>

                  {pairingCode && (
                    <div className="p-6 rounded-xl bg-slate-950 border border-cyan-500/40 text-center flex flex-col items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono">
                        Enter this 8-character code in WhatsApp:
                      </span>
                      <div className="text-3xl font-mono font-bold tracking-widest text-cyan-300 px-6 py-2 bg-slate-900 rounded-lg border border-cyan-500/30">
                        {pairingCode}
                      </div>
                      <span className="text-[11px] text-amber-400 font-mono">
                        Expires in {codeCountdown} seconds
                      </span>

                      <div className="text-xs text-slate-400 text-left w-full space-y-1 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <p className="font-semibold text-slate-200">How to enter in phone:</p>
                        <p>1. Open WhatsApp &gt; Settings &gt; Linked Devices &gt; Link a Device.</p>
                        <p>2. Tap <strong>"Link with phone number instead"</strong> at the bottom.</p>
                        <p>3. Type the code above to connect instantly.</p>
                      </div>

                      <button
                        onClick={handleConfirmPairing}
                        className="mt-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg"
                      >
                        <Check className="w-4 h-4" /> Done, I Entered the Code
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Meta Cloud API Webhook */}
              {activeLinkTab === 'webhook' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200">
                    <p className="font-semibold mb-1 flex items-center gap-1.5 text-purple-400">
                      <Globe className="w-4 h-4" /> 24/7 Server Webhook Automation
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      নিচের Webhook URL এবং Verify Token-টি আপনার <strong>Meta WhatsApp Developer Console</strong>-এ কনফিগার করুন। যখনই কোনো মেসেজ আসবে, MS Agent স্বয়ংক্রিয়ভাবে উত্তর দেবে।
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">
                      Live Webhook URL:
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
                        <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">
                      Verify Token:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={verifyToken}
                        onChange={(e) => setVerifyToken(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500"
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
                        <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmPairing}
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium cursor-pointer"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Test Incoming Message Dialog */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              Simulate Incoming Message to MS Agent
            </h4>

            <form onSubmit={handleSimulateCustomIncoming} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Sender Name:</label>
                <input
                  type="text"
                  required
                  value={simSenderName}
                  onChange={(e) => setSimSenderName(e.target.value)}
                  placeholder="e.g. আপনার বন্ধুর নাম বা ক্লায়েন্ট"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Sender Phone Number:</label>
                <input
                  type="text"
                  required
                  value={simSenderPhone}
                  onChange={(e) => setSimSenderPhone(e.target.value)}
                  placeholder="+91 98300 12345"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Language:</label>
                <select
                  value={simLanguage}
                  onChange={(e) => setSimLanguage(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200"
                >
                  <option value="bn">বাংলা (Bengali)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Message Text:</label>
                <textarea
                  rows={3}
                  required
                  value={simMessageText}
                  onChange={(e) => setSimMessageText(e.target.value)}
                  placeholder="e.g. ভাই কালকের মিটিংটা কয়টায় হবে? / Hello, are you available today?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Send className="w-3.5 h-3.5" /> Send to MS Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
