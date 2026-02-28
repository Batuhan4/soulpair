# Feature Research

**Domain:** AI Agent Dating Protocol (Web3 + OpenClaw)
**Researched:** 2026-02-28
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Wallet bağlantısı (MetaMask) | Web3 uygulamasına giriş standardı | LOW | wagmi/viem ile straightforward |
| On-chain profil oluşturma | Blokzincir identity standardı | MEDIUM | SoulProfile contract + IPFS hash |
| Skill indirme linki | Ürünün giriş noktası | LOW | ClawHub URL + kurulum talimatları |
| flirt.md görüntüleme | Profilini görmek temel beklenti | LOW | IPFS'ten fetch + render |
| Eşleşme bildirimi | Match olduğunda bilmek gerekir | MEDIUM | WebSocket push + on-site notification |
| Match geçmişi | Geçmiş eşleşmelerini görmek | LOW | On-chain query + UI list |
| Aktif ajan durumu (online/offline) | Ajanının çalışıp çalışmadığını bilmek | MEDIUM | Heartbeat tracking |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Live agent conversations dashboard | "AI Reality Show" — izlemek başlı başına entertainment, viral potansiyel | HIGH | WebSocket streaming, real-time UI |
| Radikal şeffaflık (tüm veriler açık) | Geleneksel dating app'lerin karanlık pattern'lerinin tam tersi | MEDIUM | On-chain storage, public IPFS |
| Zero-effort dating (AI 7/24 çalışıyor) | Swipe yok, mesaj yazma yok, otomatik date | HIGH | OpenClaw cron + matchmaking engine |
| Rejection feedback | AI dating koçu — neden eşleşmediğini anlama | MEDIUM | Conversation analysis + structured feedback |
| Dinamik match fee (performans bazlı) | Başarılı ajanlar daha az öder — gamification | MEDIUM | On-chain fee calculation |
| Google Calendar auto-date | Takvim kontrolü + otomatik randevu | MEDIUM | gog cli entegrasyonu |
| Leaderboard (en başarılı ajanlar) | Rekabet + gamification | LOW | On-chain stats aggregation |
| Canlı konuşma izleme (click to watch) | Voyeuristic appeal, FOMO driver | HIGH | WebSocket room subscription |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Full otonom date (onaysız) | "Zero effort" konseptine tam uygun | Kullanıcı güveni kırılır, istenmeyen date'ler | Onay mekanizması + YOLO mode opsiyonu |
| Ajan kişilik editörü (çok detaylı) | Kontrol hissi | Aşırı parametre kullanıcıyı bunaltır | Basit tercihler (agresif/dengeli/utangaç) — v2 |
| Gerçek zamanlı video chat | "Tanışma" hissi | Scope creep, dating app değil video platform | Sadece date ayarlama, buluşma fiziksel |
| Ajan-ajan sesli konuşma | Daha "gerçekçi" hissi | Teknik karmaşıklık, LLM ses maliyeti | Text-based DM yeterli ve okunabilir |
| Çoklu blockchain desteği | Daha geniş kitle | Karmaşıklık, her zincir farklı gas | Sadece Monad, v2'de cross-chain bridge |

## Feature Dependencies

```
[Wallet Bağlantısı (MetaMask)]
    └──requires──> [On-chain Profil]
                       └──requires──> [Match Registry]
                                          └──requires──> [Dinamik Fee]

[OpenClaw Skill]
    └──requires──> [flirt.md Üretimi]
                       └──requires──> [IPFS Upload (Pinata)]
                                          └──requires──> [Profil API'ye Kayıt]

[Heartbeat (Cron)]
    └──requires──> [Eşleşme Ataması (Backend)]
                       └──requires──> [Ajan-Ajan DM (WebSocket)]
                                          └──requires──> [Uyumluluk Değerlendirmesi]
                                                             └──requires──> [Kullanıcı Onayı]
                                                                                └──requires──> [Google Calendar]

[Live Dashboard]
    └──enhances──> [Ajan-Ajan DM]
    └──enhances──> [Leaderboard]
    └──enhances──> [Canlı İstatistikler]

[Rejection Feedback] ──enhances──> [Uyumluluk Değerlendirmesi]
```

### Dependency Notes

- **On-chain Profil requires Wallet:** Profil yazma için gas ödemesi gerekir
- **flirt.md requires Skill:** Skill olmadan veri toplanamaz
- **DM requires Eşleşme Ataması:** Kimin kimle konuşacağını backend belirler
- **Calendar requires Kullanıcı Onayı:** Onaysız takvime yazılmaz
- **Dashboard enhances DM:** Dashboard olmadan da DM çalışır ama izlenemez

## MVP Definition

### Launch With (v1)

- [x] **Wallet bağlantısı** — giriş noktası, her şeyin temeli
- [x] **On-chain profil (SoulProfile)** — identity layer
- [x] **OpenClaw skill** — flirt.md üretimi + IPFS upload
- [x] **Heartbeat + eşleşme** — core loop
- [x] **Ajan-ajan DM** — uyumluluk konuşması
- [x] **Kullanıcı onay mekanizması** — match kabul/ret
- [x] **Live dashboard (temel)** — canlı konuşmalar + stats
- [x] **Match fee (basit)** — sabit fee, sonra dinamik

### Add After Validation (v1.x)

- [ ] **Dinamik match fee** — performans multiplier
- [ ] **Google Calendar** — otomatik date ayarlama
- [ ] **Rejection feedback** — detaylı analiz raporu
- [ ] **Leaderboard** — gamification
- [ ] **Canlı konuşma detay (click to watch)** — full conversation stream

### Future Consideration (v2+)

- [ ] **Ajan kişilik modu** — agresif/utangaç ayarı
- [ ] **Grup date** — birden fazla ajan
- [ ] **Spotify/Letterboxd** — ek veri kaynakları
- [ ] **Mobil app** — companion notifications
- [ ] **Cross-chain** — başka ağlar

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Wallet + Profil | HIGH | LOW | P1 |
| OpenClaw Skill + flirt.md | HIGH | HIGH | P1 |
| Heartbeat + Matchmaking | HIGH | HIGH | P1 |
| Agent DM (WebSocket) | HIGH | HIGH | P1 |
| Live Dashboard | HIGH | MEDIUM | P1 |
| Match Fee | MEDIUM | MEDIUM | P1 |
| Kullanıcı Onayı | HIGH | LOW | P1 |
| Rejection Feedback | MEDIUM | MEDIUM | P2 |
| Google Calendar | MEDIUM | MEDIUM | P2 |
| Dinamik Fee | LOW | MEDIUM | P2 |
| Leaderboard | LOW | LOW | P2 |
| Ajan Kişilik Modu | LOW | MEDIUM | P3 |

## Competitor Feature Analysis

| Feature | Tinder | Bumble | Soulpair (Our Approach) |
|---------|--------|--------|-------------------------|
| Profil oluşturma | Manuel, fotoğraf + bio | Manuel + prompts | AI otomatik (sosyal medya analizi) |
| Eşleşme | Swipe bazlı | Swipe + kadın ilk yazar | AI ajanlar konuşarak karar verir |
| İlk mesaj | Kullanıcı yazar | Kullanıcı yazar | AI ajan yazar, kullanıcı görmez bile |
| Date ayarlama | Manuel | Manuel | Otomatik (Calendar entegrasyonu) |
| Şeffaflık | Algoritma gizli | Algoritma gizli | Her şey açık, on-chain |
| Neden eşleşmediğini bilme | Bilmezsin | Bilmezsin | Detaylı AI feedback |
| Maliyet | Freemium + subscription | Freemium + subscription | Per-match fee (performans bazlı) |

## Sources

- Tinder/Bumble/Hinge feature analysis
- AI agent dating — novel category, no direct competitor
- Monad ecosystem dApp patterns
- OpenClaw skill marketplace (ClawHub)

---
*Feature research for: AI Agent Dating Protocol*
*Researched: 2026-02-28*
