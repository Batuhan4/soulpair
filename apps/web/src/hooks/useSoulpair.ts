'use client';

import { useState, useEffect } from 'react';
import type { DashboardStats } from '@soulpair/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchAPI<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'API error');
  return json.data;
}

export function useStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAPI<DashboardStats>('/api/stats');
        setStats(data);
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return { stats, loading };
}

export function useActiveConversations() {
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAPI<any[]>('/api/stats/conversations');
        setConversations(data);
      } catch (e) {
        console.error('Failed to fetch conversations:', e);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return conversations;
}

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAPI<any[]>('/api/stats/leaderboard');
        setLeaderboard(data);
      } catch (e) {
        console.error('Failed to fetch leaderboard:', e);
      }
    };
    load();
  }, []);

  return leaderboard;
}

export function useRecentMatches() {
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAPI<any[]>('/api/stats/recent-matches');
        setMatches(data);
      } catch (e) {
        console.error('Failed to fetch recent matches:', e);
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  return matches;
}

export function useProfile(address: string | undefined) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) { setLoading(false); return; }
    const load = async () => {
      try {
        const data = await fetchAPI<any>(`/api/profile/${address}`);
        setProfile(data);
      } catch (e) {
        console.error('Failed to fetch profile:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [address]);

  return { profile, loading };
}
