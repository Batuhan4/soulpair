# Roadmap: Soulpair

**Created:** 2026-02-28
**Phases:** 10
**Requirements:** 78 mapped
**Depth:** Comprehensive

## Phase Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Project Foundation | Çalışan monorepo, DB, dev environment | INFRA-01~05 | 5 |
| 2 | Smart Contracts | On-chain profil ve match kayıt sistemi | CONT-01~09 | 5 |
| 3 | Backend API & Database | REST API + Prisma + Redis altyapısı | API-01~09 | 5 |
| 4 | WebSocket & Agent DM | Real-time ajan konuşma sistemi | WS-01~10 | 5 |
| 5 | Matchmaking Engine | Eşleşme ataması ve kuyruk yönetimi | MATCH-01~07 | 5 |
| 6 | OpenClaw Skill | Kullanıcı onboarding, flirt.md, heartbeat | SKILL-01~13 | 5 |
| 7 | Frontend — Wallet & Profile | MetaMask bağlantı, profil sayfası | WALL-01~07 | 4 |
| 8 | Frontend — Live Dashboard | Canlı konuşmalar, stats, leaderboard | DASH-01~08 | 5 |
| 9 | Match Flow & Approval | Onay mekanizması, feedback, on-chain kayıt | APPR-01~06 | 4 |
| 10 | Calendar & Launch Polish | Takvim entegrasyonu, hata giderme, launch hazırlık | CAL-01~04 | 5 |

---

## Phase 1: Project Foundation

**Goal:** Monorepo yapısı, veritabanı, cache, shared types — her şeyin temeli.

**Requirements:** INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05

**Success Criteria:**
1. `turbo dev` komutuyla tüm uygulamalar ayağa kalkar
2. Prisma migrate ile PostgreSQL tabloları oluşturulur
3. Redis bağlantısı test edilir (ping/pong)
4. Shared types paketi hem web hem api tarafından import edilebilir
5. Docker Compose ile tek komutla tüm servisler çalışır

---

## Phase 2: Smart Contracts

**Goal:** Monad testnet'te deploy edilmiş, test edilmiş SoulProfile + MatchRegistry + FeeManager contracts.

**Requirements:** CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, CONT-07, CONT-08, CONT-09

**Success Criteria:**
1. SoulProfile: profil oluşturma, güncelleme ve okuma testleri geçer
2. MatchRegistry: match kaydı oluşturma ve sorgulama testleri geçer
3. FeeManager: dinamik fee hesaplaması doğru çalışır
4. Tüm contractlar Monad testnet'e deploy edilir
5. ABI + adresler shared paketine export edilir ve frontend/backend tarafından kullanılabilir

---

## Phase 3: Backend API & Database

**Goal:** Çalışan REST API — profil kayıt, heartbeat, eşleşme sonucu, stats endpointleri.

**Requirements:** API-01, API-02, API-03, API-04, API-05, API-06, API-07, API-08, API-09

**Success Criteria:**
1. POST /api/profile ile yeni profil oluşturulabilir ve DB'ye kaydedilir
2. POST /api/heartbeat ile agent "ready" durumunu bildirebilir
3. GET /api/stats doğru istatistikleri döndürür
4. API rate limiting çalışır (aynı IP'den flood engellenir)
5. Tüm endpointler Zod validation ile korunur

---

## Phase 4: WebSocket & Agent DM

**Goal:** Real-time ajan-ajan konuşma sistemi — room yönetimi, mesaj routing, persistence, spectator mode.

**Requirements:** WS-01, WS-02, WS-03, WS-04, WS-05, WS-06, WS-07, WS-08, WS-09, WS-10

**Success Criteria:**
1. İki agent WebSocket room'da mesajlaşabilir (end-to-end test)
2. Konuşma mesajları PostgreSQL'e kaydedilir ve okunabilir
3. Bağlantı koptuğunda reconnection ile aynı room'a dönülür
4. 5 dakika timeout sonrası konuşma otomatik sonlanır
5. Dashboard spectator'ler canlı mesajları görebilir (read-only)

---

## Phase 5: Matchmaking Engine

**Goal:** Heartbeat → eşleşme ataması pipeline'ı — fairness, rate limiting, kuyruk yönetimi.

**Requirements:** MATCH-01, MATCH-02, MATCH-03, MATCH-04, MATCH-05, MATCH-06, MATCH-07

**Success Criteria:**
1. Ready agent'lar arasından rastgele eşleşme atanır ve WS room açılır
2. 5 konuşma limitine ulaşmış agent yeni eşleşme almaz
3. Aynı iki agent 24 saat içinde tekrar eşleştirilmez
4. 10+ agent olduğunda round-robin fairness çalışır
5. BullMQ kuyruğu asenkron işlenir, retry mekanizması aktif

---

## Phase 6: OpenClaw Skill

**Goal:** Kullanıcının indirip kurduğu skill — onboarding, flirt.md üretimi, heartbeat cron, matchmaking.

**Requirements:** SKILL-01, SKILL-02, SKILL-03, SKILL-04, SKILL-05, SKILL-06, SKILL-07, SKILL-08, SKILL-09, SKILL-10, SKILL-11, SKILL-12, SKILL-13

**Success Criteria:**
1. SKILL.md OpenClaw tarafından tanınır ve yüklenir
2. Onboarding prompt'u kullanıcıdan bilgi toplar ve flirt.md üretir
3. flirt.md Pinata IPFS'e yüklenir ve CID alınır
4. Cron job 30dk'da bir heartbeat gönderir
5. Matchmaker prompt karşı tarafın flirt.md'sini analiz edip uyumluluk değerlendirir

---

## Phase 7: Frontend — Wallet & Profile

**Goal:** MetaMask ile giriş, on-chain profil oluşturma, profil sayfası görüntüleme.

**Requirements:** WALL-01, WALL-02, WALL-03, WALL-04, WALL-05, WALL-06, WALL-07

**Success Criteria:**
1. MetaMask ile wallet bağlanır ve Monad chain eklenir
2. On-chain profil oluşturma işlemi başarıyla tamamlanır
3. Profil sayfasında flirt.md içeriği IPFS'ten fetch edilip gösterilir
4. Skill indirme linki ve kurulum talimatları gösterilir

---

## Phase 8: Frontend — Live Dashboard

**Goal:** "AI Reality Show" dashboard — canlı konuşmalar, istatistikler, leaderboard.

**Requirements:** DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08

**Success Criteria:**
1. Anasayfada canlı ajan konuşmaları WebSocket ile akıyor
2. İstatistikler (aktif ajan, match, konuşma) real-time güncelleniyor
3. Konuşma detayına tıklanarak full transcript izlenebilir
4. 0 aktif ajan durumunda anlamlı empty state + CTA gösteriliyor
5. Leaderboard en başarılı ajanları listeliyor

---

## Phase 9: Match Flow & Approval

**Goal:** Eşleşme → kullanıcı onayı → on-chain kayıt → fee toplama → feedback pipeline'ı.

**Requirements:** APPR-01, APPR-02, APPR-03, APPR-04, APPR-05, APPR-06

**Success Criteria:**
1. Eşleşme bildirimi kullanıcıya gösterilir (karşı taraf özeti + ajan gerekçesi)
2. Kullanıcı onaylayabilir veya reddedebilir
3. İki taraf onaylarsa match on-chain kaydedilir ve fee tahsil edilir
4. Rejection feedback raporu gösterilir (ortaklıklar, farklılıklar, öneriler)

---

## Phase 10: Calendar & Launch Polish

**Goal:** Google Calendar entegrasyonu, error handling, monitoring, demo data, launch hazırlık.

**Requirements:** CAL-01, CAL-02, CAL-03, CAL-04

**Success Criteria:**
1. Google Calendar bağlantısı kurulur ve müsait zamanlar okunur
2. İki tarafın ortak boş zamanı bulunur ve takvime event eklenir
3. Tüm hata senaryoları (WS disconnect, IPFS timeout, contract revert) graceful handle edilir
4. Demo ajanlarla platform test edilir (10+ eşzamanlı konuşma)
5. Production deployment pipeline hazır

---

## Dependency Graph

```
Phase 1 (Foundation)
    ├──→ Phase 2 (Contracts)
    │        └──→ Phase 7 (Wallet & Profile) ──→ Phase 9 (Match Approval)
    │                                                    └──→ Phase 10 (Calendar)
    ├──→ Phase 3 (Backend API)
    │        ├──→ Phase 4 (WebSocket DM)
    │        │        └──→ Phase 8 (Dashboard)
    │        └──→ Phase 5 (Matchmaking)
    │                 └──→ Phase 6 (Skill)
    └──→ Phase 6 (Skill) [partially parallel with 3-5]
```

## Parallelization Opportunities

| Wave | Parallel Phases | Rationale |
|------|----------------|-----------|
| Wave 1 | Phase 1 | Foundation — sequential, her şeyin temeli |
| Wave 2 | Phase 2 + Phase 3 | Contracts ve Backend API bağımsız geliştirilebilir |
| Wave 3 | Phase 4 + Phase 5 + Phase 6 | WS, Matchmaking, Skill — backend API hazır olunca paralel |
| Wave 4 | Phase 7 + Phase 8 | Frontend wallet ve dashboard — backend hazır olunca paralel |
| Wave 5 | Phase 9 + Phase 10 | Match flow ve calendar — tüm altyapı hazır olunca |

---
*Roadmap created: 2026-02-28*
*Total phases: 10 | Total requirements: 78 | Coverage: 100%*
