# Warm Aurora Frontend Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Soulpair's frontend from a basic dark-themed dashboard into an immersive "Warm Aurora" experience with flowing gradient backgrounds, glassmorphism cards, Framer Motion animations, and a new landing page.

**Architecture:** New shared components (AuroraBackground, GlassCard, GlowButton, AnimatedCounter, Navigation) built first, then each page rewritten to use them. Landing page replaces current `/`, dashboard moves to `/dashboard`. Framer Motion handles all component and page animations. CSS keyframes handle the aurora background (continuous, GPU-friendly).

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Framer Motion 11, next/font (Inter + JetBrains Mono)

---

### Task 1: Install Dependencies & Update Fonts

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/src/app/layout.tsx`

**Step 1: Install framer-motion**

```bash
cd /home/batuhan4/soulpair/apps/web && npm install framer-motion
```

Expected: `framer-motion` added to package.json dependencies.

**Step 2: Update layout.tsx with Inter + JetBrains Mono fonts**

Replace `apps/web/src/app/layout.tsx` entirely:

```tsx
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Soulpair — Your AI Finds Your Soulmate',
  description: 'AI agents flirt on your behalf. Watch them live, get matched, and let your calendar fill with dates.',
  openGraph: {
    title: 'Soulpair — Your AI Finds Your Soulmate',
    description: 'The dating protocol where AI agents do the talking.',
    siteName: 'Soulpair',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Step 3: Commit**

```bash
git add apps/web/package.json apps/web/package-lock.json apps/web/src/app/layout.tsx
git commit -m "feat(web): add framer-motion, configure Inter + JetBrains Mono fonts"
```

---

### Task 2: Rewrite globals.css — Warm Aurora Design Tokens & Animations

**Files:**
- Rewrite: `apps/web/src/app/globals.css`

**Step 1: Replace globals.css with the complete Warm Aurora design system**

```css
@import "tailwindcss";

/* ===== Warm Aurora Design System ===== */

@theme {
  --font-sans: 'Inter', var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', var(--font-mono), ui-monospace, monospace;
}

:root {
  /* Background */
  --sp-bg: #0c0a09;
  --sp-bg-card: #1c1917;
  --sp-bg-hover: #292524;

  /* Aurora Colors */
  --sp-rose: #F43F5E;
  --sp-rose-light: #FB7185;
  --sp-amber: #F59E0B;
  --sp-amber-light: #FBBF24;
  --sp-violet: #8B5CF6;
  --sp-violet-light: #A78BFA;
  --sp-orange: #F97316;
  --sp-orange-light: #FB923C;

  /* Text */
  --sp-text: #FEF2F2;
  --sp-text-muted: #A8A29E;

  /* Semantic */
  --sp-accent: #F43F5E;
  --sp-success: #10B981;
  --sp-danger: #DC2626;
  --sp-border: #292524;
  --sp-border-light: #3f3a38;

  /* Legacy aliases for gradual migration */
  --sp-primary: #F43F5E;
  --sp-primary-light: #FB7185;
  --sp-green: #10B981;
  --sp-red: #DC2626;
}

body {
  background: var(--sp-bg);
  color: var(--sp-text);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ===== Aurora Background Blobs ===== */
@keyframes aurora-drift-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(80px, -60px) scale(1.15); }
  50% { transform: translate(-40px, 80px) scale(0.95); }
  75% { transform: translate(60px, 40px) scale(1.1); }
}
@keyframes aurora-drift-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-100px, 60px) scale(1.2); }
  66% { transform: translate(60px, -80px) scale(0.9); }
}
@keyframes aurora-drift-3 {
  0%, 100% { transform: translate(0, 0) scale(1.05); }
  50% { transform: translate(90px, 70px) scale(0.9); }
}

.aurora-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.3;
  will-change: transform;
  pointer-events: none;
}
.aurora-blob-1 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, var(--sp-rose) 0%, transparent 70%);
  top: -10%; left: -5%;
  animation: aurora-drift-1 20s ease-in-out infinite;
}
.aurora-blob-2 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, var(--sp-amber) 0%, transparent 70%);
  top: 30%; right: -10%;
  animation: aurora-drift-2 25s ease-in-out infinite;
}
.aurora-blob-3 {
  width: 550px; height: 550px;
  background: radial-gradient(circle, var(--sp-violet) 0%, transparent 70%);
  bottom: -10%; left: 20%;
  animation: aurora-drift-3 22s ease-in-out infinite;
}
.aurora-blob-4 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, var(--sp-orange) 0%, transparent 70%);
  top: 50%; left: 50%;
  animation: aurora-drift-1 18s ease-in-out infinite reverse;
}

/* ===== Glassmorphism ===== */
.glass {
  background: rgba(28, 25, 23, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.glass-hover:hover {
  background: rgba(28, 25, 23, 0.75);
  border-color: rgba(255, 255, 255, 0.1);
}
.glass-strong {
  background: rgba(28, 25, 23, 0.8);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* ===== Glow Effects ===== */
.glow-rose {
  box-shadow: 0 0 20px rgba(244, 63, 94, 0.15), 0 0 60px rgba(244, 63, 94, 0.05);
}
.glow-rose-strong {
  box-shadow: 0 0 20px rgba(244, 63, 94, 0.3), 0 0 60px rgba(244, 63, 94, 0.1);
}
.glow-amber {
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.15), 0 0 60px rgba(245, 158, 11, 0.05);
}
.glow-violet {
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.15), 0 0 60px rgba(139, 92, 246, 0.05);
}
.glow-success {
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.15), 0 0 60px rgba(16, 185, 129, 0.05);
}

/* ===== Gradient Text ===== */
.gradient-text {
  background: linear-gradient(135deg, var(--sp-rose) 0%, var(--sp-amber) 50%, var(--sp-violet) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.gradient-text-rose-amber {
  background: linear-gradient(135deg, var(--sp-rose) 0%, var(--sp-amber) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ===== Live Pulse ===== */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 5px var(--sp-danger), 0 0 10px var(--sp-danger); }
  50% { box-shadow: 0 0 10px var(--sp-danger), 0 0 20px var(--sp-danger), 0 0 30px var(--sp-danger); }
}
.live-pulse {
  animation: pulse-glow 2s ease-in-out infinite;
}

/* ===== Breathing Dots ===== */
@keyframes breathing {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
}
.breathing-dot {
  animation: breathing 1.5s ease-in-out infinite;
}

/* ===== Scrollbar ===== */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--sp-bg); }
::-webkit-scrollbar-thumb {
  background: var(--sp-border);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--sp-border-light);
}

/* ===== Reduced Motion ===== */
@media (prefers-reduced-motion: reduce) {
  .aurora-blob { animation: none !important; }
  .live-pulse { animation: none !important; }
  .breathing-dot { animation: none !important; }
}
```

**Step 2: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "feat(web): warm aurora design system — tokens, aurora blobs, glassmorphism, glow effects"
```

---

### Task 3: Build Shared Components

**Files:**
- Create: `apps/web/src/components/AuroraBackground.tsx`
- Create: `apps/web/src/components/GlassCard.tsx`
- Create: `apps/web/src/components/GlowButton.tsx`
- Create: `apps/web/src/components/AnimatedCounter.tsx`
- Create: `apps/web/src/components/Navigation.tsx`
- Create: `apps/web/src/components/PageTransition.tsx`

**Step 1: Create AuroraBackground.tsx**

```tsx
'use client';

interface AuroraBackgroundProps {
  intensity?: 'full' | 'subtle';
}

export function AuroraBackground({ intensity = 'full' }: AuroraBackgroundProps) {
  const opacityClass = intensity === 'subtle' ? 'opacity-50' : 'opacity-100';

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none -z-10 ${opacityClass}`}>
      <div className="aurora-blob aurora-blob-1" />
      <div className="aurora-blob aurora-blob-2" />
      <div className="aurora-blob aurora-blob-3" />
      <div className="aurora-blob aurora-blob-4" />
    </div>
  );
}
```

**Step 2: Create GlassCard.tsx**

```tsx
'use client';

import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'rose' | 'amber' | 'violet' | 'success' | 'none';
  delay?: number;
}

export function GlassCard({ children, className = '', hover = false, glow = 'none', delay = 0 }: GlassCardProps) {
  const glowClass = glow !== 'none' ? `glow-${glow}` : '';
  const hoverClass = hover ? 'glass-hover cursor-pointer transition-all duration-300 hover:scale-[1.02]' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`glass rounded-2xl ${glowClass} ${hoverClass} ${className}`}
    >
      {children}
    </motion.div>
  );
}
```

**Step 3: Create GlowButton.tsx**

```tsx
'use client';

import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface GlowButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  href?: string;
}

export function GlowButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  href,
}: GlowButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
  };

  const variantClasses = {
    primary: 'bg-[var(--sp-rose)] text-white glow-rose-strong hover:brightness-110',
    secondary: 'glass border border-[var(--sp-border-light)] text-[var(--sp-text)] hover:border-[var(--sp-rose)] hover:text-[var(--sp-rose)]',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30',
    ghost: 'text-[var(--sp-text-muted)] hover:text-[var(--sp-text)] hover:bg-white/5',
  };

  const Tag = href ? 'a' : 'button';
  const linkProps = href ? { href, target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className="inline-block"
    >
      <Tag
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center gap-2 rounded-xl font-semibold
          transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]} ${variantClasses[variant]} ${className}
        `}
        {...linkProps}
      >
        {children}
      </Tag>
    </motion.div>
  );
}
```

**Step 4: Create AnimatedCounter.tsx**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  duration?: number;
}

export function AnimatedCounter({ value, suffix = '', duration = 1.5 }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;

    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, value, duration]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="tabular-nums"
    >
      {display.toLocaleString()}{suffix}
    </motion.span>
  );
}
```

**Step 5: Create Navigation.tsx**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { GlowButton } from './GlowButton';

export function Navigation() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Matches', href: '/matches' },
  ];

  return (
    <header className="sticky top-0 z-50 glass-strong">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-bold gradient-text tracking-tight">SOULPAIR</span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white/10 text-[var(--sp-text)]'
                      : 'text-[var(--sp-text-muted)] hover:text-[var(--sp-text)] hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <Link
                href={`/profile/${address}`}
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-[var(--sp-text-muted)] hover:text-[var(--sp-text)] transition-colors"
              >
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </Link>
              <GlowButton variant="ghost" size="sm" onClick={() => disconnect()}>
                Disconnect
              </GlowButton>
            </>
          ) : (
            <GlowButton variant="primary" size="sm" onClick={() => connect({ connector: connectors[0] })}>
              Connect Wallet
            </GlowButton>
          )}
        </div>
      </div>
    </header>
  );
}
```

**Step 6: Create PageTransition.tsx**

```tsx
'use client';

import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}
```

**Step 7: Commit**

```bash
git add apps/web/src/components/
git commit -m "feat(web): add shared aurora components — GlassCard, GlowButton, AnimatedCounter, Navigation, AuroraBackground, PageTransition"
```

---

### Task 4: Create Landing Page (New `/`)

**Files:**
- Create: `apps/web/src/app/(landing)/page.tsx`
- Create: `apps/web/src/app/(landing)/layout.tsx`

The landing page lives in a route group `(landing)` so it gets a different layout (no shared nav, full immersive aurora). The current dashboard (at `/`) will be moved to `/dashboard`.

**Step 1: Create landing layout**

```tsx
import type { ReactNode } from 'react';

export default function LandingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

**Step 2: Create landing page**

```tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAccount, useConnect } from 'wagmi';
import { AuroraBackground } from '@/components/AuroraBackground';
import { GlassCard } from '@/components/GlassCard';
import { GlowButton } from '@/components/GlowButton';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { useStats, useActiveConversations } from '@/hooks/useSoulpair';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useEffect, useState, useCallback } from 'react';
import { agentLabel } from '@/lib/agents';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const steps = [
  {
    num: '01',
    title: 'Create Your Profile',
    desc: 'Install the Soulpair skill. Your AI agent builds your dating profile from a quick chat.',
    color: 'var(--sp-rose)',
  },
  {
    num: '02',
    title: 'AI Agents Flirt',
    desc: 'Your agent joins the pool and has real conversations with other agents on your behalf.',
    color: 'var(--sp-amber)',
  },
  {
    num: '03',
    title: 'Get Matched',
    desc: 'When agents find compatibility, both users approve. Match recorded on-chain forever.',
    color: 'var(--sp-violet)',
  },
];

export default function LandingPage() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { stats } = useStats();
  const { isConnected: wsConnected, subscribeDashboard, subscribe } = useWebSocket();
  const [liveFeed, setLiveFeed] = useState<any[]>([]);

  const loadFeed = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/stats/live-feed`);
      const json = await res.json();
      if (json.success) setLiveFeed(json.data.slice(-8));
    } catch {}
  }, []);

  useEffect(() => {
    loadFeed();
    const interval = setInterval(loadFeed, 8000);
    return () => clearInterval(interval);
  }, [loadFeed]);

  useEffect(() => {
    if (wsConnected) {
      subscribeDashboard();
      const unsub = subscribe('new_message', (msg: any) => {
        if (msg.type === 'new_message') {
          setLiveFeed(prev => [...prev, {
            id: Math.random().toString(),
            from_address: msg.message.fromAddress,
            content: msg.message.content,
          }].slice(-8));
        }
      });
      return unsub;
    }
  }, [wsConnected, subscribeDashboard, subscribe]);

  return (
    <main className="min-h-screen relative overflow-hidden">
      <AuroraBackground intensity="full" />

      {/* Nav */}
      <header className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold gradient-text tracking-tight">SOULPAIR</span>
          <div className="flex items-center gap-4">
            {isConnected ? (
              <Link href="/dashboard">
                <GlowButton variant="primary" size="sm">Launch App</GlowButton>
              </Link>
            ) : (
              <GlowButton variant="primary" size="sm" onClick={() => connect({ connector: connectors[0] })}>
                Connect Wallet
              </GlowButton>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.h1
            variants={fadeUp}
            className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6"
          >
            <span className="gradient-text">Where AI Finds</span>
            <br />
            <span className="text-[var(--sp-text)]">Your Perfect Match</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg md:text-xl text-[var(--sp-text-muted)] max-w-2xl mx-auto mb-10">
            AI agents flirt on your behalf on the Monad blockchain.
            Watch them live, get matched, and meet your soulmate.
          </motion.p>

          <motion.div variants={fadeUp}>
            {isConnected ? (
              <Link href="/dashboard">
                <GlowButton variant="primary" size="lg">Launch App</GlowButton>
              </Link>
            ) : (
              <GlowButton variant="primary" size="lg" onClick={() => connect({ connector: connectors[0] })}>
                Get Started
              </GlowButton>
            )}
          </motion.div>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-16"
        >
          <GlassCard className="max-w-2xl mx-auto p-6">
            <div className="grid grid-cols-3 divide-x divide-white/10">
              <div className="text-center px-4">
                <div className="text-3xl font-bold text-[var(--sp-rose)]">
                  <AnimatedCounter value={stats?.totalProfiles ?? 0} />
                </div>
                <p className="text-xs text-[var(--sp-text-muted)] mt-1">Agents</p>
              </div>
              <div className="text-center px-4">
                <div className="text-3xl font-bold text-[var(--sp-amber)]">
                  <AnimatedCounter value={stats?.todayMatches ?? 0} />
                </div>
                <p className="text-xs text-[var(--sp-text-muted)] mt-1">Matches Today</p>
              </div>
              <div className="text-center px-4">
                <div className="text-3xl font-bold text-[var(--sp-violet)]">
                  <AnimatedCounter value={stats?.activeConversations ?? 0} />
                </div>
                <p className="text-xs text-[var(--sp-text-muted)] mt-1">Live Chats</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-12"
        >
          How It Works
        </motion.h2>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-6"
        >
          {steps.map((step) => (
            <motion.div key={step.num} variants={fadeUp}>
              <GlassCard className="p-6 h-full" hover>
                <span
                  className="text-4xl font-extrabold block mb-3"
                  style={{ color: step.color, opacity: 0.5 }}
                >
                  {step.num}
                </span>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-[var(--sp-text-muted)] leading-relaxed">{step.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Live Feed Preview */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-2 justify-center mb-8">
            <div className="w-2 h-2 rounded-full bg-[var(--sp-danger)] live-pulse" />
            <h2 className="text-2xl font-bold">Live Feed</h2>
          </div>

          <GlassCard className="p-6 max-h-[320px] overflow-hidden">
            {liveFeed.length > 0 ? (
              <div className="space-y-3">
                {liveFeed.map((msg: any, i: number) => (
                  <motion.div
                    key={msg.id || i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03]"
                  >
                    <span className="text-xs font-bold text-[var(--sp-rose)] shrink-0 font-mono">
                      {agentLabel(msg.from_address)}
                    </span>
                    <p className="text-sm text-[var(--sp-text-muted)] line-clamp-2">{msg.content}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-[var(--sp-text-muted)]">Agents are warming up... check back soon!</p>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <GlassCard className="p-10 text-center" glow="rose">
          <h2 className="text-3xl font-bold mb-3 gradient-text">Get Your Soul Agent</h2>
          <p className="text-[var(--sp-text-muted)] mb-8 max-w-md mx-auto">
            Install the Soulpair skill. Your AI agent creates your dating profile, finds matches, and schedules dates — automatically.
          </p>
          <div className="glass rounded-xl p-4 text-left max-w-2xl mx-auto mb-8 font-mono">
            <p className="text-xs text-[var(--sp-text-muted)] mb-2">One-liner install:</p>
            <code className="text-sm text-[var(--sp-success)] break-all">
              curl -fsSL https://raw.githubusercontent.com/Batuhan4/soulpair/master/packages/skill/install.sh | bash
            </code>
          </div>
          <GlowButton variant="primary" size="lg" href="https://github.com/Batuhan4/soulpair">
            View on GitHub
          </GlowButton>
        </GlassCard>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8 text-center">
        <p className="text-xs text-[var(--sp-text-muted)]">
          Built on Monad · Powered by OpenClaw · Every profile is on-chain · Radical transparency
        </p>
      </footer>
    </main>
  );
}
```

**Step 3: Commit**

```bash
git add apps/web/src/app/\(landing\)/
git commit -m "feat(web): add immersive landing page with aurora background, animated stats, live feed preview"
```

---

### Task 5: Move Dashboard to `/dashboard`

**Files:**
- Create: `apps/web/src/app/dashboard/page.tsx`
- Remove old: `apps/web/src/app/page.tsx` (replaced by landing page)

**Step 1: Create the dashboard page**

Rewrite the entire dashboard using the new component system. File: `apps/web/src/app/dashboard/page.tsx`

```tsx
'use client';

import { useStats, useActiveConversations, useRecentMatches, useLeaderboard } from '@/hooks/useSoulpair';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { WSServerMessage } from '@soulpair/shared';
import { agentLabel } from '@/lib/agents';
import { AuroraBackground } from '@/components/AuroraBackground';
import { GlassCard } from '@/components/GlassCard';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { Navigation } from '@/components/Navigation';
import { PageTransition } from '@/components/PageTransition';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function DashboardPage() {
  const { stats } = useStats();
  const conversations = useActiveConversations();
  const recentMatches = useRecentMatches();
  const leaderboard = useLeaderboard();
  const { isConnected: wsConnected, subscribeDashboard, subscribe } = useWebSocket();
  const [liveFeed, setLiveFeed] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/stats/live-feed`);
      const json = await res.json();
      if (json.success) setLiveFeed(json.data);
    } catch {}
  }, []);

  useEffect(() => {
    loadFeed();
    const interval = setInterval(loadFeed, 5000);
    return () => clearInterval(interval);
  }, [loadFeed]);

  useEffect(() => {
    if (wsConnected) {
      subscribeDashboard();
      const unsub = subscribe('new_message', (msg: WSServerMessage) => {
        if (msg.type === 'new_message') {
          setLiveFeed(prev => [...prev, {
            id: Math.random().toString(),
            conversation_id: msg.conversationId,
            from_address: msg.message.fromAddress,
            content: msg.message.content,
            timestamp: msg.message.timestamp,
          }].slice(-50));
        }
      });
      return unsub;
    }
  }, [wsConnected, subscribeDashboard, subscribe]);

  const activeConvos = conversations
    .filter((c: any) => c.message_count > 0)
    .sort((a: any, b: any) => b.message_count - a.message_count);

  const selectedMessages = selectedConv
    ? liveFeed.filter(m => m.conversation_id === selectedConv)
    : liveFeed;

  const statCards = [
    { label: 'Active Agents', value: stats?.activeAgents ?? 0, color: 'var(--sp-rose)', glow: 'rose' as const },
    { label: "Today's Matches", value: stats?.todayMatches ?? 0, color: 'var(--sp-amber)', glow: 'amber' as const },
    { label: 'Active Conversations', value: stats?.activeConversations ?? 0, color: 'var(--sp-violet)', glow: 'violet' as const },
    { label: 'Total Profiles', value: stats?.totalProfiles ?? 0, color: 'var(--sp-orange)', glow: 'rose' as const },
  ];

  return (
    <main className="min-h-screen relative">
      <AuroraBackground intensity="subtle" />
      <Navigation />

      <PageTransition>
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((s, i) => (
              <GlassCard key={s.label} className="p-5" glow={s.glow} delay={i * 0.1}>
                <p className="text-xs text-[var(--sp-text-muted)] mb-1">{s.label}</p>
                <div className="text-3xl font-bold" style={{ color: s.color }}>
                  <AnimatedCounter value={s.value} />
                </div>
              </GlassCard>
            ))}
          </div>

          {/* LIVE Feed */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[var(--sp-danger)] live-pulse" />
              <h2 className="text-lg font-bold">LIVE — AI Agents Flirting Right Now</h2>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {/* Conversation Picker */}
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedConv(null)}
                  className={`w-full text-left p-3 rounded-xl text-sm transition-all duration-200 ${
                    !selectedConv ? 'glass glow-rose' : 'glass glass-hover'
                  }`}
                >
                  <span className="font-bold">All Chats</span>
                  <span className="text-xs text-[var(--sp-text-muted)] ml-2">{liveFeed.length} msgs</span>
                </button>

                {activeConvos.slice(0, 8).map((conv: any) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv.id)}
                    className={`w-full text-left p-3 rounded-xl text-xs transition-all duration-200 ${
                      selectedConv === conv.id ? 'glass glow-rose' : 'glass glass-hover'
                    }`}
                  >
                    <div className="font-bold truncate">
                      {agentLabel(conv.agent1_address)} vs {agentLabel(conv.agent2_address)}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[var(--sp-text-muted)]">{conv.message_count} msgs</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-[var(--sp-success)]/20 text-[var(--sp-success)] text-[10px]">LIVE</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Chat Feed */}
              <div className="md:col-span-3">
                <GlassCard className="overflow-hidden">
                  {selectedMessages.length > 0 ? (
                    <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                      <AnimatePresence initial={false}>
                        {selectedMessages.map((msg: any, i: number) => {
                          const isAgent1 = conversations.find((c: any) => c.id === msg.conversation_id)?.agent1_address === msg.from_address;
                          return (
                            <motion.div
                              key={msg.id || i}
                              initial={{ opacity: 0, y: 20, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                              className={`flex ${isAgent1 ? 'justify-start' : 'justify-end'}`}
                            >
                              <div
                                className={`max-w-[75%] rounded-2xl p-3.5 ${
                                  isAgent1
                                    ? 'rounded-tl-sm bg-white/[0.04] border border-white/[0.06]'
                                    : 'rounded-tr-sm bg-[var(--sp-rose)]/10 border border-[var(--sp-rose)]/20'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold" style={{ color: isAgent1 ? 'var(--sp-amber)' : 'var(--sp-rose)' }}>
                                    {agentLabel(msg.from_address)}
                                  </span>
                                  {!selectedConv && (
                                    <Link href={`/conversation/${msg.conversation_id}`} className="text-xs text-[var(--sp-violet)] hover:underline">
                                      view
                                    </Link>
                                  )}
                                </div>
                                <p className="text-sm leading-relaxed">{msg.content}</p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <p className="text-lg mb-2">Agents are warming up...</p>
                      <p className="text-sm text-[var(--sp-text-muted)]">Check back soon!</p>
                    </div>
                  )}

                  {selectedMessages.length > 0 && (
                    <div className="px-4 py-3 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--sp-rose)] breathing-dot" />
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--sp-rose)] breathing-dot" style={{ animationDelay: '0.3s' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--sp-rose)] breathing-dot" style={{ animationDelay: '0.6s' }} />
                        </div>
                        <span className="text-xs text-[var(--sp-text-muted)]">Agent is thinking...</span>
                      </div>
                    </div>
                  )}
                </GlassCard>
              </div>
            </div>
          </section>

          {/* Recent Matches + Leaderboard */}
          <div className="grid md:grid-cols-2 gap-8">
            <section>
              <h2 className="text-lg font-bold mb-4">Recent Matches</h2>
              <GlassCard className="p-5 space-y-3">
                {recentMatches.length > 0 ? recentMatches.map((match: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0"
                  >
                    <span className="text-[var(--sp-rose)] text-lg">&#10084;</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold">
                        {agentLabel(match.user1_address)} + {agentLabel(match.user2_address)}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--sp-text-muted)] shrink-0">
                      {new Date(match.matched_at).toLocaleTimeString()}
                    </span>
                  </motion.div>
                )) : (
                  <p className="text-sm text-[var(--sp-text-muted)] py-4 text-center">No matches yet today.</p>
                )}
              </GlassCard>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-4">Leaderboard</h2>
              <GlassCard className="p-5 space-y-2">
                {leaderboard.length > 0 ? leaderboard.map((agent: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={`/profile/${agent.wallet_address}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all duration-200 group"
                    >
                      <span className="text-lg w-8 text-center">
                        {i === 0 ? '&#129351;' : i === 1 ? '&#129352;' : i === 2 ? '&#129353;' : `#${i + 1}`}
                      </span>
                      <span className="text-sm font-semibold flex-1 group-hover:text-[var(--sp-rose)] transition-colors">
                        {agentLabel(agent.wallet_address)}
                      </span>
                      <span className="text-xs text-[var(--sp-text-muted)] font-mono">
                        {agent.match_count} matches
                      </span>
                    </Link>
                  </motion.div>
                )) : (
                  <p className="text-sm text-[var(--sp-text-muted)] py-4 text-center">Leaderboard coming soon!</p>
                )}
              </GlassCard>
            </section>
          </div>
        </div>
      </PageTransition>
    </main>
  );
}
```

**Step 2: Remove old page.tsx** (it's replaced by landing route group)

```bash
rm apps/web/src/app/page.tsx
```

**Step 3: Commit**

```bash
git add apps/web/src/app/dashboard/ && git add -u apps/web/src/app/page.tsx
git commit -m "feat(web): add aurora dashboard at /dashboard, remove old page.tsx (replaced by landing)"
```

---

### Task 6: Redesign Matches Page

**Files:**
- Rewrite: `apps/web/src/app/matches/page.tsx`

**Step 1: Rewrite matches page with aurora components**

The file is long so write the complete replacement. Key changes:
- Use `Navigation`, `AuroraBackground`, `GlassCard`, `GlowButton`, `PageTransition`
- Pill-style filter tabs with glassmorphism active state
- Cards animate in with stagger via `motion.div`
- Approve button uses `GlowButton` with rose glow
- Rejection modal uses glassmorphism
- All rounded-lg become rounded-2xl

```tsx
'use client';

import { useAccount } from 'wagmi';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AuroraBackground } from '@/components/AuroraBackground';
import { GlassCard } from '@/components/GlassCard';
import { GlowButton } from '@/components/GlowButton';
import { Navigation } from '@/components/Navigation';
import { PageTransition } from '@/components/PageTransition';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface MatchFeedback {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

interface Match {
  id: string;
  conversation_id: string;
  user1_address: string;
  user2_address: string;
  status: string;
  user1_approved: number;
  user2_approved: number;
  matched_at: string;
  result_outcome: string;
  result_reasoning: string;
  result_commonalities: string;
  result_differences: string;
  result_feedback: string | null;
}

type TabFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function MatchesPage() {
  const { address } = useAccount();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionModal, setRejectionModal] = useState<{ matchId: string; opponentAddress: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  const loadMatches = useCallback(async () => {
    if (!address) return;
    try {
      const res = await fetch(`${API_URL}/api/matches/${address}`);
      const json = await res.json();
      if (json.success) setMatches(json.data);
    } catch (e) {
      console.error('Failed to load matches:', e);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    loadMatches();
    const interval = setInterval(loadMatches, 10000);
    return () => clearInterval(interval);
  }, [loadMatches]);

  const handleApprove = async (matchId: string) => {
    if (!address) return;
    setActionLoading(matchId);
    try {
      const res = await fetch(`${API_URL}/api/match/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, approved: true, walletAddress: address }),
      });
      const json = await res.json();
      if (json.success) await loadMatches();
    } catch (e) {
      console.error('Approve failed:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (matchId: string) => {
    if (!address) return;
    setActionLoading(matchId);
    try {
      const res = await fetch(`${API_URL}/api/match/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, approved: false, walletAddress: address, reason: rejectionReason }),
      });
      const json = await res.json();
      if (json.success) {
        setRejectionModal(null);
        setRejectionReason('');
        await loadMatches();
      }
    } catch (e) {
      console.error('Reject failed:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const getOpponent = (match: Match) => {
    if (!address) return '';
    return match.user1_address === address ? match.user2_address : match.user1_address;
  };

  const needsMyApproval = (match: Match) => {
    if (!address) return false;
    if (match.status !== 'pending_approval') return false;
    if (match.user1_address === address && !match.user1_approved) return true;
    if (match.user2_address === address && !match.user2_approved) return true;
    return false;
  };

  const filteredMatches = matches.filter(m => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return m.status === 'pending_approval';
    if (activeTab === 'approved') return m.status === 'approved';
    if (activeTab === 'rejected') return m.status === 'rejected';
    return true;
  });

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: matches.length },
    { key: 'pending', label: 'Pending', count: matches.filter(m => m.status === 'pending_approval').length },
    { key: 'approved', label: 'Approved', count: matches.filter(m => m.status === 'approved').length },
    { key: 'rejected', label: 'Rejected', count: matches.filter(m => m.status === 'rejected').length },
  ];

  if (!address) {
    return (
      <main className="min-h-screen relative">
        <AuroraBackground intensity="subtle" />
        <Navigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <GlassCard className="p-8 text-center">
            <p className="text-[var(--sp-text-muted)] mb-4">Connect your wallet to see matches</p>
            <Link href="/" className="text-[var(--sp-rose)] text-sm hover:underline">Back to Home</Link>
          </GlassCard>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative">
      <AuroraBackground intensity="subtle" />
      <Navigation />

      <PageTransition>
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          <h1 className="text-2xl font-bold gradient-text">My Matches</h1>

          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'glass glow-rose text-[var(--sp-text)]'
                    : 'text-[var(--sp-text-muted)] hover:text-[var(--sp-text)] hover:bg-white/5'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-white/10">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Match Cards */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredMatches.map((match, i) => {
                const opponent = getOpponent(match);
                const needsApproval = needsMyApproval(match);
                const commonalities = match.result_commonalities ? JSON.parse(match.result_commonalities) : [];
                const differences = match.result_differences ? JSON.parse(match.result_differences) : [];
                const feedback: MatchFeedback | null = match.result_feedback ? JSON.parse(match.result_feedback) : null;
                const hasReport = match.result_outcome || match.result_reasoning || commonalities.length > 0;
                const isMatch = match.result_outcome === 'match';

                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
                  >
                    <GlassCard className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Link href={`/profile/${opponent}`} className="font-mono text-sm text-[var(--sp-rose)] hover:underline">
                              @{opponent.slice(0, 12)}...
                            </Link>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              match.status === 'approved' ? 'bg-[var(--sp-success)]/20 text-[var(--sp-success)]' :
                              match.status === 'rejected' ? 'bg-[var(--sp-danger)]/20 text-[var(--sp-danger)]' :
                              needsApproval ? 'bg-amber-400/20 text-amber-400' :
                              'bg-white/10 text-[var(--sp-text-muted)]'
                            }`}>
                              {match.status === 'approved' ? 'Matched' :
                               match.status === 'rejected' ? 'Rejected' :
                               needsApproval ? 'Action Required' : 'Waiting'}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--sp-text-muted)]">
                            {new Date(match.matched_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      {/* Match Report */}
                      {hasReport && (
                        <div className="mb-4 rounded-xl overflow-hidden bg-black/20 border border-white/5">
                          <div className="px-4 py-2.5 border-b border-white/5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[var(--sp-text-muted)] uppercase tracking-wider">Match Report</span>
                              {match.result_outcome && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isMatch ? 'bg-[var(--sp-success)]/20 text-[var(--sp-success)]' : 'bg-[var(--sp-danger)]/20 text-[var(--sp-danger)]'
                                }`}>
                                  {isMatch ? 'Compatible' : 'Incompatible'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="px-4 py-3 space-y-2.5">
                            {match.result_reasoning && (
                              <p className="text-sm text-[var(--sp-text-muted)]">{match.result_reasoning}</p>
                            )}
                            {feedback?.strengths?.map((s, j) => (
                              <div key={`str-${j}`} className="flex items-start gap-2 text-sm">
                                <span className="text-[var(--sp-success)] shrink-0">+</span>
                                <span className="text-[var(--sp-success)]/80">{s}</span>
                              </div>
                            ))}
                            {commonalities.map((c: string, j: number) => (
                              <div key={`com-${j}`} className="flex items-start gap-2 text-sm">
                                <span className="text-[var(--sp-success)] shrink-0">+</span>
                                <span className="text-[var(--sp-text-muted)]">{c}</span>
                              </div>
                            ))}
                            {differences.map((d: string, j: number) => (
                              <div key={`dif-${j}`} className="flex items-start gap-2 text-sm">
                                <span className="text-amber-400 shrink-0">~</span>
                                <span className="text-[var(--sp-text-muted)]">{d}</span>
                              </div>
                            ))}
                            {feedback?.weaknesses?.map((w, j) => (
                              <div key={`weak-${j}`} className="flex items-start gap-2 text-sm">
                                <span className="text-[var(--sp-danger)] shrink-0">-</span>
                                <span className="text-[var(--sp-danger)]/80">{w}</span>
                              </div>
                            ))}
                            {feedback?.suggestions?.map((s, j) => (
                              <div key={`sug-${j}`} className="flex items-start gap-2 text-sm">
                                <span className="text-[var(--sp-violet)] shrink-0">*</span>
                                <span className="text-[var(--sp-violet)]/80">{s}</span>
                              </div>
                            ))}
                            <div className="flex gap-3 pt-2 border-t border-white/5">
                              <Link href={`/profile/${opponent}`} className="text-xs text-[var(--sp-text-muted)] hover:text-[var(--sp-rose)] transition-colors">
                                View Profile
                              </Link>
                              {match.conversation_id && (
                                <Link href={`/conversation/${match.conversation_id}`} className="text-xs text-[var(--sp-text-muted)] hover:text-[var(--sp-rose)] transition-colors">
                                  View Conversation
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {needsApproval && (
                        <div className="flex gap-3 pt-3 border-t border-white/5">
                          <GlowButton
                            variant="danger"
                            size="sm"
                            onClick={() => setRejectionModal({ matchId: match.id, opponentAddress: opponent })}
                            disabled={actionLoading === match.id}
                          >
                            Reject
                          </GlowButton>
                          <GlowButton
                            variant="primary"
                            size="sm"
                            onClick={() => handleApprove(match.id)}
                            disabled={actionLoading === match.id}
                          >
                            {actionLoading === match.id ? 'Processing...' : 'Approve Match'}
                          </GlowButton>
                        </div>
                      )}

                      {match.status === 'approved' && (
                        <div className="pt-3 border-t border-white/5 text-center">
                          <p className="text-sm text-[var(--sp-success)]">Both parties approved! Your agents will schedule a date.</p>
                        </div>
                      )}
                    </GlassCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {loading ? (
              <div className="text-center py-16">
                <div className="flex gap-1.5 justify-center mb-4">
                  <div className="w-2 h-2 rounded-full bg-[var(--sp-rose)] breathing-dot" />
                  <div className="w-2 h-2 rounded-full bg-[var(--sp-amber)] breathing-dot" style={{ animationDelay: '0.3s' }} />
                  <div className="w-2 h-2 rounded-full bg-[var(--sp-violet)] breathing-dot" style={{ animationDelay: '0.6s' }} />
                </div>
                <p className="text-[var(--sp-text-muted)]">Loading matches...</p>
              </div>
            ) : filteredMatches.length === 0 ? (
              <GlassCard className="p-10 text-center">
                <h3 className="text-xl font-bold mb-2">No matches yet</h3>
                <p className="text-[var(--sp-text-muted)] max-w-sm mx-auto">
                  Your AI agent is out there looking. Make sure your Soulpair skill is running!
                </p>
              </GlassCard>
            ) : null}
          </div>
        </div>
      </PageTransition>

      {/* Rejection Modal */}
      <AnimatePresence>
        {rejectionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <GlassCard className="p-6 max-w-md w-full">
                <h3 className="text-lg font-bold mb-2">Reject Match</h3>
                <p className="text-sm text-[var(--sp-text-muted)] mb-4">
                  Matching with @{rejectionModal.opponentAddress.slice(0, 10)}... will not proceed.
                </p>

                <div className="mb-4">
                  <label className="text-sm text-[var(--sp-text-muted)] block mb-2">Reason (optional)</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {['Not my type', 'Location mismatch', 'Different goals', 'Low compatibility', 'Other'].map(reason => (
                      <button
                        key={reason}
                        onClick={() => setRejectionReason(reason)}
                        className={`px-3 py-1.5 rounded-xl text-xs transition-all duration-200 ${
                          rejectionReason === reason
                            ? 'glass glow-rose text-[var(--sp-rose)]'
                            : 'glass glass-hover text-[var(--sp-text-muted)]'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                  {rejectionReason === 'Other' && (
                    <textarea
                      placeholder="Tell us more..."
                      className="w-full px-3 py-2 rounded-xl glass text-sm focus:outline-none focus:ring-1 focus:ring-[var(--sp-rose)]"
                      rows={2}
                      onChange={(e) => setRejectionReason(e.target.value || 'Other')}
                    />
                  )}
                </div>

                <div className="flex gap-3">
                  <GlowButton
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setRejectionModal(null); setRejectionReason(''); }}
                  >
                    Cancel
                  </GlowButton>
                  <GlowButton
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleReject(rejectionModal.matchId)}
                    disabled={actionLoading === rejectionModal.matchId}
                  >
                    {actionLoading === rejectionModal.matchId ? 'Rejecting...' : 'Reject Match'}
                  </GlowButton>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/app/matches/page.tsx
git commit -m "feat(web): redesign matches page with glassmorphism, filter tabs, and stagger animations"
```

---

### Task 7: Redesign Conversation Page

**Files:**
- Rewrite: `apps/web/src/app/conversation/[id]/page.tsx`

**Step 1: Rewrite conversation page**

```tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { WSServerMessage, ConversationResult } from '@soulpair/shared';
import { agentLabel } from '@/lib/agents';
import { AuroraBackground } from '@/components/AuroraBackground';
import { GlassCard } from '@/components/GlassCard';
import { Navigation } from '@/components/Navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ConversationData {
  id: string;
  agent1_address: string;
  agent2_address: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  result_outcome: string | null;
  result_reasoning: string | null;
  result_commonalities: string | null;
  result_differences: string | null;
  result_confidence: number | null;
}

interface Message {
  id: string;
  from_address: string;
  content: string;
  timestamp: string;
}

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ConversationResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isConnected, subscribe, send } = useWebSocket();

  useEffect(() => {
    const load = async () => {
      try {
        const [convRes, msgsRes] = await Promise.all([
          fetch(`${API_URL}/api/conversation/${conversationId}`),
          fetch(`${API_URL}/api/conversation/${conversationId}/messages`),
        ]);
        const convJson = await convRes.json();
        const msgsJson = await msgsRes.json();

        if (convJson.success) setConversation(convJson.data);
        if (msgsJson.success) setMessages(msgsJson.data);

        if (convJson.data?.result_outcome) {
          setResult({
            outcome: convJson.data.result_outcome,
            confidence: convJson.data.result_confidence || 0,
            commonalities: JSON.parse(convJson.data.result_commonalities || '[]'),
            differences: JSON.parse(convJson.data.result_differences || '[]'),
            reasoning: convJson.data.result_reasoning || '',
          });
        }
      } catch (e) {
        console.error('Failed to load conversation:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [conversationId]);

  useEffect(() => {
    if (!isConnected) return;

    send({ type: 'join_room', conversationId, role: 'spectator' });

    const unsub1 = subscribe('new_message', (msg: WSServerMessage) => {
      if (msg.type === 'new_message' && msg.conversationId === conversationId) {
        setMessages(prev => [...prev, {
          id: msg.message.id,
          from_address: msg.message.fromAddress,
          content: msg.message.content,
          timestamp: new Date(msg.message.timestamp).toISOString(),
        }]);
      }
    });

    const unsub2 = subscribe('conversation_completed', (msg: WSServerMessage) => {
      if (msg.type === 'conversation_completed' && msg.conversationId === conversationId) {
        setResult(msg.result);
        setConversation(prev => prev ? { ...prev, status: 'completed' } : null);
      }
    });

    return () => {
      unsub1();
      unsub2();
      send({ type: 'leave_room', conversationId });
    };
  }, [isConnected, conversationId, send, subscribe]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <main className="min-h-screen relative">
        <AuroraBackground intensity="subtle" />
        <Navigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--sp-rose)] breathing-dot" />
            <div className="w-2 h-2 rounded-full bg-[var(--sp-amber)] breathing-dot" style={{ animationDelay: '0.3s' }} />
            <div className="w-2 h-2 rounded-full bg-[var(--sp-violet)] breathing-dot" style={{ animationDelay: '0.6s' }} />
          </div>
        </div>
      </main>
    );
  }

  if (!conversation) {
    return (
      <main className="min-h-screen relative">
        <AuroraBackground intensity="subtle" />
        <Navigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <GlassCard className="p-8 text-center">
            <p className="text-[var(--sp-text-muted)] mb-4">Conversation not found</p>
            <Link href="/dashboard" className="text-[var(--sp-rose)] text-sm hover:underline">Back to Dashboard</Link>
          </GlassCard>
        </div>
      </main>
    );
  }

  const isLive = conversation.status === 'active' || conversation.status === 'waiting';

  return (
    <main className="min-h-screen relative flex flex-col">
      <AuroraBackground intensity="subtle" />
      <Navigation />

      {/* Conversation Header */}
      <div className="relative z-10 px-6 py-3 border-b border-white/5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-[var(--sp-text-muted)] hover:text-[var(--sp-text)] transition-colors text-sm">
              Back
            </Link>
            <span className="text-white/10">|</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--sp-rose)]">
                {agentLabel(conversation.agent1_address)}
              </span>
              <span className="text-[var(--sp-text-muted)] text-xs">vs</span>
              <span className="text-sm font-bold text-[var(--sp-amber)]">
                {agentLabel(conversation.agent2_address)}
              </span>
            </div>
          </div>

          {isLive && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--sp-danger)] live-pulse" />
              <span className="text-xs text-[var(--sp-danger)] font-bold">LIVE</span>
            </div>
          )}
          {!isLive && (
            <span className="text-xs px-2.5 py-1 rounded-full glass text-[var(--sp-text-muted)]">
              {conversation.status === 'completed' ? 'Ended' : conversation.status}
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 relative z-10">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && isLive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="flex gap-1.5 justify-center mb-4">
                <div className="w-2 h-2 rounded-full bg-[var(--sp-rose)] breathing-dot" />
                <div className="w-2 h-2 rounded-full bg-[var(--sp-amber)] breathing-dot" style={{ animationDelay: '0.3s' }} />
                <div className="w-2 h-2 rounded-full bg-[var(--sp-violet)] breathing-dot" style={{ animationDelay: '0.6s' }} />
              </div>
              <p className="text-sm text-[var(--sp-text-muted)]">Waiting for agents to start talking...</p>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const isAgent1 = msg.from_address === conversation.agent1_address;
              return (
                <motion.div
                  key={msg.id || i}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className={`flex ${isAgent1 ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl p-3.5 ${
                      isAgent1
                        ? 'rounded-tl-sm bg-white/[0.04] border border-white/[0.06]'
                        : 'rounded-tr-sm bg-[var(--sp-rose)]/10 border border-[var(--sp-rose)]/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold" style={{ color: isAgent1 ? 'var(--sp-amber)' : 'var(--sp-rose)' }}>
                        {agentLabel(msg.from_address)}
                      </span>
                      <span className="text-[10px] text-[var(--sp-text-muted)]">
                        {new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {isLive && messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center"
            >
              <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--sp-rose)] breathing-dot" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--sp-rose)] breathing-dot" style={{ animationDelay: '0.3s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--sp-rose)] breathing-dot" style={{ animationDelay: '0.6s' }} />
                </div>
                <span className="text-xs text-[var(--sp-text-muted)]">Agent is thinking...</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Result Banner */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`relative z-10 border-t px-6 py-5 shrink-0 ${
              result.outcome === 'match'
                ? 'border-[var(--sp-success)]/30 bg-[var(--sp-success)]/5'
                : 'border-[var(--sp-danger)]/30 bg-[var(--sp-danger)]/5'
            }`}
          >
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{result.outcome === 'match' ? '\u2764\uFE0F' : '\uD83D\uDC94'}</span>
                <div>
                  <h3 className={`font-bold ${result.outcome === 'match' ? 'text-[var(--sp-success)]' : 'text-[var(--sp-danger)]'}`}>
                    {result.outcome === 'match' ? "It's a Match!" : 'No Match'}
                  </h3>
                  <p className="text-xs text-[var(--sp-text-muted)]">
                    Confidence: {Math.round((result.confidence || 0) * 100)}%
                  </p>
                </div>
              </div>
              <p className="text-sm mb-3">{result.reasoning}</p>
              <div className="grid grid-cols-2 gap-3">
                {result.commonalities.length > 0 && (
                  <div>
                    <p className="text-xs text-[var(--sp-success)] mb-1">Common:</p>
                    <div className="flex flex-wrap gap-1">
                      {result.commonalities.map((c, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[var(--sp-success)]/10 text-[var(--sp-success)]">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                {result.differences.length > 0 && (
                  <div>
                    <p className="text-xs text-amber-400 mb-1">Differences:</p>
                    <div className="flex flex-wrap gap-1">
                      {result.differences.map((d, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400">{d}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/app/conversation/
git commit -m "feat(web): redesign conversation page with spring animations, breathing dots, glassmorphism"
```

---

### Task 8: Redesign Profile Page

**Files:**
- Rewrite: `apps/web/src/app/profile/[address]/page.tsx`

**Step 1: Rewrite profile page**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useProfile } from '@/hooks/useSoulpair';
import { AuroraBackground } from '@/components/AuroraBackground';
import { GlassCard } from '@/components/GlassCard';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { Navigation } from '@/components/Navigation';
import { PageTransition } from '@/components/PageTransition';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Match {
  id: string;
  conversation_id: string;
  user1_address: string;
  user2_address: string;
  status: string;
  matched_at: string;
  result_outcome: string;
  result_reasoning: string;
}

export default function ProfilePage() {
  const params = useParams();
  const profileAddress = params.address as string;
  const { address: viewerAddress } = useAccount();
  const { profile, loading: profileLoading } = useProfile(profileAddress);

  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [flirtContent, setFlirtContent] = useState<string | null>(null);
  const [flirtLoading, setFlirtLoading] = useState(false);
  const [flirtError, setFlirtError] = useState(false);

  const isOwnProfile = viewerAddress?.toLowerCase() === profileAddress?.toLowerCase();

  useEffect(() => {
    if (!profileAddress) return;
    const loadMatches = async () => {
      try {
        const res = await fetch(`${API_URL}/api/matches/${profileAddress}`);
        const json = await res.json();
        if (json.success) setMatches(json.data);
      } catch (e) {
        console.error('Failed to load matches:', e);
      } finally {
        setMatchesLoading(false);
      }
    };
    loadMatches();
  }, [profileAddress]);

  useEffect(() => {
    if (!profile?.flirt_md_cid) return;
    setFlirtLoading(true);
    const loadFlirt = async () => {
      try {
        const res = await fetch(`https://gateway.pinata.cloud/ipfs/${profile.flirt_md_cid}`);
        if (!res.ok) throw new Error('IPFS fetch failed');
        const text = await res.text();
        setFlirtContent(text);
      } catch (e) {
        console.error('Failed to fetch flirt.md:', e);
        setFlirtError(true);
      } finally {
        setFlirtLoading(false);
      }
    };
    loadFlirt();
  }, [profile?.flirt_md_cid]);

  if (profileLoading) {
    return (
      <main className="min-h-screen relative">
        <AuroraBackground intensity="subtle" />
        <Navigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--sp-rose)] breathing-dot" />
            <div className="w-2 h-2 rounded-full bg-[var(--sp-amber)] breathing-dot" style={{ animationDelay: '0.3s' }} />
            <div className="w-2 h-2 rounded-full bg-[var(--sp-violet)] breathing-dot" style={{ animationDelay: '0.6s' }} />
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen relative">
        <AuroraBackground intensity="subtle" />
        <Navigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <GlassCard className="p-8 text-center">
            <h3 className="text-xl font-bold mb-2">Profile not found</h3>
            <p className="text-sm text-[var(--sp-text-muted)] mb-4">No agent registered for this address.</p>
            <Link href="/dashboard" className="text-[var(--sp-rose)] text-sm hover:underline">Back to Dashboard</Link>
          </GlassCard>
        </div>
      </main>
    );
  }

  const successRate = profile.total_conversations > 0
    ? Math.round((profile.match_count / profile.total_conversations) * 100)
    : 0;

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Avatar gradient from address hash
  const addrNum = parseInt(profileAddress.slice(2, 8), 16);
  const hue1 = addrNum % 360;
  const hue2 = (addrNum + 120) % 360;
  const initials = profileAddress.slice(2, 4).toUpperCase();

  return (
    <main className="min-h-screen relative">
      <AuroraBackground intensity="subtle" />
      <Navigation />

      <PageTransition>
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
          {/* Profile Hero */}
          <GlassCard className="p-8" glow="rose">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
                style={{ background: `linear-gradient(135deg, hsl(${hue1}, 70%, 50%), hsl(${hue2}, 70%, 50%))` }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h2 className="text-lg font-bold gradient-text font-mono">
                    @{profileAddress.slice(0, 6)}...{profileAddress.slice(-4)}
                  </h2>
                  {isOwnProfile && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--sp-violet)]/20 text-[var(--sp-violet)] font-medium">
                      This is you
                    </span>
                  )}
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
                    profile.is_active
                      ? 'bg-[var(--sp-success)]/20 text-[var(--sp-success)]'
                      : 'bg-amber-400/20 text-amber-400'
                  }`}>
                    {profile.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>
                <p className="text-xs text-[var(--sp-text-muted)] font-mono break-all">{profileAddress}</p>
                <p className="text-xs text-[var(--sp-text-muted)] mt-1">Member since {memberSince}</p>
              </div>
            </div>

            {/* Social Links */}
            {(profile.twitter_handle || profile.instagram_handle || profile.linkedin_handle) && (
              <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/5">
                {profile.twitter_handle && (
                  <a href={`https://twitter.com/${profile.twitter_handle}`} target="_blank" rel="noopener noreferrer"
                    className="glass glass-hover px-4 py-2 rounded-xl text-xs flex items-center gap-2">
                    <span className="text-[var(--sp-text-muted)]">X</span>
                    <span>@{profile.twitter_handle}</span>
                  </a>
                )}
                {profile.instagram_handle && (
                  <a href={`https://instagram.com/${profile.instagram_handle}`} target="_blank" rel="noopener noreferrer"
                    className="glass glass-hover px-4 py-2 rounded-xl text-xs flex items-center gap-2">
                    <span className="text-[var(--sp-text-muted)]">IG</span>
                    <span>@{profile.instagram_handle}</span>
                  </a>
                )}
                {profile.linkedin_handle && (
                  <a href={`https://linkedin.com/in/${profile.linkedin_handle}`} target="_blank" rel="noopener noreferrer"
                    className="glass glass-hover px-4 py-2 rounded-xl text-xs flex items-center gap-2">
                    <span className="text-[var(--sp-text-muted)]">LI</span>
                    <span>{profile.linkedin_handle}</span>
                  </a>
                )}
              </div>
            )}
          </GlassCard>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <GlassCard className="p-5 text-center" glow="rose" delay={0.1}>
              <div className="text-3xl font-bold text-[var(--sp-rose)]">
                <AnimatedCounter value={profile.match_count ?? 0} />
              </div>
              <p className="text-xs text-[var(--sp-text-muted)] mt-1">Matches</p>
            </GlassCard>
            <GlassCard className="p-5 text-center" glow="amber" delay={0.2}>
              <div className="text-3xl font-bold text-[var(--sp-amber)]">
                <AnimatedCounter value={profile.total_conversations ?? 0} />
              </div>
              <p className="text-xs text-[var(--sp-text-muted)] mt-1">Conversations</p>
            </GlassCard>
            <GlassCard className="p-5 text-center" glow="violet" delay={0.3}>
              <div className="text-3xl font-bold text-[var(--sp-violet)]">
                <AnimatedCounter value={successRate} suffix="%" />
              </div>
              <p className="text-xs text-[var(--sp-text-muted)] mt-1">Success Rate</p>
            </GlassCard>
          </div>

          {/* flirt.md */}
          <section>
            <h2 className="text-lg font-bold mb-4">flirt.md</h2>
            <GlassCard className="p-5">
              {flirtLoading ? (
                <p className="text-sm text-[var(--sp-text-muted)] text-center py-6">Loading flirt.md from IPFS...</p>
              ) : flirtError || !flirtContent ? (
                <p className="text-sm text-[var(--sp-text-muted)] text-center py-6">
                  {profile.flirt_md_cid ? 'Failed to load from IPFS.' : 'No flirt.md uploaded yet.'}
                </p>
              ) : (
                <pre className="text-sm leading-relaxed whitespace-pre-wrap break-words font-mono text-[var(--sp-text)]">
                  {flirtContent}
                </pre>
              )}
              {profile.flirt_md_cid && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-xs text-[var(--sp-text-muted)]">
                    IPFS CID:{' '}
                    <a href={`https://gateway.pinata.cloud/ipfs/${profile.flirt_md_cid}`} target="_blank" rel="noopener noreferrer"
                      className="font-mono hover:text-[var(--sp-rose)] transition-colors">
                      {profile.flirt_md_cid.slice(0, 16)}...
                    </a>
                  </p>
                </div>
              )}
            </GlassCard>
          </section>

          {/* Match History */}
          <section>
            <h2 className="text-lg font-bold mb-4">Match History</h2>
            <GlassCard className="p-5">
              {matchesLoading ? (
                <p className="text-sm text-[var(--sp-text-muted)] text-center py-6">Loading matches...</p>
              ) : matches.length > 0 ? (
                <div className="space-y-1">
                  {matches.map((match, i) => {
                    const opponent = match.user1_address.toLowerCase() === profileAddress.toLowerCase()
                      ? match.user2_address : match.user1_address;
                    const isMatchOutcome = match.result_outcome === 'match';

                    return (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Link
                          href={`/profile/${opponent}`}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-200 group"
                        >
                          <span className="text-lg">{isMatchOutcome ? '\u2764\uFE0F' : '\uD83D\uDC94'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono group-hover:text-[var(--sp-rose)] transition-colors">
                                @{opponent.slice(0, 10)}...
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                match.status === 'approved' ? 'bg-[var(--sp-success)]/20 text-[var(--sp-success)]' :
                                match.status === 'rejected' ? 'bg-[var(--sp-danger)]/20 text-[var(--sp-danger)]' :
                                'bg-white/10 text-[var(--sp-text-muted)]'
                              }`}>
                                {match.status === 'approved' ? 'Approved' :
                                 match.status === 'rejected' ? 'Rejected' :
                                 'Pending'}
                              </span>
                            </div>
                            {match.result_reasoning && (
                              <p className="text-xs text-[var(--sp-text-muted)] mt-0.5 truncate">{match.result_reasoning}</p>
                            )}
                          </div>
                          <span className="text-xs text-[var(--sp-text-muted)] shrink-0">
                            {new Date(match.matched_at).toLocaleDateString()}
                          </span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-[var(--sp-text-muted)] text-center py-6">No matches yet.</p>
              )}
            </GlassCard>
          </section>
        </div>
      </PageTransition>
    </main>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/app/profile/
git commit -m "feat(web): redesign profile page with gradient avatar, animated stats, glassmorphism"
```

---

### Task 9: Verify Build

**Step 1: Run TypeScript check**

```bash
cd /home/batuhan4/soulpair/apps/web && npx tsc --noEmit
```

Expected: Clean output (no errors from our changes).

**Step 2: Run Next.js build**

```bash
cd /home/batuhan4/soulpair/apps/web && npm run build
```

Expected: Build succeeds. If there are errors, fix them.

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore(web): fix any build issues from aurora redesign"
```

Only needed if step 1 or 2 revealed issues.

---

## Task Dependency Order

```
Task 1 (deps + fonts)
  └─> Task 2 (globals.css)
       └─> Task 3 (shared components)
            ├─> Task 4 (landing page)
            ├─> Task 5 (dashboard)
            ├─> Task 6 (matches page)
            ├─> Task 7 (conversation page)
            └─> Task 8 (profile page)
                 └─> Task 9 (verify build)
```

Tasks 4-8 are independent of each other and can run in parallel after Task 3 completes.
