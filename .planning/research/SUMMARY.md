# Project Research Summary

**Project:** Soulpair
**Domain:** AI Agent Dating Protocol (Web3 + OpenClaw + Real-time)
**Researched:** 2026-02-28
**Confidence:** HIGH

## Executive Summary

Soulpair, AI ajanlarının birbirleriyle flörtleştiği benzersiz bir dating protokolü. Mevcut dating app'lerden farklı olarak, eşleşme süreci tamamen AI tarafından yönetiliyor. Teknik olarak 3 ana katmandan oluşuyor: (1) OpenClaw skill — kullanıcı tarafında veri toplama ve ajan çalıştırma, (2) Soulpair Platform — eşleşme koordinasyonu, WebSocket DM, live dashboard, (3) Monad Blockchain — on-chain profil ve match kayıtları.

Önerilen yaklaşım monorepo (Turborepo) ile Next.js frontend + Express/ws backend + Solidity contracts yapısı. Kritik risk alanları: WebSocket connection yönetimi, matchmaking fairness, AI halüsinasyonu kontrolü ve düşük kullanıcı sayısında "ölü platform" hissi. Bu risklerin hepsi doğru fazlamada ve prompt mühendisliğiyle yönetilebilir.

Pazar tamamen yeni — AI agent dating kesişiminde ciddi rakip yok. İlk hamle avantajı büyük. "AI Reality Show" dashboard konsepti viral potansiyel taşıyor.

## Key Findings

### Recommended Stack

Monorepo yapısında Next.js 15 (App Router) frontend, Express + ws backend, Solidity smart contracts. Veri katmanı PostgreSQL + Redis (off-chain) + Monad (on-chain) + Pinata IPFS hibrit model.

**Core technologies:**
- **Next.js 15**: SSR dashboard, wagmi wallet hooks, App Router
- **ws + Redis pub/sub**: Agent DM rooms, dashboard live feed
- **Solidity + Hardhat**: SoulProfile + MatchRegistry contracts (Monad EVM)
- **BullMQ**: Matchmaking kuyruğu, heartbeat processing
- **Pinata SDK**: flirt.md + conversation log IPFS pinning

### Expected Features

**Must have (table stakes):**
- MetaMask wallet bağlantısı + on-chain profil
- OpenClaw skill (flirt.md üretimi)
- Heartbeat + matchmaking + agent DM
- Live dashboard (konuşmalar + stats)
- Kullanıcı onay mekanizması

**Should have (competitive):**
- Rejection feedback (AI dating coach)
- Google Calendar entegrasyonu
- Dinamik match fee
- Leaderboard

**Defer (v2+):**
- Ajan kişilik modu, grup date, Spotify/Letterboxd, mobil app

### Architecture Approach

İki taraflı mimari: OpenClaw (kullanıcı tarafı) + Soulpair Platform (merkezi koordinasyon). Veri akışı: Skill → flirt.md → IPFS → API → Matchmaker → WebSocket DM → Sonuç → On-chain. On-chain sadece profil + match (gas optimizasyonu), geri kalan off-chain.

**Major components:**
1. **OpenClaw Skill** — veri toplama, flirt.md üretimi, heartbeat cron
2. **Soulpair API** — eşleşme ataması, WebSocket server, conversation manager
3. **Next.js Dashboard** — live feed, profil sayfaları, wallet connection
4. **Smart Contracts** — SoulProfile, MatchRegistry, FeeManager (Monad)
5. **IPFS (Pinata)** — flirt.md ve conversation log depolama

### Critical Pitfalls

1. **WebSocket bağlantı yönetimi** — reconnection, timeout, ghost room'lar. Conversation state'i DB'de persist et.
2. **Matchmaking starvation** — round-robin eşleşme, 24h tekrar eşleşme yasağı, fairness metrikleri.
3. **AI halüsinasyonu** — strict prompt: "sadece flirt.md'deki bilgileri kullan", structured confidence output.
4. **Gas patlaması** — on-chain SADECE profil + match, geri kalan off-chain.
5. **Ölü platform hissi** — demo ajanlar (label'lı), waiting list, 7 günlük stats.

## Implications for Roadmap

### Phase 1: Project Foundation & Monorepo Setup
**Rationale:** Her şeyin temeli — monorepo, DB, config, shared types
**Delivers:** Çalışan proje yapısı, dev environment
**Addresses:** Development infrastructure
**Avoids:** Dağınık proje yapısı, dependency karmaşası

### Phase 2: Smart Contracts (Monad)
**Rationale:** On-chain identity layer her şeyden önce gerekli
**Delivers:** SoulProfile, MatchRegistry, FeeManager contracts
**Addresses:** Blockchain identity, match recording, fee collection
**Avoids:** Gas patlaması (minimal on-chain data)

### Phase 3: Backend API & Database
**Rationale:** Frontend ve skill'in bağlanacağı merkezi API
**Delivers:** REST endpoints, Prisma schema, Redis setup
**Addresses:** Profil kayıt, eşleşme kuyruğu, stats
**Avoids:** Off-chain data yönetim sorunları

### Phase 4: WebSocket Server & Agent DM
**Rationale:** Core feature — ajanların konuşması
**Delivers:** WS server, room management, message routing, conversation persistence
**Addresses:** Real-time agent communication
**Avoids:** WS connection yönetimi pitfall'ları

### Phase 5: Matchmaking Engine
**Rationale:** Heartbeat → eşleşme pipeline'ı
**Delivers:** BullMQ matchmaker, fairness algoritması, rate limiting
**Addresses:** Eşleşme ataması, queue yönetimi
**Avoids:** Matchmaking starvation

### Phase 6: OpenClaw Skill
**Rationale:** Kullanıcı tarafı — veri toplama, flirt.md, heartbeat
**Delivers:** SKILL.md, onboarding prompts, matchmaker prompts, IPFS upload
**Addresses:** Kullanıcı onboarding, AI profil oluşturma
**Avoids:** Context overflow, halüsinasyon

### Phase 7: Frontend — Wallet & Profile
**Rationale:** Kullanıcının platforma girişi
**Delivers:** MetaMask bağlantı, profil sayfası, flirt.md görüntüleme
**Addresses:** Web3 identity, on-chain profil oluşturma
**Avoids:** Wallet UX sorunları

### Phase 8: Frontend — Live Dashboard
**Rationale:** Ürünün "wow" faktörü — AI Reality Show
**Delivers:** Live conversation feed, stats, leaderboard, empty states
**Addresses:** Entertainment value, FOMO, kullanıcı çekme
**Avoids:** Ölü platform hissi

### Phase 9: Match Flow & User Approval
**Rationale:** Eşleşme sonucu → kullanıcı onayı → takvim
**Delivers:** Match notification, approval UI, rejection feedback, Calendar integration
**Addresses:** End-to-end match flow
**Avoids:** Onaysız date problemi

### Phase 10: On-chain Integration & Fee System
**Rationale:** Profil ve match'leri on-chain kaydet, fee topla
**Delivers:** Contract interaction, fee payment flow, on-chain match recording
**Addresses:** Monetizasyon, radikal şeffaflık
**Avoids:** Gas patlaması (batch tx)

### Phase 11: Polish, Testing & Launch Prep
**Rationale:** Production readiness
**Delivers:** Error handling, monitoring, demo data, performance optimization
**Addresses:** Launch kalitesi
**Avoids:** "Looks done but isn't" pitfall'ları

### Phase Ordering Rationale

- **Contracts önce** çünkü profil yapısı her şeyi belirler (ABI types shared'a geçer)
- **Backend önce frontend** çünkü frontend backend'e bağımlı
- **WebSocket önce matchmaking** çünkü matchmaking WS room açar
- **Skill paralel çalışabilir** backend ile — bağımsız geliştirilebilir
- **Dashboard en son** çünkü gösterecek veri lazım (DM + matchmaking)

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (WebSocket):** Room management patterns, reconnection handling
- **Phase 5 (Matchmaking):** Fairness algoritmaları, queue patterns
- **Phase 6 (Skill):** OpenClaw skill best practices, prompt engineering

Phases with standard patterns (skip research-phase):
- **Phase 1 (Monorepo):** Well-established Turborepo patterns
- **Phase 2 (Contracts):** Standard EVM contract patterns
- **Phase 7 (Wallet):** Standard wagmi/viem patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Bilinen, kanıtlanmış teknolojiler |
| Features | HIGH | PRD çok detaylı, kullanıcı gereksinimleri net |
| Architecture | HIGH | Hibrit on/off-chain pattern well-established |
| Pitfalls | HIGH | Dating app + Web3 + real-time pitfall'ları biliniyor |

**Overall confidence:** HIGH

### Gaps to Address

- **Monad mainnet gas costs:** Testnet'te test et, mainnet'e geçişte gas estimation doğrula
- **OpenClaw cron reliability:** Uzun süreli cron job stability testi gerekli
- **LLM matchmaking prompt kalitesi:** A/B test ile optimize edilmeli
- **Pinata rate limits:** Yüksek volume'da pinning hızı test edilmeli

## Sources

### Primary (HIGH confidence)
- OpenClaw docs (docs.openclaw.ai) — skills, cron, agent-browser, tools
- Monad docs — EVM compatibility, gas model
- Pinata docs — SDK v3, pinning API

### Secondary (MEDIUM confidence)
- Dating app market analysis — Tinder/Bumble patterns
- WebSocket scaling patterns — production case studies

---
*Research completed: 2026-02-28*
*Ready for roadmap: yes*
