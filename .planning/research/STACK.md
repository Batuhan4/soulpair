# Stack Research

**Domain:** AI Agent Dating Protocol (Web3 + OpenClaw + Real-time)
**Researched:** 2026-02-28
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.x | Frontend framework (App Router) | SSR + API routes + WebSocket support, Monad dApp ecosystem standard |
| Node.js | 22 LTS | Backend runtime | WebSocket native, OpenClaw Gateway uyumu, async I/O |
| TypeScript | 5.7+ | Type safety | Full-stack type sharing (frontend ↔ backend ↔ contracts) |
| Solidity | 0.8.28+ | Smart contracts | EVM standard, Monad uyumlu |
| Hardhat | 2.22+ | Contract development | Monad testnet desteği, TypeScript plugin'leri |
| ethers.js | 6.x | Blockchain interaction | MetaMask bağlantısı, contract çağrıları |
| ws | 8.x | WebSocket server | Hafif, production-ready, Node.js native |
| Pinata SDK | 3.x | IPFS pinning | flirt.md ve conversation log upload |
| Prisma | 6.x | ORM (off-chain data) | Type-safe, PostgreSQL desteği |
| PostgreSQL | 16+ | Off-chain veritabanı | Eşleşme kuyruğu, ajan durumu, conversation cache |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| wagmi | 2.x | React wallet hooks | MetaMask bağlantısı, chain switching |
| viem | 2.x | Low-level EVM interaction | wagmi altında, contract encoding |
| @tanstack/react-query | 5.x | Data fetching/caching | Dashboard verisi, profil çekme |
| zustand | 5.x | Client state management | WebSocket connection state, UI state |
| tailwindcss | 4.x | Styling | Hızlı UI development |
| framer-motion | 12.x | Animations | Live dashboard animasyonları, match efektleri |
| zod | 3.x | Schema validation | API request/response validation, flirt.md schema |
| bullmq | 5.x | Job queue | Matchmaking queue, heartbeat coordination |
| Redis | 7.x | Cache + pub/sub | WebSocket room management, rate limiting, real-time state |
| @openzeppelin/contracts | 5.x | Audited contract bases | Access control, Pausable, ReentrancyGuard |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Turborepo | Monorepo management | apps/web, apps/api, packages/contracts, packages/skill |
| Vitest | Testing | Unit + integration tests |
| ESLint + Prettier | Linting/formatting | Consistent code style |
| Docker Compose | Local dev environment | PostgreSQL + Redis + API together |

## Installation

```bash
# Monorepo setup
npx create-turbo@latest soulpair

# Frontend (apps/web)
npm install next@latest react react-dom wagmi viem @tanstack/react-query zustand tailwindcss framer-motion

# Backend (apps/api)
npm install ws express @prisma/client bullmq ioredis zod pinata

# Contracts (packages/contracts)
npm install -D hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts

# Shared types
npm install -D typescript zod
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js | Vite + React | Eğer SSR gerekmiyorsa, ama dashboard SEO + ilk yükleme hızı için SSR lazım |
| ws | Socket.IO | Eğer otomatik reconnection/rooms gerekiyorsa, ama ws + Redis pub/sub daha hafif |
| PostgreSQL | MongoDB | Eğer schema-less veri çoksa, ama ilişkisel veri (user↔match↔conversation) SQL'e daha uygun |
| Hardhat | Foundry | Eğer Solidity-first test istiyorsan, ama TypeScript ekosistemiyle entegrasyon Hardhat'ta daha kolay |
| ethers.js | web3.js | Eğer legacy proje varsa, ethers.js v6 daha modern ve type-safe |
| BullMQ | Agenda.js | Eğer MongoDB kullanıyorsan, ama Redis-based BullMQ daha performanslı |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Socket.IO | Overengineered for agent-to-agent DM, adds unnecessary overhead | ws + custom protocol |
| Firebase | Vendor lock-in, Monad on-chain data ile redundant | PostgreSQL + Redis |
| GraphQL | Overengineered for this use case, REST + WebSocket yeterli | REST API + WebSocket events |
| Mongoose | MongoDB'ye bağlı, ilişkisel veri modeli için uygun değil | Prisma + PostgreSQL |
| TRPC | Güzel ama WebSocket kısmı karmaşıklaşır | Plain REST + ws |

## Stack Patterns

**Monorepo Yapısı:**
```
soulpair/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Node.js backend (Express + WebSocket)
├── packages/
│   ├── contracts/    # Solidity smart contracts
│   ├── shared/       # Shared types, schemas, utils
│   └── skill/        # OpenClaw skill files
├── turbo.json
└── package.json
```

**WebSocket Message Protocol:**
```typescript
// Typed WebSocket messages
type WSMessage =
  | { type: 'conversation:start'; matchId: string; agentA: string; agentB: string }
  | { type: 'conversation:message'; matchId: string; from: string; content: string }
  | { type: 'conversation:end'; matchId: string; result: 'match' | 'no-match'; reason: string }
  | { type: 'match:new'; match: MatchData }
  | { type: 'stats:update'; stats: DashboardStats }
```

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 15 | React 19 | App Router stable |
| wagmi 2.x | viem 2.x | Must match major versions |
| ethers.js 6.x | Hardhat 2.22+ | Hardhat ethers plugin v3 gerekli |
| Prisma 6.x | PostgreSQL 14+ | JSON column support gerekli |

## Sources

- Next.js official docs — App Router, API routes, WebSocket
- Monad docs — EVM compatibility, RPC endpoints
- OpenClaw docs — Skill format, cron jobs, agent-browser
- Pinata docs — SDK v3, IPFS pinning API
- wagmi docs — MetaMask integration, chain config

---
*Stack research for: AI Agent Dating Protocol*
*Researched: 2026-02-28*
