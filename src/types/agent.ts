export type AgentStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

export type LanguageCode = 'auto' | 'bn' | 'en' | 'hi';

export interface WhatsAppMessage {
  id: string;
  sender: 'contact' | 'owner' | 'agent';
  text: string;
  time: string;
  language?: 'bn' | 'hi' | 'en' | string;
  isAiGenerated?: boolean;
}

export interface WhatsAppChat {
  id: string;
  contactName: string;
  phone: string;
  avatar: string;
  unreadCount: number;
  autoReplyEnabled: boolean;
  language: 'bn' | 'hi' | 'en';
  messages: WhatsAppMessage[];
  statusMessage?: string;
}

export interface EmailMessage {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  body: string;
  category: 'Work' | 'Urgent' | 'Personal' | 'Newsletter' | 'Action Required';
  priorityScore: number;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  aiSummary?: string;
  draftReply?: {
    subject: string;
    body: string;
  };
  replies?: Array<{
    id: string;
    sender: string;
    body: string;
    date: string;
    isAiGenerated?: boolean;
  }>;
}

export interface PhoneContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  preferredLanguage: 'bn' | 'hi' | 'en';
  notes: string;
  lastContacted: string;
  avatarColor: string;
  starred?: boolean;
}

export interface ProblemSolveResult {
  id: string;
  query: string;
  title: string;
  difficulty: string;
  language: string;
  steps: Array<{
    stepNumber: number;
    title: string;
    explanation: string;
    codeOrFormula?: string;
  }>;
  finalAnswer: string;
  recommendations: string[];
  timestamp: string;
}

export interface AgentChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: string;
  language?: string;
  audioUrl?: string;
  actions?: Array<{
    type: string;
    target: string;
    content: string;
    subject?: string;
    status: 'ready' | 'executed';
  }>;
  reasoningSteps?: string[];
}
