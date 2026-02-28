'use client';

import { motion } from 'motion/react';
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
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={`glass rounded-2xl ${glowClass} ${hoverClass} ${className}`}
    >
      {children}
    </motion.div>
  );
}
