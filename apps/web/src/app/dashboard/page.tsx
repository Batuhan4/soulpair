'use client';

import { useStats, useActiveConversations, useRecentMatches, useLeaderboard } from '@/hooks/useSoulpair';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
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
