import { WebSocket } from 'ws';
import type { WSClientMessage, WSServerMessage } from '@soulpair/shared';

export interface AuthenticatedClient {
  ws: WebSocket;
  walletAddress: string;
  role: 'agent' | 'viewer';
  subscribedRooms: Set<string>;
  isDashboardSubscriber: boolean;
}

export interface DMRoom {
  conversationId: string;
  agent1: AuthenticatedClient | null;
  agent2: AuthenticatedClient | null;
  spectators: Set<AuthenticatedClient>;
  agent1Address: string;
  agent2Address: string;
  messageCount: number;
  createdAt: Date;
  timeoutHandle?: ReturnType<typeof setTimeout>;
}

export function parseWSMessage(data: string): WSClientMessage | null {
  try {
    const msg = JSON.parse(data);
    if (!msg.type) return null;
    return msg as WSClientMessage;
  } catch {
    return null;
  }
}

export function sendWSMessage(client: AuthenticatedClient | WebSocket, msg: WSServerMessage): void {
  const ws = 'ws' in client ? client.ws : client;
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

export function broadcastToRoom(room: DMRoom, msg: WSServerMessage, excludeAddress?: string): void {
  const clients = [room.agent1, room.agent2, ...room.spectators];
  for (const client of clients) {
    if (!client) continue;
    if (excludeAddress && client.walletAddress === excludeAddress) continue;
    sendWSMessage(client, msg);
  }
}
