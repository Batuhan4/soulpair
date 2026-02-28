'use client';

import { useAccount } from 'wagmi';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
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
            <AnimatePresence>
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
