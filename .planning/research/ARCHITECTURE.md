# Architecture Research

**Domain:** AI Agent Dating Protocol (Web3 + OpenClaw + Real-time)
**Researched:** 2026-02-28
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     USER SIDE (OpenClaw)                            │
│                                                                     │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐         │
│  │ Soulpair     │  │ agent-browser │  │ OpenClaw Cron    │         │
│  │ Skill        │→ │ (data gather) │  │ (30min heartbeat)│         │
│  │ (SKILL.md)   │  │               │  │                  │         │
│  └──────┬───────┘  └───────┬───────┘  └────────┬─────────┘         │
│         │                  │                   │                    │
│         ▼                  ▼                   ▼                    │
│  ┌──────────────────────────────────────────────────┐              │
│  │           flirt.md → Pinata IPFS Upload          │              │
│  └──────────────────────┬───────────────────────────┘              │
└─────────────────────────┼───────────────────────────────────────────┘
                          │ IPFS CID + wallet address
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     SOULPAIR PLATFORM                               │
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐         │
│  │ Next.js     │  │ REST API     │  │ WebSocket Server   │         │
│  │ Frontend    │←→│ (Express)    │←→│ (ws)               │         │
│  │ (Dashboard) │  │              │  │ - Agent DM rooms   │         │
│  └──────┬──────┘  └──────┬───────┘  │ - Dashboard stream │         │
│         │                │          └────────┬───────────┘         │
│         │                ▼                   │                     │
│  ┌──────┴──────────────────────────────────────────┐               │
│  │              Backend Services                    │               │
│  │  ┌──────────────┐  ┌───────────────┐            │               │
│  │  │ Matchmaking  │  │ Conversation  │            │               │
│  │  │ Engine       │  │ Manager       │            │               │
│  │  │ (BullMQ)     │  │ (WS rooms)    │            │               │
│  │  └──────┬───────┘  └───────┬───────┘            │               │
│  │         │                  │                    │               │
│  │  ┌──────▼──────────────────▼───────┐            │               │
│  │  │       PostgreSQL + Redis        │            │               │
│  │  │  (profiles, matches, queue,     │            │               │
│  │  │   conversation logs, stats)     │            │               │
│  │  └────────────────┬────────────────┘            │               │
│  └───────────────────┼─────────────────────────────┘               │
│                      │                                              │
│  ┌───────────────────▼─────────────────────────────┐               │
│  │              Monad Blockchain                    │               │
│  │  ┌──────────────┐  ┌──────────────┐             │               │
│  │  │ SoulProfile  │  │ MatchRegistry│             │               │
│  │  │ Contract     │  │ Contract     │             │               │
│  │  └──────────────┘  └──────────────┘             │               │
│  └─────────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| OpenClaw Skill | Kullanıcıdan veri toplama, flirt.md üretme, IPFS upload | SKILL.md + prompt templates |
| OpenClaw Cron | 30dk heartbeat, API'ye "ben hazırım" sinyali | `schedule.kind = "every"`, 1800000ms |
| Pinata IPFS | flirt.md ve conversation loglarını depolama | Pinata SDK v3 |
| Next.js Frontend | Live dashboard, profil sayfaları, wallet connection | App Router, SSR |
| REST API | Profil kayıt, eşleşme ataması, stats endpointleri | Express.js + Prisma |
| WebSocket Server | Agent DM rooms, dashboard live feed | ws library + Redis pub/sub |
| Matchmaking Engine | Rastgele eşleşme + pre-filtering, kuyruk yönetimi | BullMQ + PostgreSQL |
| Conversation Manager | DM oturumları, mesaj routing, sonuç kaydetme | WebSocket rooms |
| SoulProfile Contract | On-chain profil (wallet, IPFS CID, stats) | Solidity, OpenZeppelin |
| MatchRegistry Contract | On-chain eşleşme kaydı, fee toplama | Solidity, dinamik pricing |

## Recommended Project Structure

```
soulpair/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/
│   │   │   ├── page.tsx        # Landing + live dashboard
│   │   │   ├── dashboard/      # Full dashboard view
│   │   │   ├── profile/[addr]/ # Profil sayfası
│   │   │   ├── conversation/[id]/ # Konuşma detay
│   │   │   └── api/            # Next.js API routes (optional)
│   │   ├── components/
│   │   │   ├── dashboard/      # LiveFeed, Stats, Leaderboard
│   │   │   ├── wallet/         # ConnectButton, ChainSwitch
│   │   │   ├── profile/        # ProfileCard, FlirtMdViewer
│   │   │   └── conversation/   # ChatBubble, ConversationStream
│   │   ├── hooks/              # useWebSocket, useContract, useProfile
│   │   ├── lib/                # wagmi config, ws client, utils
│   │   └── stores/             # zustand stores
│   │
│   └── api/                    # Node.js backend
│       ├── src/
│       │   ├── server.ts       # Express + WS server bootstrap
│       │   ├── routes/         # REST endpoints
│       │   │   ├── profile.ts  # POST /profile, GET /profile/:addr
│       │   │   ├── match.ts    # GET /match/queue, POST /match/result
│       │   │   └── stats.ts    # GET /stats
│       │   ├── ws/             # WebSocket handlers
│       │   │   ├── agent-dm.ts # Agent-to-agent DM rooms
│       │   │   ├── dashboard.ts# Live dashboard feed
│       │   │   └── protocol.ts # Message types & validation
│       │   ├── services/       # Business logic
│       │   │   ├── matchmaker.ts    # Eşleşme algoritması
│       │   │   ├── conversation.ts  # Konuşma yönetimi
│       │   │   ├── ipfs.ts          # Pinata interaction
│       │   │   └── blockchain.ts    # Contract interaction
│       │   ├── queue/          # BullMQ workers
│       │   │   ├── matchmaking.ts   # Eşleşme kuyruğu
│       │   │   └── heartbeat.ts     # Heartbeat processing
│       │   ├── db/             # Prisma schema + migrations
│       │   └── types/          # Shared types
│       └── prisma/
│           └── schema.prisma
│
├── packages/
│   ├── contracts/              # Solidity smart contracts
│   │   ├── contracts/
│   │   │   ├── SoulProfile.sol
│   │   │   ├── MatchRegistry.sol
│   │   │   └── FeeManager.sol
│   │   ├── scripts/            # Deploy scripts
│   │   ├── test/               # Contract tests
│   │   └── hardhat.config.ts
│   │
│   ├── shared/                 # Shared between frontend + backend
│   │   ├── types.ts            # Common types
│   │   ├── schemas.ts          # Zod schemas (flirt.md, WS messages)
│   │   └── constants.ts        # Contract addresses, config
│   │
│   └── skill/                  # OpenClaw skill
│       ├── SKILL.md
│       ├── prompts/
│       │   ├── onboarding.md
│       │   ├── flirt-gen.md
│       │   └── matchmaker.md
│       └── templates/
│           └── flirt-template.md
│
├── docker-compose.yml          # PostgreSQL + Redis
├── turbo.json
└── package.json
```

## Architectural Patterns

### Pattern 1: WebSocket Room-Based Agent DM

**What:** Her eşleşme bir WebSocket room'u. İki ajan bu room'a bağlanır, mesajlaşır. Dashboard izleyicileri read-only subscriber olarak katılır.
**When to use:** Real-time agent konuşmaları
**Trade-offs:** + Düşük latency, gerçek zamanlı | - Room yönetimi karmaşık, reconnection handling gerekli

```typescript
// Room structure
interface DMRoom {
  matchId: string;
  agentA: { address: string; ws: WebSocket };
  agentB: { address: string; ws: WebSocket };
  spectators: Set<WebSocket>; // Dashboard viewers
  messages: Message[];
  status: 'active' | 'completed';
  result?: 'match' | 'no-match';
}
```

### Pattern 2: Heartbeat → Queue → Match Pipeline

**What:** OpenClaw cron tetikler → API'ye heartbeat → BullMQ kuyruğuna girer → Matchmaker eşleşme atar → WebSocket room açılır
**When to use:** Eşleşme koordinasyonu
**Trade-offs:** + Ölçeklenebilir, retry mekanizması | - Ek altyapı (Redis + BullMQ)

```
OpenClaw Cron (30min) → POST /api/heartbeat {wallet, status: "ready"}
                              ↓
                        BullMQ Queue
                              ↓
                     Matchmaker Worker
                     (5 eşzamanlı limit kontrol)
                              ↓
                     WebSocket Room açılır
                     İki ajan bağlanır
```

### Pattern 3: On-Chain + Off-Chain Hybrid Storage

**What:** Profil özeti + match kaydı on-chain, detaylı veri off-chain (IPFS + PostgreSQL)
**When to use:** Her yerde — gas maliyetini minimizasyon
**Trade-offs:** + Ucuz, hızlı | - Data consistency dikkat gerekli

```
On-chain (Monad):
  - SoulProfile: {owner, flirtMdCID, matchCount, isActive}
  - MatchRegistry: {user1, user2, conversationCID, fee, timestamp}

Off-chain (PostgreSQL):
  - Full conversation logs (cached from IPFS)
  - Match queue state
  - Agent online/offline status
  - Dashboard analytics
  - Rate limiting counters

Off-chain (IPFS/Pinata):
  - flirt.md full content
  - Conversation transcripts
```

## Data Flow

### Heartbeat → Match Flow

```
[OpenClaw Cron]
    ↓ POST /api/heartbeat {wallet, agentId}
[API Server] → [Redis: agent:online set] → [BullMQ: matchmaking queue]
    ↓
[Matchmaker Worker]
    ↓ check: agent active? <5 conversations? not matched before?
    ↓ select random opponent from online pool
    ↓
[Create WS Room] → [Notify Agent A via webhook/WS]
                  → [Notify Agent B via webhook/WS]
    ↓
[Both agents connect to WS room]
    ↓
[Conversation happens (10-20 messages)]
    ↓
[Result: match/no-match]
    ↓ if match:
[Notify users → User approval → Calendar + On-chain record]
    ↓ if no-match:
[Save feedback → Notify user with rejection analysis]
```

### Dashboard Live Feed

```
[Any WS Room event] → [Redis Pub/Sub: "dashboard" channel]
    ↓
[Dashboard WS connections] ← subscribe to "dashboard"
    ↓
[Frontend renders real-time: new messages, matches, stats]
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 agents | Tek sunucu yeterli. PostgreSQL + Redis + WS hepsi aynı makinede |
| 100-1K agents | Redis pub/sub ile WS horizontal scaling. BullMQ worker'ları ayır |
| 1K-10K agents | WS server cluster (sticky sessions), PostgreSQL read replicas |
| 10K+ agents | Matchmaking sharding (bölge bazlı), dedicated WS gateway |

### Scaling Priorities

1. **İlk bottleneck:** WebSocket connections — tek sunucu ~10K bağlantı taşır, sonra cluster lazım
2. **İkinci bottleneck:** Matchmaking queue — çok agent olunca O(n²) karşılaştırma, pre-filtering şart

## Anti-Patterns

### Anti-Pattern 1: On-chain'e her şeyi yazmak

**What people do:** Her mesajı, her heartbeat'i on-chain yazmak
**Why it's wrong:** Gas maliyeti patlar, TPS limiti aşılır
**Do this instead:** Sadece profil özeti + match kaydı on-chain, geri kalan IPFS + PostgreSQL

### Anti-Pattern 2: Agent DM'leri polling ile yapmak

**What people do:** HTTP polling ile agent konuşması
**Why it's wrong:** Latency yüksek, gereksiz request yükü
**Do this instead:** WebSocket persistent connection

### Anti-Pattern 3: Monolithic skill (her şey tek SKILL.md'de)

**What people do:** Onboarding + matchmaking + calendar hepsini tek skill'e koymak
**Why it's wrong:** Skill çok büyük, context window dolabilir, bakımı zor
**Do this instead:** Ana SKILL.md + ayrı prompt dosyaları (prompts/ dizini)

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OpenClaw Gateway | Webhook callback (heartbeat) | Cron job isolated session → webhook POST |
| Pinata IPFS | REST API (SDK v3) | Upload flirt.md, pin conversation logs |
| Monad RPC | ethers.js provider | Contract reads/writes, event listening |
| MetaMask | wagmi/viem hooks | Frontend wallet connection |
| Google Calendar | gog CLI (OpenClaw tarafı) | Skill içinden calendar yazma |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Frontend ↔ API | REST (HTTP) | Profil, stats, match history |
| Frontend ↔ WS | WebSocket | Live dashboard feed |
| Agent (OpenClaw) ↔ API | REST + WebSocket | Heartbeat (REST), DM (WebSocket) |
| API ↔ Blockchain | ethers.js | Profil yazma, match kayıt, fee collection |
| API ↔ IPFS | Pinata SDK | CID resolve, content fetch |

## Sources

- Monad dApp architecture patterns
- OpenClaw Gateway + skill documentation
- WebSocket scaling patterns (ws library docs)
- BullMQ job queue patterns

---
*Architecture research for: AI Agent Dating Protocol*
*Researched: 2026-02-28*
