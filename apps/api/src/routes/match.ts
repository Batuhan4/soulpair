import { Router, Request, Response } from 'express';
import { heartbeatSchema, matchResultSchema, matchApprovalSchema } from '@soulpair/shared';
import db from '../db/database';
import { runMatchmaking, getPendingAssignments } from '../services/matchmaker';
import { createRoom } from '../ws/agent-dm';

const router = Router();

// POST /api/heartbeat — Agent heartbeat
router.post('/heartbeat', (req: Request, res: Response) => {
  const parsed = heartbeatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.message });
    return;
  }

  const { walletAddress, agentId, status } = parsed.data;

  // Verify profile exists
  const profile = db.prepare('SELECT wallet_address FROM profiles WHERE wallet_address = ?').get(walletAddress);
  if (!profile) {
    res.status(404).json({ success: false, error: 'Profile not found. Create profile first.' });
    return;
  }

  // Upsert heartbeat
  db.prepare(`
    INSERT INTO agent_heartbeats (wallet_address, agent_id, status, last_heartbeat)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(wallet_address) DO UPDATE SET
      agent_id = excluded.agent_id,
      status = excluded.status,
      last_heartbeat = datetime('now')
  `).run(walletAddress, agentId, status);

  // If agent is ready, run matchmaking
  let assignments: ReturnType<typeof getPendingAssignments> = [];
  if (status === 'ready') {
    // Try to create new matches
    const newMatches = runMatchmaking();

    // Create WebSocket rooms for new matches
    for (const match of newMatches) {
      createRoom(match.conversationId, match.agent1Address, match.agent2Address);
    }

    // Get all pending assignments for this agent
    assignments = getPendingAssignments(walletAddress);
  }

  res.json({
    success: true,
    data: {
      status,
      pendingAssignments: assignments,
    },
  });
});

// GET /api/match/queue — Get pending match assignments for agent
router.get('/queue', (req: Request, res: Response) => {
  const walletAddress = req.query.wallet as string;
  if (!walletAddress) {
    res.status(400).json({ success: false, error: 'wallet query param required' });
    return;
  }

  const assignments = getPendingAssignments(walletAddress);
  res.json({ success: true, data: assignments });
});

// POST /api/match/result — Submit conversation result
router.post('/result', (req: Request, res: Response) => {
  const parsed = matchResultSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.message });
    return;
  }

  const { conversationId, result, agentAddress } = parsed.data;

  // Verify conversation exists and agent is participant
  const conv = db.prepare(`
    SELECT * FROM conversations WHERE id = ?
  `).get(conversationId) as any;

  if (!conv) {
    res.status(404).json({ success: false, error: 'Conversation not found' });
    return;
  }

  if (conv.agent1_address !== agentAddress && conv.agent2_address !== agentAddress) {
    res.status(403).json({ success: false, error: 'Not a participant' });
    return;
  }

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

  // Update match queue
  db.prepare(`
    UPDATE match_queue SET status = 'completed'
    WHERE conversation_id = ?
  `).run(conversationId);

  res.json({ success: true, data: { conversationId, result: result.outcome } });
});

// POST /api/match/approve — User approves or rejects a match
router.post('/approve', (req: Request, res: Response) => {
  const parsed = matchApprovalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.message });
    return;
  }

  const { matchId, approved, walletAddress } = parsed.data;

  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId) as any;
  if (!match) {
    res.status(404).json({ success: false, error: 'Match not found' });
    return;
  }

  if (match.user1_address !== walletAddress && match.user2_address !== walletAddress) {
    res.status(403).json({ success: false, error: 'Not a participant' });
    return;
  }

  if (!approved) {
    db.prepare('UPDATE matches SET status = ? WHERE id = ?').run('rejected', matchId);
    res.json({ success: true, data: { matchId, status: 'rejected' } });
    return;
  }

  // Approve
  if (walletAddress === match.user1_address) {
    db.prepare('UPDATE matches SET user1_approved = 1 WHERE id = ?').run(matchId);
  } else {
    db.prepare('UPDATE matches SET user2_approved = 1 WHERE id = ?').run(matchId);
  }

  // Check if both approved
  const updated = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId) as any;
  if (updated.user1_approved && updated.user2_approved) {
    db.prepare('UPDATE matches SET status = ? WHERE id = ?').run('approved', matchId);

    // Update profile match counts
    db.prepare('UPDATE profiles SET match_count = match_count + 1 WHERE wallet_address IN (?, ?)').run(match.user1_address, match.user2_address);

    res.json({ success: true, data: { matchId, status: 'approved', bothApproved: true } });
    return;
  }

  res.json({ success: true, data: { matchId, status: 'pending_approval', bothApproved: false } });
});

// GET /api/matches/:address — Get user's match history
router.get('/:address', (req: Request, res: Response) => {
  const { address } = req.params;

  const matches = db.prepare(`
    SELECT m.*, c.result_outcome, c.result_reasoning, c.result_commonalities, c.result_differences
    FROM matches m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE m.user1_address = ? OR m.user2_address = ?
    ORDER BY m.matched_at DESC
    LIMIT 50
  `).all(address, address);

  res.json({ success: true, data: matches });
});

export default router;
