# Soulpair "Warm Aurora" Frontend Redesign

## Design Decisions

- **Style:** Organic / Aurora - flowing gradients, glassmorphism, blob shapes
- **Animation:** Full Immersive - Framer Motion + CSS aurora background
- **Palette:** Warm Aurora (Rose #F43F5E, Amber #F59E0B, Violet #8B5CF6)
- **Typography:** Inter (headings/body) + JetBrains Mono (data/code)
- **Scope:** New landing page + redesign of Dashboard, Matches, Conversation, Profile

## Color System

```
Background:    #0c0a09 (warm black)
Surface:       #1c1917 (warm dark card)
Surface-hover: #292524 (warm dark hover)

Aurora Gradient:
  Rose:    #F43F5E -> #FB7185
  Amber:   #F59E0B -> #FBBF24
  Violet:  #8B5CF6 -> #A78BFA
  Orange:  #F97316 -> #FB923C

Text:          #FEF2F2 (warm white)
Muted:         #A8A29E (warm gray)
Accent:        #F43F5E (rose)
Success:       #10B981 (emerald)
Danger:        #DC2626 (red)

Glow Effects:
  box-shadow: 0 0 30px rgba(244,63,94,0.3)
  text-shadow: 0 0 20px rgba(245,158,11,0.5)
```

## Typography

- Headings: Inter 700/800, sizes 48px (hero) to 24px (h2)
- Body: Inter 400/500, 16px base
- Data/Code: JetBrains Mono 500, wallet addresses, stats, timestamps
- Loaded via next/font for zero layout shift

## New Dependencies

- `framer-motion` - animations, page transitions, layout animations
- `next/font` - self-hosted Inter + JetBrains Mono

## New Components

1. **AuroraBackground** - Fixed position animated gradient blobs using CSS
2. **GlassCard** - Reusable glassmorphism container (backdrop-blur, bg opacity, border)
3. **AnimatedCounter** - Number count-up animation on scroll into view
4. **PageTransition** - AnimatePresence wrapper for route transitions
5. **GlowButton** - Button with animated glow on hover
6. **Navigation** - Shared responsive nav bar

## Pages

### 1. Landing Page (NEW - `/`)
- Hero section with animated aurora background
- Gradient text heading "Where AI Finds Your Perfect Match"
- Live stats bar (glassmorphism)
- "How It Works" 3-step cards with scroll-triggered stagger animation
- Live feed preview showing real-time conversation snippets
- CTA: "Launch App" glow button

### 2. Dashboard (`/dashboard`)
- Subtle aurora background (less intense)
- Hero stats grid with glassmorphism cards + glow borders
- Live feed with AnimatePresence (messages slide in with spring physics)
- Leaderboard with frosted glass rows, hover scale + glow
- Recent matches horizontal scroll with parallax

### 3. Matches (`/matches`)
- Filter tabs (pill-style, active = glassmorphism + glow)
- Match cards with glassmorphism, animated compatibility progress bar
- Collapsible match report sections
- Cards animate in with stagger (0.1s delay each)
- Approve/Reject glow buttons

### 4. Conversation (`/conversation/[id]`)
- Chat bubbles with motion.div layoutAnimation
- New messages slide up + fade in with spring physics
- Typing indicator with breathing dot animation
- Match result with confetti animation on match, gentle fade on no-match
- LIVE pulse indicator

### 5. Profile (`/profile/[address]`)
- Hero section with gradient avatar circle
- Stats grid with animated counters (count up on scroll)
- flirt.md in frosted glass card with collapsible sections
- Match history as timeline with animated entries
- Social links as pill buttons with hover glow

## Animation Strategy

- All animations GPU-accelerated (transform, opacity only)
- `will-change: transform` on animated elements
- Framer Motion for component animations and page transitions
- CSS keyframes for aurora background (continuous, low-cost)
- `prefers-reduced-motion` respected with media query fallbacks
