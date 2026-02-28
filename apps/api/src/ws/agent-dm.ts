import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { verifyMessage } from 'ethers';
import { SOULPAIR_CONFIG } from '@soulpair/shared';
import type { WSClientMessage, WSServerMessage, ConversationResult } from '@soulpair/shared';
import { AuthenticatedClient, DMRoom, parseWSMessage, sendWSMessage, broadcastToRoom } from './protocol';
import db from '../db/database';

const { CONVERSATION_TIMEOUT_MS, MAX_MESSAGES_PER_CONVERSATION } = SOULPAIR_CONFIG;

// ===== State =====

const clients = new Map<WebSocket, AuthenticatedClient>();
const rooms = new Map<string, DMRoom>();
const dashboardSubscribers = new Set<AuthenticatedClient>();
const addressToClient = new Map<string, AuthenticatedClient>();

// ===== Public API =====

export function setupWebSocket(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (data: Buffer) => {
      const msg = parseWSMessage(data.toString());
      if (!msg) {
        sendWSMessage(ws, { type: 'error', message: 'Invalid message format' });
        return;
      }
      handleMessage(ws, msg);
    });

    ws.on('close', () => handleDisconnect(ws));
    ws.on('error', () => handleDisconnect(ws));

    // Ping/pong for connection health
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        sendWSMessage(ws, { type: 'ping', timestamp: Date.now() });
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
  });
}

export function createRoom(conversationId: string, agent1Address: string, agent2Address: string): DMRoom {
  const room: DMRoom = {
    conversationId,
    agent1: null,
    agent2: null,
    spectators: new Set(),
    agent1Address,
    agent2Address,
    messageCount: 0,
    createdAt: new Date(),
  };

  // Set timeout
  room.timeoutHandle = setTimeout(() => {
    handleConversationTimeout(conversationId);
  }, CONVERSATION_TIMEOUT_MS);

  rooms.set(conversationId, room);

  // Notify agents if they're already connected
  notifyAgentOfRoom(agent1Address, conversationId, agent2Address);
  notifyAgentOfRoom(agent2Address, conversationId, agent1Address);

  // Broadcast to dashboard
  broadcastDashboard({
    type: 'conversation_start',
    conversationId,
    agent1Address,
    agent2Address,
  });

  return room;
}

export function getStats() {
  const activeRooms = Array.from(rooms.values()).filter(
    r => r.agent1 && r.agent2
  ).length;

  return {
    activeAgents: addressToClient.size,
    activeConversations: activeRooms,
    totalRooms: rooms.size,
    dashboardViewers: dashboardSubscribers.size,
  };
}

// ===== Message Handlers =====

function handleMessage(ws: WebSocket, msg: WSClientMessage): void {
  switch (msg.type) {
    case 'auth':
      handleAuth(ws, msg.walletAddress, msg.signature, msg.role);
      break;

    case 'join_room': {
      const client = clients.get(ws);
      if (!client) return sendWSMessage(ws, { type: 'error', message: 'Not authenticated' });
      handleJoinRoom(client, msg.conversationId, msg.role);
      break;
    }

    case 'leave_room': {
      const client = clients.get(ws);
      if (!client) return;
      handleLeaveRoom(client, msg.conversationId);
      break;
    }

    case 'send_message': {
      const client = clients.get(ws);
      if (!client) return sendWSMessage(ws, { type: 'error', message: 'Not authenticated' });
      handleSendMessage(client, msg.conversationId, msg.content);
      break;
    }

    case 'conversation_end': {
      const client = clients.get(ws);
      if (!client) return;
      handleConversationEnd(client, msg.conversationId, msg.result);
      break;
    }

    case 'subscribe_dashboard': {
      const client = clients.get(ws);
      if (!client) return sendWSMessage(ws, { type: 'error', message: 'Not authenticated' });
      dashboardSubscribers.add(client);
      client.isDashboardSubscriber = true;
      break;
    }
  }
}

function handleAuth(ws: WebSocket, walletAddress: string, signature: string, role: 'agent' | 'viewer'): void {
  // Viewers don't need wallet verification
  if (role === 'viewer') {
    const client: AuthenticatedClient = {
      ws,
      walletAddress: walletAddress || 'viewer',
      role,
      subscribedRooms: new Set(),
      isDashboardSubscriber: false,
    };
    clients.set(ws, client);
    sendWSMessage(client, { type: 'auth_result', success: true });
    return;
  }

  // Agents must verify wallet ownership
  try {
    const expectedMessage = `Soulpair Auth: ${walletAddress}`;
    const recoveredAddress = verifyMessage(expectedMessage, signature);

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      sendWSMessage(ws, { type: 'auth_result', success: false, error: 'Signature verification failed' });
      return;
    }
  } catch (err) {
    sendWSMessage(ws, { type: 'auth_result', success: false, error: 'Invalid signature' });
    return;
  }

  const client: AuthenticatedClient = {
    ws,
    walletAddress,
    role,
    subscribedRooms: new Set(),
    isDashboardSubscriber: false,
  };

  clients.set(ws, client);
  addressToClient.set(walletAddress, client);

  sendWSMessage(client, { type: 'auth_result', success: true });

  // Check for pending rooms
  for (const [convId, room] of rooms) {
    if (room.agent1Address === walletAddress || room.agent2Address === walletAddress) {
      const opponentAddr = room.agent1Address === walletAddress ? room.agent2Address : room.agent1Address;
      const opponentProfile = db.prepare('SELECT flirt_md_cid FROM profiles WHERE wallet_address = ?').get(opponentAddr) as { flirt_md_cid: string } | undefined;

      sendWSMessage(client, {
        type: 'room_assigned',
        conversationId: convId,
        opponentAddress: opponentAddr,
        opponentFlirtMdCID: opponentProfile?.flirt_md_cid || '',
      });
    }
  }
}

function handleJoinRoom(client: AuthenticatedClient, conversationId: string, role: 'agent' | 'spectator'): void {
  const room = rooms.get(conversationId);
  if (!room) {
    sendWSMessage(client, { type: 'error', message: 'Room not found', code: 'ROOM_NOT_FOUND' });
    return;
  }

  if (role === 'spectator') {
    room.spectators.add(client);
    client.subscribedRooms.add(conversationId);
    return;
  }

  // Agent joining
  if (client.walletAddress === room.agent1Address) {
    room.agent1 = client;
  } else if (client.walletAddress === room.agent2Address) {
    room.agent2 = client;
  } else {
    sendWSMessage(client, { type: 'error', message: 'Not a participant in this room' });
    return;
  }

  client.subscribedRooms.add(conversationId);

  // If both agents connected, start conversation
  if (room.agent1 && room.agent2) {
    // Reset timeout — conversation is active
    if (room.timeoutHandle) clearTimeout(room.timeoutHandle);
    room.timeoutHandle = setTimeout(() => {
      handleConversationTimeout(conversationId);
    }, CONVERSATION_TIMEOUT_MS);

    db.prepare(`UPDATE conversations SET status = 'active' WHERE id = ?`).run(conversationId);
  }
}

function handleLeaveRoom(client: AuthenticatedClient, conversationId: string): void {
  const room = rooms.get(conversationId);
  if (!room) return;

  room.spectators.delete(client);
  client.subscribedRooms.delete(conversationId);

  if (client.walletAddress === room.agent1Address) room.agent1 = null;
  if (client.walletAddress === room.agent2Address) room.agent2 = null;
}

function handleSendMessage(client: AuthenticatedClient, conversationId: string, content: string): void {
  const room = rooms.get(conversationId);
  if (!room) {
    sendWSMessage(client, { type: 'error', message: 'Room not found' });
    return;
  }

  // Verify sender is a participant
  if (client.walletAddress !== room.agent1Address && client.walletAddress !== room.agent2Address) {
    sendWSMessage(client, { type: 'error', message: 'Not a participant' });
    return;
  }

  // Check message limit
  if (room.messageCount >= MAX_MESSAGES_PER_CONVERSATION) {
    sendWSMessage(client, { type: 'error', message: 'Message limit reached', code: 'MSG_LIMIT' });
    return;
  }

  room.messageCount++;

  // Reset timeout on new message
  if (room.timeoutHandle) clearTimeout(room.timeoutHandle);
  room.timeoutHandle = setTimeout(() => {
    handleConversationTimeout(conversationId);
  }, CONVERSATION_TIMEOUT_MS);

  const messageId = uuidv4();
  const timestamp = new Date();

  // Persist message
  db.prepare(`
    INSERT INTO conversation_messages (id, conversation_id, from_address, content, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(messageId, conversationId, client.walletAddress, content, timestamp.toISOString());

  // Broadcast to room (including spectators)
  const message = {
    id: messageId,
    conversationId,
    fromAddress: client.walletAddress,
    content,
    timestamp,
  };

  broadcastToRoom(room, {
    type: 'new_message',
    conversationId,
    message,
  });

  // Also broadcast to dashboard subscribers
  broadcastDashboard({
    type: 'new_message',
    conversationId,
    message,
  });
}

function handleConversationEnd(client: AuthenticatedClient, conversationId: string, result: ConversationResult): void {
  const room = rooms.get(conversationId);
  if (!room) return;

  // Only participants can end
  if (client.walletAddress !== room.agent1Address && client.walletAddress !== room.agent2Address) return;

  // Clear timeout
  if (room.timeoutHandle) clearTimeout(room.timeoutHandle);

  // Save result
  db.prepare(`
    UPDATE conversations SET
      status = 'completed',
      result_outcome = ?,
      result_confidence = ?,
      result_commonalities = ?,
      result_differences = ?,
      result_reasoning = ?,
      result_feedback = ?,
      ended_at = datetime('now')
    WHERE id = ?
  `).run(
    result.outcome,
    result.confidence,
    JSON.stringify(result.commonalities),
    JSON.stringify(result.differences),
    result.reasoning,
    result.feedback ? JSON.stringify(result.feedback) : null,
    conversationId,
  );

  // Update conversation counts
  db.prepare(`
    UPDATE agent_heartbeats SET active_conversations = MAX(0, active_conversations - 1)
    WHERE wallet_address IN (?, ?)
  `).run(room.agent1Address, room.agent2Address);

  // If match, create match record
  if (result.outcome === 'match') {
    const matchId = uuidv4();
    db.prepare(`
      INSERT INTO matches (id, conversation_id, user1_address, user2_address, status)
      VALUES (?, ?, ?, ?, 'pending_approval')
    `).run(matchId, conversationId, room.agent1Address, room.agent2Address);
  }

  // Broadcast completion
  broadcastToRoom(room, {
    type: 'conversation_completed',
    conversationId,
    result,
  });

  broadcastDashboard({
    type: 'conversation_completed',
    conversationId,
    result,
  });

  // Cleanup room after a delay
  setTimeout(() => {
    rooms.delete(conversationId);
  }, 5000);
}

function handleConversationTimeout(conversationId: string): void {
  const room = rooms.get(conversationId);
  if (!room) return;

  db.prepare(`
    UPDATE conversations SET status = 'timeout', ended_at = datetime('now')
    WHERE id = ? AND status IN ('waiting', 'active')
  `).run(conversationId);

  db.prepare(`
    UPDATE agent_heartbeats SET active_conversations = MAX(0, active_conversations - 1)
    WHERE wallet_address IN (?, ?)
  `).run(room.agent1Address, room.agent2Address);

  broadcastToRoom(room, {
    type: 'conversation_completed',
    conversationId,
    result: {
      outcome: 'no-match',
      confidence: 0,
      commonalities: [],
      differences: [],
      reasoning: 'Conversation timed out — no response within 5 minutes.',
    },
  });

  rooms.delete(conversationId);
}

function handleDisconnect(ws: WebSocket): void {
  const client = clients.get(ws);
  if (!client) return;

  // Remove from dashboard subscribers
  dashboardSubscribers.delete(client);

  // Remove from rooms (but don't close rooms — allow reconnection)
  for (const convId of client.subscribedRooms) {
    const room = rooms.get(convId);
    if (!room) continue;
    room.spectators.delete(client);
    if (client.walletAddress === room.agent1Address) room.agent1 = null;
    if (client.walletAddress === room.agent2Address) room.agent2 = null;
  }

  addressToClient.delete(client.walletAddress);
  clients.delete(ws);
}

function notifyAgentOfRoom(agentAddress: string, conversationId: string, opponentAddress: string): void {
  const client = addressToClient.get(agentAddress);
  if (!client) return;

  const opponentProfile = db.prepare('SELECT flirt_md_cid FROM profiles WHERE wallet_address = ?').get(opponentAddress) as { flirt_md_cid: string } | undefined;

  sendWSMessage(client, {
    type: 'room_assigned',
    conversationId,
    opponentAddress,
    opponentFlirtMdCID: opponentProfile?.flirt_md_cid || '',
  });
}

function broadcastDashboard(msg: WSServerMessage): void {
  for (const client of dashboardSubscribers) {
    sendWSMessage(client, msg);
  }
}
