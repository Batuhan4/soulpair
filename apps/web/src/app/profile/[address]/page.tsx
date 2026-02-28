'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
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
