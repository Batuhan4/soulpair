// ===== Core Domain Types =====

export interface SoulProfile {
  walletAddress: string;
  flirtMdCID: string;
  flirtMdContent?: string;
  twitterHandle?: string;
  instagramHandle?: string;
  linkedinHandle?: string;
  matchCount: number;
  totalConversations: number;
  successRate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  user1Address: string;
  user2Address: string;
  conversationCID?: string;
  conversationId: string;
  matchFee: string; // BigInt as string
  dateTimestamp?: Date;
  dateLocation?: string;
  user1Approved: boolean;
  user2Approved: boolean;
  status: MatchStatus;
  matchedAt: Date;
}

export type MatchStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'completed';

export interface Conversation {
  id: string;
  matchQueueId: string;
  agent1Address: string;
  agent2Address: string;
  messages: ConversationMessage[];
  result?: ConversationResult;
  startedAt: Date;
  endedAt?: Date;
  status: ConversationStatus;
}

export type ConversationStatus =
  | 'waiting'    // Room açıldı, agent bekleniyor
  | 'active'     // İki agent bağlı, konuşma devam ediyor
  | 'completed'  // Sonuçlandı (match veya no-match)
  | 'timeout'    // 5dk cevapsız, otomatik kapandı
  | 'error';     // Hata

export interface ConversationMessage {
  id: string;
  conversationId: string;
  fromAddress: string;
  content: string;
  timestamp: Date;
}

export interface ConversationResult {
  outcome: 'match' | 'no-match';
  confidence: number; // 0-1
  commonalities: string[];
  differences: string[];
  reasoning: string;
  feedback?: RejectionFeedback;
}

export interface RejectionFeedback {
  strengths: string[];     // Ortak noktalar
  weaknesses: string[];    // Uyumsuz noktalar
  suggestions: string[];   // İyileştirme önerileri
}

export interface AgentHeartbeat {
  walletAddress: string;
  agentId: string;
  status: 'ready' | 'busy' | 'offline';
  activeConversations: number;
  activeMatches: number;
  timestamp: Date;
}

export interface MatchQueueEntry {
  id: string;
  agent1Address: string;
  agent2Address: string;
  conversationId?: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  createdAt: Date;
  processedAt?: Date;
}

export interface DashboardStats {
  activeAgents: number;
  totalMatches: number;
  todayMatches: number;
  activeConversations: number;
  totalConversations: number;
  totalProfiles: number;
}

// ===== API Types =====

export interface CreateProfileRequest {
  walletAddress: string;
  flirtMdCID: string;
  twitterHandle?: string;
  instagramHandle?: string;
  linkedinHandle?: string;
  signature: string; // wallet signature for auth
}

export interface HeartbeatRequest {
  walletAddress: string;
  agentId: string;
  status: 'ready' | 'busy' | 'offline';
  signature: string;
}

export interface MatchResultRequest {
  conversationId: string;
  result: ConversationResult;
  agentAddress: string;
  signature: string;
}

export interface MatchApprovalRequest {
  matchId: string;
  approved: boolean;
  walletAddress: string;
  signature: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
