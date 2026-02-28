import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { SOULPAIR_CONFIG } from '@soulpair/shared';

const { MAX_CONCURRENT_CONVERSATIONS, MAX_ACTIVE_MATCHES, REMATCH_COOLDOWN_MS } = SOULPAIR_CONFIG;

export interface MatchAssignment {
  conversationId: string;
  matchQueueId: string;
  agent1Address: string;
  agent2Address: string;
}

/**
 * Get all agents that are ready for matching
 */
function getReadyAgents(): string[] {
  const stmt = db.prepare(`
    SELECT h.wallet_address
    FROM agent_heartbeats h
    JOIN profiles p ON p.wallet_address = h.wallet_address
    WHERE h.status = 'ready'
      AND p.is_active = 1
      AND h.active_conversations < ?
      AND h.active_matches < ?
      AND datetime(h.last_heartbeat) > datetime('now', '-35 minutes')
    ORDER BY h.last_heartbeat ASC
  `);

  const agents = stmt.all(MAX_CONCURRENT_CONVERSATIONS, MAX_ACTIVE_MATCHES) as { wallet_address: string }[];
  return agents.map(a => a.wallet_address);
}

/**
 * Check if two agents were matched in the last 24 hours
 */
function wasRecentlyMatched(agent1: string, agent2: string): boolean {
  const cooldownHours = REMATCH_COOLDOWN_MS / (60 * 60 * 1000);
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM match_history
    WHERE (
      (agent1_address = ? AND agent2_address = ?)
      OR (agent1_address = ? AND agent2_address = ?)
    )
    AND datetime(matched_at) > datetime('now', '-' || ? || ' hours')
  `);

  const result = stmt.get(agent1, agent2, agent2, agent1, cooldownHours) as { count: number };
  return result.count > 0;
}

/**
 * Check if two agents are currently in an active conversation
 */
function hasActiveConversation(agent1: string, agent2: string): boolean {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM conversations
    WHERE status IN ('waiting', 'active')
    AND (
      (agent1_address = ? AND agent2_address = ?)
      OR (agent1_address = ? AND agent2_address = ?)
    )
  `);

  const result = stmt.get(agent1, agent2, agent2, agent1) as { count: number };
  return result.count > 0;
}

/**
 * Run matchmaking round — assign ready agents into pairs
 * Uses round-robin fairness: agents who waited longest get priority
 */
export function runMatchmaking(): MatchAssignment[] {
  const readyAgents = getReadyAgents();
  const assignments: MatchAssignment[] = [];
  const matched = new Set<string>();

  for (let i = 0; i < readyAgents.length; i++) {
    const agent1 = readyAgents[i];
    if (matched.has(agent1)) continue;

    for (let j = i + 1; j < readyAgents.length; j++) {
      const agent2 = readyAgents[j];
      if (matched.has(agent2)) continue;

      // Skip if recently matched or already in conversation
      if (wasRecentlyMatched(agent1, agent2)) continue;
      if (hasActiveConversation(agent1, agent2)) continue;

      // Create match!
      const conversationId = uuidv4();
      const matchQueueId = uuidv4();

      // Insert conversation
      db.prepare(`
        INSERT INTO conversations (id, match_queue_id, agent1_address, agent2_address, status)
        VALUES (?, ?, ?, ?, 'waiting')
      `).run(conversationId, matchQueueId, agent1, agent2);

      // Insert match queue entry
      db.prepare(`
        INSERT INTO match_queue (id, agent1_address, agent2_address, conversation_id, status)
        VALUES (?, ?, ?, ?, 'pending')
      `).run(matchQueueId, agent1, agent2, conversationId);

      // Record in match history (for 24h cooldown)
      db.prepare(`
        INSERT INTO match_history (agent1_address, agent2_address)
        VALUES (?, ?)
      `).run(agent1, agent2);

      // Update active conversation count
      db.prepare(`
        UPDATE agent_heartbeats SET active_conversations = active_conversations + 1
        WHERE wallet_address IN (?, ?)
      `).run(agent1, agent2);

      matched.add(agent1);
      matched.add(agent2);

      assignments.push({ conversationId, matchQueueId, agent1Address: agent1, agent2Address: agent2 });
      break; // agent1 paired, move to next
    }
  }

  return assignments;
}

/**
 * Get pending match assignments for a specific agent
 */
export function getPendingAssignments(walletAddress: string): MatchAssignment[] {
  const stmt = db.prepare(`
    SELECT mq.id as matchQueueId, c.id as conversationId,
           c.agent1_address as agent1Address, c.agent2_address as agent2Address
    FROM match_queue mq
    JOIN conversations c ON c.id = mq.conversation_id
    WHERE mq.status = 'pending'
    AND (mq.agent1_address = ? OR mq.agent2_address = ?)
  `);

  return stmt.all(walletAddress, walletAddress) as MatchAssignment[];
}

/**
 * Mark a match queue entry as active (both agents connected)
 */
export function activateMatch(matchQueueId: string): void {
  db.prepare(`
    UPDATE match_queue SET status = 'active', processed_at = datetime('now')
    WHERE id = ?
  `).run(matchQueueId);

  const mq = db.prepare('SELECT conversation_id FROM match_queue WHERE id = ?').get(matchQueueId) as { conversation_id: string } | undefined;
  if (mq) {
    db.prepare(`
      UPDATE conversations SET status = 'active'
      WHERE id = ?
    `).run(mq.conversation_id);
  }
}
