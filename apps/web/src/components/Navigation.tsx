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
            <span className="text-2xl">💘</span>
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
