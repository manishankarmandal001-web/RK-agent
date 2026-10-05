import { AgentChatMessage, PhoneContact, WhatsAppChat, EmailMessage } from '../types/agent';

export async function sendAgentChat(params: {
  message: string;
  history?: Array<{ role: 'user' | 'agent'; content: string }>;
  contacts?: PhoneContact[];
  unreadWhatsApp?: WhatsAppChat[];
  unreadEmails?: EmailMessage[];
  currentLanguage?: string;
  voiceMode?: boolean;
}) {
  const res = await fetch('/api/agent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Agent chat failed (${res.status})`);
  }
  return await res.json();
}

export async function requestAgentTts(text: string, voice = 'Kore'): Promise<string> {
  const res = await fetch('/api/agent/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `TTS request failed (${res.status})`);
  }
  const data = await res.json();
  if (data.audioBase64) {
    return `data:audio/wav;base64,${data.audioBase64}`;
  }
  throw new Error('No audio returned from server');
}

export async function generateWhatsAppAutoReply(params: {
  incomingMessage: string;
  senderName: string;
  context?: string;
  tone?: string;
}) {
  const res = await fetch('/api/agent/whatsapp-reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Auto-reply generation failed (${res.status})`);
  }
  return await res.json();
}

export async function triageEmailMessage(params: {
  sender: string;
  subject: string;
  body: string;
  preferredLanguage?: string;
}) {
  const res = await fetch('/api/agent/email-triage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Email triage failed (${res.status})`);
  }
  return await res.json();
}

export async function solveProblemWithAi(params: {
  problem: string;
  domain?: string;
  language?: string;
}) {
  const res = await fetch('/api/agent/solve-problem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Problem solving failed (${res.status})`);
  }
  return await res.json();
}
