'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
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
