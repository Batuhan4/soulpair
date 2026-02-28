import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { WebSocketServer } from 'ws';
import http from 'http';

import profileRoutes from './routes/profile';
import matchRoutes from './routes/match';
import statsRoutes from './routes/stats';
import conversationRoutes from './routes/conversation';
import { setupWebSocket, getStats } from './ws/agent-dm';
import { errorHandler, notFoundHandler } from './middleware/error-handler';

const app = express();
const PORT = process.env.PORT || 3001;

// ===== Middleware =====
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow localhost on any port + no origin (curl/server-to-server)
    if (!origin || /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, process.env.FRONTEND_URL || false);
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// ===== Simple rate limiter =====
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW = 60 * 1000;

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

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestCounts) {
    if (now > entry.resetAt) requestCounts.delete(key);
  }
}, 60000);

// ===== Routes =====
// All match-related routes are under /api (heartbeat, match/*, matches/*)
app.use('/api', matchRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/conversations', conversationRoutes);

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

// ===== Error Handling =====
app.use(notFoundHandler);
app.use(errorHandler);

// ===== HTTP + WebSocket Server =====
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

setupWebSocket(wss);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║   🔥 Soulpair API Server                 ║
  ║   HTTP:  http://0.0.0.0:${PORT}            ║
  ║   WS:    ws://0.0.0.0:${PORT}/ws           ║
  ║   Status: Ready                           ║
  ╚═══════════════════════════════════════════╝
  `);
});

export default server;
