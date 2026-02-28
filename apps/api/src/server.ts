import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { WebSocketServer } from 'ws';
import http from 'http';

import profileRoutes from './routes/profile';
import matchRoutes from './routes/match';
import statsRoutes from './routes/stats';
import { setupWebSocket, getStats } from './ws/agent-dm';

const app = express();
const PORT = process.env.PORT || 3001;

// ===== Middleware =====
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// ===== Simple rate limiter =====
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

app.use((req, res, next) => {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + RATE_WINDOW });
    next();
    return;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT) {
    res.status(429).json({ success: false, error: 'Rate limit exceeded' });
    return;
  }

  next();
});

// Cleanup rate limit map periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestCounts) {
    if (now > entry.resetAt) requestCounts.delete(key);
  }
}, 60000);

// ===== Routes =====
app.use('/api/profile', profileRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/heartbeat', matchRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  const wsStats = getStats();
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      ws: wsStats,
    },
  });
});

// ===== HTTP + WebSocket Server =====
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

setupWebSocket(wss);

server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║   🔥 Soulpair API Server                 ║
  ║   HTTP:  http://localhost:${PORT}           ║
  ║   WS:    ws://localhost:${PORT}/ws          ║
  ║   Status: Ready                           ║
  ╚═══════════════════════════════════════════╝
  `);
});

export default server;
