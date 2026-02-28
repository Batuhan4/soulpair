'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { WSServerMessage, ConversationMessage, ConversationResult } from '@soulpair/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

import { agentLabel } from '@/lib/agents';

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

  // Load conversation data
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

  // Subscribe to live updates
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

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <p className="text-[var(--sp-text-muted)]">Loading conversation...</p>
        </div>
      </main>
    );
  }

  if (!conversation) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-[var(--sp-text-muted)]">Conversation not found</p>
          <Link href="/" className="text-[var(--sp-primary)] text-sm mt-4 inline-block">← Dashboard</Link>
        </div>
      </main>
    );
  }

  const isLive = conversation.status === 'active' || conversation.status === 'waiting';

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--sp-border)] px-6 py-4 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[var(--sp-text-muted)] hover:text-[var(--sp-text)]">←</Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: 'var(--sp-primary)' }}>
                  {agentLabel(conversation.agent1_address)}
                </span>
                <span className="text-[var(--sp-text-muted)]">↔</span>
                <span className="text-sm font-bold" style={{ color: 'var(--sp-primary)' }}>
                  {agentLabel(conversation.agent2_address)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLive ? (
              <>
                <div className="w-2 h-2 rounded-full bg-red-500 live-pulse" />
                <span className="text-xs text-red-400 font-bold">LIVE</span>
              </>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded bg-[var(--sp-border)] text-[var(--sp-text-muted)]">
                {conversation.status === 'completed' ? 'Ended' : conversation.status}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && isLive && (
            <div className="text-center py-8">
              <div className="text-2xl mb-2">💬</div>
              <p className="text-sm text-[var(--sp-text-muted)]">Waiting for agents to start talking...</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isAgent1 = msg.from_address === conversation.agent1_address;
            return (
              <div key={msg.id || i} className={`flex ${isAgent1 ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[75%] rounded-lg p-3 ${isAgent1
                  ? 'bg-[var(--sp-bg-card)] border border-[var(--sp-border)]'
                  : 'border border-[var(--sp-primary)]/30'
                }`} style={!isAgent1 ? { background: 'rgba(255,90,54,0.1)' } : {}}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold" style={{ color: 'var(--sp-primary)' }}>
                      {agentLabel(msg.from_address)}
                    </span>
                    <span className="text-xs text-[var(--sp-text-muted)]">
                      {new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            );
          })}

          {isLive && messages.length > 0 && (
            <div className="flex justify-center">
              <div className="px-3 py-1.5 rounded-full bg-[var(--sp-bg-card)] border border-[var(--sp-border)]">
                <span className="text-xs text-[var(--sp-text-muted)]">● ● ● Agent is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Result Banner */}
      {result && (
        <div className={`border-t px-6 py-4 shrink-0 ${
          result.outcome === 'match' ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
        }`}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{result.outcome === 'match' ? '💕' : '💔'}</span>
              <div>
                <h3 className={`font-bold ${result.outcome === 'match' ? 'text-green-400' : 'text-red-400'}`}>
                  {result.outcome === 'match' ? 'It\'s a Match!' : 'No Match'}
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
                  <p className="text-xs text-green-400 mb-1">Ortak noktalar:</p>
                  {result.commonalities.map((c, i) => (
                    <span key={i} className="inline-block text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-400 mr-1 mb-1">
                      {c}
                    </span>
                  ))}
                </div>
              )}
              {result.differences.length > 0 && (
                <div>
                  <p className="text-xs text-yellow-400 mb-1">Farklılıklar:</p>
                  {result.differences.map((d, i) => (
                    <span key={i} className="inline-block text-xs px-2 py-0.5 rounded bg-yellow-400/10 text-yellow-400 mr-1 mb-1">
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
