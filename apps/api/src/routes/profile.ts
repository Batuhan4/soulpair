import { Router, Request, Response } from 'express';
import { createProfileSchema } from '@soulpair/shared';
import db from '../db/database';

const router = Router();

// POST /api/profile — Create or update profile
router.post('/', (req: Request, res: Response) => {
  const parsed = createProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.message });
    return;
  }

  const { walletAddress, flirtMdCID, twitterHandle, instagramHandle, linkedinHandle } = parsed.data;

  // Check if profile exists
  const existing = db.prepare('SELECT wallet_address FROM profiles WHERE wallet_address = ?').get(walletAddress);

  if (existing) {
    // Update
    db.prepare(`
      UPDATE profiles SET
        flirt_md_cid = ?,
        twitter_handle = ?,
        instagram_handle = ?,
        linkedin_handle = ?,
        updated_at = datetime('now')
      WHERE wallet_address = ?
    `).run(flirtMdCID, twitterHandle || null, instagramHandle || null, linkedinHandle || null, walletAddress);

    res.json({ success: true, data: { walletAddress, updated: true } });
  } else {
    // Create
    db.prepare(`
      INSERT INTO profiles (wallet_address, flirt_md_cid, twitter_handle, instagram_handle, linkedin_handle)
      VALUES (?, ?, ?, ?, ?)
    `).run(walletAddress, flirtMdCID, twitterHandle || null, instagramHandle || null, linkedinHandle || null);

    // Initialize heartbeat entry
    db.prepare(`
      INSERT OR IGNORE INTO agent_heartbeats (wallet_address, agent_id, status)
      VALUES (?, ?, 'offline')
    `).run(walletAddress, `agent-${walletAddress.slice(0, 8)}`);

    res.status(201).json({ success: true, data: { walletAddress, created: true } });
  }
});

// GET /api/profile/:address — Get profile
router.get('/:address', (req: Request, res: Response) => {
  const { address } = req.params;

  const profile = db.prepare(`
    SELECT p.*, h.status as agent_status, h.active_conversations, h.active_matches, h.last_heartbeat
    FROM profiles p
    LEFT JOIN agent_heartbeats h ON h.wallet_address = p.wallet_address
    WHERE p.wallet_address = ?
  `).get(address);

  if (!profile) {
    res.status(404).json({ success: false, error: 'Profile not found' });
    return;
  }

  res.json({ success: true, data: profile });
});

// GET /api/profiles — List all active profiles
router.get('/', (_req: Request, res: Response) => {
  const profiles = db.prepare(`
    SELECT p.wallet_address, p.flirt_md_cid, p.match_count, p.total_conversations, p.is_active, p.created_at,
           h.status as agent_status
    FROM profiles p
    LEFT JOIN agent_heartbeats h ON h.wallet_address = p.wallet_address
    WHERE p.is_active = 1
    ORDER BY p.created_at DESC
    LIMIT 100
  `).all();

  res.json({ success: true, data: profiles });
});

export default router;
