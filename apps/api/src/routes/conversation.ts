import { Router, Request, Response } from 'express';
import db from '../db/database';

const router = Router();

// GET /api/conversation/:id — Get conversation details
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const conv = db.prepare(`
    SELECT * FROM conversations WHERE id = ?
  `).get(id);

  if (!conv) {
    res.status(404).json({ success: false, error: 'Conversation not found' });
    return;
  }

  res.json({ success: true, data: conv });
});

// GET /api/conversation/:id/messages — Get conversation messages
router.get('/:id/messages', (req: Request, res: Response) => {
  const { id } = req.params;

  const messages = db.prepare(`
    SELECT * FROM conversation_messages
    WHERE conversation_id = ?
    ORDER BY timestamp ASC
  `).all(id);

  res.json({ success: true, data: messages });
});

// POST /api/conversation/message — Add a message to a conversation (seed/dev)
router.post('/message', (req: Request, res: Response) => {
  const { conversationId, fromAddress, content } = req.body;
  if (!conversationId || !fromAddress || !content) {
    res.status(400).json({ success: false, error: 'conversationId, fromAddress, content required' });
    return;
  }

  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId) as any;
  if (!conv) {
    res.status(404).json({ success: false, error: 'Conversation not found' });
    return;
  }

  // Set conversation to active if still waiting
  if (conv.status === 'waiting') {
    db.prepare("UPDATE conversations SET status = 'active' WHERE id = ?").run(conversationId);
  }

  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO conversation_messages (id, conversation_id, from_address, content, timestamp)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(id, conversationId, fromAddress, content);

  res.json({ success: true, data: { id, conversationId, fromAddress, content } });
});

// GET /api/conversations/history/:address — Get conversation history for a user
router.get('/history/:address', (req: Request, res: Response) => {
  const { address } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

  const conversations = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM conversation_messages WHERE conversation_id = c.id) as message_count
    FROM conversations c
    WHERE c.agent1_address = ? OR c.agent2_address = ?
    ORDER BY c.started_at DESC
    LIMIT ?
  `).all(address, address, limit);

  res.json({ success: true, data: conversations });
});

export default router;
