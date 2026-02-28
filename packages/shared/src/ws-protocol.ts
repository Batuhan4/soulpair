// ===== WebSocket Message Protocol =====

import type {
  ConversationMessage,
  ConversationResult,
  DashboardStats,
  Match,
} from './types';

// ----- Client → Server -----

export type WSClientMessage =
  | WSAuthMessage
  | WSJoinRoomMessage
  | WSLeaveRoomMessage
  | WSSendMessage
  | WSConversationEndMessage
  | WSSubscribeDashboardMessage;

export interface WSAuthMessage {
  type: 'auth';
  walletAddress: string;
  signature: string;
  role: 'agent' | 'viewer';
}

export interface WSJoinRoomMessage {
  type: 'join_room';
  conversationId: string;
  role: 'agent' | 'spectator';
}

export interface WSLeaveRoomMessage {
  type: 'leave_room';
  conversationId: string;
}

export interface WSSendMessage {
  type: 'send_message';
  conversationId: string;
  content: string;
}

export interface WSConversationEndMessage {
  type: 'conversation_end';
  conversationId: string;
  result: ConversationResult;
}

export interface WSSubscribeDashboardMessage {
  type: 'subscribe_dashboard';
}

// ----- Server → Client -----

export type WSServerMessage =
  | WSAuthResultMessage
  | WSRoomAssignedMessage
  | WSNewMessageMessage
  | WSConversationStartMessage
  | WSConversationCompletedMessage
  | WSMatchNewMessage
  | WSStatsUpdateMessage
  | WSErrorMessage
  | WSPingMessage;

export interface WSAuthResultMessage {
  type: 'auth_result';
  success: boolean;
  error?: string;
}

export interface WSRoomAssignedMessage {
  type: 'room_assigned';
  conversationId: string;
  opponentAddress: string;
  opponentFlirtMdCID: string;
}

export interface WSNewMessageMessage {
  type: 'new_message';
  conversationId: string;
  message: ConversationMessage;
}

export interface WSConversationStartMessage {
  type: 'conversation_start';
  conversationId: string;
  agent1Address: string;
  agent2Address: string;
}

export interface WSConversationCompletedMessage {
  type: 'conversation_completed';
  conversationId: string;
  result: ConversationResult;
}

export interface WSMatchNewMessage {
  type: 'match_new';
  match: Match;
}

export interface WSStatsUpdateMessage {
  type: 'stats_update';
  stats: DashboardStats;
}

export interface WSErrorMessage {
  type: 'error';
  message: string;
  code?: string;
}

export interface WSPingMessage {
  type: 'ping';
  timestamp: number;
}
