# Requirements: Soulpair

**Defined:** 2026-02-28
**Core Value:** AI ajanın senin yerine 7/24 flört ediyor — uygun birini bulursa takvimine date koyuyor.

## v1 Requirements

### Infrastructure

- [ ] **INFRA-01**: Monorepo yapısı (Turborepo) çalışır durumda — apps/web, apps/api, packages/contracts, packages/shared, packages/skill
- [ ] **INFRA-02**: PostgreSQL veritabanı bağlantısı ve Prisma schema tanımlı
- [ ] **INFRA-03**: Redis bağlantısı aktif (cache + pub/sub + rate limiting)
- [ ] **INFRA-04**: Docker Compose ile lokal geliştirme ortamı (PostgreSQL + Redis)
- [ ] **INFRA-05**: Shared types paketi frontend ve backend tarafından kullanılabilir

### Smart Contracts

- [ ] **CONT-01**: SoulProfile contract — kullanıcı profil oluşturabilir (wallet, flirtMdCID, isActive)
- [ ] **CONT-02**: SoulProfile contract — profil güncelleyebilir (flirtMdCID, isActive toggle)
- [ ] **CONT-03**: SoulProfile contract — profil bilgilerini on-chain okuyabilir (herkes)
- [ ] **CONT-04**: MatchRegistry contract — başarılı eşleşmeyi on-chain kaydedebilir (user1, user2, conversationCID, fee)
- [ ] **CONT-05**: MatchRegistry contract — match fee toplayabilir (MON transfer)
- [ ] **CONT-06**: MatchRegistry contract — match geçmişini sorgulayabilir (per-user ve global)
- [ ] **CONT-07**: FeeManager contract — performans bazlı dinamik fee hesaplayabilir
- [ ] **CONT-08**: Contracts Monad testnet'e deploy edilebilir
- [ ] **CONT-09**: Contract ABI'leri shared paketine export edilir

### Backend API

- [ ] **API-01**: POST /api/profile — yeni profil kaydedebilir (wallet address + flirtMdCID)
- [ ] **API-02**: GET /api/profile/:address — profil bilgilerini getirebilir (IPFS'ten flirt.md dahil)
- [ ] **API-03**: POST /api/heartbeat — agent heartbeat alabilir (wallet, agentId, status: ready)
- [ ] **API-04**: GET /api/match/queue — agent için bekleyen eşleşme ataması döndürebilir
- [ ] **API-05**: POST /api/match/result — konuşma sonucunu kaydedebilir (match/no-match + reason)
- [ ] **API-06**: GET /api/stats — dashboard istatistiklerini döndürebilir (aktif ajan, match sayısı, konuşma sayısı)
- [ ] **API-07**: GET /api/matches/:address — kullanıcının match geçmişini döndürebilir
- [ ] **API-08**: POST /api/match/approve — kullanıcı match'i onaylayabilir veya reddedebilir
- [ ] **API-09**: API rate limiting aktif (Redis bazlı, IP + wallet)

### WebSocket & Agent DM

- [ ] **WS-01**: WebSocket server aktif ve bağlantı kabul edebilir
- [ ] **WS-02**: Agent wallet signature ile authenticate olabilir
- [ ] **WS-03**: Eşleşme atamasında iki agent için DM room açılabilir
- [ ] **WS-04**: Agent'lar DM room'unda mesaj gönderip alabilir (real-time)
- [ ] **WS-05**: Konuşma mesajları PostgreSQL'e persist edilir
- [ ] **WS-06**: Konuşma sonucu (match/no-match) room'a broadcast edilir
- [ ] **WS-07**: Bağlantı koptuğunda reconnection token ile aynı room'a dönülebilir
- [ ] **WS-08**: 5 dakika cevapsız konuşma otomatik sonlandırılır (timeout)
- [ ] **WS-09**: Dashboard viewer'lar konuşmaları read-only izleyebilir (spectator mode)
- [ ] **WS-10**: Dashboard'a canlı stats güncellemesi broadcast edilir

### Matchmaking

- [ ] **MATCH-01**: Heartbeat alan agent'lardan rastgele eşleşme ataması yapılabilir
- [ ] **MATCH-02**: Agent başına max 5 eşzamanlı konuşma limiti kontrol edilir
- [ ] **MATCH-03**: Agent başına max 2 aktif eşleşme limiti kontrol edilir
- [ ] **MATCH-04**: Aynı iki agent 24 saat içinde tekrar eşleştirilmez
- [ ] **MATCH-05**: BullMQ kuyruğu ile eşleşme işlemi asenkron işlenir
- [ ] **MATCH-06**: Round-robin fairness — her agent sırayla eşleşme alır
- [ ] **MATCH-07**: Agent "meşgul" (5 konuşma dolu) ise kuyruktan çıkar, boşalınca geri girer

### OpenClaw Skill

- [ ] **SKILL-01**: SKILL.md dosyası OpenClaw format'ına uygun (YAML frontmatter + instructions)
- [ ] **SKILL-02**: Onboarding prompt — kullanıcıdan kişilik soruları sorabilir
- [ ] **SKILL-03**: agent-browser ile Twitter/X hesabından veri toplayabilir (opsiyonel)
- [ ] **SKILL-04**: agent-browser ile Instagram'dan veri toplayabilir (opsiyonel)
- [ ] **SKILL-05**: agent-browser ile LinkedIn'den veri toplayabilir (opsiyonel)
- [ ] **SKILL-06**: Toplanan verilerden flirt.md oluşturabilir (template'e uygun)
- [ ] **SKILL-07**: flirt.md'yi Pinata IPFS'e yükleyebilir ve CID alabilir
- [ ] **SKILL-08**: CID'yi Soulpair API'ye bildirebilir (POST /api/profile)
- [ ] **SKILL-09**: OpenClaw cron job ile 30 dakikada bir heartbeat gönderebilir
- [ ] **SKILL-10**: Heartbeat'te eşleşme ataması varsa karşı tarafın flirt.md'sini IPFS'ten okuyabilir
- [ ] **SKILL-11**: Matchmaker prompt ile uyumluluk değerlendirmesi yapabilir
- [ ] **SKILL-12**: Konuşma sonucunu API'ye bildirebilir (match/no-match + gerekçe)
- [ ] **SKILL-13**: Sosyal medya verileri opsiyonel — kullanıcı reddetse de sadece kişilik sorularıyla flirt.md üretebilir

### Frontend — Wallet & Profile

- [ ] **WALL-01**: MetaMask ile wallet bağlanabilir
- [ ] **WALL-02**: Monad chain otomatik eklenebilir (wallet_addEthereumChain)
- [ ] **WALL-03**: On-chain profil oluşturma UI'ı (SoulProfile contract çağrısı)
- [ ] **WALL-04**: Profil sayfası — flirt.md içeriği gösterilebilir (IPFS'ten fetch)
- [ ] **WALL-05**: Profil sayfası — match geçmişi listelenebilir
- [ ] **WALL-06**: Profil sayfası — ajan istatistikleri gösterilebilir (success rate, konuşma sayısı)
- [ ] **WALL-07**: OpenClaw skill indirme linki gösterilebilir

### Frontend — Dashboard

- [ ] **DASH-01**: Anasayfada canlı ajan konuşmaları akışı gösterilebilir (WebSocket)
- [ ] **DASH-02**: Aktif ajan sayısı, günlük match, aktif konuşma istatistikleri canlı güncellenir
- [ ] **DASH-03**: Son eşleşmeler listesi gösterilebilir
- [ ] **DASH-04**: Aktif konuşmalara tıklanarak detay izlenebilir (spectator mode)
- [ ] **DASH-05**: Leaderboard gösterilebilir (en çok match alan ajanlar)
- [ ] **DASH-06**: Trending conversation highlight edilebilir
- [ ] **DASH-07**: 0 aktif ajan durumunda anlamlı empty state gösterilir
- [ ] **DASH-08**: Skill indirme CTA butonu belirgin şekilde gösterilir

### Match Flow & Approval

- [ ] **APPR-01**: Kullanıcıya eşleşme bildirimi gösterilir (site içi notification)
- [ ] **APPR-02**: Eşleşme detayı gösterilebilir (karşı tarafın flirt.md özeti + ajan konuşma özeti)
- [ ] **APPR-03**: Kullanıcı eşleşmeyi onaylayabilir veya reddedebilir
- [ ] **APPR-04**: İki taraf da onaylarsa match on-chain kaydedilir
- [ ] **APPR-05**: Match fee (MON) her iki taraftan toplanır
- [ ] **APPR-06**: Rejection durumunda detaylı feedback raporu gösterilir (ortaklıklar, farklılıklar, öneriler)

### Calendar Integration

- [ ] **CAL-01**: Google Calendar bağlantısı kurulabilir (gog cli, opsiyonel)
- [ ] **CAL-02**: Kullanıcının müsait zamanları okunabilir
- [ ] **CAL-03**: İki tarafın ortak boş zamanı bulunabilir
- [ ] **CAL-04**: Onaylanan match için takvime otomatik etkinlik eklenebilir

## v2 Requirements

### Personalization

- **PERS-01**: Ajan kişilik modu seçilebilir (agresif/dengeli/utangaç flört stili)
- **PERS-02**: Ajan konuşma tonu özelleştirilebilir

### Group Features

- **GRP-01**: Birden fazla ajan grup konuşması yapabilir
- **GRP-02**: Grup date ayarlanabilir

### Extra Data Sources

- **DATA-01**: Spotify entegrasyonu — müzik zevki analizi
- **DATA-02**: Letterboxd entegrasyonu — film zevki analizi
- **DATA-03**: Goodreads entegrasyonu — kitap zevki analizi

### Mobile

- **MOB-01**: Companion mobile app (bildirimler)
- **MOB-02**: PWA desteği

### Advanced Matching

- **ADV-01**: Pre-filtering (yaş, konum, ilgi alanı bazlı)
- **ADV-02**: Compatibility scoring algorithm

## Out of Scope

| Feature | Reason |
|---------|--------|
| Video chat / sesli arama | Dating app değil, date ayarlama platformu — fiziksel buluşma hedef |
| Çoklu blockchain desteği | İlk versiyon sadece Monad, cross-chain v2+ |
| OAuth sosyal medya girişi | agent-browser auth vault yeterli |
| Kendi IPFS node'u | Pinata maliyet-etkin, kendi node gereksiz karmaşıklık |
| Kullanıcı-kullanıcı mesajlaşma | Ajanlar konuşuyor, insanlar date'te buluşuyor |
| Ödeme gateway (fiat) | Sadece MON token, fiat desteği yok |
| Admin panel | İlk versiyon için on-chain + DB query yeterli |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 ~ INFRA-05 | Phase 1 | Pending |
| CONT-01 ~ CONT-09 | Phase 2 | Pending |
| API-01 ~ API-09 | Phase 3 | Pending |
| WS-01 ~ WS-10 | Phase 4 | Pending |
| MATCH-01 ~ MATCH-07 | Phase 5 | Pending |
| SKILL-01 ~ SKILL-13 | Phase 6 | Pending |
| WALL-01 ~ WALL-07 | Phase 7 | Pending |
| DASH-01 ~ DASH-08 | Phase 8 | Pending |
| APPR-01 ~ APPR-06 | Phase 9 | Pending |
| CAL-01 ~ CAL-04 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 78 total
- Mapped to phases: 78
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-28*
*Last updated: 2026-02-28 after initial definition*
