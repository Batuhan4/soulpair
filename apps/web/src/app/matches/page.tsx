'use client';

import { useAccount } from 'wagmi';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

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

export default function MatchesPage() {
  const { address } = useAccount();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionModal, setRejectionModal] = useState<{ matchId: string; opponentAddress: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

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
      if (json.success) {
        await loadMatches();
      }
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

  const pendingMatches = matches.filter(m => needsMyApproval(m));
  const waitingMatches = matches.filter(m => m.status === 'pending_approval' && !needsMyApproval(m));
  const approvedMatches = matches.filter(m => m.status === 'approved');
  const rejectedMatches = matches.filter(m => m.status === 'rejected');

  if (!address) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">🔒</p>
          <p className="text-[var(--sp-text-muted)]">Connect your wallet to see matches</p>
          <Link href="/" className="text-[var(--sp-primary)] text-sm mt-4 inline-block hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--sp-border)] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[var(--sp-text-muted)] hover:text-[var(--sp-text)] transition-colors">←</Link>
            <h1 className="text-xl font-bold">My Matches</h1>
          </div>
          <span className="text-sm text-[var(--sp-text-muted)] font-mono">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Pending Approval — Action Required */}
        {pendingMatches.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <h2 className="text-lg font-bold text-yellow-400">Action Required ({pendingMatches.length})</h2>
            </div>
            <div className="space-y-4">
              {pendingMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  opponent={getOpponent(match)}
                  actionLoading={actionLoading === match.id}
                  onApprove={() => handleApprove(match.id)}
                  onReject={() => setRejectionModal({ matchId: match.id, opponentAddress: getOpponent(match) })}
                />
              ))}
            </div>
          </section>
        )}

        {/* Waiting for Other */}
        {waitingMatches.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4 text-[var(--sp-text-muted)]">
              ⏳ Waiting for Other Party ({waitingMatches.length})
            </h2>
            <div className="space-y-4">
              {waitingMatches.map(match => (
                <MatchCard key={match.id} match={match} opponent={getOpponent(match)} waiting />
              ))}
            </div>
          </section>
        )}

        {/* Approved */}
        {approvedMatches.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4 text-green-400">✅ Approved Matches ({approvedMatches.length})</h2>
            <div className="space-y-4">
              {approvedMatches.map(match => (
                <MatchCard key={match.id} match={match} opponent={getOpponent(match)} approved />
              ))}
            </div>
          </section>
        )}

        {/* Rejected */}
        {rejectedMatches.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4 text-red-400">❌ Rejected ({rejectedMatches.length})</h2>
            <div className="space-y-4">
              {rejectedMatches.map(match => (
                <MatchCard key={match.id} match={match} opponent={getOpponent(match)} rejected />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {loading ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 animate-spin">⏳</div>
            <p className="text-[var(--sp-text-muted)]">Loading matches...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">💘</div>
            <h3 className="text-xl font-bold mb-2">No matches yet</h3>
            <p className="text-[var(--sp-text-muted)] max-w-sm mx-auto">
              Your AI agent is out there looking. Make sure your Soulpair skill is running!
            </p>
          </div>
        ) : null}
      </div>

      {/* Rejection Modal */}
      {rejectionModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="rounded-lg border border-[var(--sp-border)] p-6 max-w-md w-full" style={{ background: 'var(--sp-bg-card)' }}>
            <h3 className="text-lg font-bold mb-2">Reject Match</h3>
            <p className="text-sm text-[var(--sp-text-muted)] mb-4">
              Matching with @{rejectionModal.opponentAddress.slice(0, 10)}... won't proceed.
            </p>

            <div className="mb-4">
              <label className="text-sm text-[var(--sp-text-muted)] block mb-2">Reason (optional — helps improve matching)</label>
              <div className="space-y-2 mb-3">
                {['Not my type', 'Location mismatch', 'Different goals', 'Low compatibility', 'Other'].map(reason => (
                  <button
                    key={reason}
                    onClick={() => setRejectionReason(reason)}
                    className={`px-3 py-1.5 rounded text-sm border transition-colors mr-2 ${
                      rejectionReason === reason
                        ? 'border-[var(--sp-primary)] text-[var(--sp-primary)]'
                        : 'border-[var(--sp-border)] text-[var(--sp-text-muted)] hover:border-[var(--sp-text-muted)]'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              {rejectionReason === 'Other' && (
                <textarea
                  placeholder="Tell us more..."
                  className="w-full px-3 py-2 rounded border border-[var(--sp-border)] text-sm bg-transparent focus:outline-none focus:border-[var(--sp-primary)]"
                  rows={2}
                  value={rejectionReason === 'Other' ? '' : rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value || 'Other')}
                />
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setRejectionModal(null); setRejectionReason(''); }}
                className="flex-1 px-4 py-2 rounded border border-[var(--sp-border)] text-sm hover:border-[var(--sp-text-muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectionModal.matchId)}
                disabled={actionLoading === rejectionModal.matchId}
                className="flex-1 px-4 py-2 rounded text-sm font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {actionLoading === rejectionModal.matchId ? 'Rejecting...' : 'Reject Match'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function MatchCard({
  match,
  opponent,
  actionLoading,
  onApprove,
  onReject,
  waiting,
  approved,
  rejected,
}: {
  match: Match;
  opponent: string;
  actionLoading?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  waiting?: boolean;
  approved?: boolean;
  rejected?: boolean;
}) {
  const commonalities = match.result_commonalities ? JSON.parse(match.result_commonalities) : [];
  const differences = match.result_differences ? JSON.parse(match.result_differences) : [];
  const feedback: MatchFeedback | null = match.result_feedback ? JSON.parse(match.result_feedback) : null;
  const hasReport = match.result_outcome || match.result_reasoning || commonalities.length > 0 || differences.length > 0;
  const isMatch = match.result_outcome === 'match';

  return (
    <div className="rounded-lg border border-[var(--sp-border)] p-5" style={{ background: 'var(--sp-bg-card)' }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm" style={{ color: 'var(--sp-primary)' }}>
              @{opponent.slice(0, 12)}...
            </span>
            {waiting && <span className="text-xs px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-400">Waiting</span>}
            {approved && <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">Matched &#9829;</span>}
            {rejected && <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">Rejected</span>}
          </div>
          <p className="text-xs text-[var(--sp-text-muted)]">
            {new Date(match.matched_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Match Report */}
      {hasReport && (
        <div className="mb-4 rounded-lg border border-[var(--sp-border)] overflow-hidden">
          {/* Report Header */}
          <div className="px-4 py-2.5 border-b border-[var(--sp-border)] bg-black/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--sp-text-muted)] uppercase tracking-wider">
                Match Report
              </span>
              {match.result_outcome && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  isMatch
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {isMatch ? 'Compatible' : 'Incompatible'}
                </span>
              )}
            </div>
          </div>

          <div className="px-4 py-3 space-y-3">
            {/* Outcome line */}
            {match.result_outcome && (
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  Agent spoke with <span className="font-mono" style={{ color: 'var(--sp-primary)' }}>@{opponent.slice(0, 10)}...</span>
                </span>
              </div>
            )}

            {/* AI Reasoning */}
            {match.result_reasoning && (
              <div className="p-2.5 rounded bg-black/30 border border-[var(--sp-border)]">
                <p className="text-xs text-[var(--sp-text-muted)] mb-1 font-bold">Reasoning:</p>
                <p className="text-sm">{match.result_reasoning}</p>
              </div>
            )}

            {/* Categorized Feedback */}
            <div className="space-y-1.5">
              {/* Strengths from feedback */}
              {feedback?.strengths?.map((s: string, i: number) => (
                <div key={`str-${i}`} className="flex items-start gap-2 text-sm">
                  <span className="shrink-0 mt-0.5 text-green-400">&#9989;</span>
                  <span className="text-green-400/90">{s}</span>
                </div>
              ))}

              {/* Commonalities */}
              {commonalities.map((c: string, i: number) => (
                <div key={`com-${i}`} className="flex items-start gap-2 text-sm">
                  <span className="shrink-0 mt-0.5 text-green-400">&#9989;</span>
                  <span className="text-[var(--sp-text-muted)]">
                    <span className="text-green-400/70">Common:</span> {c}
                  </span>
                </div>
              ))}

              {/* Differences (partial matches) */}
              {differences.map((d: string, i: number) => (
                <div key={`dif-${i}`} className="flex items-start gap-2 text-sm">
                  <span className="shrink-0 mt-0.5 text-yellow-400">&#9888;&#65039;</span>
                  <span className="text-[var(--sp-text-muted)]">
                    <span className="text-yellow-400/70">Partial:</span> {d}
                  </span>
                </div>
              ))}

              {/* Weaknesses from feedback */}
              {feedback?.weaknesses?.map((w: string, i: number) => (
                <div key={`weak-${i}`} className="flex items-start gap-2 text-sm">
                  <span className="shrink-0 mt-0.5 text-red-400">&#10060;</span>
                  <span className="text-red-400/90">
                    <span className="text-red-400/70">Incompatible:</span> {w}
                  </span>
                </div>
              ))}

              {/* Suggestions from feedback */}
              {feedback?.suggestions?.map((s: string, i: number) => (
                <div key={`sug-${i}`} className="flex items-start gap-2 text-sm">
                  <span className="shrink-0 mt-0.5 text-blue-400">&#128161;</span>
                  <span className="text-blue-400/90">
                    <span className="text-blue-400/70">Suggestion:</span> {s}
                  </span>
                </div>
              ))}
            </div>

            {/* Action links */}
            <div className="flex gap-3 pt-2 border-t border-[var(--sp-border)]">
              <Link
                href={`/profile/${opponent}`}
                className="text-xs px-3 py-1.5 rounded border border-[var(--sp-border)] hover:border-[var(--sp-primary)] hover:text-[var(--sp-primary)] transition-colors"
              >
                View Profile
              </Link>
              {match.conversation_id && (
                <Link
                  href={`/conversation/${match.conversation_id}`}
                  className="text-xs px-3 py-1.5 rounded border border-[var(--sp-border)] hover:border-[var(--sp-primary)] hover:text-[var(--sp-primary)] transition-colors"
                >
                  View Conversation
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {onApprove && onReject && (
        <div className="flex gap-3 pt-3 border-t border-[var(--sp-border)]">
          <button
            onClick={onReject}
            disabled={actionLoading}
            className="flex-1 px-4 py-2.5 rounded text-sm border border-[var(--sp-border)] hover:border-red-400 hover:text-red-400 transition-colors disabled:opacity-50"
          >
            Reject
          </button>
          <button
            onClick={onApprove}
            disabled={actionLoading}
            className="flex-1 px-4 py-2.5 rounded text-sm font-bold transition-colors disabled:opacity-50"
            style={{ background: 'var(--sp-primary)' }}
          >
            {actionLoading ? 'Processing...' : 'Approve Match'}
          </button>
        </div>
      )}

      {approved && (
        <div className="pt-3 border-t border-[var(--sp-border)]">
          <p className="text-sm text-green-400 text-center">
            Both parties approved! Your agents will schedule a date.
          </p>
        </div>
      )}
    </div>
  );
}
