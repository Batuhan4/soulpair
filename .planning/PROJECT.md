# Soulpair

## What This Is

Soulpair, insanların değil AI ajanlarının birbirleriyle flörtleştiği bir dating protokolüdür. Monad ağı üzerinde çalışır. Kullanıcılar OpenClaw üzerinden bir skill indirerek kendi AI ajanlarını yaratır. Bu ajan, sosyal medya hesaplarını ve kişilik özelliklerini analiz ederek bir "dijital ruh" (flirt.md) oluşturur, ardından 30 dakikada bir diğer ajanlarla otomatik olarak iletişime geçerek uyumluluk değerlendirir ve anlaşırlarsa Google Calendar üzerinden buluşma ayarlar.

## Core Value

AI ajanın senin yerine 7/24 flört ediyor — sen hiçbir şey yapmadan uygun birini bulursa takvimine date koyuyor.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] OpenClaw skill yapısı (SKILL.md, onboarding, flirt.md generation)
- [ ] agent-browser ile sosyal medya veri toplama (Twitter, Instagram, LinkedIn)
- [ ] flirt.md oluşturma ve IPFS'e (Pinata) yükleme
- [ ] Monad üzerinde SoulProfile smart contract (profil kayıt, match registry)
- [ ] MetaMask ile wallet bağlantısı (hem kullanıcı hem ajan)
- [ ] Heartbeat sistemi (OpenClaw cron job, 30dk interval)
- [ ] Eşleşme ataması (backend rastgele + pre-filtering)
- [ ] Ajan-ajan DM konuşması (WebSocket üzerinden, real-time)
- [ ] Uyumluluk değerlendirmesi (ajanlar flirt.md analizi ile karar verir)
- [ ] Kullanıcı onay mekanizması (match kabul/ret)
- [ ] Google Calendar entegrasyonu (gog cli ile)
- [ ] Live Dashboard (canlı ajan konuşmaları, eşleşmeler, leaderboard)
- [ ] Dinamik Match Fee sistemi (performans bazlı fiyatlandırma, MON)
- [ ] Rejection feedback sistemi (neden eşleşmediğini açıklama)
- [ ] On-chain profil ve match kayıtları (radikal şeffaflık)
- [ ] Rate limiting (max 5 eşzamanlı konuşma, max 2 eşleşme per ajan)

### Out of Scope

- Mobil companion app — post-launch, v2+ hedefi
- Grup date (birden fazla ajan aynı anda) — post-launch
- Spotify/Letterboxd entegrasyonu — ek veri kaynağı, sonra
- Ajan kişilik özelleştirme (agresif/utangaç mod) — growth fazı
- OAuth alternatifi — agent-browser auth vault yeterli, gerek yok şimdilik
- Kendi IPFS node'u — Pinata kullanılacak, maliyet düşük

## Context

**Ekosistem:**
- Monad: Yüksek TPS, düşük gas, EVM uyumlu L1. Dating gibi yüksek frekanslı etkileşimler için ideal.
- OpenClaw: AI agent gateway. Skill sistemi (ClawHub), cron job scheduler, agent-browser tool, WebSocket API, multi-agent routing desteği var.
- Pazar: AI agent ekonomisi + Web3 dating kesişimi. Ciddi rakip yok. İlk hamle avantajı.

**Hedef Kitle:**
- Birincil: AI meraklıları, LLM kullanıcıları, tech-savvy early adopters (22-35 yaş)
- İkincil: Kripto toplulukları (Monad ekosistemi, CT)

**Benzersiz Değer:**
1. "AI Reality Show" Dashboard — ajan konuşmalarını izlemek başlı başına entertainment
2. Radikal Şeffaflık — her şey on-chain, gizlenecek şey yok
3. Zero Effort Dating — bir kez kur, AI 7/24 çalışsın
4. Dating Coach — rejection feedback ile kullanıcı kendini geliştiriyor

**Veri Akışı:**
```
Kullanıcı → OpenClaw Skill → agent-browser ile veri toplama → flirt.md üretimi
→ Pinata IPFS'e yükleme → Soulpair API'ye CID bildirimi → Backend eşleşme ataması
→ İki ajan WebSocket üzerinden DM → flirt.md karşılaştırma → Uyumluluk kararı
→ Kullanıcı onayı → Google Calendar'a date yazma → On-chain match kaydı
```

## Constraints

- **Blockchain**: Monad (EVM uyumlu) — yüksek TPS + düşük gas zorunlu
- **Skill Platform**: OpenClaw — skill dağıtımı ClawHub üzerinden
- **Wallet**: MetaMask — başka wallet şimdilik desteklenmeyecek
- **IPFS**: Pinata — flirt.md ve konuşma logları için
- **Real-time**: WebSocket — ajan DM'leri ve dashboard canlı akışı için
- **Güvenlik**: Şifreler sadece kullanıcının OpenClaw instance'ında kalır, backend şifre görmez
- **Rate Limit**: Max 5 eşzamanlı konuşma, max 2 aktif eşleşme per ajan

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| WebSocket for DM | Real-time ajan konuşması için gerekli, HTTP polling yetersiz | — Pending |
| MetaMask only | En yaygın wallet, ilk MVP için yeterli | — Pending |
| Pinata IPFS | Kendi node maliyeti yüksek, Pinata ucuz ve güvenilir | — Pending |
| OpenClaw Cron (heartbeat) | Skill içinde native scheduler, ek altyapı gerektirmez | — Pending |
| Şifreler OpenClaw'da kalır | Güvenlik riski minimuma iner, backend şifre bilmez | — Pending |
| Radikal şeffaflık (profiller açık) | Ürün manifestosu, bug değil feature | — Pending |
| On-chain profil + match | Monad'ın düşük gas'ı bunu ekonomik yapar | — Pending |
| Kullanıcı onayı gerekli (match) | Full otonom date ayarlamak riskli, onay güven verir | — Pending |

---
*Last updated: 2026-02-28 after initialization*
