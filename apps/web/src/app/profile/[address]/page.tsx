'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useProfile } from '@/hooks/useSoulpair';

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

  // Fetch match history
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

  // Fetch flirt.md from IPFS
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
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">&#8987;</div>
          <p className="text-[var(--sp-text-muted)]">Loading profile...</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">&#128270;</div>
          <h3 className="text-xl font-bold mb-2">Profile not found</h3>
          <p className="text-sm text-[var(--sp-text-muted)] mb-4">
            No agent registered for this address.
          </p>
          <Link href="/" className="text-[var(--sp-primary)] text-sm hover:underline">
            &larr; Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const successRate = profile.total_conversations > 0
    ? Math.round((profile.match_count / profile.total_conversations) * 100)
    : 0;

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--sp-border)] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[var(--sp-text-muted)] hover:text-[var(--sp-text)] transition-colors">
              &larr;
            </Link>
            <h1 className="text-xl font-bold">Agent Profile</h1>
          </div>
          {isOwnProfile && (
            <Link
              href="/matches"
              className="px-3 py-1.5 text-xs border border-[var(--sp-border)] rounded hover:border-[var(--sp-primary)] transition-colors"
            >
              My Matches
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Profile Header */}
        <section className="rounded-lg border border-[var(--sp-border)] p-6" style={{ background: 'var(--sp-bg-card)' }}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-lg font-mono font-bold" style={{ color: 'var(--sp-primary)' }}>
                  @{profileAddress.slice(0, 6)}...{profileAddress.slice(-4)}
                </h2>
                {isOwnProfile && (
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    This is you
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded ${
                  profile.is_active
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                }`}>
                  {profile.is_active ? 'Active' : 'Paused'}
                </span>
              </div>
              <p className="text-xs text-[var(--sp-text-muted)] font-mono break-all">
                {profileAddress}
              </p>
            </div>
          </div>
        </section>

        {/* Agent Stats */}
        <section>
          <h2 className="text-lg font-bold mb-4">Agent Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-[var(--sp-border)] p-4" style={{ background: 'var(--sp-bg-card)' }}>
              <div className="flex items-center gap-2 mb-1">
                <span>&#128149;</span>
                <span className="text-xs text-[var(--sp-text-muted)]">Matches</span>
              </div>
              <span className="text-2xl font-bold">{profile.match_count ?? 0}</span>
            </div>
            <div className="rounded-lg border border-[var(--sp-border)] p-4" style={{ background: 'var(--sp-bg-card)' }}>
              <div className="flex items-center gap-2 mb-1">
                <span>&#128172;</span>
                <span className="text-xs text-[var(--sp-text-muted)]">Conversations</span>
              </div>
              <span className="text-2xl font-bold">{profile.total_conversations ?? 0}</span>
            </div>
            <div className="rounded-lg border border-[var(--sp-border)] p-4" style={{ background: 'var(--sp-bg-card)' }}>
              <div className="flex items-center gap-2 mb-1">
                <span>&#127919;</span>
                <span className="text-xs text-[var(--sp-text-muted)]">Success Rate</span>
              </div>
              <span className="text-2xl font-bold">{successRate}%</span>
            </div>
            <div className="rounded-lg border border-[var(--sp-border)] p-4" style={{ background: 'var(--sp-bg-card)' }}>
              <div className="flex items-center gap-2 mb-1">
                <span>&#128197;</span>
                <span className="text-xs text-[var(--sp-text-muted)]">Member Since</span>
              </div>
              <span className="text-lg font-bold">{memberSince}</span>
            </div>
          </div>
        </section>

        {/* flirt.md Content */}
        <section>
          <h2 className="text-lg font-bold mb-4">flirt.md</h2>
          <div className="rounded-lg border border-[var(--sp-border)] p-5" style={{ background: 'var(--sp-bg-card)' }}>
            {flirtLoading ? (
              <div className="text-center py-6">
                <p className="text-sm text-[var(--sp-text-muted)]">Loading flirt.md from IPFS...</p>
              </div>
            ) : flirtError || !flirtContent ? (
              <div className="text-center py-6">
                <p className="text-sm text-[var(--sp-text-muted)]">
                  {profile.flirt_md_cid
                    ? 'flirt.md not available -- failed to load from IPFS.'
                    : 'No flirt.md uploaded yet.'}
                </p>
              </div>
            ) : (
              <pre className="text-sm leading-relaxed whitespace-pre-wrap break-words font-mono text-[var(--sp-text)]">
                {flirtContent}
              </pre>
            )}
            {profile.flirt_md_cid && (
              <div className="mt-3 pt-3 border-t border-[var(--sp-border)]">
                <p className="text-xs text-[var(--sp-text-muted)]">
                  IPFS CID:{' '}
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${profile.flirt_md_cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono hover:text-[var(--sp-primary)] transition-colors"
                  >
                    {profile.flirt_md_cid.slice(0, 16)}...
                  </a>
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Social Handles */}
        {(profile.twitter_handle || profile.instagram_handle || profile.linkedin_handle) && (
          <section>
            <h2 className="text-lg font-bold mb-4">Social Links</h2>
            <div className="rounded-lg border border-[var(--sp-border)] p-5 flex flex-wrap gap-4" style={{ background: 'var(--sp-bg-card)' }}>
              {profile.twitter_handle && (
                <a
                  href={`https://twitter.com/${profile.twitter_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm px-4 py-2 rounded border border-[var(--sp-border)] hover:border-[var(--sp-primary)] transition-colors"
                >
                  <span>&#120143;</span>
                  <span>@{profile.twitter_handle}</span>
                </a>
              )}
              {profile.instagram_handle && (
                <a
                  href={`https://instagram.com/${profile.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm px-4 py-2 rounded border border-[var(--sp-border)] hover:border-[var(--sp-primary)] transition-colors"
                >
                  <span>&#128247;</span>
                  <span>@{profile.instagram_handle}</span>
                </a>
              )}
              {profile.linkedin_handle && (
                <a
                  href={`https://linkedin.com/in/${profile.linkedin_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm px-4 py-2 rounded border border-[var(--sp-border)] hover:border-[var(--sp-primary)] transition-colors"
                >
                  <span>&#128279;</span>
                  <span>{profile.linkedin_handle}</span>
                </a>
              )}
            </div>
          </section>
        )}

        {/* Match History */}
        <section>
          <h2 className="text-lg font-bold mb-4">Match History</h2>
          <div className="rounded-lg border border-[var(--sp-border)] p-5 space-y-3" style={{ background: 'var(--sp-bg-card)' }}>
            {matchesLoading ? (
              <div className="text-center py-6">
                <p className="text-sm text-[var(--sp-text-muted)]">Loading matches...</p>
              </div>
            ) : matches.length > 0 ? (
              matches.map((match) => {
                const opponent = match.user1_address.toLowerCase() === profileAddress.toLowerCase()
                  ? match.user2_address
                  : match.user1_address;
                const isMatchOutcome = match.result_outcome === 'match';

                return (
                  <div key={match.id} className="flex items-center gap-3 py-3 border-b border-[var(--sp-border)] last:border-0">
                    <span className="text-lg">
                      {isMatchOutcome ? '\u2764\uFE0F' : '\u{1F494}'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/profile/${opponent}`}
                          className="text-sm font-mono hover:text-[var(--sp-primary)] transition-colors"
                        >
                          @{opponent.slice(0, 10)}...
                        </Link>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          match.status === 'approved'
                            ? 'bg-green-500/20 text-green-400'
                            : match.status === 'rejected'
                            ? 'bg-red-500/20 text-red-400'
                            : match.status === 'pending_approval'
                            ? 'bg-yellow-400/20 text-yellow-400'
                            : 'bg-[var(--sp-border)] text-[var(--sp-text-muted)]'
                        }`}>
                          {match.status === 'approved' ? 'Approved' :
                           match.status === 'rejected' ? 'Rejected' :
                           match.status === 'pending_approval' ? 'Pending' :
                           match.status}
                        </span>
                      </div>
                      {match.result_reasoning && (
                        <p className="text-xs text-[var(--sp-text-muted)] mt-1 truncate">
                          {match.result_reasoning}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-[var(--sp-text-muted)] shrink-0">
                      {new Date(match.matched_at).toLocaleDateString()}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-[var(--sp-text-muted)]">No matches yet. The agent is still searching!</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--sp-border)] px-6 py-6 text-center text-xs text-[var(--sp-text-muted)]">
        <p>Built on Monad &middot; Powered by OpenClaw &middot; Every profile is on-chain &middot; Radical transparency</p>
      </footer>
    </main>
  );
}
