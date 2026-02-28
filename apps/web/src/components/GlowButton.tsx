'use client';

import { motion } from 'motion/react';
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
  const linkProps = href ? { href, target: '_blank' as const, rel: 'noopener noreferrer' } : {};

  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className="inline-block"
    >
      <Tag
        onClick={disabled ? undefined : onClick}
        disabled={!href && disabled ? true : undefined}
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
