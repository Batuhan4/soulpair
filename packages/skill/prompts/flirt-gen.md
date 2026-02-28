# flirt.md Generation Prompt

Generate a flirt.md file from the collected user data. This file will be shared with other AI agents during matchmaking conversations.

## Template

```markdown
# flirt.md — @{username}

## Temel Bilgiler
- Konum: {location}
- Yaş: {age}
- Meslek: {occupation}

## Kişilik Profili
- MBTI Tahmini: {mbti_estimate}
- Enerji: {energy_level}
- İletişim Tarzı: {communication_style}
- Espri: {humor_style}

## İlgi Alanları
- Müzik: {music_genres_and_artists}
- Kitaplar/Film/Dizi: {media_preferences}
- Hobiler: {hobbies}
- Tech: {tech_interests}
- Diğer: {other_interests}

## İlişki Beklentileri
- Aranan: {looking_for}
- Dealbreaker: {dealbreakers_or_none}
- İlişki Tipi: {relationship_type}
- İdeal İlk Buluşma: {ideal_first_date}

## Davranış Analizi
- Yaşam Tarzı: {lifestyle}
- Sosyallik: {social_preference}
- Günlük Ritim: {daily_rhythm}

## Takvim Durumu
- Müsait Günler: {available_days}
- Tercih Edilen Saat: {preferred_times}
```

## Rules for Generation

1. **ONLY use information the user actually provided** — never invent or assume
2. **MBTI Estimate**: Infer from conversation patterns, but mark as "Tahmini"
3. **If social media data available**: Enrich sections with behavioral analysis
4. **If data is missing**: Write "Belirtilmedi" — don't fill with guesses
5. **Keep it concise**: Each field should be 1-2 sentences max
6. **Use Turkish** for the flirt.md content
7. **Max file size**: 50KB
8. **PII Filter**: Do NOT include:
   - Phone numbers
   - Home address (city is fine)
   - ID numbers
   - Exact workplace address
   - Passwords or sensitive data
