# Pitfalls Research

**Domain:** AI Agent Dating Protocol (Web3 + OpenClaw + Real-time)
**Researched:** 2026-02-28
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: WebSocket Connection Yönetimi Karmaşıklığı

**What goes wrong:**
Agent'lar bağlantı koparınca konuşma ortada kalır. Reconnection handling yoksa eşleşme kaybolur, dashboard'da "ghost" konuşmalar oluşur.

**Why it happens:**
WebSocket stateful — network kesintisi, OpenClaw restart, agent timeout hepsi bağlantı koparır.

**How to avoid:**
- Heartbeat ping/pong mekanizması (30s interval)
- Conversation state PostgreSQL'de persist et (WS sadece transport)
- Reconnection token ile aynı room'a geri bağlanma
- Timeout: 5 dakika cevap yoksa konuşmayı sonlandır

**Warning signs:**
- Dashboard'da "active" gözüken ama mesaj akmayan konuşmalar
- Agent'ların aynı kişiyle tekrar eşleşmesi

**Phase to address:** Agent DM sistemi fazında

---

### Pitfall 2: Matchmaking Starvation (Eşleşme Açlığı)

**What goes wrong:**
Az kullanıcıda aynı kişiler sürekli eşleşir. Çok kullanıcıda bazıları hiç eşleşme alamaz. Rate limit (max 5 konuşma) ile bazı agent'lar sürekli dolu.

**Why it happens:**
Random eşleşme "fairness" garantisi vermez. Popüler profiller hep meşgul.

**How to avoid:**
- Round-robin eşleşme: herkes sırayla
- "Son eşleşme zamanı" bazlı önceliklendirme
- Aynı iki kişi 24 saat içinde tekrar eşleşemez
- Agent "meşgul" ise kuyruktan çıkar, boşalınca geri girer

**Warning signs:**
- Bazı kullanıcılar 0 eşleşme alırken diğerleri sürekli alıyor
- Aynı çiftlerin tekrar tekrar eşleşmesi

**Phase to address:** Matchmaking engine fazında

---

### Pitfall 3: AI Halüsinasyonu — Yanlış Bilgiyle Eşleşme

**What goes wrong:**
AI ajan flirt.md'de olmayan bilgileri uydurur veya yanlış yorumlar. "Benim insanım da trekking seviyor" der ama aslında flirt.md'de sadece "yürüyüş" yazıyordur.

**Why it happens:**
LLM'ler context'ten çıkarım yapar ve bazen aşırı genelleme yapar.

**How to avoid:**
- Matchmaker prompt'unda strict talimat: "SADECE flirt.md'deki bilgileri kullan, çıkarım yapma"
- Konuşma sonunda structured output: {commonalities: [...], differences: [...], confidence: 0-1}
- Confidence < 0.6 ise "belirsiz" olarak raporla, eşleştirme

**Warning signs:**
- Konuşma loglarında flirt.md'de olmayan bilgiler
- Kullanıcı feedback'i: "Ajan benim hakkımda yanlış şeyler söylemiş"

**Phase to address:** Matchmaker prompt + conversation manager fazında

---

### Pitfall 4: Gas Maliyeti Patlaması

**What goes wrong:**
Her heartbeat'te, her konuşmada on-chain işlem yapılırsa gas maliyeti kullanıcıları kaçırır.

**Why it happens:**
On-chain her şeyi yazma dürtüsü. Monad ucuz ama sıfır değil.

**How to avoid:**
- On-chain SADECE: profil oluşturma (1 kez) + match kaydı (başarılı eşleşmede)
- Heartbeat, konuşma logları, eşleşme kuyruğu OFF-CHAIN
- Batch transaction: birden fazla match'i tek tx'te kaydet
- Gas estimation UI'da göster

**Warning signs:**
- Kullanıcı şikayetleri: "çok gas harcıyorum"
- On-chain tx sayısı kullanıcı sayısının 10x'inden fazla

**Phase to address:** Smart contract tasarım fazında

---

### Pitfall 5: OpenClaw Skill Context Window Overflow

**What goes wrong:**
Skill çok fazla prompt + flirt.md + conversation history yüklerse LLM context window'u dolar, kalite düşer.

**Why it happens:**
Skill'e her şeyi koymak cazip. Onboarding + matchmaking + calendar + feedback hepsini tek session'da yapmak.

**How to avoid:**
- Skill'i modüler yap: her cron çalışmasında sadece matchmaking prompt'u
- flirt.md'yi özetle (full content değil, key points)
- Conversation history'yi son 10 mesajla sınırla
- Onboarding ayrı session, matchmaking ayrı session (OpenClaw isolated sessions)

**Warning signs:**
- Ajan cevapları tutarsızlaşıyor
- Aynı bilgiyi tekrar tekrar söylüyor
- Response kalitesi düşüyor

**Phase to address:** Skill geliştirme fazında

---

### Pitfall 6: Düşük Kullanıcı Sayısında Ölü Platform Hissi

**What goes wrong:**
Dashboard'a giren biri "0 aktif ajan, 0 konuşma" görürse hemen çıkar. Chicken-and-egg problemi.

**Why it happens:**
İki taraflı pazar: eşleşme için iki taraf lazım, ama kimse boş platforma gelmez.

**How to avoid:**
- Kapalı beta: ilk 100 kullanıcıyı davetli al, minimum aktivite garantile
- Demo/simülasyon ajanları: gerçek olmayan ama gerçekçi konuşmalar göster (açıkça "demo" label'ı ile)
- Dashboard'da "bugün" değil "son 7 gün" istatistikleri göster
- Waiting list + "X kişi bekliyor" FOMO

**Warning signs:**
- Dashboard bounce rate %80+
- Skill indirme → aktif ajan dönüşümü %10'un altında

**Phase to address:** Launch stratejisi + dashboard tasarımı

---

### Pitfall 7: Sosyal Medya Scraping Kırılganlığı

**What goes wrong:**
agent-browser ile Twitter/Instagram'a giriş yapılıyor ama bu platformlar bot detection yapıyor. Hesap kilitlenebilir.

**Why it happens:**
Sosyal medya platformları otomasyona karşı agresif. CAPTCHA, rate limit, IP ban.

**How to avoid:**
- Sosyal medya verisini OPSIYONEL yap (zorunlu değil)
- Kullanıcıya uyar: "Hesabınız geçici olarak kilitlenebilir"
- Scraping yerine kullanıcının kendi verilerini yapıştırmasına izin ver
- Rate limit: her platform için min 30s bekleme
- OpenClaw auth vault ile session persistence

**Warning signs:**
- Kullanıcılar "hesabım kitlendi" diye şikayet ediyor
- Skill'in veri toplama başarı oranı %50'nin altında

**Phase to address:** Onboarding skill fazında

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Sabit match fee (dinamik yerine) | Hızlı MVP | Fee optimizasyonu yok, unfair | MVP'de kabul edilebilir |
| Tek sunucu (cluster yok) | Basit deployment | 1K+ agent'ta bottleneck | İlk 500 agent'a kadar |
| flirt.md'yi PostgreSQL'de cache | Hızlı erişim | IPFS ile sync sorunu | Her zaman, ama TTL koy |
| Demo ajanlar | Boş dashboard'u doldurur | Gerçek data olmadan metrikler yanıltıcı | Launch'a kadar |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| MetaMask | Monad chain'i otomatik eklenmiyor | `wallet_addEthereumChain` ile Monad'ı otomatik ekle |
| Pinata IPFS | Gateway timeout (büyük dosyalar) | flirt.md max 50KB sınırla, dedicated gateway kullan |
| OpenClaw Cron | Cron job fail olunca sessizce duruyor | `deleteAfterRun: false` + retry logic + webhook error handling |
| Monad RPC | Testnet ile mainnet RPC farklı | Environment variable ile yönet, hardcode etme |
| Google Calendar (gog) | OAuth token expire | Refresh token mekanizması, skill her çalışmada kontrol etsin |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Her dashboard viewer için ayrı DB query | Yavaş dashboard, DB CPU yüksek | Redis cache + pub/sub broadcast | 50+ eşzamanlı viewer |
| On-chain event polling | Yüksek RPC call count, rate limit | WebSocket subscription + event indexer | 100+ profil |
| flirt.md'yi her konuşmada IPFS'ten fetch | Yavaş konuşma başlangıcı | PostgreSQL cache (TTL: 1 saat) | 10+ eşzamanlı konuşma |
| Conversation loglarını memory'de tutmak | Memory leak, server crash | PostgreSQL'e stream, memory'de son 20 mesaj | 50+ aktif konuşma |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Wallet private key backend'de tutmak | Tüm kullanıcı fonları çalınabilir | ASLA — sadece frontend'de MetaMask sign |
| Agent DM'lerinde authentication yok | Sahte ajan konuşmalara katılabilir | JWT token + wallet signature verification |
| flirt.md'de PII (kişisel bilgi) filtrelememe | GDPR/kişisel veri sızıntısı | Skill'de PII filter: telefon, adres, TC no çıkar |
| Rate limit olmayan API | DDoS, spam agent flood | Redis-based rate limiting: IP + wallet bazlı |

## "Looks Done But Isn't" Checklist

- [ ] **WebSocket:** Reconnection handling var mı? Ping/pong timeout var mı?
- [ ] **Matchmaking:** Aynı çift tekrar eşleşme kontrolü var mı?
- [ ] **On-chain:** Gas estimation UI'da gösteriliyor mu?
- [ ] **Dashboard:** 0 aktif ajan olduğunda ne gösteriyor? (boş state)
- [ ] **Skill:** OpenClaw restart sonrası cron job devam ediyor mu?
- [ ] **IPFS:** Pinata rate limit'e takılınca ne oluyor? (fallback)
- [ ] **Conversation:** 5 konuşma limiti dolduğunda ne oluyor? (graceful rejection)
- [ ] **Match fee:** Contract'ta reentrancy guard var mı?
- [ ] **Calendar:** gog token expire olduğunda ne oluyor?

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| WS connection yönetimi | Agent DM sistemi | Reconnection test, ghost room kontrolü |
| Matchmaking starvation | Matchmaking engine | Fairness metrikleri, round-robin test |
| AI halüsinasyonu | Skill + prompt geliştirme | Conversation log audit, confidence check |
| Gas patlaması | Smart contract tasarımı | Gas estimation test, batch tx test |
| Context overflow | Skill modüler yapı | Token count monitoring |
| Ölü platform hissi | Dashboard + launch | Empty state UI, demo data |
| Scraping kırılganlığı | Onboarding skill | Fallback path test |

## Sources

- WebSocket scaling best practices (ws library)
- Dating app chicken-and-egg problem (Tinder early days case study)
- LLM hallucination mitigation patterns
- Monad gas optimization guides
- OpenClaw cron job troubleshooting docs

---
*Pitfalls research for: AI Agent Dating Protocol*
*Researched: 2026-02-28*
