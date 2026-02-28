import { Router, Request, Response } from 'express';
import db from '../db/database';
import type { DashboardStats } from '@soulpair/shared';

const router = Router();

// GET /api/stats — Dashboard statistics
router.get('/', (_req: Request, res: Response) => {
  const activeAgents = db.prepare(`
    SELECT COUNT(*) as count FROM agent_heartbeats
    WHERE status = 'ready'
    AND datetime(last_heartbeat) > datetime('now', '-35 minutes')
  `).get() as { count: number };

  const totalMatches = db.prepare(`
    SELECT COUNT(*) as count FROM matches WHERE status = 'approved'
  `).get() as { count: number };

  const todayMatches = db.prepare(`
    SELECT COUNT(*) as count FROM matches
    WHERE status = 'approved'
    AND date(matched_at) = date('now')
  `).get() as { count: number };

  const activeConversations = db.prepare(`
    SELECT COUNT(*) as count FROM conversations
    WHERE id IN (SELECT DISTINCT conversation_id FROM conversation_messages)
  `).get() as { count: number };

  const totalConversations = db.prepare(`
    SELECT COUNT(*) as count FROM conversations
  `).get() as { count: number };

  const totalProfiles = db.prepare(`
    SELECT COUNT(*) as count FROM profiles WHERE is_active = 1
  `).get() as { count: number };

  const stats: DashboardStats = {
    activeAgents: activeAgents.count,
    totalMatches: totalMatches.count,
    todayMatches: todayMatches.count,
    activeConversations: activeConversations.count,
    totalConversations: totalConversations.count,
    totalProfiles: totalProfiles.count,
  };

  res.json({ success: true, data: stats });
});

// GET /api/stats/leaderboard — Top agents by match count
router.get('/leaderboard', (_req: Request, res: Response) => {
  const leaderboard = db.prepare(`
    SELECT wallet_address, match_count, total_conversations,
           CASE WHEN total_conversations > 0
             THEN ROUND(CAST(match_count AS REAL) / total_conversations * 100, 1)
             ELSE 0
           END as success_rate
    FROM profiles
    WHERE is_active = 1 AND match_count > 0
    ORDER BY match_count DESC
    LIMIT 20
  `).all();

  res.json({ success: true, data: leaderboard });
});

// GET /api/stats/conversations — Active conversations for dashboard
router.get('/conversations', (_req: Request, res: Response) => {
  const conversations = db.prepare(`
    SELECT c.id, c.agent1_address, c.agent2_address, c.status, c.started_at,
           (SELECT COUNT(*) FROM conversation_messages WHERE conversation_id = c.id) as message_count,
           (SELECT content FROM conversation_messages WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_message
    FROM conversations c
    WHERE c.id IN (SELECT DISTINCT conversation_id FROM conversation_messages)
    ORDER BY
      (SELECT COUNT(*) FROM conversation_messages WHERE conversation_id = c.id) DESC,
      c.started_at DESC
    LIMIT 20
  `).all();

  res.json({ success: true, data: conversations });
});

// GET /api/stats/live-feed — Recent messages across all active conversations
router.get('/live-feed', (_req: Request, res: Response) => {
  const messages = db.prepare(`
    SELECT m.id, m.conversation_id, m.from_address, m.content, m.timestamp,
           c.agent1_address, c.agent2_address
    FROM conversation_messages m
    JOIN conversations c ON c.id = m.conversation_id
    -- ORDER BY m.timestamp DESC
    LIMIT 50
  `).all();

  res.json({ success: true, data: messages.reverse() });
});

// GET /api/stats/recent-matches — Recent successful matches
router.get('/recent-matches', (_req: Request, res: Response) => {
  const recentMatches = db.prepare(`
    SELECT m.id, m.user1_address, m.user2_address, m.matched_at, m.status,
           c.result_commonalities
    FROM matches m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE m.status = 'approved'
    ORDER BY m.matched_at DESC
    LIMIT 10
  `).all();

  res.json({ success: true, data: recentMatches });
});

export default router;
